import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '../.ui-checks/sql-engine/node_modules/@electric-sql/pglite/dist/index.js';
import { deliverSubscriptionEmails, subscriptionEmail } from '../supabase/functions/_shared/subscriptionEmail.js';
import { verifySubscriptionWebhook } from '../supabase/functions/_shared/subscriptionWebhook.js';

// Actual reminder migration, real PostgreSQL execution, isolated in-memory auth fixtures.
const pg=new PGlite();
await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
GRANT USAGE ON SCHEMA auth TO authenticated;GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
CREATE TABLE profiles(id uuid PRIMARY KEY,full_name text,role text);
CREATE TABLE farms(id text PRIMARY KEY);
CREATE TABLE subscription_plans(id text PRIMARY KEY,name text);
CREATE TABLE farm_subscriptions(farm_id text PRIMARY KEY,user_id uuid,plan_id text,status text,trial_ends_at timestamptz,renewal_date timestamptz,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE subscription_orders(id text PRIMARY KEY,reference text,farm_id text,plan_id text,status text,created_at timestamptz DEFAULT now());
CREATE TABLE notifications(id text PRIMARY KEY,user_id uuid,farm_id text,title text,message text,type text,category text,time text,is_read boolean,action_url text,related_entity_type text,related_entity_id text,created_at timestamptz DEFAULT now());
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY existing_own_notifications ON notifications TO authenticated USING(user_id=auth.uid());
GRANT SELECT ON profiles,notifications TO authenticated;
GRANT INSERT ON subscription_orders TO authenticated;
INSERT INTO subscription_plans VALUES('basic','Basic'),('professional','Pro');`);
await pg.exec(await readFile(new URL('../supabase/migrations/20261030000200_trial_reminders.sql',import.meta.url),'utf8'));
const q=async(sql,params=[]) => (await pg.query(sql,params)).rows;
// Validate the installation SQL without installing Cron or making HTTP calls.
// These test schemas record the requested schedule/HTTP invocation only.
await pg.exec(`CREATE SCHEMA vault;CREATE TABLE vault.decrypted_secrets(name text,decrypted_secret text);
CREATE SCHEMA cron;CREATE TABLE cron.fixture_jobs(name text PRIMARY KEY,schedule text,command text);
CREATE FUNCTION cron.schedule(p_name text,p_schedule text,p_command text) RETURNS bigint LANGUAGE plpgsql AS $$BEGIN INSERT INTO cron.fixture_jobs VALUES(p_name,p_schedule,p_command) ON CONFLICT(name) DO UPDATE SET schedule=excluded.schedule,command=excluded.command;RETURN 1;END$$;
CREATE SCHEMA net;CREATE TABLE net.fixture_requests(url text,headers jsonb,body jsonb);
CREATE FUNCTION net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds integer) RETURNS bigint LANGUAGE plpgsql AS $$BEGIN INSERT INTO net.fixture_requests VALUES(url,headers,body);RETURN 1;END$$;`);
const scheduleSql=(await readFile(new URL('../supabase/optional/install_trial_reminder_schedule.sql',import.meta.url),'utf8')).replace(/^CREATE EXTENSION.*$/gm,'');
await assert.rejects(pg.exec(scheduleSql),/Configure project URL/);
await pg.exec("INSERT INTO vault.decrypted_secrets VALUES('poultrypro_project_url','https://fixture.supabase.invalid'),('poultrypro_trial_cron_secret','controlled-cron-secret-for-test-only')");
await pg.exec(scheduleSql);await pg.exec(scheduleSql);
const jobs=await q('SELECT * FROM cron.fixture_jobs');assert.equal(jobs.length,2,'Reinstallation reuses named jobs');
assert.equal(jobs.find(j=>j.name==='poultrypro-daily-trial-reminders').schedule,'0 9 * * *');
assert.equal(jobs.find(j=>j.name==='poultrypro-trial-email-worker').schedule,'*/15 * * * *');
await pg.exec(jobs.find(j=>j.name==='poultrypro-trial-email-worker').command);
assert.equal((await q('SELECT * FROM net.fixture_requests'))[0].url,'https://fixture.supabase.invalid/functions/v1/trial-reminders');
for(const [index,days] of [10,7,5,3,1,0].entries()){
 const id=`00000000-0000-4000-8000-${String(index+1).padStart(12,'0')}`;
 await pg.query(`INSERT INTO auth.users VALUES($1,$2);`,[id,`farmer${index}@example.invalid`]);
 await pg.query(`INSERT INTO profiles VALUES($1,$2,'farmer')`,[id,`Farmer ${index}`]);
 await pg.query(`INSERT INTO farms VALUES($1)`,[`farm-${index}`]);
 await pg.query(`INSERT INTO farm_subscriptions(farm_id,user_id,plan_id,status,trial_ends_at,created_at) VALUES($1,$2,'basic','trial',now()+($3||' days')::interval,now()-interval '4 days')`,[`farm-${index}`,id,String(days-0.01)]);
}
await q('SELECT queue_trial_reminders()');
assert.equal((await q('SELECT * FROM subscription_reminders')).length,6);
assert.equal((await q('SELECT * FROM notifications WHERE is_read=false')).length,6);
assert.deepEqual((await q("SELECT milestone FROM subscription_reminders WHERE event_type='trial_reminder' ORDER BY milestone")).map(r=>r.milestone),[1,3,5,7,10]);
assert.equal((await q("SELECT * FROM subscription_reminders WHERE event_type='trial_expired'")).length,1);
await q('SELECT queue_trial_reminders()');assert.equal((await q('SELECT * FROM notifications')).length,6,'Repeated schedule must not duplicate notifications');
assert.ok((await q('SELECT * FROM notifications')).every(r=>['free_trial','subscription'].includes(r.category)),'Subscription categories resolve to the existing subscription route');
// UTC ceil boundary, not calendar dates or browser clocks.
assert.equal((await q("SELECT ceil(extract(epoch FROM interval '7 days')/86400)::int AS days"))[0].days,7);
assert.equal((await q("SELECT ceil(extract(epoch FROM interval '7 days 1 second')/86400)::int AS days"))[0].days,8);
// Farmers cannot read other recipients or delivery tracking and cannot run backend functions.
await pg.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);`);
assert.equal((await q('SELECT * FROM notifications')).length,1);assert.equal((await q('SELECT * FROM subscription_reminders')).length,0);
await assert.rejects(q('SELECT queue_trial_reminders()'),/permission denied/);
await assert.rejects(q('INSERT INTO subscription_reminders DEFAULT VALUES'),/permission denied/);
await assert.rejects(q("INSERT INTO subscription_orders(id,reference,farm_id,plan_id,status) VALUES('spoofed-payment','spoof','farm-0','basic','paid')"),/verified backend/);
await q("INSERT INTO subscription_orders(id,reference,farm_id,plan_id,status) VALUES('pending-checkout','pending','farm-0','basic','pending')");
await pg.exec('RESET ROLE');
// A confirmed order alone is insufficient until the actual subscription is active.
await q("INSERT INTO subscription_orders(id,reference,farm_id,plan_id,status) VALUES('paid-1','REF-1','farm-0','basic','pending')");
await q("UPDATE subscription_orders SET status='paid' WHERE id='paid-1'");
assert.equal((await q("SELECT * FROM subscription_reminders WHERE event_type='subscription_activated'")).length,0);
await q("UPDATE farm_subscriptions SET status='active' WHERE farm_id='farm-0'");
assert.equal((await q("SELECT * FROM subscription_reminders WHERE event_type='subscription_activated'")).length,1);
assert.equal((await q("SELECT email_status FROM subscription_reminders WHERE farm_id='farm-0' AND event_type='trial_reminder'"))[0].email_status,'cancelled');
await q("UPDATE farm_subscriptions SET renewal_date=now()+interval '30 days' WHERE farm_id='farm-0'");
await q('SELECT queue_trial_reminders()');assert.equal((await q("SELECT * FROM subscription_reminders WHERE event_type='subscription_activated'")).length,1);
const claims1=await q('SELECT * FROM claim_subscription_emails(3)'),claims2=await q('SELECT * FROM claim_subscription_emails(3)');
assert.equal(claims1.length,3);assert.equal(claims2.length,3);assert.ok(claims1.every(a=>!claims2.some(b=>a.id===b.id)),'Workers claim disjoint leases');
assert.equal((await q("SELECT finish_subscription_email($1,gen_random_uuid(),'accepted','wrong-provider',NULL)",[claims1[0].id]))[0].finish_subscription_email,false,'Stale lease cannot acknowledge another worker');
await q("UPDATE subscription_reminders SET email_status='retry',next_attempt_at=now()-interval '1 minute',lease_until=NULL WHERE email_status='processing'");
// Actual service calls run against the same PostgreSQL engine; fake only the provider transport.
const db={rpc:async(name,args={})=>{
 const signature={queue_trial_reminders:[],claim_subscription_emails:['p_limit'],finish_subscription_email:['p_id','p_lease','p_status','p_provider','p_error']}[name];
 try{const values=signature.map(k=>args[k]);const rows=await q(`SELECT * FROM ${name}(${values.map((_,i)=>'$'+(i+1)).join(',')})`,values);return {data:name==='finish_subscription_email'?rows[0].finish_subscription_email:rows,error:null};}catch(error){return {data:null,error};}
 },from:()=>({update:payload=>{
  const filters={};const builder={eq(key,value){filters[key]=value;return builder;},select(){return builder;},async maybeSingle(){try{const rows=await q('UPDATE subscription_reminders SET email_payload=$1 WHERE id=$2 AND lease_token=$3 AND email_status=$4 RETURNING id',[payload.email_payload,filters.id,filters.lease_token,filters.email_status]);return {data:rows[0]||null,error:null};}catch(error){return {data:null,error};}}};return builder;
 }})};
const config={apiKey:'fake-key',from:'PoultryPro <verified@example.invalid>',appUrl:'https://poultrypro.example.invalid'};
const attempts=new Map(),accepted=new Set();let failing=true;
const fetcher=async(url,options)=>{
 assert.equal(url,'https://api.resend.com/emails');const key=options.headers['Idempotency-Key'],body=JSON.parse(options.body);
 assert.equal(body.reply_to,'ahmadadebara04@gmail.com');assert.ok(body.html.includes('08109606739'));assert.ok(body.text.includes('https://poultrypro.example.invalid/settings/subscription'));
 const previous=attempts.get(key);if(previous)assert.equal(previous,options.body,'Retry payload must stay frozen');attempts.set(key,options.body);
 if(failing)return new Response('{}',{status:503});accepted.add(key);return Response.json({id:'provider-'+key.split('/')[1]});
};
const notificationCount=(await q('SELECT * FROM notifications')).length;
const first=await deliverSubscriptionEmails({db,config,fetcher});assert.equal(first.retry,6);assert.equal(first.accepted,0);
assert.equal((await q('SELECT * FROM notifications')).length,notificationCount);
await q("UPDATE subscription_reminders SET next_attempt_at=now()-interval '1 minute' WHERE email_status='retry'");failing=false;
const second=await deliverSubscriptionEmails({db,config,fetcher});assert.equal(second.accepted,6);
assert.equal((await q('SELECT * FROM notifications')).length,notificationCount,'Retry must not duplicate dashboard notifications');
assert.equal((await deliverSubscriptionEmails({db,config,fetcher})).accepted,0);
// Simulate a crash after acceptance, before acknowledgement. Recovery must reuse
// the same provider key/body, not create another email or dashboard notification.
const recovering=(await q("SELECT * FROM subscription_reminders WHERE email_status='accepted' LIMIT 1"))[0];
await q("UPDATE subscription_reminders SET email_status='processing',lease_until=now()-interval '1 minute',next_attempt_at=now()-interval '1 minute' WHERE id=$1",[recovering.id]);
const acceptedBefore=accepted.size;assert.equal((await deliverSubscriptionEmails({db,config,fetcher})).accepted,1);assert.equal(accepted.size,acceptedBefore);
// Webhook delivery, duplicate receipts, and out-of-order receipts.
const row=(await q("SELECT * FROM subscription_reminders WHERE email_status='accepted' LIMIT 1"))[0];
await q("SELECT record_subscription_email_event('event-1',$1,'delivered',now())",[row.provider_message_id]);
await q("SELECT record_subscription_email_event('event-1',$1,'delivered',now())",[row.provider_message_id]);
assert.equal((await q('SELECT email_status FROM subscription_reminders WHERE id=$1',[row.id]))[0].email_status,'delivered');
assert.equal((await q('SELECT * FROM subscription_email_events')).length,1);
await q("SELECT record_subscription_email_event('older-event',$1,'bounced',now()-interval '1 hour')",[row.provider_message_id]);
assert.equal((await q('SELECT email_status FROM subscription_reminders WHERE id=$1',[row.id]))[0].email_status,'delivered','Older receipt cannot overwrite newer delivery');
// Lost provider response: expired lease reuses the payload/key, and stops before 24-hour provider dedupe expires.
await q("UPDATE subscription_reminders SET email_status='processing',lease_until=now()-interval '1 minute',first_attempt_at=now()-interval '23 hours' WHERE id=$1",[row.id]);
await q('SELECT claim_subscription_emails()');assert.equal((await q('SELECT email_status FROM subscription_reminders WHERE id=$1',[row.id]))[0].email_status,'needs_review');
// Signed webhook validation, tampering and replay rejection.
const secret=btoa('controlled-webhook-signing-key'),stamp=String(Math.floor(Date.now()/1000)),raw=JSON.stringify({type:'email.delivered',created_at:new Date().toISOString(),data:{email_id:'provider-test'}});
const key=await crypto.subtle.importKey('raw',new TextEncoder().encode('controlled-webhook-signing-key'),{name:'HMAC',hash:'SHA-256'},false,['sign']);
const signature=btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`msg-1.${stamp}.${raw}`)))));
const headers=new Headers({'svix-id':'msg-1','svix-timestamp':stamp,'svix-signature':'v1,'+signature});
assert.equal((await verifySubscriptionWebhook(raw,headers,'whsec_'+secret)).type,'email.delivered');
await assert.rejects(verifySubscriptionWebhook(raw+' ',headers,'whsec_'+secret),/Invalid webhook signature/);
await assert.rejects(verifySubscriptionWebhook(raw,headers,'whsec_'+secret,Date.now()+600000),/Invalid webhook envelope/);
const template=subscriptionEmail({...row,farmer_name:'<script>bad</script>'},config);assert.ok(!template.html.includes('<script>'));assert.ok(!template.html.includes('gradient'));
await pg.close();
console.log('PASS real PostgreSQL reminder migration, all five milestones, expiry, payment activation, unique notifications, farmer isolation, backend-only RPCs, email-only retries, frozen payloads, delivery receipts, retry-window safety and signed webhook validation. No live accounts or email API used.');

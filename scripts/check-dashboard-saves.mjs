import { build } from 'esbuild';
import Module from 'node:module';
import { resolve } from 'node:path';
import { dashboardDatabase } from './fixtures/dashboardDatabase.js';

globalThis.__dashboardDB=dashboardDatabase();
globalThis.fetch=async()=>new Response('',{status:404}); // Default fixture bucket is private.
globalThis.__selectedFarm='farm-a';
const cache=new Map();globalThis.localStorage={getItem:key=>cache.get(key)||null,setItem:(key,value)=>cache.set(key,value),removeItem:key=>cache.delete(key)};
const events=[];globalThis.window={dispatchEvent:e=>events.push(e),location:{origin:'http://localhost',hostname:'localhost'}};
const source=`
const assert=require('node:assert/strict');
const profile=require('./src/services/profileService.js');
const auth=require('./src/services/supabase/authService.js');
const records=require('./src/services/supabase/farmDataService.js');
const operations=require('./src/services/supabase/operationsService.js');
const {flockMutations}=require('./src/services/supabase/mutationService.js');
const settings=require('./src/services/settingsPersistence.js');
const admin=require('./src/admin/services/adminPersistence.js');
const {savePlan}=require('./src/services/planCatalog.js');
const {DEFAULT_PLANS}=require('./shared/subscriptionPlans.js');
const {verifiedPayment}=require('./supabase/functions/_shared/paymentValidation.js');
module.exports=(async()=>{
const db=globalThis.__dashboardDB,s=db.state;
const invoice={reference:'PP-test',amount:2500};
const paid={status:true,data:{status:'success',amount:250000,currency:'NGN',reference:'PP-test',customer:{email:'farmer-a@example.invalid'}}};
assert.equal(verifiedPayment(paid,invoice,'farmer-a@example.invalid'),true);
for(const patch of [{status:'pending'},{amount:2500},{currency:'USD'},{reference:'wrong'},{customer:{email:'other@example.invalid'}}])assert.equal(verifiedPayment({...paid,data:{...paid.data,...patch}},invoice,'farmer-a@example.invalid'),false);
assert.equal(verifiedPayment({...paid,status:false},invoice,'farmer-a@example.invalid'),false);

const calls=()=>s.calls.filter(c=>c.table==='profiles'&&c.action==='select').length;
const before=calls();const [a,b]=await Promise.all([auth.getProfile('farmer-a'),auth.getProfile('farmer-a')]);assert.equal(a.name,'First Farmer');assert.equal(b.full_name,'First Farmer');assert.equal(calls()-before,1,'Profile reads must coalesce');
await profile.saveProfile({name:'Updated Farmer',phone:'+234 810 960 6739',role:'super_admin',farm_id:'farm-b'},'farmer-a');
assert.equal(s.rows.profiles[0].full_name,'Updated Farmer');assert.equal(s.rows.profiles[0].role,'farmer');assert.equal(s.rows.profiles[0].farm_id,'farm-a');
s.failure={table:'profiles',action:'update',message:'RLS denied'};await assert.rejects(profile.saveProfile({full_name:'Not saved'},'farmer-a'),/RLS denied/);assert.equal(s.rows.profiles[0].full_name,'Updated Farmer');s.failure=null;
s.userId='farmer-b';await assert.rejects(profile.saveProfile({full_name:'Wrong account'},'farmer-a'),/session changed/);s.userId='farmer-a';
for(const value of [{name:' '},{phone:'not a phone'},{avatar_url:'data:image/svg+xml,unsafe'}])await assert.rejects(profile.saveProfile(value,'farmer-a'));
const file=new File([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])],'profile.png',{type:'image/png'});
// Exercise the installed Storage SDK's multipart encoding and real error parser.
const {StorageClient}=require('@supabase/storage-js');
const originalStorage=db.storage;let storageResponse,uploadRequests=0;
const transport=new StorageClient('https://fixture.supabase.invalid/storage/v1',{},async(url,options)=>{
  uploadRequests++;
  assert.ok(String(url).includes('/object/avatars/farmer-a/'));
  assert.equal(options.method,'POST');assert.equal(options.headers['x-upsert'],'false');
  const image=[...options.body.values()].find(value=>value instanceof Blob);
  assert.ok(image,'SDK must send binary image data, not a preview URL');assert.equal(image.type,'image/png');
  assert.deepEqual(new Uint8Array(await image.arrayBuffer()),new Uint8Array(await file.arrayBuffer()));
  if(storageResponse.status===200)storageResponse.body={Key:new URL(url).pathname.slice('/storage/v1/object/'.length)};
  return new Response(JSON.stringify(storageResponse.body),{status:storageResponse.status,headers:{'Content-Type':'application/json'}});
});
db.storage={from(bucket){const fallback=originalStorage.from(bucket);return {...fallback,upload:(...args)=>transport.from(bucket).upload(...args)};}};
for(const [status,code,message] of [[400,'NoSuchBucket','Bucket not found'],[400,'InvalidMimeType','mime type image/png is not supported'],[413,'EntityTooLarge','The object exceeded the maximum allowed size'],[403,'AccessDenied','new row violates row-level security policy'],[409,'ResourceAlreadyExists','The resource already exists'],[401,'InvalidJWT','jwt expired']]){
 storageResponse={status,body:{statusCode:String(status),code,message}};
 const beforeUpload=s.rows.profiles[0].avatar_url;
 await assert.rejects(profile.saveProfileAvatar(file,'farmer-a'),error=>error.status===status&&error.code===code&&error.message.includes(message)&&error.bucket==='avatars');
 assert.equal(s.rows.profiles[0].avatar_url,beforeUpload,'Upload failures must not change the profile');
}
storageResponse={status:200,body:{Key:'avatars/farmer-a/upload.png'}};
await profile.saveProfileAvatar(file,'farmer-a');assert.equal(uploadRequests,7,'No automatic upload retries');db.storage=originalStorage;
const picture=await profile.saveProfileAvatar(file,'farmer-a');assert.ok(picture.avatar_url.startsWith('storage://avatars/farmer-a/'));assert.ok(picture.avatarDisplayUrl.includes('/sign/avatars/'));
assert.ok(!profile.profilePatch({avatar_url:picture.avatarDisplayUrl}).avatar_url.includes('?token='),'Signed display URLs must not be persisted');
await assert.rejects(profile.validateAvatar(new File(['bad'],'file.png',{type:'image/png'})),/not a valid image/);
await assert.rejects(profile.validateAvatar(new File([new Uint8Array(2*1024*1024+1)],'large.png',{type:'image/png'})),/2 MB/);
await assert.rejects(profile.validateAvatar(new File(['<svg/>'],'image.svg',{type:'image/svg+xml'})),/2 MB/);
await assert.rejects(profile.saveProfile({avatar_url:'storage://avatars/farmer-b/other.png'},'farmer-a'),/own Storage folder/);
const reloaded=await profile.resolveProfileAvatar(profile.normalizeProfile(s.rows.profiles[0]));assert.ok(reloaded.avatarDisplayUrl.includes('/sign/avatars/'));
await profile.saveProfile({avatar_url:''},'farmer-a');assert.equal(s.rows.profiles[0].avatar_url,'');

const uploadCount=s.uploads.size;s.failure={table:'profiles',action:'update'};await assert.rejects(profile.saveProfileAvatar(file,'farmer-a'));assert.equal(s.uploads.size,uploadCount,'Failed profile saves clean up only the new file');s.failure=null;
const fromStorage=db.storage.from.bind(db.storage);let signCalls=0;
db.storage={from(bucket){return {...fromStorage(bucket),async createSignedUrl(){signCalls++;return {data:null,error:{code:'NoSuchKey',message:'Object not found'}};}};}};
const withoutRead=await profile.saveProfileAvatar(file,'farmer-a');
assert.equal(s.rows.profiles[0].avatar_url,withoutRead.avatar_url,'Signing failure must not skip the database update');
assert.equal(withoutRead.avatarDisplayUrl,'');assert.match(withoutRead.avatarError,/Object not found/);
assert.ok(s.uploads.has(profile.avatarStorageReference(withoutRead.avatar_url).path),'Never delete the newly saved object on display failure');
const previousReference=withoutRead.avatar_url;globalThis.fetch=async()=>new Response('',{status:200,headers:{'content-type':'image/png'}});
const publicPicture=await profile.saveProfileAvatar(file,'farmer-a',previousReference);
assert.ok(publicPicture.avatar_url.includes('/object/public/avatars/farmer-a/'));assert.equal(publicPicture.avatarDisplayUrl,publicPicture.avatar_url);
assert.equal(s.uploads.has(profile.avatarStorageReference(previousReference).path),false,'Remove old object only after the new reference is saved');
const signedBefore=signCalls;await profile.resolveProfileAvatar(publicPicture);assert.equal(signCalls,signedBefore,'Public URLs must not be signed');
await profile.removeProfileAvatar('farmer-a',publicPicture.avatar_url);assert.equal(s.rows.profiles[0].avatar_url,'');assert.equal(s.uploads.has(profile.avatarStorageReference(publicPicture.avatar_url).path),false);
db.storage=originalStorage;globalThis.fetch=async()=>new Response('',{status:404});
const flock=await records.createFlock('farm-a',{name:'Original flock',type:'Broilers',initialBirds:100,currentBirds:100,acquisitionDate:'2025-03-02',pen:'House A',source:'Supplier'});
const changed=await records.updateFlock(flock.id,{currentBirds:95});assert.equal(changed.name,'Original flock');assert.equal(changed.initialBirds,100);assert.equal(changed.acquisitionDate,'2025-03-02');assert.equal(changed.pen,'House A');
await assert.rejects(records.updateFlock('missing-row',{currentBirds:0}),/No authorized row/);
s.userId='farmer-b';await assert.rejects(records.updateFlock(flock.id,{name:'Unauthorized'}),/No authorized row/);s.userId='farmer-a';
const fixtures=[
 ['Egg',{date:'2026-01-02',goodEggs:20,brokenEggs:2,rejectedEggs:1,totalEggs:23,flockName:'Original flock'}],
 ['Feed',{name:'Starter feed',feedType:'Starter',quantityBags:10,bagWeightKg:25,costPerBag:1000,unitPrice:1000,supplier:'Supplier',minStockThresholdBags:3}],
 ['Vaccination',{vaccineName:'Test Vaccine',scheduledDate:'2026-01-03',diseasePrevented:'Disease',birdsVaccinated:95,dosage:'1 dose',method:'Water',cost:500,administeredBy:'Farm Staff',nextDueDate:'2026-04-03'}],
 ['Medication',{medicationName:'Treatment',startDate:'2026-01-04',endDate:'2026-01-09',durationDays:5,status:'Ongoing',cost:100}],
 ['Customer',{name:'Buyer',totalPurchases:500,outstandingBalance:50}],
 ['Sale',{customerName:'Buyer',product:'Eggs',quantity:2,unitPrice:1500,totalAmount:3000}],
 ['Expense',{description:'Farm supplies',category:'Supplies',amount:1000,paymentMethod:'Transfer'}],
 ['Worker',{name:'Farm Worker',phone:'08000000000',assignedPen:'House A'}],
 ['DailyRecord',{category:'feed',date:'2026-01-04',values:{consumedKg:12}}],
];
for(const [kind,value]of fixtures){const row=await records['create'+kind]('farm-a',value);assert.ok(row.id,kind+' saved');if(records['update'+kind]){const saved=await records['update'+kind](row.id,{...value,notes:'Updated notes',...(kind==='DailyRecord'?{values:{...value.values,notes:'Updated notes'}}:{}),...(kind==='Worker'?{phone:'08000000999'}:{})});assert.equal(kind==='Worker'?saved.phone:kind==='DailyRecord'?saved.values.notes:saved.notes,kind==='Worker'?'08000000999':'Updated notes',kind+' update fields');}await records['delete'+kind](row.id);await assert.rejects(records['delete'+kind](row.id),/No authorized row/);}
const item=await operations.createInventory({name:'Equipment',quantity:10,minStock:0,cost:100,notes:'Important notes'});assert.equal(item.minStock,0);const moved=await operations.moveInventory(item.id,2,'usage','Routine use','2026-01-06');assert.equal(moved.quantity,8);assert.equal(moved.lastMovement.date,'2026-01-06');await assert.rejects(operations.moveInventory(item.id,20,'usage',''),/exceeds/);
const task=await operations.createTask({title:'Clean pen',assignedTo:'Farm Worker',dueDate:'2026-01-07',notes:'Task notes'});assert.equal((await operations.updateTaskStatus(task.id,'Completed')).status,'Completed');assert.equal((await operations.getTasks('farm-a'))[0].title,'Clean pen');
globalThis.__selectedFarm=null;await assert.rejects(flockMutations.create(null,{name:'Unsaved'}),/Select a farm/);globalThis.__selectedFarm='farm-a';
s.writeDelay=30;const start=s.calls.length;const one=flockMutations.create('farm-a',{name:'Single submission',initialBirds:20});const two=flockMutations.create('farm-a',{name:'Single submission',initialBirds:20});assert.equal(one,two);await Promise.all([one,two]);assert.equal(s.calls.slice(start).filter(c=>c.table==='flocks'&&c.action==='insert').length,1);s.writeDelay=0;
await settings.saveNotificationPreferences('farmer-a',{emailNotifications:false});assert.equal((await settings.readNotificationPreferences('farmer-a',{})).emailNotifications,false);
await assert.rejects(settings.writeSetting('admin:platform',{platformName:'Unauthorized'}),/security/);
s.userId='admin-a';await admin.saveAdminConfiguration('platform',{platformName:'Saved platform'});assert.equal((await settings.readSetting('admin:platform',{})).platformName,'Saved platform');
await admin.saveFarmerStatus('farmer-a','Suspended');assert.equal(s.rows.profiles[0].account_status,'Suspended');
const previousPrice=s.rows.farm_subscriptions[0].agreed_price;await admin.saveSubscriber({id:'farmer-a',farmId:'farm-a'},'extend_trial',{days:7},DEFAULT_PLANS);assert.equal(s.rows.farm_subscriptions[0].agreed_price,previousPrice);await admin.saveSubscriber({id:'farmer-a',farmId:'farm-a'},'cancel',{},DEFAULT_PLANS);assert.equal(s.rows.farm_subscriptions[0].status,'cancelled');await assert.rejects(admin.saveSubscriber({id:'farmer-a'},'unknown',{},DEFAULT_PLANS),/Unsupported/);
await savePlan('basic',{maxFlocks:5,maxBirds:700,isMostPopular:true});assert.equal(s.rows.subscription_plans[0].max_flocks,5);assert.equal(s.rows.subscription_plans[0].monthly_price,2500);assert.equal(s.rows.subscription_plans[0].is_most_popular,true);
const notice={requestId:'test-broadcast',title:'Notice',message:'Verified in-app message',priority:'Important Notice',targetAudience:'All Farmers'};
const targets=[{id:'farmer-a',farmId:'farm-a'},{id:'farmer-b',farmId:'farm-b'}];await admin.publishNotification(notice,targets);await admin.publishNotification(notice,targets);assert.equal(s.rows.notifications.length,2,'Retry must not duplicate recipient notifications');
console.log('PASS profile validation, account isolation, upload cleanup, confirmed CRUD, partial flock updates, duplicate prevention, persistent inventory/tasks/settings, subscription aliases and prices, notification retries. PostgreSQL RPC/RLS require separate live tests.');
})()
`;
const result=await build({stdin:{contents:source,resolveDir:process.cwd(),loader:'js'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',define:{'import.meta.env':JSON.stringify({VITE_SUPABASE_URL:'https://fixture.supabase.invalid'})},plugins:[{name:'fake-supabase',setup(builder){
  builder.onLoad({filter:/lib[\\/]supabaseClient\.js$/},()=>({contents:'export const supabase=globalThis.__dashboardDB;export const isSupabaseConfigured=()=>true;export default supabase;',loader:'js'}));
  builder.onLoad({filter:/services[\\/]farmScope\.js$/},()=>({contents:"export const getSelectedFarmId=()=>globalThis.__selectedFarm;export const getSelectedPoultryType=()=> 'all';",loader:'js'}));
}}]});
const filename=resolve('.ui-checks/dashboard-save-check.cjs');const mod=new Module(filename);mod.filename=filename;mod.paths=Module._nodeModulePaths(process.cwd());mod._compile(result.outputFiles[0].text,filename);await mod.exports;

import { SUPPORT_CONTACT } from '../../../src/config/supportContact.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// PostgreSQL jsonb can reorder object keys. Keep retry request bytes stable as well.
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value==='object' ? Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])) : value;
export function subscriptionEmail(row, config) {
 const origin = new URL(config.appUrl);
 if (origin.protocol !== 'https:' || origin.username || origin.password) throw new Error('APP_URL must be a public HTTPS URL');
 const upgrade = new URL('/settings/subscription', origin).href;
 const logo = new URL('/logo-email.png', origin).href;
 const date = row.trial_expires_at ? new Date(row.trial_expires_at).toLocaleString('en-GB',{timeZone:'UTC',dateStyle:'long',timeStyle:'short'})+' UTC' : '';
 const active = row.event_type === 'subscription_activated';
 const subject = active ? `Your PoultryPro ${row.plan_name} Subscription Is Active` : row.event_type === 'trial_expired' ? 'Your PoultryPro Free Trial Has Ended' : `Your PoultryPro Free Trial Ends in ${row.milestone} Days`;
 const body = active ? `Your ${row.plan_name} subscription is now active. Thank you for choosing PoultryPro.` : row.event_type === 'trial_expired' ? row.message : `Your PoultryPro free trial has just ${row.milestone} ${row.milestone===1?'day':'days'} remaining.\n\nWe hope you've been enjoying the convenience of managing your poultry farm with PoultryPro.\n\nTo continue accessing your farm management tools without interruption, choose a subscription plan before your trial expires.`;
 const action = active ? 'View Subscription' : 'Upgrade Now';
 const detail = active ? `Activated Plan: ${row.plan_name}` : `Trial Expiration Date: ${date}`;
 const text = `Hello ${row.farmer_name || 'Farmer'},\n\n${body}\n\n${detail}\n\n${action}: ${upgrade}\n\nThank you for choosing PoultryPro.\nPoultryPro Support Team\nEmail: ${SUPPORT_CONTACT.email}\nWhatsApp: ${SUPPORT_CONTACT.phone}`;
 const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f1f5f9;color:#1e293b;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:20px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:auto;background:white;border:1px solid #e2e8f0;border-radius:12px"><tr><td style="padding:24px;border-bottom:3px solid #15803d"><img src="${escape(logo)}" width="140" alt="PoultryPro" style="max-width:100%;height:auto"><h1 style="font-size:22px;color:#15803d">${escape(row.title)}</h1></td></tr><tr><td style="padding:24px;font-size:15px;line-height:1.7"><p>Hello ${escape(row.farmer_name || 'Farmer')},</p>${body.split('\n\n').map(p=>`<p>${escape(p)}</p>`).join('')}<p style="color:#1d4ed8"><strong>${escape(detail)}</strong></p><p><a href="${escape(upgrade)}" style="display:inline-block;padding:13px 20px;border-radius:6px;background:#15803d;color:white;text-decoration:none;font-weight:bold">${action}</a></p><p>Thank you for choosing PoultryPro.<br>PoultryPro Support Team</p><p style="font-size:13px;overflow-wrap:anywhere">Email: <a href="mailto:${SUPPORT_CONTACT.email}">${SUPPORT_CONTACT.email}</a><br>WhatsApp: <a href="${escape(SUPPORT_CONTACT.whatsappUrl)}">${SUPPORT_CONTACT.phone}</a></p></td></tr></table></td></tr></table></body></html>`;
 return {from:config.from,to:[row.recipient_email],reply_to:SUPPORT_CONTACT.email,subject,text,html};
}

export async function deliverSubscriptionEmails({db,config,fetcher=fetch}) {
 const {error:queueError} = await db.rpc('queue_trial_reminders');
 if(queueError) throw new Error('Could not queue subscription reminders');
 // Missing provider configuration never prevents daily SQL dashboard notifications.
 if(!config.apiKey || !config.from || !config.appUrl) throw new Error('Email provider, verified sender, and APP_URL must be configured');
 const {data:rows,error} = await db.rpc('claim_subscription_emails',{p_limit:20});
 if(error) throw new Error('Could not claim queued emails');
 const outcomes={accepted:0,retry:0,failed:0,cancelled:0};
 for(const row of rows || []) {
  let status='retry',provider=null,reason=null;
  try {
   const payload=row.email_payload || subscriptionEmail(row,config);
   // Freeze the exact body before the first API request for safe provider idempotency.
   const {data:saved,error:saveError}=await db.from('subscription_reminders').update({email_payload:payload}).eq('id',row.id).eq('lease_token',row.lease_token).eq('email_status','processing').select('id').maybeSingle();
   if(saveError) throw new Error('Could not persist email payload');
   if(!saved){outcomes.cancelled++;continue;}
   const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${config.apiKey}`,'Content-Type':'application/json','Idempotency-Key':`poultrypro-subscription/${row.id}`},body:JSON.stringify(canonical(payload)),signal:AbortSignal.timeout(12000)});
   const result=await response.json().catch(()=>({}));
   if(response.ok && typeof result.id==='string'){status='accepted';provider=result.id;}
   else {status=response.status===429 || response.status>=500 || (response.status===409 && result.name==='concurrent_idempotent_requests')?'retry':'failed';reason=`Email provider rejected request (${response.status})`;}
  } catch {reason='Email request or persistence failed; retry with the same idempotency key';}
  const {data:finished,error:finishError}=await db.rpc('finish_subscription_email',{p_id:row.id,p_lease:row.lease_token,p_status:status,p_provider:provider,p_error:reason});
  if(finishError) throw new Error('Could not record email outcome; lease recovery will reuse the same idempotency key');
  if(finished) outcomes[status]++; else outcomes.cancelled++;
 }
 return outcomes;
}

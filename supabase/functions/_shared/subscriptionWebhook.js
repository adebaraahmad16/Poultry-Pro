// Svix/Standard Webhooks: verify the raw body, HMAC, and a five-minute replay window.
export async function verifySubscriptionWebhook(raw, headers, secret, now=Date.now()) {
 const id=headers.get('svix-id'),timestamp=headers.get('svix-timestamp'),signatures=headers.get('svix-signature');
 if(!secret || !id || !timestamp || !signatures || !/^\d+$/.test(timestamp) || Math.abs(now/1000-Number(timestamp))>300) throw new Error('Invalid webhook envelope');
 const bytes=Uint8Array.from(atob(secret.replace(/^whsec_/,'')),c=>c.charCodeAt(0));
 const key=await crypto.subtle.importKey('raw',bytes,{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const content=new TextEncoder().encode(`${id}.${timestamp}.${raw}`);
 let valid=false;
 for(const entry of signatures.split(' ')) {
  const [version,signature]=entry.split(',');if(version!=='v1' || !signature)continue;
  try{if(await crypto.subtle.verify('HMAC',key,Uint8Array.from(atob(signature),c=>c.charCodeAt(0)),content))valid=true;}catch{/* Ignore unknown/malformed rotation signatures. */}
 }
 if(!valid)throw new Error('Invalid webhook signature');
 const event=JSON.parse(raw);
 if(!event.data || typeof event.data.email_id!=='string' || !Number.isFinite(Date.parse(event.created_at)))throw new Error('Invalid webhook event');
 return {id,providerId:event.data.email_id,type:event.type,at:event.created_at};
}

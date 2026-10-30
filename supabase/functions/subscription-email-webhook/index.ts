import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifySubscriptionWebhook } from '../_shared/subscriptionWebhook.js';
Deno.serve(async req=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 const secret=Deno.env.get('RESEND_WEBHOOK_SECRET');
 if(!secret)return new Response('Webhook not configured',{status:503});
 let event;
 try{
  const reader=req.body?.getReader();if(!reader)throw new Error('Missing body');
  let size=0;const chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();return new Response('Body too large',{status:413});}chunks.push(value);}
  const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
  event=await verifySubscriptionWebhook(new TextDecoder().decode(body),req.headers,secret);
 }catch{return new Response('Invalid webhook',{status:400});}
 const status=({'email.delivered':'delivered','email.bounced':'bounced','email.failed':'failed'} as Record<string,string>)[event.type];
 if(!status)return new Response('Ignored',{status:200});
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
 const {error}=await db.rpc('record_subscription_email_event',{p_event_id:event.id,p_provider:event.providerId,p_status:status,p_occurred_at:event.at});
 return new Response(error?'Could not record event':'Recorded',{status:error?503:200});
});

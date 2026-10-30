import { createClient } from 'npm:@supabase/supabase-js@2';
import { deliverSubscriptionEmails } from '../_shared/subscriptionEmail.js';

Deno.serve(async req => {
 const expected=Deno.env.get('TRIAL_CRON_SECRET');
 const provided=req.headers.get('x-trial-cron-secret') || '';
 const digest=async(value:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
 const a=await digest(expected || ''),b=await digest(provided);
 if(!expected || expected.length<32 || a.reduce((difference,byte,i)=>difference|(byte^b[i]),0)!==0) return new Response('Unauthorized',{status:401});
 if(req.method!=='POST') return new Response('Method not allowed',{status:405});
 try {
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
  const outcomes=await deliverSubscriptionEmails({db,config:{apiKey:Deno.env.get('RESEND_API_KEY'),from:Deno.env.get('SUBSCRIPTION_EMAIL_FROM'),appUrl:Deno.env.get('APP_URL')}});
  return Response.json(outcomes);
 } catch(error) {
  console.error('Subscription reminder worker:',error instanceof Error ? error.message : 'Worker failed');
  return Response.json({error:'Reminder worker failed. Inspect server logs and delivery tracking.'},{status:503});
 }
});

import { createClient } from 'npm:@supabase/supabase-js@2';
import { readContactBody } from '../_shared/contactValidation.js';
import { verifiedPayment } from '../_shared/paymentValidation.js';

Deno.serve(async req => {
  const origin = Deno.env.get('APP_ALLOWED_ORIGIN') || Deno.env.get('CONTACT_ALLOWED_ORIGIN');
  const headers = { 'Access-Control-Allow-Origin': origin || '', 'Access-Control-Allow-Headers': 'authorization,x-client-info,apikey,content-type', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Content-Type': 'application/json', Vary: 'Origin' };
  const respond = (status: number, body: object) => new Response(JSON.stringify(body), {status,headers});
  if (!origin) return respond(503,{error:'Payment verification is not configured.'});
  if (req.headers.get('origin') !== origin) return respond(403,{error:'Request not allowed.'});
  if (req.method === 'OPTIONS') return new Response(null,{headers});
  if (req.method !== 'POST') return respond(405,{error:'Method not allowed.'});
  try {
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
    if (!token) return respond(401,{error:'Sign in as an administrator before verifying payments.'});
    const url = Deno.env.get('SUPABASE_URL')!;
    const db = createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
    const {data:identity,error:authError} = await db.auth.getUser(token);
    if (authError || !identity.user) return respond(401,{error:'Your administrator session could not be verified.'});
    const {data:admin,error:roleError} = await db.from('profiles').select('role,account_status').eq('id',identity.user.id).single();
    if (roleError || !admin || !['admin','super_admin','Super Admin'].includes(admin.role) || admin.account_status !== 'Active') return respond(403,{error:'Administrator authorization is required.'});
    const input = await readContactBody(req,4096);
    if (typeof input?.reference !== 'string' || !/^[A-Za-z0-9_.=-]{1,100}$/.test(input.reference)) return respond(400,{error:'Select a valid transaction reference.'});
    const {data:order,error:orderError} = await db.from('subscription_orders').select('*').eq('reference',input.reference).single();
    if (orderError || !order) return respond(404,{error:'The subscription order was not found.'});
    const {data:farm} = await db.from('farms').select('owner_id').eq('id',order.farm_id).single();
    if (!farm?.owner_id) return respond(400,{error:'The order is not linked to a valid farm owner.'});
    const {data:owner,error:ownerError} = await db.auth.admin.getUserById(farm.owner_id);
    if (ownerError || !owner.user?.email) return respond(400,{error:'The payment account could not be verified.'});
    const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!secret) return respond(503,{error:'The server payment gateway is not configured.'});
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(input.reference)}`,{headers:{Authorization:`Bearer ${secret}`},signal:AbortSignal.timeout(15000)});
    if (!response.ok) return respond(502,{error:'The payment gateway could not verify this transaction. Please retry.'});
    const payment = await response.json();
    if (!verifiedPayment(payment,order,owner.user.email)) return respond(409,{error:'The gateway has not confirmed a matching successful payment. No payment or subscription was changed.'});
    // Service-only function atomically applies the original order quote once.
    const {data:saved,error} = await db.rpc('confirm_verified_subscription_payment',{
      p_reference:order.reference,p_amount:payment.data.amount,p_currency:payment.data.currency,p_email:owner.user.email,
    });
    if (error) return respond(409,{error:error.message});
    return respond(200,{verified:true,order:saved});
  } catch { return respond(503,{error:'Payment verification could not be completed. Please retry.'}); }
});

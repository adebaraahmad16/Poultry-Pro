import { createClient } from 'npm:@supabase/supabase-js@2';
import { validContact, readContactBody } from '../_shared/contactValidation.js';
Deno.serve(async req => {
  const origin = Deno.env.get('CONTACT_ALLOWED_ORIGIN');
  const headers = { 'Access-Control-Allow-Origin': origin || '', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', 'Vary': 'Origin' };
  const respond = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
  if (!origin) return respond(503, { error: 'Contact support is temporarily unavailable.' });
  if (req.headers.get('origin') !== origin) return respond(403, { error: 'Request not allowed.' });
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return respond(405, { error: 'Method not allowed.' });
  try {
    const p = await readContactBody(req);
    if (!validContact(p)) {
      return respond(400, { error: 'Please check your message details.' });
    }
    // Supabase gateway supplies the client address. Keep only its hash in rate-limit storage.
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (!ip) return respond(503, { error: 'Please try again later.' });
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
    const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error } = await db.rpc('save_contact_enquiry', { payload: p, ip_hash: hash });
    if (error) return respond(error.message.includes('rate limit') ? 429 : 503, { error: error.message.includes('rate limit') ? 'Too many enquiries. Please try again in an hour.' : 'Unable to send your message. Please try again later.' });
    return respond(200, { success: true });
  } catch (error) {
    return error instanceof RangeError
      ? respond(413, { error: 'Message is too long.' })
      : respond(400, { error: 'Unable to process your message.' });
  }
});

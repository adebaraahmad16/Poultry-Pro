import { supabase } from '../lib/supabaseClient';
import { verifiedSession, assertSessionCurrent, currentSession } from './authSession';

let verifiedToken = null;
let verification = null;
const accessError = (message, status, code) => Object.assign(new Error(message), { status, code });

// UI caches and legacy Express tokens are never Supabase administrator credentials.
export async function requireSupabaseAdmin(expectedUserId) {
  if (!supabase) throw accessError('Supabase is not configured.', 503, 'NOT_CONFIGURED');
  const initial = await currentSession();
  const userId = expectedUserId || initial?.user?.id;
  try { return await verifyAdministrator(userId); }
  catch (error) {
    // A normal token rotation for the same account gets one bounded retry.
    if (error.code === 'AUTH_SESSION_CHANGED' && userId && (await currentSession())?.user?.id === userId) return verifyAdministrator(userId);
    throw error;
  }
}
async function verifyAdministrator(expectedUserId) {
  if (!supabase) throw accessError('Supabase is not configured.', 503, 'NOT_CONFIGURED');
  const session = await verifiedSession(expectedUserId);
  if (verifiedToken !== session.access_token || !verification) {
    const token = session.access_token;
    verifiedToken = token;
    verification = (async () => {
      const { data: allowed, error: denied, status } = await supabase.rpc('is_admin');
      // Validate before interpreting either false OR an error from an older RPC.
      await assertSessionCurrent(session);
      if (denied) throw Object.assign(new Error(`Administrator RPC failed: ${denied.message}`), { code: denied.code || 'ADMIN_RPC_FAILED', status: status || (denied.code === '42501' ? 403 : 503) });
      if (allowed !== true) throw Object.assign(accessError(`Supabase authenticated ${session.user.email || 'this account'} (${session.user.id}), but public.is_admin() returned false. Check that this Auth ID matches the existing administrator profile in the configured project; no roles or identities were changed.`, 403, 'ADMIN_ROLE_REQUIRED'), { userId: session.user.id });
      return { userId: session.user.id };
    })();
    verification.catch(() => { if (verifiedToken === token) { verifiedToken = null; verification = null; } });
  }
  const access = await verification;
  await assertSessionCurrent(session);
  return access;
}

export const isAdminAccessError = error => [401,403].includes(error?.status) || ['42501','PGRST301','PGRST302','ADMIN_SESSION_REQUIRED','ADMIN_ROLE_REQUIRED'].includes(error?.code);
export const adminRequestMessage = error => `${error?.message || 'The administrator request failed.'}${error?.code ? ` (${error.code})` : ''}`;

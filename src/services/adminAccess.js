import { supabase } from '../lib/supabaseClient';

let verifiedToken = null;
let verification = null;
const accessError = (message, status, code) => Object.assign(new Error(message), { status, code });

// UI caches and legacy Express tokens are never Supabase administrator credentials.
export async function requireSupabaseAdmin() {
  if (!supabase) throw accessError('Supabase is not configured.', 503, 'NOT_CONFIGURED');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const session = data?.session;
  if (!session?.user?.id || !session.access_token) {
    verifiedToken = null; verification = null;
    throw accessError('Sign in with your Supabase administrator account to access enquiries.', 401, 'ADMIN_SESSION_REQUIRED');
  }
  if (verifiedToken !== session.access_token || !verification) {
    const token = session.access_token;
    verifiedToken = token;
    verification = (async () => {
      const { data: allowed, error: denied } = await supabase.rpc('is_admin');
      if (denied) throw Object.assign(new Error(`Administrator verification failed: ${denied.message}`), { code: denied.code, status: denied.code === '42501' ? 403 : 401 });
      if (allowed !== true) throw accessError('Your authenticated account is not recognized by public.is_admin(). Ask an administrator to review your existing profile role.', 403, 'ADMIN_ROLE_REQUIRED');
      return { userId: session.user.id };
    })();
    verification.catch(() => { if (verifiedToken === token) { verifiedToken = null; verification = null; } });
  }
  const access = await verification;
  const { data: current } = await supabase.auth.getSession();
  if (current?.session?.user?.id !== access.userId || current.session.access_token !== session.access_token) {
    throw accessError('The administrator session changed. Please sign in again.', 401, 'ADMIN_SESSION_REQUIRED');
  }
  return access;
}

export const isAdminAccessError = error => [401,403].includes(error?.status) || ['42501','PGRST301','PGRST302','ADMIN_SESSION_REQUIRED','ADMIN_ROLE_REQUIRED'].includes(error?.code);
export const adminRequestMessage = error => `${error?.message || 'The administrator request failed.'}${error?.code ? ` (${error.code})` : ''}`;

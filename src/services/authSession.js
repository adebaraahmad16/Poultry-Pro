import { supabase } from '../lib/supabaseClient';

let token = null, verification = null;
export const sessionError = (message, code, status = 401, details = {}) => Object.assign(new Error(message), { code, status, ...details });
export const clearSessionVerification = () => { token = null; verification = null; };
export async function currentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data?.session || null;
}
export async function assertSessionCurrent(snapshot) {
  const current = await currentSession();
  if (!current || current.user?.id !== snapshot.user.id || current.access_token !== snapshot.access_token) {
    throw sessionError('The signed-in session changed while verifying access. Retry with the current account.', 'AUTH_SESSION_CHANGED', 409);
  }
}
export async function verifiedSession(expectedUserId) {
  if (!supabase) throw sessionError('Supabase is not configured.', 'NOT_CONFIGURED', 503);
  const session = await currentSession();
  if (!session?.user?.id || !session.access_token) {
    clearSessionVerification();
    throw sessionError('Sign in to continue.', 'ADMIN_SESSION_REQUIRED');
  }
  if (expectedUserId && session.user.id !== expectedUserId) {
    throw sessionError(`The active Supabase user (${session.user.id}) does not match the requested profile (${expectedUserId}). Sign in with the correct account; do not change either database identity.`, 'AUTH_IDENTITY_MISMATCH', 409, { userId: session.user.id, expectedUserId });
  }
  if (token !== session.access_token || !verification) {
    const checking = session.access_token;
    token = checking;
    verification = (async () => {
      // Validate this exact token at Auth, not just its cached user object.
      const { data, error } = await supabase.auth.getUser(checking);
      await assertSessionCurrent(session);
      if (error || !data?.user) throw sessionError(error?.message || 'Your session has expired. Sign in again.', error?.status === 401 || !data?.user && !error ? 'AUTH_SESSION_EXPIRED' : 'AUTH_VERIFICATION_FAILED', error?.status || 503);
      if (data.user.id !== session.user.id) throw sessionError('Supabase Auth and the stored session identify different users. Sign in again; no profile identities have been changed.', 'AUTH_IDENTITY_MISMATCH', 409);
      return data.user;
    })();
    verification.catch(() => { if (token === checking) clearSessionVerification(); });
  }
  const user = await verification;
  await assertSessionCurrent(session);
  return { ...session, user };
}

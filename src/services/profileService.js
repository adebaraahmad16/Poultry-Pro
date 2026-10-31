import { supabase } from '../lib/supabaseClient.js';
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const avatarBucket = existing => (import.meta.env.VITE_PROFILE_AVATAR_BUCKET || avatarStorageReference(existing)?.bucket || 'avatars').trim();
// Preserve the server's diagnosis; HTTP 400 can represent several different failures.
export function profileOperationError(stage, failure, context = {}) {
  const status = failure?.status;
  const statusCode = failure?.statusCode;
  const code = failure?.code;
  const details = [status && `HTTP ${status}`, code || statusCode].filter(Boolean).join(', ');
  const message = failure?.message || 'The server did not confirm the operation.';
  const error = new Error(`${stage}${details ? ` (${details})` : ''}: ${message}`, { cause: failure });
  Object.assign(error, { stage, status, statusCode, code, ...context });
  return error;
}
export function avatarStorageReference(value) {
  if (!value) return null;
  let match = value.match(/^storage:\/\/([^/]+)\/(.+)$/);
  if (!match) {
    try {
      const url = new URL(value), project = import.meta.env.VITE_SUPABASE_URL || supabase?.supabaseUrl;
      if (!project || url.origin !== new URL(project).origin) return null;
      match = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)/);
    } catch { return null; }
  }
  if (!match) return null;
  try {
    const bucket = decodeURIComponent(match[1]), path = decodeURIComponent(match[2]);
    if (!bucket || bucket.includes('/') || bucket==='.' || bucket==='..' || !path || path.split('/').some(part => !part || part === '.' || part === '..') || /[\\\u0000]/.test(bucket+path)) throw new Error('Invalid path');
    return { bucket, path, reference: `storage://${encodeURIComponent(bucket)}/${path.split('/').map(encodeURIComponent).join('/')}` };
  } catch { throw new Error('The saved profile image path is invalid. Choose the image again.'); }
}

export function normalizeProfile(row) {
  if (!row) return null;
  const name = row.full_name ?? row.fullName ?? row.name ?? '';
  const avatar = row.avatar_url ?? row.avatarUrl ?? row.avatar ?? '';
  const farmId = row.farm_id || row.farmId || null;
  return { ...row, full_name: name, fullName: name, name, avatar_url: avatar, avatarUrl: avatar, avatar, farm_id: farmId, farmId };
}

export async function verifiedProfileUser(expectedId) {
  if (!supabase) throw new Error('Profile saving requires a configured Supabase connection.');
  const { data, error } = await supabase.auth.getUser();
  if (error) throw profileOperationError('Your session could not be verified. Sign in again if it has expired', error);
  if (!data?.user || (expectedId && data.user.id !== expectedId)) throw new Error('Your account session changed. Sign in again before saving.');
  return data.user;
}

export async function changeAccountPassword(currentPassword, newPassword, expectedId) {
  if (!currentPassword || typeof newPassword !== 'string' || newPassword.length < 8) throw new Error('Enter your current password and a new password of at least 8 characters.');
  const user = await verifiedProfileUser(expectedId);
  const verification = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (verification.error) throw new Error('Your current password could not be verified.');
  if (verification.data.user.id !== user.id) throw new Error('Your account session changed. Please retry.');
  await verifiedProfileUser(user.id);
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw profileOperationError('Password update failed', error);
}

export function profilePatch(values) {
  const patch = {};
  const name = values.full_name ?? values.fullName ?? values.name;
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120) throw new Error('Enter a full name between 2 and 120 characters.');
    patch.full_name = name.trim();
  }
  if (values.phone !== undefined) {
    if (typeof values.phone !== 'string' || values.phone.trim().length > 40 || (values.phone.trim() && !/^[+\d\s().-]{5,40}$/.test(values.phone.trim()))) throw new Error('Enter a valid phone number.');
    patch.phone = values.phone.trim();
  }
  const avatar = values.avatar_url ?? values.avatarUrl ?? values.avatar;
  if (avatar !== undefined) {
    if (typeof avatar !== 'string' || (avatar && !/^https:\/\//i.test(avatar) && !avatar.startsWith('storage://'))) throw new Error('Profile pictures must use a secure image URL or an uploaded image.');
    let canonical = avatar;
    if (avatar.startsWith('storage://')) {
      canonical = avatarStorageReference(avatar).reference;
    } else if (avatar) {
      const url = new URL(avatar);
      const project = import.meta.env.VITE_SUPABASE_URL || supabase?.supabaseUrl;
      if (project && url.origin === new URL(project).origin && url.pathname.includes('/storage/v1/object/sign/')) {
        canonical = avatarStorageReference(avatar)?.reference || avatar;
      }
    }
    patch.avatar_url = canonical;
  }
  if (!Object.keys(patch).length) throw new Error('There are no profile changes to save.');
  return patch;
}

export async function saveProfile(values, expectedId, { resolveAvatar = true } = {}) {
  const patch = profilePatch(values);
  const user = await verifiedProfileUser(expectedId);
  const stored = patch.avatar_url && avatarStorageReference(patch.avatar_url);
  if (stored && stored.path.split('/')[0] !== user.id) throw new Error('You can only save a profile image from your own Storage folder.');
  const { data, error } = await supabase.from('profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', user.id).select('id,email,full_name,phone,role,farm_id,avatar_url,created_at,updated_at').single();
  if (error) throw profileOperationError('Profile changes could not be saved', error);
  if (!data || data.id !== user.id) throw new Error('The profile was not saved. Check your account permissions and retry.');
  if ('avatar_url' in patch && (data.avatar_url || '') !== patch.avatar_url) throw new Error('The database did not retain the requested profile image reference.');
  return resolveAvatar ? resolveProfileAvatar(normalizeProfile(data)) : normalizeProfile(data);
}

export async function resolveProfileAvatar(profile) {
  if (profile) profile = { ...profile, avatarDisplayUrl: profile.avatar_url?.startsWith('https://') ? profile.avatar_url : '', avatarError: '' };
  if (!profile?.avatar_url || !supabase?.storage) return profile;
  try {
    const stored = avatarStorageReference(profile.avatar_url);
    if (!stored) return profile;
    // Public references are permanent URLs. Signing them introduces an unnecessary
    // dependency on SELECT policies and can replace a working URL with an error.
    if (profile.avatar_url.includes('/storage/v1/object/public/')) return profile;
    const { data, error } = await supabase.storage.from(stored.bucket).createSignedUrl(stored.path, 3600);
    return { ...profile, avatarDisplayUrl: error ? '' : data?.signedUrl || '', avatarError: error ? `Profile picture could not be loaded: ${error.message}` : '' };
  } catch (error) { return { ...profile, avatarDisplayUrl: '', avatarError: error.message }; }
}

async function publicAvatarUrl(storage, path) {
  const url = storage.getPublicUrl(path).data?.publicUrl;
  if (!url) return '';
  try {
    // getPublicUrl only constructs a URL; it does not establish bucket visibility.
    const response = await fetch(url, { method: 'HEAD', credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(5000) });
    return response.ok && response.headers.get('content-type')?.startsWith('image/') ? url : '';
  } catch { return ''; } // Private buckets use a stable path and signed display URL.
}

async function cleanupOwnedAvatar(reference, userId, replacement = '') {
  if (!reference || reference === replacement) return '';
  try {
    const stored = avatarStorageReference(reference);
    if (!stored || stored.path.split('/')[0] !== userId) return '';
    await verifiedProfileUser(userId);
    const { error } = await supabase.storage.from(stored.bucket).remove([stored.path]);
    return error ? `Your picture was saved, but the previous image could not be removed: ${error.message}` : '';
  } catch (error) { return `Your picture was saved, but the previous image could not be removed: ${error.message}`; }
}

export async function removeProfileAvatar(expectedId, existingAvatar = '') {
  const saved = await saveProfile({ avatar_url: '' }, expectedId);
  const avatarWarning = await cleanupOwnedAvatar(existingAvatar, saved.id);
  return { ...saved, avatarWarning };
}

export async function validateAvatar(file) {
  const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  if (!file || typeof file.slice !== 'function' || !Number.isFinite(file.size)) throw new Error('Select an image file before uploading.');
  if (!types[file.type]) throw new Error('Unsupported image format. Choose JPG, JPEG, PNG, or WebP (maximum 2 MB).');
  if (file.size > MAX_AVATAR_BYTES) throw new Error('The image is too large. Choose an image no larger than 2 MB.');
  if (!file.size) throw new Error('The selected image file is empty.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const valid = file.type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : file.type === 'image/png' ? [137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b)
    : String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP';
  if (!valid) throw new Error('The selected file is not a valid image of the stated type.');
  return types[file.type];
}

export async function saveProfileAvatar(file, expectedId, existingAvatar = '') {
  const extension = await validateAvatar(file);
  const user = await verifiedProfileUser(expectedId);
  const bucket = avatarBucket(existingAvatar);
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const storage = supabase.storage.from(bucket);
  const { data: uploaded, error } = await storage.upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    // Log only allowlisted diagnostic fields, never the client/session or request headers.
    // A serialized line remains copyable when the browser collapses error objects.
    console.error('PoultryPro avatar upload response:', JSON.stringify({
      status: error.status ?? null,
      statusCode: error.statusCode ?? null,
      code: error.code ?? null,
      message: error.message || 'Storage did not provide an error message',
    }));
    throw profileOperationError(`Profile picture upload failed in bucket "${bucket}"`, error, { bucket, path });
  }
  if (!uploaded?.path || uploaded.path !== path) throw new Error('Storage did not confirm the requested image path. Your profile has not been changed.');
  let saved;
  try {
    const publicUrl = await publicAvatarUrl(storage, uploaded.path);
    const reference = publicUrl || `storage://${encodeURIComponent(bucket)}/${uploaded.path}`;
    // Persist first. An image-read failure must not prevent saving a valid upload
    // or cause a newly referenced object to be deleted.
    saved = await saveProfile({ avatar_url: reference }, user.id, { resolveAvatar: false });
  }
  catch (error) {
    // Never remove the previous avatar when saving the new reference fails.
    try { const result = await storage.remove([path]); if (result.error) error.cleanupError = profileOperationError('Unused image cleanup failed', result.error); }
    catch (cleanupError) { error.cleanupError = cleanupError; }
    throw error;
  }
  const resolved = await resolveProfileAvatar(saved);
  const avatarWarning = await cleanupOwnedAvatar(existingAvatar, user.id, saved.avatar_url);
  return { ...resolved, avatarWarning };
}

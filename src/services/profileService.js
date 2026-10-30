import { supabase } from '../lib/supabaseClient.js';

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
  if (error) throw new Error(error.message);
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
  if (error) throw new Error(error.message);
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
    if (typeof avatar !== 'string' || (avatar && !/^https:\/\//i.test(avatar))) throw new Error('Profile pictures must use a secure image URL or an uploaded image.');
    let canonical = avatar;
    if (avatar) {
      const url = new URL(avatar);
      const project = import.meta.env.VITE_SUPABASE_URL || supabase?.supabaseUrl;
      if (project && url.origin === new URL(project).origin && url.pathname.includes('/storage/v1/object/sign/')) {
        url.pathname = url.pathname.replace('/object/sign/', '/object/public/'); url.search = ''; canonical = url.toString();
      }
    }
    patch.avatar_url = canonical;
  }
  if (!Object.keys(patch).length) throw new Error('There are no profile changes to save.');
  return patch;
}

export async function saveProfile(values, expectedId) {
  const patch = profilePatch(values);
  const user = await verifiedProfileUser(expectedId);
  const { data, error } = await supabase.from('profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', user.id).select('id,email,full_name,phone,role,farm_id,avatar_url,created_at,updated_at').single();
  if (error) throw new Error(error.message);
  if (!data || data.id !== user.id) throw new Error('The profile was not saved. Check your account permissions and retry.');
  return resolveProfileAvatar(normalizeProfile(data));
}

export async function resolveProfileAvatar(profile) {
  if (profile) profile = { ...profile, avatarDisplayUrl: profile.avatar_url || '' };
  if (!profile?.avatar_url || !supabase?.storage) return profile;
  try {
    const url = new URL(profile.avatar_url);
    const project = import.meta.env.VITE_SUPABASE_URL || supabase.supabaseUrl;
    if (!project || url.origin !== new URL(project).origin) return profile;
    const match = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/);
    if (!match) return profile;
    const { data, error } = await supabase.storage.from(decodeURIComponent(match[1])).createSignedUrl(decodeURIComponent(match[2]), 3600);
    return { ...profile, avatarDisplayUrl: error ? profile.avatar_url : data.signedUrl };
  } catch { return profile; }
}

export async function validateAvatar(file) {
  const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  if (!file || !types[file.type] || !file.size || file.size > 5 * 1024 * 1024) throw new Error('Choose a JPEG, PNG, or WebP image smaller than 5 MB.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const valid = file.type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : file.type === 'image/png' ? [137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b)
    : String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP';
  if (!valid) throw new Error('The selected file is not a valid image of the stated type.');
  return types[file.type];
}

export async function saveProfileAvatar(file, expectedId) {
  const extension = await validateAvatar(file);
  const user = await verifiedProfileUser(expectedId);
  const bucket = (import.meta.env.VITE_PROFILE_AVATAR_BUCKET || 'avatars').trim();
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const storage = supabase.storage.from(bucket);
  const { error } = await storage.upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Profile picture upload failed: ${error.message}`);
  const { data } = storage.getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Storage did not return a profile picture URL.');
  try {
    const readable = await storage.createSignedUrl(path, 3600);
    if (readable.error) throw new Error(`Profile picture access failed: ${readable.error.message}`);
    return await saveProfile({ avatar_url: data.publicUrl }, user.id);
  }
  catch (error) { try { await storage.remove([path]); } catch { /* Only the newly uploaded, unused file is eligible for cleanup. */ } throw error; }
}

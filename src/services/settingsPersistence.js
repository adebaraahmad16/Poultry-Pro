import { supabase } from '../lib/supabaseClient';
import { verifiedProfileUser } from './profileService';

export async function readSetting(id, fallback, ownerId = null) {
  if (!supabase) throw new Error('A Supabase connection is required to load settings.');
  let query = supabase.from('app_settings').select('value').eq('id', id);
  query = ownerId ? query.eq('owner_id', ownerId) : query.is('owner_id', null);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Settings could not be loaded: ${error.message}`);
  return data?.value ?? fallback;
}
export async function writeSetting(id, value, ownerId = null) {
  if (!supabase) throw new Error('A Supabase connection is required to save settings.');
  const { data, error } = await supabase.from('app_settings').upsert({ id, owner_id: ownerId, value, updated_at: new Date().toISOString() }, { onConflict: 'id' }).select('value').single();
  if (error) throw new Error(`Settings were not saved: ${error.message}`);
  if (!data) throw new Error('The database did not confirm the settings update.');
  return data.value;
}
export async function readNotificationPreferences(expectedId, defaults) {
  const user = await verifiedProfileUser(expectedId);
  return readSetting(`user:${user.id}:notifications`, defaults, user.id);
}
export async function saveNotificationPreferences(expectedId, values) {
  const user = await verifiedProfileUser(expectedId);
  if (Object.values(values).some(value => typeof value !== 'boolean')) throw new Error('Notification preferences must be enabled or disabled.');
  return writeSetting(`user:${user.id}:notifications`, values, user.id);
}

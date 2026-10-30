import { supabase } from '../../lib/supabaseClient';
import { requireSupabaseAdmin } from '../../services/adminAccess';
import { readSetting, writeSetting } from '../../services/settingsPersistence';
import { initialPlatformSettings, initialSubscriptionSettings, initialWebsiteContent, initialPoultryCategories } from './adminMockData';

const confirmed = async query => {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!data) throw new Error('The database did not confirm this change. Check administrator permissions and retry.');
  return data;
};
export async function loadAdminConfiguration() {
  const [settings, subscriptionSettings, cms, categories] = await Promise.all([
    readSetting('admin:platform', initialPlatformSettings), readSetting('admin:subscriptions', initialSubscriptionSettings),
    readSetting('admin:website', initialWebsiteContent), readSetting('admin:categories', initialPoultryCategories),
  ]);
  return { settings, subscriptionSettings, cms, categories };
}
export const saveAdminConfiguration = (key, value) => writeSetting(`admin:${key}`, value);
export async function verifyGatewayPayment(reference) {
  if (!supabase || !reference) throw new Error('Select a valid transaction reference.');
  const { data, error } = await supabase.functions.invoke('verify-admin-payment', { body: { reference } });
  if (error || !data?.verified || !data.order) {
    let message = data?.error;
    if (!message && error?.context) { try { message = (await error.context.json()).error; } catch { /* Network errors use the fallback. */ } }
    throw new Error(message || 'Payment verification was not confirmed. Please retry.');
  }
  return data.order;
}
export async function saveFarmerStatus(id, status) {
  if (!supabase || !['Active','Suspended'].includes(status)) throw new Error('Select a valid farmer account status.');
  return confirmed(supabase.from('profiles').update({ account_status: status }).eq('id', id).eq('role', 'farmer').select('id,account_status').single());
}
export async function saveSubscriber(farmer, action, values, plans) {
  const aliases = { extendTrial: 'extend_trial', changePlan: 'change_plan' };
  action = aliases[action] || action;
  let query = supabase.from('farm_subscriptions').select('*').eq('user_id', farmer.id);
  if (farmer.farmId) query = query.eq('farm_id', farmer.farmId);
  const previous = await confirmed(query.single());
  const patch = {};
  if (action === 'cancel') { patch.status = 'cancelled'; patch.auto_renew = false; }
  else if (action === 'change_plan') {
    const plan = plans.find(p => p.id.toLowerCase() === values.planId?.toLowerCase() && p.status === 'Active');
    if (!plan) throw new Error('Select an active subscription plan.');
    const flockResult = await confirmed(supabase.from('flocks').select('type,current_birds,status').eq('farm_id', previous.farm_id));
    const active = flockResult.filter(f => f.status !== 'Archived' && f.status !== 'Sold');
    const birds = active.reduce((sum,f) => sum + Number(f.current_birds || 0), 0);
    if ((plan.maxFlocks != null && active.length > plan.maxFlocks) || (plan.maxBirds != null && birds > plan.maxBirds) || (plan.maxPoultryTypes != null && new Set(active.map(f => f.type)).size > plan.maxPoultryTypes)) throw new Error('Existing farm usage exceeds the selected plan limits.');
    patch.plan_id = plan.id; // Entitlement changes preserve the agreed prices and billing cycle.
  } else if (action === 'extend' || action === 'extend_trial') {
    const days = Number(values.days);
    if (!Number.isInteger(days) || days < 1 || days > 366) throw new Error('Enter an extension between 1 and 366 days.');
    const extend = value => new Date(Math.max(Date.now(), new Date(value || 0).getTime() || 0) + days * 86400000).toISOString();
    patch.renewal_date = extend(previous.renewal_date);
    if (action === 'extend_trial' || previous.status === 'trial') { patch.trial_ends_at = extend(previous.trial_ends_at); patch.status = 'trial'; }
    else patch.status = 'active';
  } else if (action === 'reactivate') {
    const next = new Date(); const day = next.getDate(); next.setDate(1); next.setMonth(next.getMonth() + 1);
    next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth()+1, 0).getDate()));
    patch.status = 'active'; patch.renewal_date = next.toISOString();
  } else throw new Error('Unsupported subscription action.');
  if (patch.renewal_date) patch.current_period_end = patch.renewal_date;
  patch.updated_at = new Date().toISOString();
  return confirmed(supabase.from('farm_subscriptions').update(patch).eq('farm_id', previous.farm_id).eq('user_id', farmer.id).select().single());
}
export async function publishNotification(values, farmers) {
  await requireSupabaseAdmin();
  if (!supabase) throw new Error('A Supabase connection is required to publish notifications.');
  if (!values.title?.trim() || !values.message?.trim()) throw new Error('Enter an announcement headline and message.');
  let targets = farmers;
  if (values.targetFarmerId) targets = targets.filter(f => f.id === values.targetFarmerId);
  else if (values.targetAudience === 'Basic Plan Users') targets = targets.filter(f => ['basic','starter','free'].includes(String(f.planId).toLowerCase()));
  else if (values.targetAudience === 'Pro Users') targets = targets.filter(f => ['professional','pro'].includes(String(f.planId).toLowerCase()));
  else if (values.targetAudience === 'Enterprise Users') targets = targets.filter(f => String(f.planId).toLowerCase() === 'enterprise');
  else if (values.targetAudience === 'Broiler Farmers') targets = targets.filter(f => f.poultryTypes?.some(t => /broiler/i.test(t)));
  else if (values.targetAudience === 'Layer Farmers') targets = targets.filter(f => f.poultryTypes?.some(t => /layer/i.test(t)));
  targets = [...new Map(targets.map(f => [f.id, f])).values()];
  if (!targets.length) throw new Error('No authorized recipients match the selected audience.');
  const id = values.requestId || crypto.randomUUID();
  const priority = /urgent/i.test(values.priority) ? 'urgent' : /important|high/i.test(values.priority) ? 'high' : 'normal';
  const rows = targets.map(f => ({ id: `${id}:${f.id}`, user_id: f.id, farm_id: f.farmId || null, title: values.title.trim(), message: values.message.trim(), type: priority === 'urgent' ? 'error' : priority === 'high' ? 'warning' : 'info', category: 'admin_broadcast', time: new Date().toISOString(), is_read: false }));
  await confirmed(supabase.from('notifications').upsert(rows, { onConflict: 'id', ignoreDuplicates: true }).select('id'));
  return { ...values, id, dateSent: new Date().toISOString(), status: 'Published', recipientCount: targets.length };
}
export async function loadBroadcasts() {
  await requireSupabaseAdmin();
  const rows = await confirmed(supabase.from('notifications').select('*').eq('category', 'admin_broadcast').order('created_at', { ascending: false }));
  const batches = new Map();
  for (const row of rows) {
    // Existing text IDs encode batch:recipient; standalone legacy IDs stay distinct.
    const separator = row.id.lastIndexOf(':');
    const batchId = row.related_entity_id || (separator > 0 ? row.id.slice(0, separator) : row.id);
    const current = batches.get(batchId);
    if (current) current.recipientCount++;
    else batches.set(batchId, { id: batchId, title: row.title, message: row.message, priority: row.priority || (row.type === 'error' ? 'urgent' : row.type === 'warning' ? 'high' : 'normal'), targetAudience: 'Selected Farmers', recipientCount: 1, dateSent: row.created_at, status: 'Published' });
  }
  return [...batches.values()];
}

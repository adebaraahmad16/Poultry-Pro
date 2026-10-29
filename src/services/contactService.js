import { supabase } from '../lib/supabaseClient';

export const CONTACT_SUBJECTS = ['General Enquiry', 'Technical Support', 'Account Registration', 'Subscription and Payment', 'Report a Problem', 'Feature Suggestion', 'Partnership or Business Enquiry', 'Other'];
const client = () => {
  if (!supabase) throw new Error('Contact support is temporarily unavailable. Please try again later.');
  return supabase;
};
export async function submitContact(form) {
  const { data, error } = await client().functions.invoke('submit-contact', { body: form });
  if (error || !data?.success) {
    let detail = data?.error;
    if (!detail && error?.context) {
      try { detail = (await error.context.json()).error; } catch { /* Preserve a useful fallback for network errors. */ }
    }
    throw new Error(detail || 'Unable to send your message. Please try again later.');
  }
}
export async function contactQuery(query) {
  const { data, error } = await query(client());
  if (error) throw error;
  return data;
}
export async function getContactStats() {
  const filters = [null, ['is_read', false], ['status', 'in_progress'], ['status', 'resolved']];
  const values = await Promise.all(filters.map(async filter => {
    let query = client().from('contact_messages').select('id', { count: 'exact', head: true });
    if (filter) query = query.eq(...filter);
    const { count, error } = await query;
    if (error) throw error;
    return count;
  }));
  return { total: values[0], unread: values[1], inProgress: values[2], resolved: values[3] };
}
export async function updateContact(id, patch) {
  const keys = Object.keys(patch);
  if (!keys.length || keys.some(key => !['is_read', 'status'].includes(key)) ||
      ('is_read' in patch && typeof patch.is_read !== 'boolean') ||
      ('status' in patch && !['new', 'in_progress', 'resolved'].includes(patch.status))) {
    throw new Error('Invalid contact message update.');
  }
  const data = await contactQuery(db => db.from('contact_messages').update(patch).eq('id', id).select().single());
  window.dispatchEvent(new Event('contact-messages-changed'));
  return data;
}

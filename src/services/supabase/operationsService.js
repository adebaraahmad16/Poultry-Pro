import { localDate } from '../../../shared/dailyRecords';
import { supabase } from '../../lib/supabaseClient';
import { getSelectedFarmId } from '../farmScope';

export function selectedFarm() {
  const id = getSelectedFarmId();
  if (!supabase || !id) throw new Error('Select a farm and reconnect to Supabase before saving records.');
  return id;
}
const changed = () => window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: 'supabase' } }));
export async function operationQuery(query, mutation = false) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await query(supabase);
  if (error) throw new Error(error.message);
  if (mutation && (!data || (Array.isArray(data) && !data.length))) throw new Error('No record was saved. Check your permissions and retry.');
  if (mutation) changed();
  return data;
}
export const mapInventory = row => ({ ...row, farmId: row.farm_id, minStock: row.min_stock, dateAdded: row.date_added, lastMovement: row.last_movement });
export const mapTask = row => ({ ...row, farmId: row.farm_id, assignedTo: row.assigned_to, dueDate: row.due_date });
export async function getInventory(farmId) {
  const rows = await operationQuery(db => db.from('inventory').select('*').eq('farm_id', farmId).order('created_at', { ascending: false }));
  return rows.map(mapInventory);
}
export async function getTasks(farmId) {
  const rows = await operationQuery(db => db.from('tasks').select('*').eq('farm_id', farmId).order('due_date'));
  return rows.map(mapTask);
}
function inventoryPayload(values) {
  const payload = {};
  for (const key of ['name','category','quantity','unit','supplier','cost','status','notes']) if (values[key] !== undefined) payload[key] = values[key];
  if (values.minStock !== undefined) payload.min_stock = Number(values.minStock);
  if (values.dateAdded !== undefined) payload.date_added = values.dateAdded;
  for (const key of ['quantity','min_stock','cost']) if (payload[key] !== undefined) {
    payload[key] = Number(payload[key]);
    if (!Number.isFinite(payload[key]) || payload[key] < 0) throw new Error('Stock quantities, thresholds, and costs must be zero or greater.');
  }
  if (payload.name !== undefined && !payload.name.trim()) throw new Error('Enter an inventory item name.');
  if (payload.quantity !== undefined && payload.min_stock !== undefined) payload.status = payload.quantity === 0 ? 'Out of Stock' : payload.quantity <= payload.min_stock ? 'Low Stock' : 'In Stock';
  return payload;
}
export async function createInventory(values) {
  const farmId = selectedFarm();
  return mapInventory(await operationQuery(db => db.from('inventory').insert({ id: crypto.randomUUID(), farm_id: farmId, ...inventoryPayload(values) }).select().single(), true));
}
export async function updateInventory(id, values) {
  const farmId = selectedFarm();
  return mapInventory(await operationQuery(db => db.from('inventory').update(inventoryPayload(values)).eq('id', id).eq('farm_id', farmId).select().single(), true));
}
export async function moveInventory(id, quantity, type, notes, date) {
  const farmId = selectedFarm();
  if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0 || !['addition','usage'].includes(type)) throw new Error('Enter a valid stock movement and a quantity greater than zero.');
  const rows = await operationQuery(db => db.rpc('apply_inventory_movement', { p_item_id: id, p_farm_id: farmId, p_quantity: Number(quantity), p_type: type, p_notes: notes || '', p_date: date || localDate() }), true);
  return mapInventory(Array.isArray(rows) ? rows[0] : rows);
}
export async function createTask(values) {
  const farmId = selectedFarm();
  if (!values.title?.trim()) throw new Error('Enter a task title.');
  return mapTask(await operationQuery(db => db.from('tasks').insert({ id: crypto.randomUUID(), farm_id: farmId, title: values.title.trim(), assigned_to: values.assignedTo || '', due_date: values.dueDate, priority: values.priority || 'Medium', status: values.status || 'Pending', notes: values.notes || '' }).select().single(), true));
}
export async function updateTaskStatus(id, status) {
  const farmId = selectedFarm();
  if (!['Pending','In Progress','Completed'].includes(status)) throw new Error('Select a valid task status.');
  return mapTask(await operationQuery(db => db.from('tasks').update({ status }).eq('id', id).eq('farm_id', farmId).select().single(), true));
}
export async function deleteOperation(table, id) {
  const farmId = selectedFarm();
  if (!['tasks','inventory'].includes(table)) throw new Error('Invalid record type.');
  return operationQuery(db => db.from(table).delete().eq('id', id).eq('farm_id', farmId).select('id').single(), true);
}

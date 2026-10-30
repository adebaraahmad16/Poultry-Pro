import { getInventory, getTasks } from './operationsService';
/**
 * Supabase Farm Data Service
 * All farm-related CRUD operations via Supabase tables with RLS applied.
 */
import { supabase } from '../../lib/supabaseClient.js';

// ─── Farm Profile ──────────────────────────────────────────────────────────

export async function getFarm(farmId) {
  if (!supabase || !farmId) return null;
  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapFarm(data) : null;
}

export async function updateFarm(farmId, updates) {
  if (!supabase || !farmId) return null;
  const patch = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.location !== undefined) patch.location = updates.location;
  if (updates.size !== undefined) patch.size = updates.size;
  if (updates.poultryTypes !== undefined) patch.poultry_types = updates.poultryTypes;
  if (updates.currency !== undefined) patch.currency = updates.currency;
  if (updates.weightUnit !== undefined) patch.weight_unit = updates.weightUnit;

  const { data, error } = await supabase
    .from('farms')
    .update(patch)
    .eq('id', farmId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapFarm(data);
}

function mapFarm(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    type: 'Poultry Farm',
    size: row.size,
    poultryTypes: row.poultry_types || [],
    currency: row.currency || '₦',
    weightUnit: row.weight_unit || 'kg',
  };
}

// ─── Flocks ────────────────────────────────────────────────────────────────

function generateRowId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function getFlocks(farmId) {
  if (!supabase || !farmId) return [];
  const { data, error } = await supabase
    .from('flocks')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false });
  if (!error) return (data || []).map(mapFlock);

  // Fallback without created_at ordering if column missing
  const fallback = await supabase
    .from('flocks')
    .select('*')
    .eq('farm_id', farmId);
  if (fallback.error) {
    console.warn('[getFlocks warning]:', fallback.error.message);
    return [];
  }
  return (fallback.data || []).map(mapFlock);
}

/**
 * Safely inserts a record into Supabase, automatically handling schema variations
 * by omitting any columns that the remote Postgres table does not support.
 */
async function safeInsert(table, payload) {
  const row = { ...payload, id: payload.id || generateRowId() };
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error(`The ${table} record was not saved. Check your permissions and retry.`);
  return data;
}
async function safeUpdate(table, id, updates) {
  if (!id) throw new Error('Select a valid record before saving changes.');
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error(`The ${table} record was not updated. Check your permissions and retry.`);
  return data;
}
async function confirmedDelete(table, id) {
  if (!supabase || !id) throw new Error('Select a valid record before deleting.');
  const { data, error } = await supabase.from(table).delete().eq('id', id).select('id').single();
  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error('The record was not deleted. Check your permissions and retry.');
}

export async function createFlock(farmId, flock) {
  if (!supabase || !farmId) throw new Error('Not configured');
  const data = await safeInsert('flocks', { farm_id: farmId, ...toFlockRow(flock) });
  return mapFlock(data);
}

export async function updateFlock(flockId, updates) {
  if (!supabase) throw new Error('Not configured');
  const data = await safeUpdate('flocks', flockId, toFlockRow(updates, true));
  return mapFlock(data);
}

export async function deleteFlock(flockId) {
  if (!supabase) throw new Error('Not configured');
  await confirmedDelete('flocks', flockId);
}

function toFlockRow(f, partial = false) {
  const initial = Number(f.initialBirds) || 0;
  const current = f.currentBirds !== undefined ? Number(f.currentBirds) : initial;
  const cost = Number(f.costPerBird) || 0;
  const row = {
    name: f.name || 'Untitled Flock',
    type: f.type || 'Broilers',
    breed: f.breed || '',
    initial_birds: initial,
    current_birds: current,
    age_weeks: Number(f.ageWeeks) || 0,
    pen: f.housingType || f.pen || '',
    status: f.status || 'Active',
    date_acquired: f.acquisitionDate || f.dateAcquired || new Date().toISOString().split('T')[0],
    cost_per_bird: cost,
    total_cost: cost * initial,
    source: f.source || '',
    notes: f.notes || '',
  };
  if (!partial) return row;
  const fields = {name:['name'],type:['type'],breed:['breed'],initial_birds:['initialBirds'],current_birds:['currentBirds'],age_weeks:['ageWeeks'],pen:['pen','housingType'],status:['status'],date_acquired:['acquisitionDate','dateAcquired'],cost_per_bird:['costPerBird'],source:['source'],notes:['notes']};
  const patch = Object.fromEntries(Object.entries(fields).filter(([,keys]) => keys.some(key => f[key] !== undefined)).map(([column]) => [column,row[column]]));
  if (f.costPerBird !== undefined && f.initialBirds !== undefined) patch.total_cost = row.total_cost;
  return patch;
}

function mapFlock(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmId: row.farm_id,
    name: row.name,
    type: row.type,
    breed: row.breed,
    initialBirds: row.initial_birds,
    currentBirds: row.current_birds,
    ageWeeks: row.age_weeks,
    housingType: row.pen || row.housing_type || '',
    status: row.status,
    acquisitionDate: row.date_acquired || row.acquisition_date,
    costPerBird: row.cost_per_bird,
    pen: row.pen || row.housing_type || '',
    source: row.source || '',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

// ─── Egg Production ────────────────────────────────────────────────────────

export async function getEggs(farmId) {
  if (!supabase || !farmId) return [];
  const { data, error } = await supabase
    .from('egg_production')
    .select('*')
    .eq('farm_id', farmId)
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapEgg);
}

export async function createEgg(farmId, record) {
  if (!supabase) throw new Error('Not configured');
  const good = Number(record.goodEggs) || 0;
  const broken = Number(record.brokenEggs) || 0;
  const rejected = Number(record.rejectedEggs) || 0;
  const total = Number(record.totalEggs) || (good + broken + rejected);
  const data = await safeInsert('egg_production', {
    farm_id: farmId,
    flock_id: record.flockId || null,
    flock_name: record.flockName || '',
    date: record.date || new Date().toISOString().split('T')[0],
    good_eggs: good,
    broken_eggs: broken,
    rejected_eggs: rejected,
    total_eggs: total,
    notes: record.notes || null,
  });
  return mapEgg(data);
}

export async function updateEgg(id, record) {
  if (!supabase) throw new Error('Not configured');
  const patch = {};
  if (record.flockId !== undefined) patch.flock_id = record.flockId || null;
  if (record.flockName !== undefined) patch.flock_name = record.flockName;
  if (record.date !== undefined) patch.date = record.date;
  if (record.goodEggs !== undefined) patch.good_eggs = Number(record.goodEggs);
  if (record.brokenEggs !== undefined) patch.broken_eggs = Number(record.brokenEggs);
  if (record.rejectedEggs !== undefined) patch.rejected_eggs = Number(record.rejectedEggs);
  if (record.totalEggs !== undefined) patch.total_eggs = Number(record.totalEggs);
  if (record.notes !== undefined) patch.notes = record.notes || null;
  const data = await safeUpdate('egg_production', id, patch);
  return mapEgg(data);
}

export async function deleteEgg(id) {
  if (!supabase) throw new Error('Not configured');
  await confirmedDelete('egg_production', id);
}

function mapEgg(row) {
  if (!row) return null;
  return { id: row.id, farmId: row.farm_id, flockId: row.flock_id, date: row.date, goodEggs: row.good_eggs, brokenEggs: row.broken_eggs, rejectedEggs: row.rejected_eggs, totalEggs: row.total_eggs, flockName: row.flock_name, notes: row.notes, createdAt: row.created_at };
}

// ─── Feed Inventory ────────────────────────────────────────────────────────

export async function getFeeds(farmId) {
  if (!supabase || !farmId) return [];
  const { data, error } = await supabase.from('feed_inventory').select('*').eq('farm_id', farmId).order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapFeed);
}

export async function createFeed(farmId, record) {
  if (!supabase) throw new Error('Not configured');
  const data = await safeInsert('feed_inventory', {
    farm_id: farmId,
    flock_id: record.flockId || null,
    date: record.date || new Date().toISOString().split('T')[0],
    name: record.name || record.feedType || 'General Feed',
    supplier: record.supplier || '',
    status: record.status || 'In Stock',
    unit_price: Number(record.unitPrice ?? record.costPerBag ?? 0),
    min_stock_threshold_bags: Number(record.minStockThresholdBags ?? 5),
    feed_type: record.feedType || record.type || 'General Feed',
    quantity_bags: Number(record.quantityBags) || 0,
    bag_weight_kg: Number(record.bagWeightKg) || 25,
    cost_per_bag: Number(record.costPerBag) || 0,
    notes: record.notes || null,
  });
  return mapFeed(data);
}

export async function updateFeed(id, record) {
  if (!supabase) throw new Error('Not configured');
  const patch = {};
  for (const [key,column] of [['name','name'],['supplier','supplier'],['status','status'],['unitPrice','unit_price'],['minStockThresholdBags','min_stock_threshold_bags']]) if (record[key] !== undefined) patch[column] = record[key];
  if (record.flockId !== undefined) patch.flock_id = record.flockId || null;
  if (record.date !== undefined) patch.date = record.date;
  if (record.feedType !== undefined) patch.feed_type = record.feedType;
  if (record.quantityBags !== undefined) patch.quantity_bags = Number(record.quantityBags);
  if (record.bagWeightKg !== undefined) patch.bag_weight_kg = Number(record.bagWeightKg);
  if (record.costPerBag !== undefined) patch.cost_per_bag = Number(record.costPerBag);
  if (record.notes !== undefined) patch.notes = record.notes || null;
  const data = await safeUpdate('feed_inventory', id, patch);
  return mapFeed(data);
}

export async function deleteFeed(id) {
  if (!supabase) throw new Error('Not configured');
  await confirmedDelete('feed_inventory', id);
}

function mapFeed(row) {
  if (!row) return null;
  return { id: row.id, farmId: row.farm_id, name: row.name, type: row.feed_type, supplier: row.supplier, status: row.status, unitPrice: row.unit_price ?? row.cost_per_bag, minStockThresholdBags: row.min_stock_threshold_bags, flockId: row.flock_id, date: row.date, feedType: row.feed_type, quantityBags: row.quantity_bags, bagWeightKg: row.bag_weight_kg, costPerBag: row.cost_per_bag, notes: row.notes, createdAt: row.created_at };
}

// ─── Mortality ─────────────────────────────────────────────────────────────

export async function getMortality(farmId) {
  if (!supabase || !farmId) return [];
  const { data, error } = await supabase.from('mortality_records').select('*').eq('farm_id', farmId).order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapMortality);
}

async function mortalityChange(action, id, farmId, payload = {}) {
  if (!supabase || !farmId) throw new Error('Select a valid farm before changing mortality records.');
  const { data, error } = await supabase.rpc('apply_mortality_record', { p_action: action, p_id: id, p_farm_id: farmId, p_payload: payload });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) throw new Error('The database did not confirm the mortality change.');
  return mapMortality(row);
}
export const createMortality = (farmId, record) => mortalityChange('create', record.id || generateRowId(), farmId, { ...record, count: Number(record.count ?? record.birdsDead), cause: record.cause ?? record.suspectedCause ?? null });
export const updateMortality = (id, record) => mortalityChange('update', id, record.farmId, record);
export const deleteMortality = (id, farmId) => mortalityChange('delete', id, farmId);

function mapMortality(row) {
  if (!row) return null;
  return { id: row.id, farmId: row.farm_id, flockId: row.flock_id, date: row.date, count: row.count, cause: row.cause, notes: row.notes, createdAt: row.created_at };
}

// ─── Vaccinations ──────────────────────────────────────────────────────────

export async function getVaccinations(farmId) {
  if (!supabase || !farmId) return [];
  // Order by 'date' (patched column) falling back to 'scheduled_date' (original column)
  const { data, error } = await supabase.from('vaccinations').select('*').eq('farm_id', farmId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapVaccination);
}

function vaccinationPayload(record, creating = false) {
  const patch = {};
  const fields = {flockId:'flock_id',flockName:'flock_name',diseasePrevented:'disease_prevented',birdsVaccinated:'birds_vaccinated',cost:'cost',method:'method',nextDueDate:'next_due_date',administeredBy:'administered_by',status:'status',notes:'notes'};
  for (const [key,column] of Object.entries(fields)) if (record[key] !== undefined) patch[column] = ['flockId','nextDueDate'].includes(key) ? record[key] || null : record[key];
  if (record.date !== undefined || record.scheduledDate !== undefined) patch.scheduled_date = record.date || record.scheduledDate;
  if (record.vaccineName !== undefined || record.vaccine !== undefined) patch.vaccine = record.vaccineName || record.vaccine;
  if (record.dosage !== undefined || record.dose !== undefined) patch.dose = record.dosage ?? record.dose;
  if (creating && !patch.scheduled_date) patch.scheduled_date = new Date().toISOString().split('T')[0];
  return patch;
}
export async function createVaccination(farmId, record) {
  if (!supabase) throw new Error('Not configured');
  return mapVaccination(await safeInsert('vaccinations', {farm_id:farmId,...vaccinationPayload(record,true)}));
}
export async function updateVaccination(id, record) {
  if (!supabase) throw new Error('Not configured');
  return mapVaccination(await safeUpdate('vaccinations',id,vaccinationPayload(record)));
}

export async function deleteVaccination(id) {
  if (!supabase) throw new Error('Not configured');
  await confirmedDelete('vaccinations', id);
}

function mapVaccination(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmId: row.farm_id,
    flockId: row.flock_id,
    date: row.scheduled_date || row.date,
    vaccineName: row.vaccine || row.vaccine_name || '',
    vaccine: row.vaccine || row.vaccine_name || '',
    scheduledDate: row.scheduled_date || row.date,
    flockName: row.flock_name,
    diseasePrevented: row.disease_prevented,
    birdsVaccinated: row.birds_vaccinated,
    cost: row.cost,
    administeredBy: row.administered_by,
    dose: row.dose || '',
    method: row.method || '',
    nextDueDate: row.next_due_date,
    notes: row.notes || '',
    status: row.status || 'Administered',
    createdAt: row.created_at,
  };
}

// ─── Medications ───────────────────────────────────────────────────────────

export async function getMedications(farmId) {
  if (!supabase || !farmId) return [];
  // Order by created_at since 'date' may not exist yet on older rows
  const { data, error } = await supabase.from('medications').select('*').eq('farm_id', farmId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapMedication);
}

function medicationPayload(record, creating = false) {
  const patch = {};
  const fields = {flockId:'flock_id',flockName:'flock_name',medicationName:'medication_name',dosage:'dosage',durationDays:'duration_days',reason:'reason',cost:'cost',status:'status',notes:'notes',endDate:'end_date'};
  for (const [key,column] of Object.entries(fields)) if (record[key] !== undefined) patch[column] = ['flockId','endDate'].includes(key) ? record[key] || null : record[key];
  if (record.date !== undefined || record.startDate !== undefined) patch.start_date = record.date || record.startDate;
  if (creating && !patch.start_date) patch.start_date = new Date().toISOString().split('T')[0];
  return patch;
}
export async function createMedication(farmId, record) {
  if (!supabase) throw new Error('Not configured');
  return mapMedication(await safeInsert('medications',{farm_id:farmId,...medicationPayload(record,true)}));
}
export async function updateMedication(id, record) {
  if (!supabase) throw new Error('Not configured');
  return mapMedication(await safeUpdate('medications',id,medicationPayload(record)));
}

export async function deleteMedication(id) {
  if (!supabase) throw new Error('Not configured');
  await confirmedDelete('medications', id);
}

function mapMedication(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmId: row.farm_id,
    flockId: row.flock_id,
    date: row.start_date || row.date,
    startDate: row.start_date || row.date,
    endDate: row.end_date,
    status: row.status,
    flockName: row.flock_name,
    medicationName: row.medication_name || '',
    dosage: row.dosage || '',
    durationDays: row.duration_days,
    reason: row.reason || '',
    cost: row.cost || 0,
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

// ─── Customers ─────────────────────────────────────────────────────────────

export async function getCustomers(farmId) {
  if (!supabase || !farmId) return [];
  const { data, error } = await supabase.from('customers').select('*').eq('farm_id', farmId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapCustomer);
}

export async function createCustomer(farmId, record) {
  if (!supabase) throw new Error('Not configured');
  const data = await safeInsert('customers', {
    farm_id: farmId,
    name: record.name,
    contact_person: record.contactPerson || null,
    phone: record.phone || null,
    email: record.email || null,
    address: record.address || null,
    type: record.type || 'Regular',
    total_purchases: Number(record.totalPurchases || 0),
    outstanding_balance: Number(record.outstandingBalance || 0),
    notes: record.notes || null,
  });
  return mapCustomer(data);
}

export async function updateCustomer(id, record) {
  if (!supabase) throw new Error('Not configured');
  const patch = {};
  if (record.name !== undefined) patch.name = record.name;
  if (record.contactPerson !== undefined) patch.contact_person = record.contactPerson;
  if (record.phone !== undefined) patch.phone = record.phone;
  if (record.email !== undefined) patch.email = record.email;
  if (record.address !== undefined) patch.address = record.address;
  if (record.type !== undefined) patch.type = record.type;
  if (record.totalPurchases !== undefined) patch.total_purchases = Number(record.totalPurchases);
  if (record.outstandingBalance !== undefined) patch.outstanding_balance = Number(record.outstandingBalance);
  if (record.notes !== undefined) patch.notes = record.notes;

  const data = await safeUpdate('customers', id, patch);
  return mapCustomer(data);
}

export async function deleteCustomer(id) {
  if (!supabase) throw new Error('Not configured');
  await confirmedDelete('customers', id);
}

function mapCustomer(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmId: row.farm_id,
    name: row.name,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email,
    address: row.address,
    type: row.type || 'Regular',
    totalPurchases: Number(row.total_purchases || 0),
    outstandingBalance: Number(row.outstanding_balance || 0),
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// ─── Sales ─────────────────────────────────────────────────────────────────

export async function getSales(farmId) {
  if (!supabase || !farmId) return [];
  const { data, error } = await supabase.from('sales').select('*').eq('farm_id', farmId).order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapSale);
}

export async function createSale(farmId, record) {
  if (!supabase) throw new Error('Not configured');
  const qty = Number(record.quantity) || 0;
  const unitPrice = Number(record.unitPrice) || 0;
  const totalAmount = Number(record.totalAmount) || (qty * unitPrice);

  const data = await safeInsert('sales', {
    farm_id: farmId,
    flock_id: record.flockId || null,
    customer_id: record.customerId || null,
    customer_name: record.customerName || record.customer || null,
    product: record.product || record.productType || 'Sale',
    date: record.date || new Date().toISOString().split('T')[0],
    quantity: qty,
    unit_price: unitPrice,
    total_amount: totalAmount,
    payment_status: record.paymentStatus || 'Paid',
    payment_method: record.paymentMethod || 'Cash',
    notes: record.notes || null,
  });
  return mapSale(data);
}

export async function updateSale(id, record) {
  if (!supabase) throw new Error('Not configured');
  const patch = {};
  if (record.flockId !== undefined) patch.flock_id = record.flockId || null;
  if (record.customerId !== undefined) patch.customer_id = record.customerId || null;
  if (record.customerName !== undefined || record.customer !== undefined) patch.customer_name = record.customerName || record.customer || null;
  if (record.product !== undefined || record.productType !== undefined) patch.product = record.product || record.productType;
  if (record.date !== undefined) patch.date = record.date;
  if (record.quantity !== undefined) patch.quantity = Number(record.quantity);
  if (record.unitPrice !== undefined) patch.unit_price = Number(record.unitPrice);
  if (record.totalAmount !== undefined) patch.total_amount = Number(record.totalAmount);
  if (record.paymentStatus !== undefined) patch.payment_status = record.paymentStatus;
  if (record.paymentMethod !== undefined) patch.payment_method = record.paymentMethod;
  if (record.notes !== undefined) patch.notes = record.notes || null;

  const data = await safeUpdate('sales', id, patch);
  return mapSale(data);
}

export async function deleteSale(id) {
  if (!supabase) throw new Error('Not configured');
  await confirmedDelete('sales', id);
}

function mapSale(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmId: row.farm_id,
    flockId: row.flock_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customer: row.customer_name,
    product: row.product,
    productType: row.product,
    date: row.date,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    totalAmount: row.total_amount,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// ─── Expenses ──────────────────────────────────────────────────────────────

export async function getExpenses(farmId) {
  if (!supabase || !farmId) return [];
  const { data, error } = await supabase.from('expenses').select('*').eq('farm_id', farmId).order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapExpense);
}

export async function createExpense(farmId, record) {
  if (!supabase) throw new Error('Not configured');
  const data = await safeInsert('expenses', {
    farm_id: farmId,
    flock_id: record.flockId || null,
    date: record.date || new Date().toISOString().split('T')[0],
    category: record.category || 'General',
    description: record.description || record.category || 'Expense',
    amount: Number(record.amount) || 0,
    payment_method: record.paymentMethod || 'Cash',
    notes: record.notes || null,
  });
  return mapExpense(data);
}

export async function updateExpense(id, record) {
  if (!supabase) throw new Error('Not configured');
  const patch = {};
  if (record.flockId !== undefined) patch.flock_id = record.flockId || null;
  if (record.date !== undefined) patch.date = record.date;
  if (record.category !== undefined) patch.category = record.category;
  if (record.description !== undefined) patch.description = record.description;
  if (record.amount !== undefined) patch.amount = Number(record.amount);
  if (record.paymentMethod !== undefined) patch.payment_method = record.paymentMethod;
  if (record.notes !== undefined) patch.notes = record.notes || null;

  const data = await safeUpdate('expenses', id, patch);
  return mapExpense(data);
}

export async function deleteExpense(id) {
  if (!supabase) throw new Error('Not configured');
  await confirmedDelete('expenses', id);
}

function mapExpense(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmId: row.farm_id,
    flockId: row.flock_id,
    date: row.date,
    category: row.category,
    description: row.description,
    amount: row.amount,
    paymentMethod: row.payment_method,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// ─── Workers ───────────────────────────────────────────────────────────────

export async function getWorkers(farmId) {
  if (!supabase || !farmId) return [];
  const { data, error } = await supabase.from('workers').select('*').eq('farm_id', farmId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapWorker);
}

export async function createWorker(farmId, record) {
  if (!supabase) throw new Error('Not configured');
  const data = await safeInsert('workers', {
    farm_id: farmId,
    name: record.name,
    role: record.role || 'Farm Worker',
    phone: record.phone || '',
    email: record.email || '',
    status: record.status || 'Active',
    start_date: record.hireDate || record.startDate || new Date().toISOString().split('T')[0],
  });
  return mapWorker(data);
}

export async function updateWorker(id, record) {
  if (!supabase) throw new Error('Not configured');
  const data = await safeUpdate('workers', id, {
    name: record.name,
    role: record.role,
    phone: record.phone,
    email: record.email,
    status: record.status,
    start_date: record.hireDate || record.startDate,
  });
  return mapWorker(data);
}

export async function deleteWorker(id) {
  if (!supabase) throw new Error('Not configured');
  await confirmedDelete('workers', id);
}

function mapWorker(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmId: row.farm_id,
    name: row.name,
    role: row.role || 'Farm Worker',
    phone: row.phone || '',
    email: row.email || '',
    salary: row.salary || 0,
    hireDate: row.hire_date || row.start_date,
    status: row.status || 'Active',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

// ─── Daily Records ─────────────────────────────────────────────────────────

export async function getDailyRecords(farmId) {
  if (!supabase || !farmId) return [];
  const { data, error } = await supabase.from('daily_records').select('*').eq('farm_id', farmId).order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapDailyRecord);
}

export async function createDailyRecord(farmId, record) {
  if (!supabase) throw new Error('Not configured');
  const data = await safeInsert('daily_records', {
    farm_id: farmId,
    flock_id: record.flockId || null,
    date: record.date || new Date().toISOString().split('T')[0],
    category: record.category,
    recorded_values: record.values || record.recorded_values || {},
    poultry_type: record.poultryType || null,
  });
  return mapDailyRecord(data);
}

export async function updateDailyRecord(id, record) {
  if (!supabase) throw new Error('Not configured');
  const patch = { updated_at: new Date().toISOString() };
  if (record.date !== undefined) patch.date = record.date;
  if (record.category !== undefined) patch.category = record.category;
  if (record.values !== undefined || record.recorded_values !== undefined) {
    patch.recorded_values = record.values || record.recorded_values;
  }
  if (record.poultryType !== undefined) patch.poultry_type = record.poultryType;
  if (record.flockId !== undefined) patch.flock_id = record.flockId || null;

  const data = await safeUpdate('daily_records', id, patch);
  return mapDailyRecord(data);
}

export async function deleteDailyRecord(id) {
  if (!supabase) throw new Error('Not configured');
  await confirmedDelete('daily_records', id);
}

function mapDailyRecord(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmId: row.farm_id,
    flockId: row.flock_id,
    date: row.date,
    category: row.category,
    values: row.recorded_values || {},
    status: 'Recorded',
    poultryType: row.poultry_type,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    editable: true,
  };
}

// ─── Subscription ──────────────────────────────────────────────────────────

export async function getFarmSubscription(farmId) {
  if (!supabase || !farmId) return null;
  const { data, error } = await supabase
    .from('farm_subscriptions')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) { console.warn('getFarmSubscription error:', error.message); return null; }
  return data ? mapSubscription(data) : null;
}

function mapSubscription(row) {
  if (!row) return null;
  return {
    planId: (row.plan_id || 'basic').toUpperCase(),
    status: row.status || 'trial',
    billingCycle: row.billing_cycle || 'monthly',
    agreedPrice: row.agreed_price ?? null,
    startDate: row.created_at,
    trialEndsAt: row.trial_ends_at,
    renewalDate: row.renewal_date || row.current_period_end || row.trial_ends_at,
    autoRenew: row.auto_renew,
    trialUsed: Boolean(row.trial_ends_at),
    trialDaysTotal: 14,
    paymentHistory: [],
  };
}

// ─── Load all farm data at once ────────────────────────────────────────────

export async function loadAllFarmData(farmId) {
  if (!supabase || !farmId) {
    return { farm: null, flocks: [], feeds: [], eggs: [], mortality: [], vaccinations: [], medications: [], customers: [], sales: [], expenses: [], workers: [], dailyRecords: [], subscription: null };
  }

 const requests = [
  getFarm(farmId),               // 0
  getFlocks(farmId),             // 1
  getFeeds(farmId),              // 2
  getEggs(farmId),               // 3
  getMortality(farmId),          // 4
  getVaccinations(farmId),       // 5
  getMedications(farmId),        // 6
  getCustomers(farmId),          // 7
  getSales(farmId),              // 8
  getExpenses(farmId),           // 9
  getWorkers(farmId),            // 10
  getDailyRecords(farmId),       // 11
  getFarmSubscription(farmId),   // 12
  getInventory(farmId),          // 13
  getTasks(farmId),              // 14
];

const results = await Promise.allSettled(requests);

const names = [
  'farm',
  'flocks',
  'feeds',
  'eggs',
  'mortality',
  'vaccinations',
  'medications',
  'customers',
  'sales',
  'expenses',
  'workers',
  'dailyRecords',
  'subscription',
  'inventory',
  'tasks',
];

const failedFields = results.flatMap((result, index) =>
  result.status === 'rejected' ? [names[index]] : []
);

const errors = results.flatMap((result, index) =>
  result.status === 'rejected'
    ? [
        `${names[index]}: ${
          result.reason?.message || 'Unable to load records'
        }`,
      ]
    : []
);

// Safely retrieve results from Promise.allSettled.
const getValue = (result, defaultValue) => {
  if (!result) {
    console.warn('Farm data load: Missing request result');
    return defaultValue;
  }

  if (result.status === 'fulfilled') {
    return result.value ?? defaultValue;
  }

  console.warn(
    'Farm data load partial failure:',
    result.reason?.message || result.reason
  );

  return defaultValue;
};

const [
  farm,
  flocks,
  feeds,
  eggs,
  mortality,
  vaccinations,
  medications,
  customers,
  sales,
  expenses,
  workers,
  dailyRecords,
  subscription,
  inventory,
  tasks,
] = [
  getValue(results[0], null),
  getValue(results[1], []),
  getValue(results[2], []),
  getValue(results[3], []),
  getValue(results[4], []),
  getValue(results[5], []),
  getValue(results[6], []),
  getValue(results[7], []),
  getValue(results[8], []),
  getValue(results[9], []),
  getValue(results[10], []),
  getValue(results[11], []),
  getValue(results[12], null),
  getValue(results[13], []),
  getValue(results[14], []),
];

return {
  inventory,
  tasks,
  failedFields,
  errors,
  farm,
  flocks,
  feeds,
  eggs,
  mortality,
  vaccinations,
  medications,
  customers,
  sales,
  expenses,
  workers,
  dailyRecords,
  subscription,
};  return { inventory: getValue(results[13], []), tasks: getValue(results[14], []), failedFields, errors, farm, flocks: flocks || [], feeds: feeds || [], eggs: eggs || [], mortality: mortality || [], vaccinations: vaccinations || [], medications: medications || [], customers: customers || [], sales: sales || [], expenses: expenses || [], workers: workers || [], dailyRecords: dailyRecords || [], subscription };
}

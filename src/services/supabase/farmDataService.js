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
  if (error) { console.warn('getFarm error:', error.message); return null; }
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
  let row = { ...payload };
  if (!row.id) {
    row.id = generateRowId();
  }
  for (let i = 0; i < 4; i++) {
    const { data, error } = await supabase.from(table).insert(row).select().maybeSingle();
    if (!error) return data || row;

    // If Postgres complains about null id, provide one
    if (error.message.includes('null value in column "id"')) {
      row.id = generateRowId();
      continue;
    }

    const match = error.message.match(/column "([^"]+)" of relation/i) 
      || error.message.match(/Could not find the '([^']+)' column/i);
    if (match && match[1] && row[match[1]] !== undefined && match[1] !== 'id') {
      console.warn(`[Supabase] Column "${match[1]}" does not exist on table "${table}". Retrying without it.`);
      delete row[match[1]];
      continue;
    }
    throw new Error(error.message);
  }
}

/**
 * Safely updates a record in Supabase with auto-recovery for missing columns.
 */
async function safeUpdate(table, id, updates) {
  let row = { ...updates };
  for (let i = 0; i < 4; i++) {
    const { data, error } = await supabase.from(table).update(row).eq('id', id).select().maybeSingle();
    if (!error) return data || { id, ...row };
    const match = error.message.match(/column "([^"]+)" of relation/i) 
      || error.message.match(/Could not find the '([^']+)' column/i);
    if (match && match[1] && row[match[1]] !== undefined) {
      console.warn(`[Supabase] Column "${match[1]}" does not exist on table "${table}". Retrying without it.`);
      delete row[match[1]];
      continue;
    }
    throw new Error(error.message);
  }
}

export async function createFlock(farmId, flock) {
  if (!supabase || !farmId) throw new Error('Not configured');
  const data = await safeInsert('flocks', { farm_id: farmId, ...toFlockRow(flock) });
  return mapFlock(data);
}

export async function updateFlock(flockId, updates) {
  if (!supabase) throw new Error('Not configured');
  const data = await safeUpdate('flocks', flockId, toFlockRow(updates));
  return mapFlock(data);
}

export async function deleteFlock(flockId) {
  if (!supabase) throw new Error('Not configured');
  const { error } = await supabase.from('flocks').delete().eq('id', flockId);
  if (error) throw new Error(error.message);
}

function toFlockRow(f) {
  const initial = Number(f.initialBirds) || 0;
  const current = f.currentBirds !== undefined ? Number(f.currentBirds) : initial;
  const cost = Number(f.costPerBird) || 0;
  return {
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
    notes: f.notes || '',
  };
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
    housingType: row.housing_type || row.pen || '',
    status: row.status,
    acquisitionDate: row.acquisition_date || row.date_acquired,
    costPerBird: row.cost_per_bird,
    pen: row.pen || '',
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
  const { error } = await supabase.from('egg_production').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function mapEgg(row) {
  if (!row) return null;
  return { id: row.id, farmId: row.farm_id, flockId: row.flock_id, date: row.date, goodEggs: row.good_eggs, brokenEggs: row.broken_eggs, notes: row.notes, createdAt: row.created_at };
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
    feed_type: record.feedType || 'General Feed',
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
  const { error } = await supabase.from('feed_inventory').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function mapFeed(row) {
  if (!row) return null;
  return { id: row.id, farmId: row.farm_id, flockId: row.flock_id, date: row.date, feedType: row.feed_type, quantityBags: row.quantity_bags, bagWeightKg: row.bag_weight_kg, costPerBag: row.cost_per_bag, notes: row.notes, createdAt: row.created_at };
}

// ─── Mortality ─────────────────────────────────────────────────────────────

export async function getMortality(farmId) {
  if (!supabase || !farmId) return [];
  const { data, error } = await supabase.from('mortality_records').select('*').eq('farm_id', farmId).order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapMortality);
}

export async function createMortality(farmId, record) {
  if (!supabase) throw new Error('Not configured');
  const count = Number(record.count !== undefined ? record.count : record.birdsDead) || 0;
  const data = await safeInsert('mortality_records', {
    farm_id: farmId,
    flock_id: record.flockId || null,
    date: record.date || new Date().toISOString().split('T')[0],
    count: count,
    cause: record.cause || record.suspectedCause || null,
    notes: record.notes || null,
  });
  return mapMortality(data);
}

export async function updateMortality(id, record) {
  if (!supabase) throw new Error('Not configured');
  const patch = {};
  if (record.flockId !== undefined) patch.flock_id = record.flockId || null;
  if (record.date !== undefined) patch.date = record.date;
  if (record.count !== undefined || record.birdsDead !== undefined) {
    patch.count = Number(record.count !== undefined ? record.count : record.birdsDead) || 0;
  }
  if (record.cause !== undefined || record.suspectedCause !== undefined) {
    patch.cause = record.cause || record.suspectedCause || null;
  }
  if (record.notes !== undefined) patch.notes = record.notes || null;
  const data = await safeUpdate('mortality_records', id, patch);
  return mapMortality(data);
}

export async function deleteMortality(id) {
  if (!supabase) throw new Error('Not configured');
  const { error } = await supabase.from('mortality_records').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

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

export async function createVaccination(farmId, record) {
  if (!supabase) throw new Error('Not configured');
  const data = await safeInsert('vaccinations', {
    farm_id: farmId,
    flock_id: record.flockId || null,
    scheduled_date: record.date || record.scheduledDate || new Date().toISOString().split('T')[0],
    vaccine: record.vaccineName || record.vaccine || '',
    status: record.status || 'Scheduled',
    notes: record.notes || '',
  });
  return mapVaccination(data);
}

export async function updateVaccination(id, record) {
  if (!supabase) throw new Error('Not configured');
  const data = await safeUpdate('vaccinations', id, {
    scheduled_date: record.date || record.scheduledDate,
    vaccine: record.vaccineName || record.vaccine,
    status: record.status,
    notes: record.notes,
  });
  return mapVaccination(data);
}

export async function deleteVaccination(id) {
  if (!supabase) throw new Error('Not configured');
  const { error } = await supabase.from('vaccinations').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function mapVaccination(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmId: row.farm_id,
    flockId: row.flock_id,
    date: row.date || row.scheduled_date,
    vaccineName: row.vaccine_name || row.vaccine || '',
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

export async function createMedication(farmId, record) {
  if (!supabase) throw new Error('Not configured');
  const data = await safeInsert('medications', {
    farm_id: farmId,
    flock_id: record.flockId || null,
    start_date: record.date || record.startDate || new Date().toISOString().split('T')[0],
    medication_name: record.medicationName || '',
    dosage: record.dosage || '',
    reason: record.reason || '',
    cost: Number(record.cost) || 0,
    notes: record.notes || '',
  });
  return mapMedication(data);
}

export async function updateMedication(id, record) {
  if (!supabase) throw new Error('Not configured');
  const data = await safeUpdate('medications', id, {
    start_date: record.date || record.startDate,
    medication_name: record.medicationName,
    dosage: record.dosage,
    reason: record.reason,
    cost: Number(record.cost) || 0,
    notes: record.notes,
  });
  return mapMedication(data);
}

export async function deleteMedication(id) {
  if (!supabase) throw new Error('Not configured');
  const { error } = await supabase.from('medications').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function mapMedication(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmId: row.farm_id,
    flockId: row.flock_id,
    date: row.date || row.start_date,
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
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw new Error(error.message);
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
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) throw new Error(error.message);
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
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw new Error(error.message);
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
  const { error } = await supabase.from('workers').delete().eq('id', id);
  if (error) throw new Error(error.message);
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
  const { error } = await supabase.from('daily_records').delete().eq('id', id);
  if (error) throw new Error(error.message);
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

  const results = await Promise.allSettled([
    getFarm(farmId),           // 0 — null on failure
    getFlocks(farmId),         // 1 — array
    getFeeds(farmId),          // 2 — array
    getEggs(farmId),           // 3 — array
    getMortality(farmId),      // 4 — array
    getVaccinations(farmId),   // 5 — array
    getMedications(farmId),    // 6 — array
    getCustomers(farmId),      // 7 — array
    getSales(farmId),          // 8 — array
    getExpenses(farmId),       // 9 — array
    getWorkers(farmId),        // 10 — array
    getDailyRecords(farmId),   // 11 — array
    getFarmSubscription(farmId), // 12 — null on failure
  ]);

  // r.value is ONLY set on fulfilled promises; use r.reason for error logging
  const getValue = (r, defaultValue) => {
    if (r.status === 'fulfilled') return r.value;
    console.warn('Farm data load partial failure:', r.reason?.message || r.reason);
    return defaultValue;
  };

  const [farm, flocks, feeds, eggs, mortality, vaccinations, medications, customers, sales, expenses, workers, dailyRecords, subscription] = [
    getValue(results[0],  null),
    getValue(results[1],  []),
    getValue(results[2],  []),
    getValue(results[3],  []),
    getValue(results[4],  []),
    getValue(results[5],  []),
    getValue(results[6],  []),
    getValue(results[7],  []),
    getValue(results[8],  []),
    getValue(results[9],  []),
    getValue(results[10], []),
    getValue(results[11], []),
    getValue(results[12], null),
  ];

  return { farm, flocks: flocks || [], feeds: feeds || [], eggs: eggs || [], mortality: mortality || [], vaccinations: vaccinations || [], medications: medications || [], customers: customers || [], sales: sales || [], expenses: expenses || [], workers: workers || [], dailyRecords: dailyRecords || [], subscription };
}

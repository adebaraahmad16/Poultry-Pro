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
    .single();
  if (error) throw new Error(error.message);
  return mapFarm(data);
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

export async function getFlocks(farmId) {
  if (!supabase || !farmId) return [];
  const { data, error } = await supabase
    .from('flocks')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapFlock);
}

export async function createFlock(farmId, flock) {
  if (!supabase || !farmId) throw new Error('Not configured');
  const { data, error } = await supabase
    .from('flocks')
    .insert({ farm_id: farmId, ...toFlockRow(flock) })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapFlock(data);
}

export async function updateFlock(flockId, updates) {
  if (!supabase) throw new Error('Not configured');
  const { data, error } = await supabase
    .from('flocks')
    .update(toFlockRow(updates))
    .eq('id', flockId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapFlock(data);
}

export async function deleteFlock(flockId) {
  if (!supabase) throw new Error('Not configured');
  const { error } = await supabase.from('flocks').delete().eq('id', flockId);
  if (error) throw new Error(error.message);
}

function toFlockRow(f) {
  return {
    name: f.name,
    type: f.type,
    breed: f.breed,
    initial_birds: Number(f.initialBirds) || 0,
    current_birds: Number(f.currentBirds) || Number(f.initialBirds) || 0,
    age_weeks: Number(f.ageWeeks) || 0,
    housing_type: f.housingType,
    status: f.status || 'Active',
    acquisition_date: f.acquisitionDate || null,
    cost_per_bird: Number(f.costPerBird) || 0,
    notes: f.notes || null,
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
    housingType: row.housing_type,
    status: row.status,
    acquisitionDate: row.acquisition_date,
    costPerBird: row.cost_per_bird,
    notes: row.notes,
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
  const { data, error } = await supabase
    .from('egg_production')
    .insert({ farm_id: farmId, flock_id: record.flockId, date: record.date, good_eggs: Number(record.goodEggs) || 0, broken_eggs: Number(record.brokenEggs) || 0, notes: record.notes || null })
    .select().single();
  if (error) throw new Error(error.message);
  return mapEgg(data);
}

export async function updateEgg(id, record) {
  if (!supabase) throw new Error('Not configured');
  const { data, error } = await supabase
    .from('egg_production')
    .update({ date: record.date, good_eggs: Number(record.goodEggs) || 0, broken_eggs: Number(record.brokenEggs) || 0, notes: record.notes || null })
    .eq('id', id).select().single();
  if (error) throw new Error(error.message);
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
  const { data, error } = await supabase
    .from('feed_inventory')
    .insert({ farm_id: farmId, flock_id: record.flockId || null, date: record.date, feed_type: record.feedType, quantity_bags: Number(record.quantityBags) || 0, bag_weight_kg: Number(record.bagWeightKg) || 25, cost_per_bag: Number(record.costPerBag) || 0, notes: record.notes || null })
    .select().single();
  if (error) throw new Error(error.message);
  return mapFeed(data);
}

export async function updateFeed(id, record) {
  if (!supabase) throw new Error('Not configured');
  const { data, error } = await supabase
    .from('feed_inventory')
    .update({ date: record.date, feed_type: record.feedType, quantity_bags: Number(record.quantityBags) || 0, bag_weight_kg: Number(record.bagWeightKg) || 25, cost_per_bag: Number(record.costPerBag) || 0, notes: record.notes || null })
    .eq('id', id).select().single();
  if (error) throw new Error(error.message);
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
  const { data, error } = await supabase
    .from('mortality_records')
    .insert({ farm_id: farmId, flock_id: record.flockId, date: record.date, count: Number(record.count) || 0, cause: record.cause || null, notes: record.notes || null })
    .select().single();
  if (error) throw new Error(error.message);
  return mapMortality(data);
}

export async function updateMortality(id, record) {
  if (!supabase) throw new Error('Not configured');
  const { data, error } = await supabase
    .from('mortality_records')
    .update({ date: record.date, count: Number(record.count) || 0, cause: record.cause || null, notes: record.notes || null })
    .eq('id', id).select().single();
  if (error) throw new Error(error.message);
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
  const { data, error } = await supabase.from('vaccinations').select('*').eq('farm_id', farmId).order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapVaccination);
}

export async function createVaccination(farmId, record) {
  if (!supabase) throw new Error('Not configured');
  const { data, error } = await supabase
    .from('vaccinations')
    .insert({ farm_id: farmId, flock_id: record.flockId, date: record.date, vaccine_name: record.vaccineName, dose: record.dose || null, method: record.method || null, next_due_date: record.nextDueDate || null, notes: record.notes || null })
    .select().single();
  if (error) throw new Error(error.message);
  return mapVaccination(data);
}

export async function updateVaccination(id, record) {
  if (!supabase) throw new Error('Not configured');
  const { data, error } = await supabase
    .from('vaccinations')
    .update({ date: record.date, vaccine_name: record.vaccineName, dose: record.dose || null, method: record.method || null, next_due_date: record.nextDueDate || null, notes: record.notes || null })
    .eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return mapVaccination(data);
}

export async function deleteVaccination(id) {
  if (!supabase) throw new Error('Not configured');
  const { error } = await supabase.from('vaccinations').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function mapVaccination(row) {
  if (!row) return null;
  return { id: row.id, farmId: row.farm_id, flockId: row.flock_id, date: row.date, vaccineName: row.vaccine_name, dose: row.dose, method: row.method, nextDueDate: row.next_due_date, notes: row.notes, createdAt: row.created_at };
}

// ─── Medications ───────────────────────────────────────────────────────────

export async function getMedications(farmId) {
  if (!supabase || !farmId) return [];
  const { data, error } = await supabase.from('medications').select('*').eq('farm_id', farmId).order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapMedication);
}

export async function createMedication(farmId, record) {
  if (!supabase) throw new Error('Not configured');
  const { data, error } = await supabase
    .from('medications')
    .insert({ farm_id: farmId, flock_id: record.flockId, date: record.date, medication_name: record.medicationName, dosage: record.dosage || null, duration_days: Number(record.durationDays) || null, reason: record.reason || null, cost: Number(record.cost) || 0, notes: record.notes || null })
    .select().single();
  if (error) throw new Error(error.message);
  return mapMedication(data);
}

export async function updateMedication(id, record) {
  if (!supabase) throw new Error('Not configured');
  const { data, error } = await supabase
    .from('medications')
    .update({ date: record.date, medication_name: record.medicationName, dosage: record.dosage || null, duration_days: Number(record.durationDays) || null, reason: record.reason || null, cost: Number(record.cost) || 0, notes: record.notes || null })
    .eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return mapMedication(data);
}

export async function deleteMedication(id) {
  if (!supabase) throw new Error('Not configured');
  const { error } = await supabase.from('medications').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function mapMedication(row) {
  if (!row) return null;
  return { id: row.id, farmId: row.farm_id, flockId: row.flock_id, date: row.date, medicationName: row.medication_name, dosage: row.dosage, durationDays: row.duration_days, reason: row.reason, cost: row.cost, notes: row.notes, createdAt: row.created_at };
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
  const { data, error } = await supabase
    .from('customers')
    .insert({
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
    })
    .select().single();
  if (error) throw new Error(error.message);
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

  const { data, error } = await supabase
    .from('customers')
    .update(patch)
    .eq('id', id).select().single();
  if (error) throw new Error(error.message);
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

  const { data, error } = await supabase
    .from('sales')
    .insert({
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
    })
    .select().single();
  if (error) throw new Error(error.message);
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

  const { data, error } = await supabase
    .from('sales')
    .update(patch)
    .eq('id', id).select().single();
  if (error) throw new Error(error.message);
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
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      farm_id: farmId,
      flock_id: record.flockId || null,
      date: record.date || new Date().toISOString().split('T')[0],
      category: record.category || 'General',
      description: record.description || record.category || 'Expense',
      amount: Number(record.amount) || 0,
      payment_method: record.paymentMethod || 'Cash',
      notes: record.notes || null,
    })
    .select().single();
  if (error) throw new Error(error.message);
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

  const { data, error } = await supabase
    .from('expenses')
    .update(patch)
    .eq('id', id).select().single();
  if (error) throw new Error(error.message);
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
  const { data, error } = await supabase
    .from('workers')
    .insert({ farm_id: farmId, name: record.name, role: record.role || null, phone: record.phone || null, email: record.email || null, salary: Number(record.salary) || 0, hire_date: record.hireDate || null, status: record.status || 'Active', notes: record.notes || null })
    .select().single();
  if (error) throw new Error(error.message);
  return mapWorker(data);
}

export async function updateWorker(id, record) {
  if (!supabase) throw new Error('Not configured');
  const { data, error } = await supabase
    .from('workers')
    .update({ name: record.name, role: record.role || null, phone: record.phone || null, email: record.email || null, salary: Number(record.salary) || 0, hire_date: record.hireDate || null, status: record.status || 'Active', notes: record.notes || null })
    .eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return mapWorker(data);
}

export async function deleteWorker(id) {
  if (!supabase) throw new Error('Not configured');
  const { error } = await supabase.from('workers').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function mapWorker(row) {
  if (!row) return null;
  return { id: row.id, farmId: row.farm_id, name: row.name, role: row.role, phone: row.phone, email: row.email, salary: row.salary, hireDate: row.hire_date, status: row.status, notes: row.notes, createdAt: row.created_at };
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
  const { data, error } = await supabase
    .from('daily_records')
    .insert({
      farm_id: farmId,
      flock_id: record.flockId || null,
      date: record.date,
      category: record.category,
      recorded_values: record.values || {},
      poultry_type: record.poultryType || null,
    })
    .select().single();
  if (error) throw new Error(error.message);
  return mapDailyRecord(data);
}

export async function updateDailyRecord(id, record) {
  if (!supabase) throw new Error('Not configured');
  const patch = { updated_at: new Date().toISOString() };
  if (record.date !== undefined) patch.date = record.date;
  if (record.category !== undefined) patch.category = record.category;
  if (record.values !== undefined) patch.recorded_values = record.values;
  if (record.poultryType !== undefined) patch.poultry_type = record.poultryType;
  if (record.flockId !== undefined) patch.flock_id = record.flockId || null;

  const { data, error } = await supabase
    .from('daily_records')
    .update(patch)
    .eq('id', id).select().single();
  if (error) throw new Error(error.message);
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
    .select('*, subscription_plans(*)')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) return null;
  return mapSubscription(data);
}

function mapSubscription(row) {
  if (!row) return null;
  return {
    planId: (row.plan_id || 'basic').toUpperCase(),
    status: row.status || 'trial',
    billingCycle: row.billing_cycle || 'monthly',
    startDate: row.created_at,
    trialEndsAt: row.trial_ends_at,
    renewalDate: row.current_period_end,
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
    getFarm(farmId),
    getFlocks(farmId),
    getFeeds(farmId),
    getEggs(farmId),
    getMortality(farmId),
    getVaccinations(farmId),
    getMedications(farmId),
    getCustomers(farmId),
    getSales(farmId),
    getExpenses(farmId),
    getWorkers(farmId),
    getDailyRecords(farmId),
    getFarmSubscription(farmId),
  ]);

  const [farm, flocks, feeds, eggs, mortality, vaccinations, medications, customers, sales, expenses, workers, dailyRecords, subscription] = results.map(r => r.status === 'fulfilled' ? r.value : (Array.isArray(r.value) ? [] : null));

  return { farm, flocks: flocks || [], feeds: feeds || [], eggs: eggs || [], mortality: mortality || [], vaccinations: vaccinations || [], medications: medications || [], customers: customers || [], sales: sales || [], expenses: expenses || [], workers: workers || [], dailyRecords: dailyRecords || [], subscription };
}

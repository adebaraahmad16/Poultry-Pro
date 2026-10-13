import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// Helper mapper functions to match camelCase frontend expectation
const formatFlock = (f) => ({
  id: f.id,
  name: f.name,
  type: f.type,
  breed: f.breed,
  initialBirds: f.initial_birds,
  currentBirds: f.current_birds,
  dateAcquired: f.date_acquired ? f.date_acquired.toISOString().split('T')[0] : '',
  ageWeeks: f.age_weeks,
  costPerBird: Number(f.cost_per_bird),
  totalCost: Number(f.total_cost),
  pen: f.pen,
  source: f.source,
  status: f.status,
  healthStatus: f.health_status,
  notes: f.notes
});

const formatFeed = (f) => ({
  id: f.id,
  name: f.name,
  type: f.type,
  quantityBags: f.quantity_bags,
  bagWeightKg: f.bag_weight_kg,
  unitPrice: Number(f.unit_price),
  supplier: f.supplier,
  status: f.status,
  minStockThresholdBags: f.min_stock_threshold_bags
});

const formatEgg = (e) => ({
  id: e.id,
  flockId: e.flock_id,
  flockName: e.flock_name,
  date: e.date ? e.date.toISOString().split('T')[0] : '',
  totalEggs: e.total_eggs,
  brokenEggs: e.broken_eggs,
  rejectedEggs: e.rejected_eggs,
  goodEggs: e.good_eggs,
  crates: Number(e.crates),
  notes: e.notes
});

const formatMortality = (m) => ({
  id: m.id,
  flockId: m.flock_id,
  flockName: m.flock_name,
  date: m.date ? m.date.toISOString().split('T')[0] : '',
  count: m.count,
  cause: m.cause,
  notes: m.notes
});

const formatSale = (s) => ({
  id: s.id,
  customerId: s.customer_id,
  customerName: s.customer_name,
  product: s.product,
  flockId: s.flock_id,
  quantity: s.quantity,
  unitPrice: Number(s.unit_price),
  totalAmount: Number(s.total_amount),
  paymentStatus: s.payment_status,
  paymentMethod: s.payment_method,
  date: s.date ? s.date.toISOString().split('T')[0] : '',
  notes: s.notes
});

const formatExpense = (ex) => ({
  id: ex.id,
  category: ex.category,
  description: ex.description,
  amount: Number(ex.amount),
  paymentMethod: ex.payment_method,
  flockId: ex.flock_id,
  date: ex.date ? ex.date.toISOString().split('T')[0] : '',
  notes: ex.notes
});

const formatCustomer = (c) => ({
  id: c.id,
  name: c.name,
  contactPerson: c.contact_person,
  phone: c.phone,
  email: c.email,
  address: c.address,
  type: c.type,
  totalPurchases: Number(c.total_purchases),
  outstandingBalance: Number(c.outstanding_balance),
  notes: c.notes
});

const formatVaccination = (v) => ({
  id: v.id,
  flockId: v.flock_id,
  flockName: v.flock_name,
  vaccine: v.vaccine,
  scheduledDate: v.scheduled_date ? v.scheduled_date.toISOString().split('T')[0] : '',
  status: v.status,
  administeredBy: v.administered_by,
  notes: v.notes
});

const formatMedication = (m) => ({
  id: m.id,
  flockId: m.flock_id,
  flockName: m.flock_name,
  medicationName: m.medication_name,
  reason: m.reason,
  dosage: m.dosage,
  startDate: m.start_date ? m.start_date.toISOString().split('T')[0] : '',
  endDate: m.end_date ? m.end_date.toISOString().split('T')[0] : '',
  cost: Number(m.cost),
  notes: m.notes
});

// --- FLOCKS API ---
router.get('/flocks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM flocks ORDER BY created_at DESC');
    res.json(rows.map(formatFlock));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/flocks', async (req, res) => {
  try {
    const f = req.body;
    const id = `flock-${Date.now()}`;
    const initialBirds = Number(f.initialBirds);
    const costPerBird = Number(f.costPerBird || 0);
    const totalCost = initialBirds * costPerBird;

    await pool.query(
      `INSERT INTO flocks (id, farm_id, name, type, breed, initial_birds, current_birds, date_acquired, age_weeks, cost_per_bird, total_cost, pen, source, status, health_status, notes)
       VALUES (?, 'farm-101', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, f.name, f.type, f.breed, initialBirds, initialBirds, f.dateAcquired || new Date(), f.ageWeeks || 1, costPerBird, totalCost, f.pen, f.source || '', f.status || 'Active', f.healthStatus || 'Healthy', f.notes || '']
    );

    const [rows] = await pool.query('SELECT * FROM flocks WHERE id = ?', [id]);
    res.status(201).json(formatFlock(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/flocks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM flocks WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EGG PRODUCTION API ---
router.get('/eggs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM egg_production ORDER BY date DESC');
    res.json(rows.map(formatEgg));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/eggs', async (req, res) => {
  try {
    const e = req.body;
    const id = `egg-${Date.now()}`;
    const total = Number(e.totalEggs);
    const broken = Number(e.brokenEggs || 0);
    const rejected = Number(e.rejectedEggs || 0);
    const good = Math.max(0, total - broken - rejected);
    const crates = (good / 30).toFixed(1);

    await pool.query(
      `INSERT INTO egg_production (id, flock_id, flock_name, date, total_eggs, broken_eggs, rejected_eggs, good_eggs, crates, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, e.flockId, e.flockName, e.date || new Date(), total, broken, rejected, good, crates, e.notes || '']
    );

    const [rows] = await pool.query('SELECT * FROM egg_production WHERE id = ?', [id]);
    res.status(201).json(formatEgg(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/eggs/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM egg_production WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- FEED INVENTORY API ---
router.get('/feed', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM feed_inventory ORDER BY created_at DESC');
    res.json(rows.map(formatFeed));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/feed', async (req, res) => {
  try {
    const f = req.body;
    const id = `feed-${Date.now()}`;
    const qty = Number(f.quantityBags);
    const minThreshold = Number(f.minStockThresholdBags || 20);
    const status = qty <= minThreshold ? 'Low Stock' : 'In Stock';

    await pool.query(
      `INSERT INTO feed_inventory (id, farm_id, name, type, quantity_bags, bag_weight_kg, unit_price, supplier, status, min_stock_threshold_bags)
       VALUES (?, 'farm-101', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, f.name, f.type, qty, f.bagWeightKg || 25, f.unitPrice, f.supplier, status, minThreshold]
    );

    const [rows] = await pool.query('SELECT * FROM feed_inventory WHERE id = ?', [id]);
    res.status(201).json(formatFeed(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/feed/:id/usage', async (req, res) => {
  try {
    const { bagsUsed } = req.body;
    const [rows] = await pool.query('SELECT * FROM feed_inventory WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Feed not found' });

    const currentQty = rows[0].quantity_bags;
    const minThreshold = rows[0].min_stock_threshold_bags;
    const newQty = Math.max(0, currentQty - Number(bagsUsed));
    const newStatus = newQty <= minThreshold ? 'Low Stock' : 'In Stock';

    await pool.query(
      'UPDATE feed_inventory SET quantity_bags = ?, status = ? WHERE id = ?',
      [newQty, newStatus, req.params.id]
    );

    res.json({ success: true, quantityBags: newQty, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/feed/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM feed_inventory WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- HEALTH & MORTALITY API ---
router.get('/mortality', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM mortality_records ORDER BY date DESC');
    res.json(rows.map(formatMortality));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/mortality', async (req, res) => {
  try {
    const m = req.body;
    const id = `mort-${Date.now()}`;
    const count = Number(m.count);

    // Insert mortality log
    await pool.query(
      `INSERT INTO mortality_records (id, flock_id, flock_name, date, count, cause, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, m.flockId, m.flockName, m.date || new Date(), count, m.cause, m.notes || '']
    );

    // Auto-deduct current birds in target flock
    await pool.query(
      `UPDATE flocks SET current_birds = GREATEST(0, current_birds - ?) WHERE id = ?`,
      [count, m.flockId]
    );

    const [rows] = await pool.query('SELECT * FROM mortality_records WHERE id = ?', [id]);
    res.status(201).json(formatMortality(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/mortality/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM mortality_records WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SALES API ---
router.get('/sales', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sales ORDER BY date DESC');
    res.json(rows.map(formatSale));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sales', async (req, res) => {
  try {
    const s = req.body;
    const id = `sale-${Date.now()}`;
    const qty = Number(s.quantity);
    const unitPrice = Number(s.unitPrice);
    const totalAmount = qty * unitPrice;

    await pool.query(
      `INSERT INTO sales (id, farm_id, customer_name, product, flock_id, quantity, unit_price, total_amount, payment_status, payment_method, date, notes)
       VALUES (?, 'farm-101', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, s.customerName, s.product, s.flockId, qty, unitPrice, totalAmount, s.paymentStatus || 'Paid', s.paymentMethod || 'Bank Transfer', s.date || new Date(), s.notes || '']
    );

    const [rows] = await pool.query('SELECT * FROM sales WHERE id = ?', [id]);
    res.status(201).json(formatSale(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/sales/:id/status', async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    await pool.query('UPDATE sales SET payment_status = ? WHERE id = ?', [paymentStatus, req.params.id]);
    res.json({ success: true, paymentStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/sales/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM sales WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EXPENSES API ---
router.get('/expenses', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    res.json(rows.map(formatExpense));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const ex = req.body;
    const id = `exp-${Date.now()}`;

    await pool.query(
      `INSERT INTO expenses (id, farm_id, category, description, amount, payment_method, flock_id, date, notes)
       VALUES (?, 'farm-101', ?, ?, ?, ?, ?, ?, ?)`,
      [id, ex.category, ex.description, Number(ex.amount), ex.paymentMethod || 'Bank Transfer', ex.flockId || null, ex.date || new Date(), ex.notes || '']
    );

    const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ?', [id]);
    res.status(201).json(formatExpense(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/expenses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CUSTOMERS API ---
router.get('/customers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(rows.map(formatCustomer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/customers', async (req, res) => {
  try {
    const c = req.body;
    const id = `cust-${Date.now()}`;
    await pool.query(
      `INSERT INTO customers (id, farm_id, name, contact_person, phone, email, address, type, total_purchases, outstanding_balance, notes)
       VALUES (?, 'farm-101', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, c.name, c.contactPerson || '', c.phone || '', c.email || '', c.address || '', c.type || 'Retailer', Number(c.totalPurchases || 0), Number(c.outstandingBalance || 0), c.notes || '']
    );
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    res.status(201).json(formatCustomer(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- VACCINATIONS API ---
router.get('/vaccinations', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vaccinations ORDER BY scheduled_date ASC');
    res.json(rows.map(formatVaccination));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vaccinations', async (req, res) => {
  try {
    const v = req.body;
    const id = `vac-${Date.now()}`;
    await pool.query(
      `INSERT INTO vaccinations (id, flock_id, flock_name, vaccine, scheduled_date, status, administered_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, v.flockId, v.flockName || '', v.vaccine, v.scheduledDate || new Date(), v.status || 'Upcoming', v.administeredBy || '', v.notes || '']
    );
    const [rows] = await pool.query('SELECT * FROM vaccinations WHERE id = ?', [id]);
    res.status(201).json(formatVaccination(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/vaccinations/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE vaccinations SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/vaccinations/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vaccinations WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MEDICATIONS API ---
router.get('/medications', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medications ORDER BY created_at DESC');
    res.json(rows.map(formatMedication));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/medications', async (req, res) => {
  try {
    const m = req.body;
    const id = `med-${Date.now()}`;
    await pool.query(
      `INSERT INTO medications (id, flock_id, flock_name, medication_name, reason, dosage, start_date, end_date, cost, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, m.flockId, m.flockName || '', m.medicationName, m.reason || '', m.dosage || '', m.startDate || null, m.endDate || null, Number(m.cost || 0), m.notes || '']
    );
    const [rows] = await pool.query('SELECT * FROM medications WHERE id = ?', [id]);
    res.status(201).json(formatMedication(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/medications/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM medications WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- FARM PROFILE & DASHBOARD API ---
router.get('/farm', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM farms WHERE id = ?', ['farm-101']);
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

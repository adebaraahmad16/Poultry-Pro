import { randomUUID } from 'node:crypto';
import { requireSession } from './subscriptionRoutes.js';
import { normalizePlanId } from '../../shared/subscriptionPlans.js';
import { initializeSubscriptions, readSubscription, readPlans, assertSubscriptionActive, assertUsage } from '../services/subscriptions.js';
import express from 'express';
import pool from '../config/db.js';
import { validDate, localDate } from '../../shared/dailyRecords.js';
import { POULTRY_SCOPES, poultryTypeId } from '../../shared/poultryScope.js';
import { initializeDailyRecords, mutateRecord, formatDaily, readRecords } from '../services/dailyRecords.js';

const router = express.Router();
// Scope existing modules to the same authenticated farm as daily records.
router.use(requireSession);
router.use(async (req,res,next) => {
  const tables={feed:['feed_inventory',true],eggs:['egg_production',false],mortality:['mortality_records',false],vaccinations:['vaccinations',false],medications:['medications',false],sales:['sales',true],expenses:['expenses',true],customers:['customers',true]};
  const [,segment,id]=req.path.split('/');
  if(!tables[segment]) return next();
  try {
    if(req.session.role!=='farmer'||!req.session.farmId) return res.status(403).json({error:'Farmer account required'});
    await initializeDailyRecords();
    const [table,farmWide]=tables[segment];
    if(id) {
      const [owned]=await pool.query(`SELECT t.id FROM ${table} t ${farmWide?'':'JOIN flocks f ON f.id=t.flock_id'} WHERE t.id=? AND ${farmWide?'t.farm_id':'f.farm_id'}=?`,[id,req.session.farmId]);
      if(!owned.length) return res.status(404).json({error:'Record not found in this farm.'});
      const [daily]=await pool.query('SELECT * FROM daily_records WHERE id=? AND farm_id=?',[id,req.session.farmId]);
      if(segment==='vaccinations'&&req.method==='PATCH'&&req.body.status==='Completed') {
        const [schedule]=await pool.query('SELECT scheduled_date>CURRENT_DATE() AS future FROM vaccinations WHERE id=?',[id]);
        if(schedule[0]?.future) return res.status(400).json({error:'A future vaccination cannot be marked completed. Record the actual administration date in Daily Records.'});
      }
      if(daily[0] && req.method!=='GET') {
        const record=formatDaily(daily[0]);
        if(req.method==='DELETE') return res.json(await mutateRecord(req.session,{updatedAt:new Date(record.updatedAt).toISOString()},{id,remove:true}));
        if(req.method==='PATCH'&&segment==='sales') {
          const amountReceived=req.body.paymentStatus==='Paid'?record.values.totalAmount:0;
          await mutateRecord(req.session,{...record,updatedAt:new Date(record.updatedAt).toISOString(),values:{...record.values,amountReceived,paymentDate:undefined}},{id});
          return res.json({success:true,paymentStatus:amountReceived?'Paid':'Unpaid'});
        }
        return res.status(409).json({error:'Correct this entry in Daily Records so linked balances and audit history stay consistent.'});
      }
      if(!daily[0] && req.method==='DELETE' && ['eggs','mortality','sales','expenses','medications','vaccinations'].includes(segment)) {
        const legacy=(await readRecords(req.session.farmId)).find(r=>r.id===id);
        if(legacy) return res.json(await mutateRecord(req.session,{farmId:req.session.farmId,updatedAt:new Date(legacy.updatedAt).toISOString()},{id,remove:true}));
      }
      if(!daily[0]&&req.method==='PATCH'&&segment==='sales') {
        const legacy=(await readRecords(req.session.farmId)).find(r=>r.id===id);
        if(legacy) {
          const amountReceived=req.body.paymentStatus==='Paid'?legacy.values.totalAmount:0;
          await mutateRecord(req.session,{...legacy,updatedAt:new Date(legacy.updatedAt).toISOString(),values:{...legacy.values,amountReceived}},{id});
          return res.json({success:true,paymentStatus:amountReceived?'Paid':'Unpaid'});
        }
      }
      if(segment==='feed'&&req.method==='DELETE') {
        const [linked]=await pool.query("SELECT id FROM daily_records WHERE farm_id=? AND category='feed' AND JSON_UNQUOTE(JSON_EXTRACT(recorded_values,'$.feedId'))=? LIMIT 1",[req.session.farmId,id]);
        if(linked.length) return res.status(409).json({error:'This feed stock has daily consumption records. Keep it so history and inventory corrections remain available.'});
      }
    }
    if(req.body.flockId) {
      const [flocks]=await pool.query('SELECT id FROM flocks WHERE id=? AND farm_id=?',[req.body.flockId,req.session.farmId]);
      if(!flocks.length) return res.status(403).json({error:'Flock does not belong to your farm.'});
    }
    if(req.method==='POST'&&segment==='medications'&&(!validDate(req.body.startDate)||req.body.startDate>localDate())) return res.status(400).json({error:'Enter an actual medication date that is not in the future.'});
    if(req.method==='POST'&&segment==='vaccinations'&&req.body.status==='Completed'&&(!validDate(req.body.scheduledDate)||req.body.scheduledDate>localDate())) return res.status(400).json({error:'Completed vaccinations require a valid past or current administration date.'});
    next();
  } catch(e) {res.status(e.status||500).json({error:e.status?e.message:'Unable to process farm record.'});}
});
// Feature access is based on the authenticated farm and the persisted catalog.
router.use((req,res,next) => {
  const segment = req.path.split('/')[1];
  const feature = {feed:'feedManagement',eggs:'eggProduction',mortality:'mortalityTracking',vaccinations:'healthManagement',medications:'healthManagement',sales:'financialManagement',expenses:'financialManagement',customers:'financialManagement'}[segment];
  if (!feature) return next();
  requireSession(req,res,async () => {
    try {
      if (req.session.role !== 'farmer') return res.status(403).json({error:'Farmer account required'});
      const sub = await readSubscription(req.session.farmId);
      if (req.method !== 'GET') assertSubscriptionActive(sub);
      const plan = (await readPlans()).find(p => p.id === normalizePlanId(sub.plan_id));
      if (!plan?.capabilities[feature]) return res.status(403).json({error:'This feature is unavailable on your subscription. Upgrade Plan.'});
      next();
    } catch(e) {res.status(e.status || 500).json({error:e.status ? e.message : 'Subscription service unavailable'});}
  });
});

// A selected poultry type scopes every existing flock-based module query.
router.use(async(req,res,next)=>{
  const type=req.session.poultryTypeId;
  if(req.method!=='GET'||!type||type==='all') return next();
  const segment=req.path.split('/')[1];
  const config={flocks:['flocks',formatFlock],eggs:['egg_production',formatEgg],mortality:['mortality_records',formatMortality],vaccinations:['vaccinations',formatVaccination],medications:['medications',formatMedication],sales:['sales',formatSale],expenses:['expenses',formatExpense]}[segment];
  if(!config||req.path.replace(/\/+$/,'')!==`/${segment}`) return next();
  try {
    const names=[...POULTRY_SCOPES[type].map(t=>t.toLowerCase()),type],marks=names.map(()=>'?').join(',');
    const [table,format]=config;
    const farmWide=['sales','expenses'].includes(segment);
    const sql=segment==='flocks'?`SELECT t.* FROM flocks t WHERE t.farm_id=? AND LOWER(t.type) IN (${marks})`:
      `SELECT t.*,d.poultry_type FROM ${table} t LEFT JOIN flocks f ON f.id=t.flock_id LEFT JOIN daily_records d ON d.id=t.id WHERE ${farmWide?'t.farm_id':'f.farm_id'}=? AND (LOWER(f.type) IN (${marks}) OR (t.flock_id IS NULL AND LOWER(d.poultry_type) IN (${marks})))`;
    const params=segment==='flocks'?[req.session.farmId,...names]:[req.session.farmId,...names,...names];
    const [rows]=await pool.query(sql,params);res.json(rows.map(format));
  }catch(e){res.status(500).json({error:'Unable to load selected poultry records.'});}
});

// Existing entry points write through the same transaction and inventory ledger.
router.use(async(req,res,next)=>{
  const segment=req.path.split('/')[1];
  if(req.method!=='POST'||req.path.replace(/\/+$/,'')!==`/${segment}`||!['eggs','mortality','sales','expenses'].includes(segment)) return next();
  try {
    const b=req.body;
    const values=({
      eggs:{totalEggs:b.totalEggs,crackedEggs:b.crackedEggs||0,brokenEggs:b.brokenEggs||0,otherUnsellable:b.rejectedEggs||0,layingHens:b.layingHens??null,notes:b.notes||''},
      mortality:{count:b.count,cause:b.cause||'Unknown',notes:b.notes||''},
      expenses:{expenseCategory:b.category,description:b.description,amount:b.amount,paymentMethod:b.paymentMethod||'Bank Transfer',notes:b.notes||''},
      sales:{product:b.product,quantity:b.quantity,unitPrice:b.unitPrice,amountReceived:b.amountReceived??(b.paymentStatus==='Paid'?Number(b.quantity)*Number(b.unitPrice):0),paymentMethod:b.paymentMethod||'Bank Transfer',customerName:b.customerName||'',notes:b.notes||''},
    })[segment];
    const record=await mutateRecord(req.session,{farmId:req.session.farmId,flockId:b.flockId||null,date:b.date||new Date().toLocaleDateString('en-CA'),category:segment,values,requestKey:b.requestKey||req.get('Idempotency-Key')||randomUUID()});
    const table=({eggs:'egg_production',mortality:'mortality_records',sales:'sales',expenses:'expenses'})[segment];
    const [rows]=await pool.query(`SELECT * FROM ${table} WHERE id=?`,[record.id]);
    res.status(201).json(({eggs:formatEgg,mortality:formatMortality,sales:formatSale,expenses:formatExpense})[segment](rows[0]));
  }catch(e){res.status(e.status||500).json({error:e.status?e.message:'Unable to save record.'});}
});

// DATE columns use the database calendar date, without a UTC conversion.
const formatDate=value=>value instanceof Date?localDate(value):String(value||'').slice(0,10);
// Helper mapper functions to match camelCase frontend expectation
const formatFlock = (f) => ({
  id: f.id,
  name: f.name,
  type: f.type,
  breed: f.breed,
  initialBirds: f.initial_birds,
  currentBirds: f.current_birds,
  dateAcquired: formatDate(f.date_acquired),
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
  date: formatDate(e.date),
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
  date: formatDate(m.date),
  count: m.count,
  cause: m.cause,
  notes: m.notes
});

const formatSale = (s) => ({
  poultryType:s.poultry_type||null,
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
  date: formatDate(s.date),
  notes: s.notes
});

const formatExpense = (ex) => ({
  poultryType:ex.poultry_type||null,
  id: ex.id,
  category: ex.category,
  description: ex.description,
  amount: Number(ex.amount),
  paymentMethod: ex.payment_method,
  flockId: ex.flock_id,
  date: formatDate(ex.date),
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
  scheduledDate: formatDate(v.scheduled_date),
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
  startDate: formatDate(m.start_date),
  endDate: formatDate(m.end_date),
  cost: Number(m.cost),
  notes: m.notes
});

// --- FLOCKS API ---
router.get('/flocks', requireSession, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM flocks WHERE farm_id = ? ORDER BY created_at DESC', [req.session.farmId]);
    res.json(rows.map(formatFlock));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/flocks', requireSession, async (req, res) => {
  if (req.session.role !== 'farmer' || !req.session.farmId) return res.status(403).json({ error: 'Farmer account required' });
  const db = await pool.getConnection();
  try {
    const f = req.body;
    if(req.session.poultryTypeId&&req.session.poultryTypeId!=='all'&&poultryTypeId(f.type)!==req.session.poultryTypeId) return res.status(400).json({error:'The new flock must match the selected poultry type.'});
    const initialBirds = Number(f.initialBirds), costPerBird = Number(f.costPerBird || 0);
    if (!Number.isSafeInteger(initialBirds) || initialBirds < 1 || !Number.isFinite(costPerBird) || costPerBird < 0 || !f.name?.trim() || !f.type?.trim()) return res.status(400).json({ error: 'Enter a flock name, type, positive bird count and valid cost.' });
    await initializeSubscriptions();
    await db.beginTransaction();
    // Serialize writes per farm so concurrent requests cannot exceed limits.
    await db.query('SELECT id FROM farms WHERE id = ? FOR UPDATE', [req.session.farmId]);
    const sub = await readSubscription(req.session.farmId, db);
    assertSubscriptionActive(sub);
    const plan = (await readPlans(db)).find(p => p.id === normalizePlanId(sub.plan_id));
    await assertUsage(plan,req.session.farmId,{ birds:initialBirds,type:f.type,addingFlock:true },db);
    const id = `flock-${randomUUID()}`;
    await db.query(`INSERT INTO flocks (id, farm_id, name, type, breed, initial_birds, current_birds, date_acquired, age_weeks, cost_per_bird, total_cost, pen, source, status, health_status, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [id,req.session.farmId,f.name,f.type,f.breed || '',initialBirds,initialBirds,f.dateAcquired || new Date(),f.ageWeeks || 1,costPerBird,initialBirds*costPerBird,f.pen || '',f.source || '',f.status || 'Active',f.healthStatus || 'Healthy',f.notes || '']);
    await db.commit();
    const [rows] = await db.query('SELECT * FROM flocks WHERE id = ?', [id]);
    res.status(201).json(formatFlock(rows[0]));
  } catch (err) { await db.rollback(); res.status(err.status || 500).json({ error: err.status ? err.message : 'Unable to create flock' }); }
  finally { db.release(); }
});

router.delete('/flocks/:id', requireSession, async (req, res) => {
  try {
    await initializeDailyRecords();
    const [linked]=await pool.query("SELECT id FROM daily_records WHERE farm_id=? AND (flock_id=? OR (category='activities' AND JSON_UNQUOTE(JSON_EXTRACT(recorded_values,'$.targetFlockId'))=?)) LIMIT 1",[req.session.farmId,req.params.id,req.params.id]);
    if(linked.length) return res.status(409).json({error:'This flock has daily records or bird transfers. Keep the flock to preserve its history.'});
    await pool.query('DELETE FROM flocks WHERE id = ? AND farm_id = ?', [req.params.id, req.session.farmId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EGG PRODUCTION API ---
router.get('/eggs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT e.* FROM egg_production e JOIN flocks f ON f.id=e.flock_id WHERE f.farm_id=? ORDER BY e.date DESC',[req.session.farmId]);
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
    const [rows] = await pool.query('SELECT * FROM feed_inventory WHERE farm_id=? ORDER BY created_at DESC',[req.session.farmId]);
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
    if(!Number.isFinite(qty)||qty<0||!Number.isFinite(Number(f.unitPrice))||Number(f.unitPrice)<0||!Number.isFinite(Number(f.bagWeightKg||25))||Number(f.bagWeightKg||25)<=0) return res.status(400).json({error:'Enter nonnegative stock and price, and a positive bag weight.'});
    const minThreshold = Number(f.minStockThresholdBags || 20);
    const status = qty <= minThreshold ? 'Low Stock' : 'In Stock';

    await pool.query(
      `INSERT INTO feed_inventory (id, farm_id, name, type, quantity_bags, bag_weight_kg, unit_price, supplier, status, min_stock_threshold_bags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.session.farmId, f.name, f.type, qty, f.bagWeightKg || 25, f.unitPrice, f.supplier, status, minThreshold]
    );

    const [rows] = await pool.query('SELECT * FROM feed_inventory WHERE id = ?', [id]);
    res.status(201).json(formatFeed(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/feed/:id/usage', async (req, res) => {
  res.status(400).json({error:'Record feeding in Daily Records with its flock, date, quantity supplied and remainder. Unlinked stock deductions are not supported.'});
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
    const [rows] = await pool.query('SELECT m.* FROM mortality_records m JOIN flocks f ON f.id=m.flock_id WHERE f.farm_id=? ORDER BY m.date DESC',[req.session.farmId]);
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
    const [rows] = await pool.query('SELECT t.*,d.poultry_type FROM sales t LEFT JOIN daily_records d ON d.id=t.id WHERE t.farm_id=? ORDER BY t.date DESC',[req.session.farmId]);
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.session.farmId, s.customerName, s.product, s.flockId, qty, unitPrice, totalAmount, s.paymentStatus || 'Paid', s.paymentMethod || 'Bank Transfer', s.date || new Date(), s.notes || '']
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
    const [rows] = await pool.query('SELECT t.*,d.poultry_type FROM expenses t LEFT JOIN daily_records d ON d.id=t.id WHERE t.farm_id=? ORDER BY t.date DESC',[req.session.farmId]);
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.session.farmId, ex.category, ex.description, Number(ex.amount), ex.paymentMethod || 'Bank Transfer', ex.flockId || null, ex.date || new Date(), ex.notes || '']
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
    const [rows] = await pool.query('SELECT * FROM customers WHERE farm_id=? ORDER BY created_at DESC',[req.session.farmId]);
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.session.farmId, c.name, c.contactPerson || '', c.phone || '', c.email || '', c.address || '', c.type || 'Retailer', Number(c.totalPurchases || 0), Number(c.outstandingBalance || 0), c.notes || '']
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
    const [rows] = await pool.query('SELECT v.* FROM vaccinations v JOIN flocks f ON f.id=v.flock_id WHERE f.farm_id=? ORDER BY v.scheduled_date ASC',[req.session.farmId]);
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
    const [rows] = await pool.query('SELECT m.* FROM medications m JOIN flocks f ON f.id=m.flock_id WHERE f.farm_id=? ORDER BY m.created_at DESC',[req.session.farmId]);
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

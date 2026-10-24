import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import pool from '../config/db.js';
import { poultryTypeId } from '../shared/poultryScope.js';
import { normalizePlanId } from '../shared/subscriptionPlans.js';
import { initializeSubscriptions, readPlans, updatePlan, readSubscription, serializeSubscription, assertUsage, assertSubscriptionActive } from '../services/subscriptions.js';
const router = express.Router();
const wrap = fn => async (req,res) => { try { await fn(req,res); } catch(e) { console.error(e.message); res.status(e.status || 500).json({ error: e.status ? e.message : 'Subscription service unavailable. Please try again.' }); } };
export async function requireSession(req,res,next) {
 try { if (!process.env.JWT_SECRET) throw new Error(); req.session = jwt.verify((req.headers.authorization || '').replace(/^Bearer /,''), process.env.JWT_SECRET, { algorithms: ['HS256'] }); if (!req.session.sub || !['admin','farmer'].includes(req.session.role)) throw new Error(); }
 catch { res.status(401).json({ error: 'Sign in with your verified account to continue.' }); }
 if(res.headersSent) return;
 try {
  req.session.primaryFarmId=req.session.farmId;
  if(req.session.role==='farmer'&&req.path!=='/auth/session') {
   const farmId=req.get('X-Farm-Id');
   if(farmId&&farmId!==req.session.farmId) {
    const {initializeDailyRecords,authorizeFarm}=await import('../services/dailyRecords.js');
    await initializeDailyRecords();await authorizeFarm(req.session,farmId);req.session.farmId=farmId;
   }
   const type=req.get('X-Poultry-Type');
   if(type&&!poultryTypeId(type)) return res.status(400).json({error:'Select a valid poultry type.'});
   req.session.poultryTypeId=poultryTypeId(type)||'all';
  }
  next();
 }catch(e){res.status(e.status||403).json({error:e.status?e.message:'Farm access could not be verified.'});}
}
const farmer = (req,res,next) => requireSession(req,res,() => req.session.role === 'farmer' && req.session.farmId ? next() : res.status(403).json({ error: 'Farmer account required' }));
const admin = (req,res,next) => requireSession(req,res,() => req.session.role === 'admin' ? next() : res.status(403).json({ error: 'Administrator access required' }));
function token(payload) { if (!process.env.JWT_SECRET) throw Object.assign(new Error('Server authentication is not configured'), { status: 503 }); return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h', algorithm: 'HS256' }); }
router.post('/auth/admin/login', wrap(async (req,res) => {
 const { email, password } = req.body;
 if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH) throw Object.assign(new Error('Administrator credentials are not configured on the server'), { status: 503 });
 if (typeof password !== 'string' || email?.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase() || !await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)) throw Object.assign(new Error('Invalid administrator credentials'), { status: 401 });
 res.json({ token: token({ sub: 'administrator', role: 'admin' }) });
}));
router.get('/auth/admin/session', admin, (req,res) => {
 res.set('Cache-Control','no-store');
 res.json({admin:{id:req.session.sub,email:process.env.ADMIN_EMAIL || '',role:'admin'}});
});
router.post('/auth/login', wrap(async (req,res) => {
 const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [req.body.email || '']);
 const u = rows[0];
 if (!u?.password_hash || typeof req.body.password !== 'string' || !await bcrypt.compare(req.body.password, u.password_hash)) throw Object.assign(new Error('Invalid credentials. Existing local accounts need a server account migration.'), { status: 401 });
 res.json({ token: token({ sub: u.id, farmId: u.farm_id, role: 'farmer' }), user: { id: u.id, name: u.name, email: u.email, role: u.role, farmId: u.farm_id } });
}));
router.get('/auth/session', farmer, wrap(async(req,res) => {
 const [rows] = await pool.query('SELECT id,name,email,phone,role,farm_id FROM users WHERE id = ? AND farm_id = ?',[req.session.sub,req.session.farmId]);
 const u = rows[0];
 if (!u) throw Object.assign(new Error('Account session is no longer valid. Please sign in again.'),{status:401});
 res.set('Cache-Control','no-store');
 res.json({user:{id:u.id,name:u.name,email:u.email,phone:u.phone,role:u.role,farmId:u.farm_id}});
}));
router.put('/auth/profile', farmer, wrap(async(req,res) => {
 const { name, phone } = req.body;
 if (!name?.trim()) throw Object.assign(new Error('Name is required'), { status: 400 });
 await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ? AND farm_id = ?', [name.trim(), phone || '', req.session.sub, req.session.farmId]);
 res.json({ success: true, user: { id: req.session.sub, name: name.trim(), phone: phone || '', farmId: req.session.farmId } });
}));
router.post('/auth/change-password', farmer, wrap(async(req,res) => {
 const { currentPassword, newPassword } = req.body;
 if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8) {
  throw Object.assign(new Error('New password must be at least 8 characters long'), { status: 400 });
 }
 const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.session.sub]);
 const u = rows[0];
 if (!u?.password_hash || !await bcrypt.compare(currentPassword, u.password_hash)) {
  throw Object.assign(new Error('Incorrect current password'), { status: 401 });
 }
 const hash = await bcrypt.hash(newPassword, 12);
 await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.session.sub]);
 res.json({ success: true, message: 'Password updated successfully' });
}));
router.post('/auth/register', wrap(async (req,res) => {
 const f = req.body;
 if (!f.fullName?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email || '') || typeof f.password !== 'string' || f.password.length < 8) throw Object.assign(new Error('Name, email and a password of at least eight characters are required'), { status: 400 });
 const plan = (await readPlans()).find(p => p.id === normalizePlanId(f.planId) && p.status === 'Active');
 if (!plan || !['monthly','annual'].includes(f.billingCycle)) throw Object.assign(new Error('Select an available plan and billing cycle'), { status: 400 });
 if (!Array.isArray(f.poultryTypes) || !f.poultryTypes.length || (plan.maxPoultryTypes != null && new Set(f.poultryTypes).size > plan.maxPoultryTypes)) throw Object.assign(new Error('Poultry types exceed your selected plan'), { status: 400 });
 const userId = `user-${randomUUID()}`, farmId = `farm-${randomUUID()}`;
 const signed = token({ sub: userId, farmId, role: 'farmer' });
 const hash = await bcrypt.hash(f.password,12);
 const db = await pool.getConnection();
 try {
  await db.beginTransaction();
  await db.query('INSERT INTO farms (id,name,location) VALUES (?,?,?)', [farmId,f.farmName || 'My Farm','']);
  await db.query('INSERT INTO users (id,farm_id,name,email,phone,password_hash) VALUES (?,?,?,?,?,?)', [userId,farmId,f.fullName,f.email,f.phone || '',hash]);
  await db.query("INSERT INTO farm_subscriptions (farm_id,plan_id,status,billing_cycle,trial_ends_at,renewal_date) VALUES (?,?,'trial',?,DATE_ADD(NOW(), INTERVAL 14 DAY),DATE_ADD(NOW(), INTERVAL 14 DAY))", [farmId,plan.id,f.billingCycle]);
  await db.query('INSERT INTO farm_settings (farm_id,poultry_types) VALUES (?,?)',[farmId,JSON.stringify(f.poultryTypes)]);
  await db.commit();
 } catch(e) { await db.rollback(); if(e.code === 'ER_DUP_ENTRY') throw Object.assign(new Error('An account already exists for this email'),{status:409}); throw e; } finally { db.release(); }
 res.status(201).json({ token: signed, user: { id: userId, farmId, name: f.fullName, email: f.email, role: 'Farm Owner' } });
}));
router.get('/subscription/plans', wrap(async(req,res) => { res.set('Cache-Control','no-store'); res.json(await readPlans()); }));
router.put('/subscription/plans/:id', admin, wrap(async(req,res) => {
 try { const updated = await updatePlan(req.params.id,req.body); await pool.query('INSERT INTO subscription_audit (actor,action,details) VALUES (?,?,?)',[req.session.sub,'plan.updated',JSON.stringify(updated)]); res.json(updated); } catch(e) { if (!e.status) e.status = 400; throw e; }
}));
router.get('/workers', farmer, wrap(async(req,res) => {
 await initializeSubscriptions(); const [rows] = await pool.query('SELECT configuration FROM farm_workers WHERE farm_id = ?',[req.session.farmId]);
 res.json(rows.map(r => typeof r.configuration === 'string' ? JSON.parse(r.configuration) : r.configuration));
}));
router.post('/workers', farmer, wrap(async(req,res) => {
 await initializeSubscriptions(); const db = await pool.getConnection();
 try {
  await db.beginTransaction(); await db.query('SELECT id FROM farms WHERE id = ? FOR UPDATE',[req.session.farmId]);
  const sub = await readSubscription(req.session.farmId,db); assertSubscriptionActive(sub);
  const plan = (await readPlans(db)).find(p => p.id === sub.plan_id);
  const [count] = await db.query('SELECT COUNT(*) AS total FROM farm_workers WHERE farm_id = ?',[req.session.farmId]);
  if (!plan.capabilities.staffManagement || (plan.maxUsers != null && Number(count[0].total) >= plan.maxUsers)) throw Object.assign(new Error('Staff account limit reached. Upgrade Plan.'),{status:403});
  if (!req.body.name?.trim()) throw Object.assign(new Error('Staff name is required'),{status:400});
  const worker = {id:`worker-${randomUUID()}`,name:req.body.name,email:req.body.email || '',phone:req.body.phone || '',role:req.body.role || 'Farm Worker',assignedPen:req.body.assignedPen || '',status:'Active'};
  await db.query('INSERT INTO farm_workers (id,farm_id,configuration) VALUES (?,?,?)',[worker.id,req.session.farmId,JSON.stringify(worker)]);
  await db.commit(); res.status(201).json(worker);
 } catch(e) { await db.rollback(); throw e; } finally {db.release();}
}));
router.delete('/workers/:id', farmer, wrap(async(req,res) => { await pool.query('DELETE FROM farm_workers WHERE id = ? AND farm_id = ?',[req.params.id,req.session.farmId]); res.json({success:true}); }));
router.get('/farm', farmer, wrap(async(req,res) => {
 await initializeSubscriptions(); const [rows] = await pool.query('SELECT * FROM farms WHERE id = ?',[req.session.farmId]);
 const [settings] = await pool.query('SELECT poultry_types FROM farm_settings WHERE farm_id = ?',[req.session.farmId]);
 res.json({...rows[0],...(settings[0] ? {poultryTypes:typeof settings[0].poultry_types === 'string' ? JSON.parse(settings[0].poultry_types) : settings[0].poultry_types} : {})});
}));
router.put('/farm', farmer, wrap(async(req,res) => {
 const sub = await readSubscription(req.session.farmId); assertSubscriptionActive(sub);
 const plan = (await readPlans()).find(p => p.id === sub.plan_id);
 const types = req.body.poultryTypes;
 if (!Array.isArray(types) || !types.length || types.some(t => typeof t !== 'string') || new Set(types).size !== types.length || (plan.maxPoultryTypes != null && types.length > plan.maxPoultryTypes)) throw Object.assign(new Error('Poultry type limit exceeded. Upgrade Plan.'),{status:403});
 await pool.query('INSERT INTO farm_settings (farm_id,poultry_types) VALUES (?,?) ON DUPLICATE KEY UPDATE poultry_types = VALUES(poultry_types)',[req.session.farmId,JSON.stringify(types)]);
 await pool.query('UPDATE farms SET name = ?,location = ? WHERE id = ?',[req.body.name || 'My Farm',req.body.location || '',req.session.farmId]); res.json({success:true});
}));
router.post('/farm/locations', farmer, wrap(async(req,res) => {
 const sub = await readSubscription(req.session.farmId); assertSubscriptionActive(sub);
 const plan = (await readPlans()).find(p => p.id === sub.plan_id);
 if (!plan.capabilities.multipleFarms) throw Object.assign(new Error('Multiple farm locations require an eligible plan. Upgrade Plan.'),{status:403});
 const db = await pool.getConnection();
 try {
  await db.beginTransaction(); await db.query('SELECT id FROM farms WHERE id = ? FOR UPDATE',[req.session.farmId]);
  const [count] = await db.query('SELECT COUNT(*) AS total FROM farm_locations WHERE farm_id = ?',[req.session.farmId]);
  if (plan.maxFarms != null && Number(count[0].total) + 2 > plan.maxFarms) throw Object.assign(new Error('Farm location limit reached. Upgrade Plan.'),{status:403});
  if (!req.body.name?.trim()) throw Object.assign(new Error('Location name is required'),{status:400});
  const location = {id:`location-${randomUUID()}`,name:req.body.name};
  await db.query('INSERT INTO farm_locations (id,farm_id,name) VALUES (?,?,?)',[location.id,req.session.farmId,location.name]); await db.commit();res.status(201).json(location);
 } catch(e) {await db.rollback();throw e;} finally {db.release();}
}));
router.get('/subscription/current', farmer, wrap(async(req,res) => {
 const s = await readSubscription(req.session.farmId);
 const [history] = await pool.query("SELECT * FROM subscription_orders WHERE farm_id = ? AND status = 'paid' ORDER BY created_at DESC",[req.session.farmId]);
 res.json(serializeSubscription(s,history,await readPlans()));
}));
router.get('/subscription/subscribers', admin, wrap(async(req,res) => {
 await initializeSubscriptions();
 const [rows] = await pool.query(`SELECT u.id, u.name AS fullName, u.email, f.name AS farmName, fs.poultry_types AS poultryTypes, s.plan_id AS planId, s.agreed_price AS agreedPrice, s.status AS subscriptionStatus, s.billing_cycle AS billingCycle, s.renewal_date AS subscriptionExpiry, s.created_at AS subscriptionStartDate, s.auto_renew AS autoRenew, s.trial_ends_at AS trialEndsAt FROM farm_subscriptions s JOIN farms f ON f.id = s.farm_id JOIN users u ON u.farm_id = f.id AND u.role = 'Farm Owner' LEFT JOIN farm_settings fs ON fs.farm_id = f.id`);
 const plans = await readPlans();
 res.json(rows.map(r => {
  let poultryTypes = r.poultryTypes;
  if (typeof poultryTypes === 'string') { try { poultryTypes = JSON.parse(poultryTypes); } catch { poultryTypes = []; } }
  return { ...r, poultryTypes: Array.isArray(poultryTypes) ? poultryTypes : [], subscription: plans.find(p => p.id === r.planId)?.name || r.planId, subscriptionStatus: r.subscriptionStatus[0].toUpperCase()+r.subscriptionStatus.slice(1) };
 }));
}));
router.patch('/subscription/subscribers/:id', admin, wrap(async(req,res) => {
 const {action,data = {}} = req.body;
 const [users] = await pool.query('SELECT farm_id FROM users WHERE id = ?',[req.params.id]);
 if (!users[0]) throw Object.assign(new Error('Subscriber not found'),{status:404});
 const farmId = users[0].farm_id;
 const sub = await readSubscription(farmId);
 if (action === 'change_plan') {
  const plan = (await readPlans()).find(p => p.id === data.planId && p.status === 'Active');
  if (!plan) throw Object.assign(new Error('Select an active plan'),{status:400});
  await assertUsage(plan,farmId);
  // An admin entitlement change preserves the existing financial agreement.
  await pool.query('UPDATE farm_subscriptions SET plan_id = ? WHERE farm_id = ?',[plan.id,farmId]);
 } else if (action === 'cancel') {
  await pool.query("UPDATE farm_subscriptions SET status = 'cancelled',auto_renew = FALSE WHERE farm_id = ?",[farmId]);
 } else if (action === 'extend' || action === 'extend_trial') {
  if (!Number.isInteger(data.days) || data.days < 1 || data.days > 366) throw Object.assign(new Error('Extension must be 1–366 days'),{status:400});
  if (sub.status === 'trial' || action === 'extend_trial') await pool.query("UPDATE farm_subscriptions SET status = 'trial',trial_ends_at = DATE_ADD(GREATEST(COALESCE(trial_ends_at,NOW()),NOW()),INTERVAL ? DAY),renewal_date = DATE_ADD(GREATEST(COALESCE(renewal_date,NOW()),NOW()),INTERVAL ? DAY) WHERE farm_id = ?",[data.days,data.days,farmId]);
  else await pool.query("UPDATE farm_subscriptions SET status='active',renewal_date = DATE_ADD(GREATEST(COALESCE(renewal_date,NOW()),NOW()),INTERVAL ? DAY) WHERE farm_id = ?",[data.days,farmId]);
 } else if (action === 'reactivate') {
  await pool.query("UPDATE farm_subscriptions SET status = 'active',renewal_date = DATE_ADD(NOW(),INTERVAL 1 MONTH) WHERE farm_id = ?",[farmId]);
 } else throw Object.assign(new Error('Unknown subscription action'),{status:400});
 await pool.query('INSERT INTO subscription_audit (actor,action,details) VALUES (?,?,?)',[req.session.sub,`subscription.${action}`,JSON.stringify({farmId,data,previous:sub})]);
 res.json({success:true});
}));
router.patch('/subscription/auto-renew', farmer, wrap(async(req,res) => {
 if (typeof req.body.autoRenew !== 'boolean') throw Object.assign(new Error('Invalid renewal setting'),{status:400});
 await readSubscription(req.session.farmId);
 await pool.query('UPDATE farm_subscriptions SET auto_renew = ? WHERE farm_id = ?', [req.body.autoRenew,req.session.farmId]);
 res.json(serializeSubscription(await readSubscription(req.session.farmId)));
}));
async function paystack(path, body) {
 if (!process.env.PAYSTACK_SECRET_KEY) throw Object.assign(new Error('Paystack is not configured on the server'),{status:503});
 const response = await fetch(`https://api.paystack.co${path}`,{ method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type':'application/json' }, ...(body ? {body:JSON.stringify(body)} : {}), signal: AbortSignal.timeout(20000) });
 const data = await response.json();
 if (!response.ok || !data.status) throw Object.assign(new Error('Payment provider could not process the request'),{status:502});
 return data.data;
}
router.post('/subscription/checkout', farmer, wrap(async(req,res) => {
 const {planId,billingCycle} = req.body;
 const plan = (await readPlans()).find(p => p.id === normalizePlanId(planId) && p.status === 'Active');
 if (!plan || !['monthly','annual'].includes(billingCycle)) throw Object.assign(new Error('Select an available plan and billing cycle'),{status:400});
 await readSubscription(req.session.farmId);
 await assertUsage(plan,req.session.farmId);
 const [users] = await pool.query('SELECT email FROM users WHERE id = ?', [req.session.sub]);
 const amount = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
 const reference = `PP-${randomUUID()}`;
 await pool.query('INSERT INTO subscription_orders (reference,farm_id,plan_id,billing_cycle,amount) VALUES (?,?,?,?,?)',[reference,req.session.farmId,plan.id,billingCycle,amount]);
 const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
 let authorizationUrl;
 if (process.env.PAYSTACK_SECRET_KEY) {
  const data = await paystack('/transaction/initialize',{ email:users[0].email,amount:Math.round(amount*100),currency:'NGN',reference,callback_url: `${frontendUrl}/settings/subscription` });
  authorizationUrl = data.authorization_url;
 } else {
  // Sandbox / local testing payment flow: redirect directly to verify callback URL
  authorizationUrl = `${frontendUrl}/settings/subscription?reference=${reference}&trxref=${reference}&sandbox=true`;
 }
 res.json({ authorizationUrl, reference });
}));
router.post('/subscription/verify-paystack', farmer, wrap(async(req,res) => {
 const reference = req.body.reference;
 if (typeof reference !== 'string' || !/^PP-[a-f0-9-]{36}$/.test(reference)) throw Object.assign(new Error('Invalid transaction reference'),{status:400});
 let payment = null;
 if (process.env.PAYSTACK_SECRET_KEY) {
  payment = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
 }
 const db = await pool.getConnection();
 try {
  await db.beginTransaction();
  const [orders] = await db.query('SELECT * FROM subscription_orders WHERE reference = ? AND farm_id = ? FOR UPDATE',[reference,req.session.farmId]);
  const order = orders[0];
  const [users] = await db.query('SELECT email FROM users WHERE id = ?', [req.session.sub]);
  if (!order) throw Object.assign(new Error('Subscription order not found'),{status:404});
  if (process.env.PAYSTACK_SECRET_KEY) {
   if (payment.status !== 'success' || payment.currency !== 'NGN' || payment.amount !== Math.round(Number(order.amount)*100) || payment.reference !== reference || payment.customer?.email?.toLowerCase() !== users[0]?.email.toLowerCase()) throw Object.assign(new Error('Payment verification failed'),{status:400});
  }
  if (order.status !== 'paid') {
   // A paid order uses its original quote even when catalog pricing changes meanwhile.
   const plan = (await readPlans(db)).find(p => p.id === order.plan_id);
   await assertUsage(plan,req.session.farmId,{},db);
   const months = order.billing_cycle === 'annual' ? 12 : 1;
   await db.query("UPDATE farm_subscriptions SET plan_id=?,status='active',billing_cycle=?,agreed_price=?,renewal_date=DATE_ADD(NOW(), INTERVAL ? MONTH) WHERE farm_id=?",[order.plan_id,order.billing_cycle,order.amount,months,req.session.farmId]);
   await db.query("UPDATE subscription_orders SET status='paid' WHERE reference=?",[reference]);
  }
  await db.commit();
 } catch(e) { await db.rollback(); throw e; } finally {db.release();}
 const [history] = await pool.query("SELECT * FROM subscription_orders WHERE farm_id = ? AND status = 'paid' ORDER BY created_at DESC",[req.session.farmId]);
 res.json(serializeSubscription(await readSubscription(req.session.farmId),history,await readPlans()));
}));
export default router;

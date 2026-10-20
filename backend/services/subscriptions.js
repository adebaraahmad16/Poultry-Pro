import pool from '../config/db.js';
import { DEFAULT_PLANS, normalizePlanId, presentPlan, validatePlan } from '../shared/subscriptionPlans.js';
let ready;
export function initializeSubscriptions() {
 if (!ready) ready = (async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS subscription_plans (id VARCHAR(64) PRIMARY KEY, configuration JSON NOT NULL)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS farm_subscriptions (farm_id VARCHAR(64) PRIMARY KEY, plan_id VARCHAR(64) NOT NULL, status VARCHAR(32) NOT NULL, billing_cycle VARCHAR(16) NOT NULL, agreed_price DECIMAL(12,2) NULL, trial_ends_at DATETIME NULL, renewal_date DATETIME NULL, auto_renew BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS subscription_orders (reference VARCHAR(100) PRIMARY KEY, farm_id VARCHAR(64) NOT NULL, plan_id VARCHAR(64) NOT NULL, billing_cycle VARCHAR(16) NOT NULL, amount DECIMAL(12,2) NOT NULL, status VARCHAR(32) NOT NULL DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS farm_settings (farm_id VARCHAR(64) PRIMARY KEY, poultry_types JSON NOT NULL)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS farm_workers (id VARCHAR(64) PRIMARY KEY, farm_id VARCHAR(64) NOT NULL, configuration JSON NOT NULL)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS farm_locations (id VARCHAR(64) PRIMARY KEY, farm_id VARCHAR(64) NOT NULL, name VARCHAR(255) NOT NULL)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS legacy_subscription_records (farm_id VARCHAR(64) PRIMARY KEY, record JSON NOT NULL)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS subscription_audit (id BIGINT AUTO_INCREMENT PRIMARY KEY, actor VARCHAR(64) NOT NULL, action VARCHAR(64) NOT NULL, details JSON NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  for (const p of DEFAULT_PLANS) await pool.query('INSERT IGNORE INTO subscription_plans (id, configuration) VALUES (?, ?)', [p.id, JSON.stringify(p)]);
 })().catch(e => { ready = undefined; throw e; });
 return ready;
}
const parse = value => typeof value === 'string' ? JSON.parse(value) : value;
export async function readPlans(db = pool) {
 await initializeSubscriptions();
 const [rows] = await db.query('SELECT configuration FROM subscription_plans');
 const catalog = rows.map(r => parse(r.configuration));
 return catalog.map(p => presentPlan(p,catalog)).sort((a,b) => DEFAULT_PLANS.findIndex(p => p.id === a.id) - DEFAULT_PLANS.findIndex(p => p.id === b.id));
}
export async function updatePlan(id, body) {
 const plans = await readPlans();
 const previous = plans.find(p => p.id === id);
 if (!previous) throw Object.assign(new Error('Unknown plan'), { status: 404 });
 if (body.version !== previous.version) throw Object.assign(new Error('This plan changed. Refresh and try again.'), { status: 409 });
 const fields = ['name','description','status','monthlyPrice','annualPrice','maxFlocks','maxBirds','maxPoultryTypes','maxUsers','maxFarms','capabilities'];
 const next = { ...previous, ...Object.fromEntries(fields.filter(k => k in body).map(k => [k, body[k]])), version: previous.version + 1 };
 validatePlan(next);
 const [result] = await pool.query("UPDATE subscription_plans SET configuration = ? WHERE id = ? AND JSON_EXTRACT(configuration, '$.version') = ?", [JSON.stringify(next), id, previous.version]);
 if (!result.affectedRows) throw Object.assign(new Error('Concurrent change detected. Refresh and try again.'), { status: 409 });
 return presentPlan(next);
}
export async function readSubscription(farmId, db = pool) {
 await initializeSubscriptions();
 const [rows] = await db.query('SELECT s.*, l.record AS legacy_record FROM farm_subscriptions s LEFT JOIN legacy_subscription_records l ON l.farm_id = s.farm_id WHERE s.farm_id = ?', [farmId]);
 const s = rows[0];
 if (!s) throw Object.assign(new Error('Your farm has no verified subscription. Sign in or contact support to migrate an existing account.'), { status: 403 });
 return s;
}
export function assertSubscriptionActive(s) {
 const end = s.status === 'trial' ? s.trial_ends_at : s.renewal_date;
 if (!['active','trial','cancelled'].includes(s.status) || !end || new Date(end).getTime() <= Date.now()) throw Object.assign(new Error('Your subscription has expired. Upgrade Plan to continue.'), { status: 403 });
}
export async function assertUsage(plan, farmId, { birds = 0, type, addingFlock = false } = {}, db = pool) {
 const [rows] = await db.query("SELECT COUNT(*) AS flocks, COALESCE(SUM(current_birds),0) AS birds, COUNT(DISTINCT type) AS types FROM flocks WHERE farm_id = ? AND status NOT IN ('Sold','Closed')", [farmId]);
 const usage = rows[0];
 if (plan.maxFlocks != null && Number(usage.flocks) + (addingFlock ? 1 : 0) > plan.maxFlocks) throw Object.assign(new Error(`${plan.name} active flock limit reached. Upgrade Plan.`), { status: 403 });
 if (plan.maxBirds != null && Number(usage.birds) + birds > plan.maxBirds) throw Object.assign(new Error(`${plan.name} bird capacity reached. Upgrade Plan.`), { status: 403 });
 const category = value => ['chick','chicken','pullet'].includes(String(value).toLowerCase()) ? 'chicks' : String(value).toLowerCase();
 const [typeRows] = await db.query("SELECT DISTINCT type FROM flocks WHERE farm_id = ? AND status NOT IN ('Sold','Closed')",[farmId]);
 const types = new Set(typeRows.map(r => category(r.type)));
 if(type) types.add(category(type));
 if (plan.maxPoultryTypes != null && types.size > plan.maxPoultryTypes) throw Object.assign(new Error(`${plan.name} poultry type limit reached. Upgrade Plan.`), { status: 403 });
 const [staff] = await db.query('SELECT COUNT(*) AS total FROM farm_workers WHERE farm_id = ?', [farmId]);
 if (plan.maxUsers != null && Number(staff[0].total) > plan.maxUsers) throw Object.assign(new Error('Reduce staff accounts before downgrading.'), { status: 403 });
 const [settings] = await db.query('SELECT poultry_types FROM farm_settings WHERE farm_id = ?', [farmId]);
 if (plan.maxPoultryTypes != null && settings[0] && parse(settings[0].poultry_types).length > plan.maxPoultryTypes) throw Object.assign(new Error('Reduce configured poultry types before downgrading.'), { status: 403 });
 const [locations] = await db.query('SELECT COUNT(*) AS total FROM farm_locations WHERE farm_id = ?', [farmId]);
 if (plan.maxFarms != null && (Number(locations[0].total) + 1) > plan.maxFarms) throw Object.assign(new Error('Reduce farm locations before downgrading.'), { status: 403 });

}
export function serializeSubscription(s, history = [], catalog = DEFAULT_PLANS) {
 const legacy = s.legacy_record ? parse(s.legacy_record) : {};
 const end = s.status === 'trial' ? s.trial_ends_at : s.renewal_date;
 const status = ['active','trial'].includes(s.status) && (!end || new Date(end).getTime() <= Date.now()) ? 'expired' : s.status;
 return { ...legacy, planId: normalizePlanId(s.plan_id).toUpperCase(), status, billingCycle: s.billing_cycle, agreedPrice: s.agreed_price == null ? null : Number(s.agreed_price), trialEndsAt: s.trial_ends_at, renewalDate: s.renewal_date, startDate: s.created_at, autoRenew: Boolean(s.auto_renew), trialUsed: true, trialDaysTotal: 14, paymentHistory: [...(legacy.paymentHistory || []), ...history.map(o => ({ id: o.reference, reference: o.reference, date: o.created_at, amount: Number(o.amount), amountFormatted: `₦${Number(o.amount).toLocaleString()}`, description: `${catalog.find(p => p.id === o.plan_id)?.name || o.plan_id} subscription`, billingCycle: o.billing_cycle, status: 'Successful', method: 'Paystack' }))].sort((a,b) => new Date(b.date)-new Date(a.date)) };
}

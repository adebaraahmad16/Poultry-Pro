// Explicit operator migration for accounts that previously existed only in browser storage.
// Usage: node scripts/import_legacy_subscriptions.js path/to/reviewed-records.json
// Never reads browser storage, overwrites subscriptions, resets trials, or deletes records.
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { initializeSubscriptions } from '../services/subscriptions.js';
import { normalizePlanId, DEFAULT_PLANS } from '../../shared/subscriptionPlans.js';
const file = process.argv[2];
if (!file) throw new Error('Supply a reviewed JSON file containing an array of {user, farm, subscription} records');
try {
 const records = JSON.parse(await readFile(file,'utf8'));
 if (!Array.isArray(records)) throw new Error('Expected an array of reviewed account records');
 await initializeSubscriptions();
 const db = await pool.getConnection();
 try {
  await db.beginTransaction();
  for (const r of records) {
   const {user,farm,subscription:s} = r;
   const planId = normalizePlanId(s?.planId);
   if (!user?.email || !farm?.id || !s || !DEFAULT_PLANS.some(p => p.id === planId) || !['trial','active','expired','cancelled'].includes(s.status)) throw new Error('Each record needs a user email, explicit farm ID and valid original subscription');
   const date = value => {if(value == null) return null; const d = new Date(value); if(!Number.isFinite(d.getTime())) throw new Error('Invalid original subscription date'); return d;};
   const trialEnd = date(s.trialEndsAt), renewal = date(s.renewalDate);
   if (s.status === 'trial' && !trialEnd) throw new Error('Retain the original trial end date; no new trials are generated');
   if (s.status === 'active' && !renewal) throw new Error('Active subscriptions require their original renewal date');
   if (s.status === 'active' && (!Number.isFinite(s.agreedPrice) || s.agreedPrice <= 0)) throw new Error('Supply the original agreedPrice from a verified payment record for paid accounts');
   const [existing] = await db.query('SELECT farm_id FROM farm_subscriptions WHERE farm_id = ?',[farm.id]);
   if(existing.length) { console.log(`Skipped existing subscription for farm ${farm.id}`); continue; }
   await db.query('INSERT IGNORE INTO farms (id,name,location) VALUES (?,?,?)',[farm.id,farm.name || 'My Farm',farm.location || '']);
   const [users] = await db.query('SELECT id,farm_id FROM users WHERE email = ?',[user.email]);
   if (users[0] && users[0].farm_id !== farm.id) throw new Error('Existing account belongs to a different farm; review account ownership before importing');
   if (!users.length) {
    if(!process.env.MIGRATION_PASSWORD || process.env.MIGRATION_PASSWORD.length < 12) throw new Error('For a browser-only account, provide a unique MIGRATION_PASSWORD of at least 12 characters');
    const hash = await bcrypt.hash(process.env.MIGRATION_PASSWORD,12);
    await db.query('INSERT INTO users (id,farm_id,name,email,phone,password_hash) VALUES (?,?,?,?,?,?)',[user.id || `user-${randomUUID()}`,farm.id,user.name || user.fullName || user.email,user.email,user.phone || '',hash]);
   }
   await db.query('INSERT INTO farm_subscriptions (farm_id,plan_id,status,billing_cycle,agreed_price,trial_ends_at,renewal_date,auto_renew) VALUES (?,?,?,?,?,?,?,?)',[farm.id,planId,s.status,s.billingCycle === 'annual' ? 'annual' : 'monthly',s.agreedPrice ?? null,trialEnd,renewal,s.autoRenew !== false]);
   await db.query('INSERT INTO legacy_subscription_records (farm_id,record) VALUES (?,?)',[farm.id,JSON.stringify(s)]);
   await db.query('INSERT IGNORE INTO farm_settings (farm_id,poultry_types) VALUES (?,?)',[farm.id,JSON.stringify(farm.poultryTypes || [])]);
   await db.query('INSERT INTO subscription_audit (actor,action,details) VALUES (?,?,?)',['operator','subscription.imported',JSON.stringify({farmId:farm.id,userId:user.id,planId})]);
  }
  await db.commit();console.log('Migration committed. Original subscriptions and payment history retained.');
 } catch(e) {await db.rollback();throw e;} finally {db.release();}
} finally {await pool.end();}

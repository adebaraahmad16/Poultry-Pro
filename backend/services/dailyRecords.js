import { randomUUID, createHash } from 'node:crypto';
import pool from '../config/db.js';
import { validateRecord, eggEligible, birdDelta, paymentsFor, validDate } from '../../shared/dailyRecords.js';
import { readPlans, readSubscription, assertSubscriptionActive, initializeSubscriptions } from './subscriptions.js';
import { poultryTypeId, POULTRY_SCOPES } from '../../shared/poultryScope.js';

let initialized;
export function initializeDailyRecords() {
  if (!initialized) initialized = (async () => {
    await initializeSubscriptions();
    await pool.query(`CREATE TABLE IF NOT EXISTS farm_record_access (
      user_id VARCHAR(64) NOT NULL, farm_id VARCHAR(64) NOT NULL,
      PRIMARY KEY(user_id,farm_id), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(farm_id) REFERENCES farms(id) ON DELETE CASCADE)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS daily_records (
      id VARCHAR(64) PRIMARY KEY, farmer_id VARCHAR(64) NOT NULL, farm_id VARCHAR(64) NOT NULL,
      flock_id VARCHAR(64), poultry_type VARCHAR(100), recording_date DATE NOT NULL,
      category VARCHAR(30) NOT NULL, status VARCHAR(30) NOT NULL, recorded_values JSON NOT NULL,
      request_key VARCHAR(100) NOT NULL, fingerprint VARCHAR(64),
      created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3), updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      UNIQUE KEY daily_request(farm_id,request_key), INDEX daily_scope(farm_id,flock_id,recording_date),
      FOREIGN KEY(farm_id) REFERENCES farms(id), FOREIGN KEY(flock_id) REFERENCES flocks(id))`);
    await pool.query(`CREATE TABLE IF NOT EXISTS daily_record_audit (
      id BIGINT AUTO_INCREMENT PRIMARY KEY, record_id VARCHAR(64) NOT NULL, farm_id VARCHAR(64) NOT NULL,
      actor_id VARCHAR(64) NOT NULL, action VARCHAR(20) NOT NULL, before_values JSON, after_values JSON,
      created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3), INDEX audit_scope(farm_id,record_id))`);
    // The original inventory used whole bags, which truncates daily kg deductions.
    const [columns] = await pool.query("SHOW COLUMNS FROM feed_inventory LIKE 'quantity_bags'");
    if (!String(columns[0]?.Type).startsWith('decimal')) await pool.query('ALTER TABLE feed_inventory MODIFY quantity_bags DECIMAL(16,6) NOT NULL DEFAULT 0');
  })().catch(e => { initialized = undefined; throw e; });
  return initialized;
}
const error = (message,status=400) => { throw Object.assign(new Error(message),{status}); };
const date = d => d instanceof Date ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : String(d || '').slice(0,10);
const json = x => typeof x === 'string' ? JSON.parse(x) : x;
export const formatDaily = r => ({id:r.id,farmerId:r.farmer_id,farmId:r.farm_id,flockId:r.flock_id,poultryType:r.poultry_type,date:date(r.recording_date),category:r.category,status:r.status,values:json(r.recorded_values),createdAt:r.created_at,updatedAt:r.updated_at,editable:true});
export async function availableFarms(session, db=pool) {
  const [rows] = await db.query(`SELECT DISTINCT f.id,f.name,f.currency FROM farms f WHERE f.id = ? OR f.id IN
    (SELECT farm_id FROM farm_record_access WHERE user_id = ?)`,[session.primaryFarmId||session.farmId,session.sub]);
  return rows.sort((a,b)=>Number(b.id===(session.primaryFarmId||session.farmId))-Number(a.id===(session.primaryFarmId||session.farmId))||a.name.localeCompare(b.name));
}
export async function authorizeFarm(session, farmId, db=pool) {
  if (session.role !== 'farmer') error('Farmer account required.',403);
  const farms = await availableFarms(session,db);
  if (!farms.some(f => f.id === farmId)) error('You do not have access to this farm.',403);
}
export async function planFor(farmId,db=pool,write=false) {
  const subscription = await readSubscription(farmId,db);
  if (write) assertSubscriptionActive(subscription);
  const plan = (await readPlans(db)).find(p => p.id === subscription.plan_id);
  if (!plan) error('Subscription plan is unavailable.',403);
  return plan;
}
export async function readRecords(farmId,db=pool) {
  const [daily] = await db.query('SELECT * FROM daily_records WHERE farm_id = ? ORDER BY recording_date DESC,created_at DESC',[farmId]);
  const records = daily.map(formatDaily);
  const tables = [
    ['egg_production','eggs','date',r => ({totalEggs:r.total_eggs,brokenEggs:r.broken_eggs,crackedEggs:0,otherUnsellable:r.rejected_eggs,damagedEggs:r.broken_eggs+r.rejected_eggs,saleableEggs:r.good_eggs})],
    ['mortality_records','mortality','date',r => ({count:r.count,cause:r.cause})],
    ['vaccinations','health','scheduled_date',r => ({recordType:'Vaccination',name:r.vaccine,administeredBy:r.administered_by})],
    ['medications','health','start_date',r => ({recordType:'Medication',name:r.medication_name,dosage:r.dosage,reason:r.reason})],
    ['expenses','expenses','date',r => ({expenseCategory:r.category,description:r.description,amount:Number(r.amount),paymentMethod:r.payment_method})],
    ['sales','sales','date',r => ({product:r.product,quantity:r.quantity,birdInventoryBaseline:r.product==='Live Birds'?r.quantity:0,unitPrice:Number(r.unit_price),totalAmount:Number(r.total_amount),paymentStatus:r.payment_status,amountReceived:r.payment_status === 'Paid' ? Number(r.total_amount) : 0,paymentMethod:r.payment_method})],
  ];
  for (const [table,category,dateField,values] of tables) {
    const farmWide = ['expenses','sales'].includes(category);
    const [rows] = await db.query(`SELECT t.*, f.type AS poultry_type FROM ${table} t LEFT JOIN flocks f ON f.id=t.flock_id
      WHERE ${farmWide ? 't.farm_id' : 'f.farm_id'} = ? AND NOT EXISTS(SELECT 1 FROM daily_records d WHERE d.id=t.id)
      ${table === 'vaccinations' ? "AND t.status = 'Completed'" : ''}`,[farmId]);
    records.push(...rows.filter(r => r[dateField]).map(r => ({id:r.id,farmId,flockId:r.flock_id || null,poultryType:r.poultry_type,date:date(r[dateField]),category,status:'Recorded',values:{...values(r),notes:r.notes || ''},createdAt:r.created_at,updatedAt:r.created_at,editable:true,legacy:true})));
  }
  return records.sort((a,b) => b.date.localeCompare(a.date));
}

async function validateBalances(db,farmId,checkEggs=true) {
  const records = await readRecords(farmId,db);
  const [flocks] = await db.query('SELECT * FROM flocks WHERE farm_id = ?',[farmId]);
  for (const f of flocks) {
    if (f.current_birds < 0) error('This change would leave a negative bird population.');
    const movements = records.filter(r => birdDelta(r,f.id));
    const byDate = new Map();
    for (const r of movements) byDate.set(r.date,(byDate.get(r.date) || 0)+birdDelta(r,f.id));
    let population = f.current_birds - movements.reduce((n,r) => n+birdDelta(r,f.id),0);
    for (const [day,delta] of [...byDate.entries()].sort(([a],[b]) => a.localeCompare(b))) {
      if (day < date(f.date_acquired)) error('Bird movements cannot precede flock placement.');
      population += delta;
      if (population < 0) error(`Bird movements exceed available birds on ${day}.`);
    }
  }
  // Farm and flock balances must both remain nonnegative after historical corrections.
  if(!checkEggs) return;
  const eggRecords = records.filter(r => r.status === 'Recorded' && (r.category === 'eggs' || (r.category === 'sales' && r.values.product === 'Eggs')));
  for (const scope of [null,...flocks.map(f => f.id)]) {
    const days = new Map();
    for (const r of eggRecords.filter(r => scope === null || r.flockId === scope)) days.set(r.date,(days.get(r.date)||0)+(r.category === 'eggs' ? Number(r.values.saleableEggs) : -Number(r.values.quantity)));
    let balance = 0;
    for (const [day,delta] of [...days.entries()].sort(([a],[b]) => a.localeCompare(b))) {
      balance += delta;
      if (balance < 0) error(`Egg sales exceed recorded saleable egg stock on ${day}. Record opening production before selling eggs.`);
    }
  }
}

async function project(db,r,flock,sign) {
  if (r.status !== 'Recorded') return;
  const v=r.values, id=r.id, name=flock?.name || '', notes=v.notes || '';
  if (r.category === 'feed') {
    const [rows] = await db.query('SELECT * FROM feed_inventory WHERE id=? AND farm_id=? FOR UPDATE',[v.feedId,r.farmId]);
    if (!rows[0]) error('Choose an existing feed inventory item for this farm.');
    const item=rows[0];
    const bags=Number(item.quantity_bags)-sign*Number(v.consumedKg)/Number(item.bag_weight_kg);
    if (!Number.isFinite(bags) || bags < -0.000001) error('Insufficient feed inventory. Add purchased stock in Feed Management first.');
    await db.query('UPDATE feed_inventory SET quantity_bags=?,status=? WHERE id=?',[Math.max(0,bags),bags<=item.min_stock_threshold_bags?'Low Stock':'In Stock',v.feedId]);
  }
  const delta=birdDelta(r,r.flockId);
  if (delta) await db.query('UPDATE flocks SET current_birds=current_birds+? WHERE id=? AND farm_id=?',[sign*delta,r.flockId,r.farmId]);
  if (r.category === 'activities' && v.activityType === 'Bird Transfer') await db.query('UPDATE flocks SET current_birds=current_birds+? WHERE id=? AND farm_id=?',[sign*v.birdsMoved,v.targetFlockId,r.farmId]);
  const table = ({mortality:'mortality_records',eggs:'egg_production',expenses:'expenses',sales:'sales',health:v.recordType === 'Vaccination' ? 'vaccinations' : ['Medication','Treatment'].includes(v.recordType) ? 'medications' : null})[r.category];
  if (r.category==='health' && sign===-1 && v.nextDate) {
    const [followups]=await db.query('SELECT status FROM vaccinations WHERE id=? FOR UPDATE',[`${id}-next`]);
    if(followups[0]?.status==='Completed') error('This record has a completed follow-up. Correct the follow-up record before changing its source schedule.',409);
    await db.query('DELETE FROM vaccinations WHERE id=?',[`${id}-next`]);
  }
  if (table && sign === -1) { await db.query(`DELETE FROM ${table} WHERE id=?`,[id]); if(r.category==='health'&&v.nextDate) await db.query('DELETE FROM vaccinations WHERE id=?',[`${id}-next`]); return; }
  if (r.category === 'mortality') await db.query('INSERT INTO mortality_records (id,flock_id,flock_name,date,count,cause,notes) VALUES (?,?,?,?,?,?,?)',[id,r.flockId,name,r.date,v.count,v.cause,notes]);
  if (r.category === 'eggs') await db.query('INSERT INTO egg_production (id,flock_id,flock_name,date,total_eggs,broken_eggs,rejected_eggs,good_eggs,crates,notes) VALUES (?,?,?,?,?,?,?,?,?,?)',[id,r.flockId,name,r.date,v.totalEggs,v.brokenEggs+v.crackedEggs,v.otherUnsellable,v.saleableEggs,v.saleableEggs/30,notes]);
  if (r.category === 'expenses') await db.query('INSERT INTO expenses (id,farm_id,flock_id,date,category,description,amount,payment_method,notes) VALUES (?,?,?,?,?,?,?,?,?)',[id,r.farmId,r.flockId,r.date,v.expenseCategory,v.description,v.amount,v.paymentMethod,notes]);
  if (r.category === 'sales') await db.query('INSERT INTO sales (id,farm_id,flock_id,date,product,quantity,unit_price,total_amount,payment_status,payment_method,notes,customer_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',[id,r.farmId,r.flockId,r.date,v.product,v.quantity,v.unitPrice,v.totalAmount,v.paymentStatus,v.paymentMethod,notes,v.customerName||'']);
  if (r.category === 'health' && sign === 1) {
    if (v.recordType === 'Vaccination') await db.query("INSERT INTO vaccinations (id,flock_id,flock_name,vaccine,scheduled_date,status,administered_by,notes) VALUES (?,?,?,?,?,'Completed',?,?)",[id,r.flockId,name,v.name,r.date,v.administeredBy,notes]);
    if (['Medication','Treatment'].includes(v.recordType)) await db.query('INSERT INTO medications (id,flock_id,flock_name,medication_name,reason,dosage,start_date,end_date,cost,notes) VALUES (?,?,?,?,?,?,?,?,0,?)',[id,r.flockId,name,v.name,v.reason,v.dosage,r.date,null,[notes,v.withdrawalUntil?`Withdrawal period ends: ${v.withdrawalUntil}`:''].filter(Boolean).join('\n')]);
    if (v.nextDate&&v.recordType==='Vaccination') await db.query("INSERT INTO vaccinations (id,flock_id,flock_name,vaccine,scheduled_date,status,administered_by,notes) VALUES (?,?,?,?,?,'Upcoming',?,?)",[`${id}-next`,r.flockId,name,v.name || v.recordType,v.nextDate,v.administeredBy,'Follow-up: '+notes]);
  }
}

export async function mutateRecord(session,input,{id,remove=false}={}) {
  await initializeDailyRecords();
  const db=await pool.getConnection();
  try {
    // Reads following the farm lock must see a preceding request's commit.
    await db.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await db.beginTransaction();
    let old;
    if(id) {
      const [rows]=await db.query('SELECT * FROM daily_records WHERE id=?',[id]);
      if(rows[0]) old=formatDaily(rows[0]);
      else {
        const farmId=input.farmId||session.farmId;
        await authorizeFarm(session,farmId,db);
        old=(await readRecords(farmId,db)).find(r=>r.id===id&&r.legacy);
        if(!old) error('Daily record not found.',404);
      }
    }
    const farmId=old?.farmId || input.farmId || session.farmId;
    await authorizeFarm(session,farmId,db);
    await db.query('SELECT id FROM farms WHERE id=? FOR UPDATE',[farmId]);
    if(id) {
      const [rows]=await db.query('SELECT * FROM daily_records WHERE id=? FOR UPDATE',[id]);
      if(rows[0]) old=formatDaily(rows[0]);
      else if(old.legacy) {
        const current=(await readRecords(farmId,db)).find(r=>r.id===id&&r.legacy);
        if(!current) error('This record changed. Refresh and try again.',409);
        old=current;
        // Adopt on the first authorized correction. Existing module rows retain their IDs.
        await db.query('INSERT INTO daily_records (id,farmer_id,farm_id,flock_id,poultry_type,recording_date,category,status,recorded_values,request_key,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',[id,session.sub,farmId,old.flockId,old.poultryType,old.date,old.category,old.status,JSON.stringify(old.values),`legacy-${id}`,old.createdAt,old.updatedAt]);
      } else error('This record was deleted. Refresh and try again.',409);
      if(input.updatedAt !== new Date(old.updatedAt).toISOString()) error('This record changed since you opened it. Refresh before editing.',409);
    }
    await planFor(farmId,db,true);
    if (!id) {
      if(!/^[a-zA-Z0-9-]{16,100}$/.test(input.requestKey || '')) error('A valid submission key is required.');
      const [existing]=await db.query('SELECT * FROM daily_records WHERE farm_id=? AND request_key=?',[farmId,input.requestKey]);
      if(existing[0]) { await db.commit(); return formatDaily(existing[0]); }
    }
    let r;
    if(!remove) {
      const [clock]=await db.query('SELECT DATE_FORMAT(CURRENT_DATE(),\'%Y-%m-%d\') AS today');
      r={...validateRecord(input,clock[0].today),id:id || `daily-${randomUUID()}`,farmId,farmerId:session.sub};
      // Only previously persisted baselines may affect an inventory correction.
      delete r.values.birdInventoryBaseline;
      if(old?.values.birdInventoryBaseline!=null) r.values.birdInventoryBaseline=old.values.birdInventoryBaseline;
      if(r.category==='sales'&&r.status==='Recorded') {
        // Clients supply a cumulative amount; dated receipts are reconciled on the server.
        const payments=old?paymentsFor(old).map(p=>({...p})):[];
        const previous=payments.reduce((n,p)=>n+Number(p.amount),0);
        const difference=Math.round((r.values.amountReceived-previous)*100)/100;
        if(difference>0) {
          const paymentDate=r.values.paymentDate||(old?clock[0].today:r.date);
          if(!validDate(paymentDate)||paymentDate<r.date||paymentDate>clock[0].today) error('Payment date must fall between the sale date and today.');
          payments.push({date:paymentDate,amount:difference});
        } else if(difference<0) {
          let reduction=-difference;
          while(reduction>0.000001&&payments.length) {
            const last=payments[payments.length-1],deduction=Math.min(reduction,last.amount);
            last.amount=Math.round((last.amount-deduction)*100)/100;reduction-=deduction;
            if(last.amount===0) payments.pop();
          }
        }
        if(payments.some(p=>p.date<r.date)) error('The corrected sale date cannot follow an existing payment date.');
        r.values.payments=payments;
      }
      if(old && (old.category!==r.category || old.flockId!==r.flockId)) error('Keep the original category and flock when correcting a record.');
      const [flocks]=await db.query('SELECT * FROM flocks WHERE farm_id=? ORDER BY id FOR UPDATE',[farmId]);
      const flock=flocks.find(f=>f.id===r.flockId);
      if(r.flockId && !flock) error('The selected flock does not belong to this farm.',403);
      if(flock&&session.poultryTypeId&&session.poultryTypeId!=='all'&&poultryTypeId(flock.type)!==session.poultryTypeId) error('Choose a flock belonging to the selected poultry type.',403);
      if(!flock&&session.poultryTypeId&&session.poultryTypeId!=='all'&&poultryTypeId(r.poultryType)&&poultryTypeId(r.poultryType)!==session.poultryTypeId) error('The record must match the selected poultry type.',403);
      r.poultryType=flock?.type || POULTRY_SCOPES[poultryTypeId(r.poultryType)||session.poultryTypeId]?.[0] || null;
      if(flock && r.date < date(flock.date_acquired)) error('Recording date cannot precede flock placement.');
      if(r.category==='eggs' && r.status==='Recorded' && !eggEligible(flock?.type)) error('Egg production does not apply to this flock.');
      if(r.category==='activities' && r.values.activityType==='Bird Transfer') {
        const target=flocks.find(f=>f.id===r.values.targetFlockId);
        if(!target || target.type!==flock.type) error('Transfers require a destination flock of the same poultry type on this farm.');
        if(r.date<date(target.date_acquired)) error('Transfer date cannot precede destination flock placement.');
      }
      const existing=await readRecords(farmId,db);
      const same=existing.filter(e=>e.id!==id && e.date===r.date && e.flockId===r.flockId && e.category===r.category);
      if(same.length && (r.status!=='Recorded' || same.some(e=>e.status!=='Recorded'))) error('A record or confirmation already exists for this category and date. Edit it in history first.',409);
      const canonical=JSON.stringify(Object.fromEntries(Object.entries(r.values).sort(([a],[b])=>a.localeCompare(b))));
      r.fingerprint=createHash('sha256').update(`${r.date}|${r.flockId}|${r.category}|${canonical}`).digest('hex');
      if(['expenses','sales'].includes(r.category)) {
        const [duplicates]=await db.query('SELECT id FROM daily_records WHERE farm_id=? AND fingerprint=? AND id<>?',[farmId,r.fingerprint,id||'']);
        if(duplicates.length) error('An identical transaction already exists. Review the history to avoid a duplicate.',409);
      }
      if(old) await project(db,old,flock,-1);
      await project(db,r,flock,1);
      if(old) await db.query('UPDATE daily_records SET recording_date=?,status=?,recorded_values=?,fingerprint=? WHERE id=?',[r.date,r.status,JSON.stringify(r.values),r.fingerprint,id]);
      else await db.query('INSERT INTO daily_records (id,farmer_id,farm_id,flock_id,poultry_type,recording_date,category,status,recorded_values,request_key,fingerprint) VALUES (?,?,?,?,?,?,?,?,?,?,?)',[r.id,session.sub,farmId,r.flockId,r.poultryType,r.date,r.category,r.status,JSON.stringify(r.values),input.requestKey,r.fingerprint]);
    } else {
      const [flocks]=await db.query('SELECT * FROM flocks WHERE farm_id=? ORDER BY id FOR UPDATE',[farmId]);
      await project(db,old,flocks.find(f=>f.id===old.flockId),-1);
      await db.query('DELETE FROM daily_records WHERE id=?',[id]);
    }
    const affectsEggs=record=>record?.category==='eggs'||(record?.category==='sales'&&record.values.product==='Eggs');
    await validateBalances(db,farmId,affectsEggs(old)||affectsEggs(r));
    if(r?.status==='Recorded' && r.flockId) {
      const all=await readRecords(farmId,db);
      const [fs]=await db.query('SELECT * FROM flocks WHERE id=?',[r.flockId]);
      const alive=Number(fs[0].current_birds)-all.filter(e=>e.date>r.date).reduce((n,e)=>n+birdDelta(e,r.flockId),0);
      if(r.category==='eggs' && r.values.layingHens!=null && r.values.layingHens>alive) error('Laying hens exceed birds alive on the recording date.');
      if(r.category==='weight' && (r.values.sampleSize>alive || (r.values.measurement==='Whole flock' && r.values.sampleSize!==alive))) error('The number weighed must match the selected measurement and available birds.');
      if(r.category==='health' && r.values.birdsTreated>alive) error('Birds treated exceed birds alive on the recording date.');
    }
    await db.query('INSERT INTO daily_record_audit (record_id,farm_id,actor_id,action,before_values,after_values) VALUES (?,?,?,?,?,?)',[id||r.id,farmId,session.sub,remove?'deleted':old?'updated':'created',old?JSON.stringify(old):null,r?JSON.stringify(r):null]);
    let result={success:true};
    if(r) { const [rows]=await db.query('SELECT * FROM daily_records WHERE id=?',[r.id]); result=formatDaily(rows[0]); }
    await db.commit(); return result;
  } catch(e) {await db.rollback();throw e;} finally {db.release();}
}

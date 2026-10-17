import express from 'express';
import pool from '../config/db.js';
import { requireSession } from './subscriptionRoutes.js';
import { initializeDailyRecords, availableFarms, authorizeFarm, planFor, readRecords, mutateRecord } from '../services/dailyRecords.js';
import { recordSummary, CATEGORIES } from '../../shared/dailyRecords.js';
import { poultryTypeId } from '../../shared/poultryScope.js';

const router=express.Router();
router.use(requireSession);
router.use(async(req,res,next)=>{
  try {
    if(req.session.role!=='farmer') return res.status(403).json({error:'Farmer account required.'});
    await initializeDailyRecords(); next();
  } catch(e) { console.error('Daily records initialization:',e.message); res.status(503).json({error:'Daily record storage is unavailable. Please try again.'}); }
});
const wrap=fn=>async(req,res)=>{try {await fn(req,res);}catch(e){if(!e.status)console.error('Daily records:',e);res.status(e.status||500).json({error:e.status?e.message:'Unable to save or load daily records. Please try again.'});}};
router.get('/farms',wrap(async(req,res)=>res.json(await availableFarms(req.session))));
router.get('/',wrap(async(req,res)=>{
  const farmId=req.query.farmId||req.session.farmId;
  await authorizeFarm(req.session,farmId);
  const plan=await planFor(farmId);
  const [flocks]=await pool.query("SELECT id,name,type,current_birds AS currentBirds,initial_birds AS initialBirds,DATE_FORMAT(date_acquired,'%Y-%m-%d') AS dateAcquired,status FROM flocks WHERE farm_id=? ORDER BY name",[farmId]);
  const [feeds]=await pool.query('SELECT id,name,type,quantity_bags AS quantityBags,bag_weight_kg AS bagWeightKg FROM feed_inventory WHERE farm_id=? ORDER BY name',[farmId]);
  const [upcomingHealth]=await pool.query("SELECT v.id,v.flock_id AS flockId,v.vaccine,DATE_FORMAT(v.scheduled_date,'%Y-%m-%d') AS date,v.status FROM vaccinations v JOIN flocks f ON f.id=v.flock_id WHERE f.farm_id=? AND v.status='Upcoming' ORDER BY v.scheduled_date",[farmId]);
  let records=await readRecords(farmId);
  const type=poultryTypeId(req.query.poultryType)||req.session.poultryTypeId||'all';
  if(type!=='all') {
    const ids=new Set(flocks.filter(f=>poultryTypeId(f.type)===type).map(f=>f.id));
    records=records.filter(r=>r.flockId?ids.has(r.flockId):poultryTypeId(r.poultryType)===type);
    flocks.splice(0,flocks.length,...flocks.filter(f=>ids.has(f.id)));
    upcomingHealth.splice(0,upcomingHealth.length,...upcomingHealth.filter(h=>ids.has(h.flockId)));
  }
  upcomingHealth.push(...records.filter(r=>r.category==='health'&&r.status==='Recorded'&&r.values.recordType!=='Vaccination'&&r.values.nextDate).map(r=>({id:r.id+'-followup',flockId:r.flockId,vaccine:`${r.values.recordType}: ${r.values.name||r.values.reason}`,date:r.values.nextDate,status:'Upcoming'})));
  upcomingHealth.sort((a,b)=>a.date.localeCompare(b.date));
  res.set('Cache-Control','no-store').json({records,flocks,feeds,upcomingHealth,capabilities:plan.capabilities});
}));
router.get('/export',wrap(async(req,res)=>{
  const farmId=req.query.farmId||req.session.farmId;
  await authorizeFarm(req.session,farmId);
  const plan=await planFor(farmId);
  if(!plan.capabilities.dataExport) return res.status(403).json({error:'Your plan does not include data export.'});
  let records=await readRecords(farmId);
  for(const key of ['flockId','category']) if(req.query[key]) records=records.filter(r=>(r[key]||'')===(req.query[key]==='farm-wide'?'':req.query[key]));
  const type=poultryTypeId(req.query.poultryType)||req.session.poultryTypeId||'all';
  if(type!=='all') records=records.filter(r=>poultryTypeId(r.poultryType)===type);
  if(req.query.from) records=records.filter(r=>r.date>=req.query.from);
  if(req.query.to) records=records.filter(r=>r.date<=req.query.to);
  if(req.query.search) records=records.filter(r=>JSON.stringify(r).toLowerCase().includes(String(req.query.search).toLowerCase()));
  const cell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
  const rows=[['Date','Farm ID','Flock ID','Poultry type','Category','Status','Summary','Recorded values','Created','Updated'],...records.map(r=>[r.date,r.farmId,r.flockId,r.poultryType,CATEGORIES.find(c=>c.id===r.category)?.label,r.status,recordSummary(r),JSON.stringify(r.values),r.createdAt,r.updatedAt])];
  res.set({'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="daily-farm-records.csv"'}).send('\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n'));
}));
router.get('/:id/audit',wrap(async(req,res)=>{
  const farmId=req.query.farmId||req.session.farmId;
  await authorizeFarm(req.session,farmId);
  const [rows]=await pool.query('SELECT action,actor_id AS actorId,before_values AS beforeValues,after_values AS afterValues,created_at AS createdAt FROM daily_record_audit WHERE record_id=? AND farm_id=? ORDER BY id DESC',[req.params.id,farmId]);
  res.json(rows);
}));
router.post('/',wrap(async(req,res)=>res.status(201).json(await mutateRecord(req.session,req.body))));
router.put('/:id',wrap(async(req,res)=>res.json(await mutateRecord(req.session,req.body,{id:req.params.id}))));
router.delete('/:id',wrap(async(req,res)=>res.json(await mutateRecord(req.session,req.body,{id:req.params.id,remove:true}))));
export default router;

import 'dotenv/config';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {localDate} from '../../shared/dailyRecords.js';
import {poultryTypeId,restoreSelection,selectionKey,scopeFarmData} from '../../shared/poultryScope.js';
const schema=`poultrypro_scope_test_${randomUUID().replaceAll('-','')}`;
assert.match(schema,/^poultrypro_scope_test_[a-f0-9]{32}$/);
const root=await mysql.createConnection({host:process.env.DB_HOST||'localhost',user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',multipleStatements:true});
process.env.DB_NAME=schema;process.env.JWT_SECRET=randomUUID();
let pool,server,checks=0;
const check=(condition,label)=>{assert.ok(condition,label);checks++;console.log('PASS '+label);};
try{
  await root.query((await readFile(new URL('../scripts/init_db.sql',import.meta.url),'utf8')).replaceAll('poultrypro_db',schema));
  pool=(await import('../config/db.js')).default;
  const app=express();app.use(cors());app.use(express.json());
  app.use('/api',(await import('../routes/subscriptionRoutes.js')).default);
  app.use('/api/daily-records',(await import('../routes/dailyRecordRoutes.js')).default);
  app.use('/api',(await import('../routes/apiRoutes.js')).default);
  server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  const apiBase=`http://127.0.0.1:${server.address().port}/api`;
  const call=async(path,token,{method='GET',body,headers={}}={})=>{
    const response=await fetch(apiBase+path,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token||''}`,...headers},...(body?{body:JSON.stringify(body)}:{})});
    const data=await response.json();return {status:response.status,data};
  };
  const register=async(email,types)=>{
    const r=await call('/auth/register','',{method:'POST',body:{fullName:'Scope Farmer',farmName:email==='scope@example.test'?'Mixed Poultry Farm':'Second Farm',email,password:'scope-test-password',planId:'enterprise',billingCycle:'monthly',poultryTypes:types}});
    assert.equal(r.status,201,JSON.stringify(r.data));return r.data;
  };
  const farmer=await register('scope@example.test',['broilers','layers','turkeys','cockerels','ducks']);
  const second=await register('second-scope@example.test',['turkeys','layers']);
  const stranger=await register('stranger-scope@example.test',['broilers']);
  const today=localDate(),flocks={};
  const stock=await call('/feed',farmer.token,{method:'POST',body:{name:'Shared Feed',type:'Grower',quantityBags:100,bagWeightKg:25,unitPrice:100,supplier:'Farm'}});
  assert.equal(stock.status,201,JSON.stringify(stock.data));
  const record=async(id,category,values,extra={})=>{
    const r=await call('/daily-records',farmer.token,{method:'POST',body:{farmId:farmer.user.farmId,flockId:flocks[id]?.id||null,date:today,category,requestKey:randomUUID(),values,...extra}});
    assert.equal(r.status,201,JSON.stringify(r.data));return r.data;
  };
  for(const [index,type] of ['Broiler','Layer','Turkey','Cockerel'].entries()){
    const id=poultryTypeId(type),r=await call('/flocks',farmer.token,{method:'POST',body:{name:`${type} Distinct Batch`,type,initialBirds:100+index*100,costPerBird:0,dateAcquired:today}});
    assert.equal(r.status,201,JSON.stringify(r.data));flocks[id]=r.data;
    await record(id,'mortality',{count:index+1,cause:'Unknown'});
    await record(id,'feed',{feedId:stock.data.id,feedType:'Grower',supplied:10+index*10,remaining:0,unit:'kg'});
    await record(id,'expenses',{expenseCategory:'Labour',description:`${type} work`,amount:100+index*100,paymentMethod:'Cash'});
    await record(id,'sales',{product:'Manure',quantity:1,unitPrice:1000+index*1000,amountReceived:1000+index*1000,paymentMethod:'Cash'});
    await record(id,'health',{recordType:'Routine Health Check',birdsTreated:10,reason:`${type} inspection`,administeredBy:'Farm staff'});
    await record(id,'water',{supplied:40+index,remaining:0});
    if(type!=='Layer') await record(id,'weight',{sampleSize:10,totalWeightKg:(1+index)*10,measurement:'Sample'});
  }
  await record('layers','eggs',{totalEggs:60,crackedEggs:1,brokenEggs:1,otherUnsellable:0,layingHens:100});
  for(const id of Object.keys(flocks)){
    const headers={'X-Poultry-Type':id};
    const scoped=await call('/flocks',farmer.token,{headers});
    check(scoped.status===200&&scoped.data.length===1&&scoped.data[0].id===flocks[id].id,`${id} backend flock filtering`);
    for(const path of ['/mortality','/expenses','/sales']){
      const rows=await call(path,farmer.token,{headers});
      check(rows.status===200&&rows.data.length===1&&rows.data.every(r=>r.flockId===flocks[id].id),`${id} ${path} filtering`);
    }
    const daily=await call('/daily-records',farmer.token,{headers});
    check(daily.status===200&&daily.data.flocks.length===1&&daily.data.records.every(r=>r.flockId===flocks[id].id),`${id} daily records, weights, feed and health stay separated`);
  }
  const wrong=await call('/daily-records',farmer.token,{method:'POST',headers:{'X-Poultry-Type':'turkeys'},body:{farmId:farmer.user.farmId,flockId:flocks.broilers.id,date:today,category:'mortality',requestKey:randomUUID(),values:{count:1,cause:'Unknown'}}});
  check(wrong.status===403,'Turkey form cannot submit a Broiler flock');
  const attributed=await record(null,'expenses',{expenseCategory:'Water',description:'Turkey water supply',amount:25,paymentMethod:'Cash'},{poultryType:'turkeys'});
  check(attributed.poultryType==='Turkey','Farm-wide poultry attribution uses canonical names');
  const turkeyCosts=await call('/expenses',farmer.token,{headers:{'X-Poultry-Type':'turkeys'}});
  check(turkeyCosts.data.length===2,'Type-attributed farm-wide expense stays with Turkey');
  check((await call('/flocks',farmer.token,{headers:{'X-Farm-Id':second.user.farmId}})).status===403,'Farm header cannot access an ungranted farm');
  await pool.query('INSERT INTO farm_record_access(user_id,farm_id) VALUES (?,?)',[farmer.user.id,second.user.farmId]);
  const otherFlock=await call('/flocks',second.token,{method:'POST',body:{name:'Other Turkey Batch',type:'Turkey',initialBirds:20,costPerBird:0,dateAcquired:today}});
  assert.equal(otherFlock.status,201,JSON.stringify(otherFlock.data));
  const secondData=await call('/flocks',farmer.token,{headers:{'X-Farm-Id':second.user.farmId,'X-Poultry-Type':'turkeys'}});
  check(secondData.status===200&&secondData.data.length===1&&secondData.data[0].id===otherFlock.data.id,'Authorized farm switch filters every module against the new farm');
  check((await call('/auth/session',farmer.token,{headers:{'X-Farm-Id':second.user.farmId}})).data.user.farmId===farmer.user.farmId,'Farm switching does not alter the authenticated owner identity');
  check(restoreSelection('turkeys',['broilers','turkeys'])==='turkeys','Valid Turkey preference survives asynchronous loading');
  check(restoreSelection('turkeys',['layers'])==='layers','Invalid preference clears to a valid type');
  check(selectionKey(farmer.user.id,farmer.user.farmId)!==selectionKey(stranger.user.id,stranger.user.farmId),'Preferences are isolated by authenticated user and farm');
  const all=(await call('/daily-records',farmer.token)).data;
  check(scopeFarmData({...all,sales:[],expenses:[],dailyRecords:all.records},'turkeys').flocks.every(f=>f.type==='Turkey'),'Client and backend share the same canonical type mapping');
  if(process.argv.includes('--browser')){
    const {checkPoultryScopeBrowser}=await import('../../scripts/check_poultry_scope_browser.mjs');
    await checkPoultryScopeBrowser({apiBase,farmer,second,stranger,flocks,adminToken:jwt.sign({sub:'scope-admin',role:'admin'},process.env.JWT_SECRET)});
  }
  console.log(`PASS ${checks} poultry selection and data isolation checks`);
}finally{
  if(server)await new Promise(resolve=>server.close(resolve));if(pool)await pool.end();
  await root.query(`DROP DATABASE IF EXISTS \`${schema}\``);await root.end();
}

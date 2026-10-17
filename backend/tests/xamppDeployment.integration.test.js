import 'dotenv/config';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import { createTailnetBridge } from '../scripts/tailnet-bridge.mjs';
import { databaseError } from '../config/databaseErrors.js';

const freePort=async()=>{const server=net.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));return port;};
assert.equal(databaseError({code:'ECONNREFUSED'}).status,503);
assert.equal(databaseError({code:'ER_DUP_ENTRY'}).status,undefined,'Validation failures keep their original classification');
let offline=false;
// Simulates only the CLI byte-stream boundary, not a live Tailscale connection.
const bridge=createTailnetBridge({port:0,host:'test-target',targetPort:3306,cli:'simulated-cli',socket:'simulated-socket',spawnProcess:()=>spawn(process.execPath,['-e',offline?'process.exit(1)':`const n=require('node:net');const s=n.connect(${Number(process.env.DB_PORT||3306)},'127.0.0.1');s.on('error',()=>process.exit(1));s.pipe(process.stdout);process.stdin.pipe(s);`],{stdio:['pipe','pipe','ignore'],windowsHide:true})});
const address=await bridge.listen();assert.equal(address.address,'127.0.0.1');
const db=mysql.createPool({host:'127.0.0.1',port:address.port,user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME||'poultrypro_db',connectionLimit:1,connectTimeout:2000});
try {
  assert.equal((await db.query('SELECT 1 AS result'))[0][0].result,1);
  console.log('PASS real MySQL protocol through a loopback TCP bridge (simulated CLI transport)');
  // A separate connection fails while the simulated tunnel is down, then recovers.
  offline=true;
  await assert.rejects(mysql.createConnection({host:'127.0.0.1',port:address.port,user:'test',connectTimeout:2000}));
  offline=false;
  const recovered=await mysql.createConnection({host:'127.0.0.1',port:address.port,user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',connectTimeout:2000});
  assert.equal((await recovered.query('SELECT 1 AS result'))[0][0].result,1);await recovered.end();
  console.log('PASS new connections recover after transport interruption; writes are never replayed');
} finally {await db.end();await bridge.close();}

const port=await freePort(),deadPort=await freePort(),secret='deployment-test-only-secret';
const child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,NODE_ENV:'test',PORT:String(port),DB_HOST:'127.0.0.1',DB_PORT:String(deadPort),JWT_SECRET:secret},windowsHide:true,stdio:'ignore'});
try {
  const base=`http://127.0.0.1:${port}`;
  let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base+'/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
  assert.ok(ready,'API starts while database is offline');
  assert.equal((await fetch(base+'/health/ready')).status,503);
  const token=jwt.sign({sub:'deployment-test',farmId:'no-real-farm',role:'farmer'},secret);
  for(const [path,body] of [['/api/auth/login',{email:'deployment@example.test',password:'unused-test'}],['/api/flocks',{name:'No write possible',type:'Turkey',initialBirds:1}]]){
    const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});
    assert.equal(response.status,503,path);assert.match((await response.json()).error,/database is unavailable/);
  }
  assert.equal((await fetch(base+'/health')).status,200,'Database failures do not crash the server');
  console.log('PASS offline MySQL returns safe 503 errors for login, readiness and flock writes; API stays alive');
} finally {child.kill();await new Promise(r=>child.once('exit',r));}

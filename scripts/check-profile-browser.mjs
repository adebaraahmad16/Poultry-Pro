import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { fixtureBrowser } from './fixtures/browser.js';

const output=resolve('.ui-checks/profile-browser');await mkdir(output,{recursive:true});
let persisted=null;
const source=`
import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter,Routes,Route,useNavigate}from'react-router-dom';
import{AuthProvider,useAuth}from'./src/context/AuthContext.jsx';import{ToastProvider}from'./src/context/ToastContext.jsx';import{ConfirmProvider}from'./src/context/ConfirmContext.jsx';
import MainLayout from './src/components/layout/MainLayout.jsx';import Settings from './src/pages/settings/Settings.jsx';import './src/index.css';
import{dashboardDatabase}from'./scripts/fixtures/dashboardDatabase.js';
const stored=await(await fetch('/fixture-state')).json();globalThis.__dashboardDB=dashboardDatabase(stored||{});
globalThis.__farm={farm:{id:'farm-a',name:'First Farm',poultryTypes:['Broilers']},activeTypeId:'all',selectedFarmId:'farm-a',dataLoading:false,dataError:'',refreshAllData:async()=>{},flocks:[],metrics:{},workers:[],notifications:[],customers:[],sales:[],expenses:[],feeds:[],currentPlan:{name:'Basic',limits:{maxFlocks:3,maxBirds:500}},currentPlanId:'BASIC',updatePlan:async()=>{}};
function TestRoutes(){const auth=useAuth();globalThis.__auth=auth;globalThis.__navigate=useNavigate();if(auth.loading)return <p>Loading</p>;if(!auth.user)return <p id="signed-out">Signed out</p>;return <Routes><Route element={<MainLayout/>}><Route path="/settings/*" element={<Settings/>}/>{['dashboard','health/mortality','management/tasks'].map(path=><Route key={path} path={'/'+path} element={<section style={{minHeight:1600}}><h1>{path}</h1></section>}/>)}</Route></Routes>}
createRoot(document.getElementById('root')).render(<BrowserRouter><ToastProvider><ConfirmProvider><AuthProvider><TestRoutes/></AuthProvider></ConfirmProvider></ToastProvider></BrowserRouter>);
`;
await build({stdin:{contents:source,loader:'jsx',resolveDir:process.cwd()},bundle:true,format:'esm',target:'es2022',outfile:output+'/app.js',define:{'import.meta.env':JSON.stringify({VITE_SUPABASE_URL:'https://fixture.supabase.invalid'})},plugins:[{name:'isolated-profile',setup(builder){
  builder.onLoad({filter:/lib[\\/]supabaseClient\.js$/},()=>({contents:'export const supabase={get supabaseUrl(){return globalThis.__dashboardDB.supabaseUrl;},auth:new Proxy({},{get:(_o,k)=>(...a)=>globalThis.__dashboardDB.auth[k](...a)}),storage:{from:(...a)=>globalThis.__dashboardDB.storage.from(...a)},from:(...a)=>globalThis.__dashboardDB.from(...a),rpc:(...a)=>globalThis.__dashboardDB.rpc(...a)};export const isSupabaseConfigured=()=>true;export default supabase;',loader:'js'}));
  builder.onLoad({filter:/context[\\/]FarmContext\.jsx$/},()=>({contents:'export const useFarm=()=>globalThis.__farm;export const useRawFarm=useFarm;export const usePoultryData=()=>({selectedTypeIds:["broilers"]});',loader:'js'}));
  builder.onLoad({filter:/layout[\\/]PoultrySelector\.jsx$|common[\\/]TrialBanner\.jsx$/},()=>({contents:'export default function FixtureUnrelatedSelector(){return null}',loader:'jsx'}));
  builder.onLoad({filter:/services[\\/]farmScope\.js$/},()=>({contents:'export const getSelectedFarmId=()=>globalThis.__farm?.selectedFarmId;export const getSelectedPoultryType=()=>"all";',loader:'js'}));
}}]});
await writeFile(output+'/app.css',(await postcss([tailwind(),autoprefixer()]).process(await readFile(output+'/app.css','utf8'),{from:output+'/app.css'})).css);
const server=createServer(async(req,res)=>{
  const path=req.url.split('?')[0];
  if(path==='/fixture-state'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(persisted));return;}
  if(path==='/app.js'||path==='/app.css'){res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':'text/css');res.end(await readFile(output+path));return;}
  res.setHeader('Content-Type','text/html');res.end('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await fixtureBrowser(output+'/chrome-profile');const{command,evaluate,wait,pause}=browser;const checks=[];
try{
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await command('Page.navigate',{url:origin+'/settings/profile'});await wait('globalThis.__auth?.user && document.querySelector("main form")');
  await evaluate(`globalThis.__setInput=(selector,value)=>{const el=document.querySelector(selector);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));};`);
  assert.equal(await evaluate('__auth.user.full_name'),'First Farmer');
  assert.equal(await evaluate('__dashboardDB.state.calls.filter(c=>c.table==="profiles"&&c.action==="select").length'),1,'Only one initial profile fetch');
  await evaluate(`__setInput('main form input[type="text"]','Updated Farmer Name');`);
  await pause(25);await evaluate(`__dashboardDB.state.writeDelay=200;document.querySelector('main form').requestSubmit();document.querySelector('main form').requestSubmit();`);
  await pause(40);assert.equal(await evaluate('document.querySelector("main form button[type=submit]").disabled'),true);
  assert.ok(!(await evaluate('document.querySelector("header").textContent')).includes('Updated Farmer Name'),'Do not publish the name before the database responds');
  await wait('__auth.user.full_name==="Updated Farmer Name"');assert.ok((await evaluate('document.querySelector("header").textContent')).includes('Updated Farmer Name'));
  assert.equal(await evaluate('__dashboardDB.state.calls.filter(c=>c.table==="profiles"&&c.action==="update").length'),1,'Duplicate form submission must not duplicate the write');checks.push('confirmed profile save and immediate header synchronization');
  await evaluate(`__dashboardDB.state.writeDelay=0;__dashboardDB.state.failure={table:'profiles',action:'update',message:'Permission denied test'};__setInput('main form input[type="text"]','Unsaved Draft');`);await pause(20);await evaluate(`document.querySelector('main form').requestSubmit()`);
  await wait('document.querySelector("main [role=alert]")');assert.equal(await evaluate('document.querySelector("main form input[type=text]").value'),'Unsaved Draft');assert.equal(await evaluate('__auth.user.full_name'),'Updated Farmer Name');checks.push('failed writes preserve draft and header');
  await evaluate('__dashboardDB.state.failure=null;__dashboardDB.state.profileReadDelay=200;globalThis.__oldRefresh=__auth.refreshProfile();void 0;');
  await pause(25);await evaluate('__auth.updateProfile({full_name:"Newest Farmer Name"})');await evaluate('__oldRefresh');assert.equal(await evaluate('__auth.user.full_name'),'Newest Farmer Name');await evaluate('__dashboardDB.state.profileReadDelay=0');checks.push('stale refresh cannot overwrite a newer save');
  persisted=await evaluate('({rows:__dashboardDB.state.rows,userId:__dashboardDB.state.userId})');
  await evaluate('localStorage.clear()');const reloadIndex=browser.events.length;await command('Page.reload');for(let i=0;i<100&&!browser.events.slice(reloadIndex).some(e=>e.method==='Page.loadEventFired');i++)await pause(50);await wait('globalThis.__auth?.user?.full_name==="Newest Farmer Name"');checks.push('reload restores profile from the server fixture without a browser profile cache');
  // Desktop sidebar is the same node after a route change, with its own scroll preserved.
  await evaluate(`globalThis.__sidebar=document.querySelector('.farmer-workspace > aside [data-sidebar-scroll]');__sidebar.scrollTop=400;document.querySelector('main').scrollTop=300;`);await pause(30);
  const scroll=await evaluate('__sidebar.scrollTop');await evaluate(`__sidebar.querySelector('a[href="/health/mortality"]').click()`);await wait('location.pathname==="/health/mortality"');
  assert.equal(await evaluate('__sidebar===document.querySelector(".farmer-workspace > aside [data-sidebar-scroll]")'),true);assert.equal(await evaluate('__sidebar.scrollTop'),scroll);assert.equal(await evaluate('document.querySelector("main").scrollTop'),0);checks.push('persistent desktop sidebar and independent main scroll');
  for(const width of [320,375,425,768,1024,1280,1440]){
    await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await evaluate(`__navigate('/settings/profile')`);await pause(60);
    const sizes=await evaluate('({width:innerWidth,page:document.documentElement.scrollWidth,main:document.querySelector("main").clientWidth,scroll:document.querySelector("main").scrollWidth})');assert.ok(sizes.page<=width+1&&sizes.scroll<=sizes.main+1,JSON.stringify(sizes));
    if(width<1024){await evaluate(`document.querySelector('[aria-label="Toggle Navigation Menu"]').click()`);await wait(`document.querySelector('[aria-label="Farmer navigation"]')`);
      await evaluate(`globalThis.__mobileScroll=document.querySelector('[aria-label="Farmer navigation"] [data-sidebar-scroll]');__mobileScroll.scrollTop=400;`);await pause(30);const position=await evaluate('__mobileScroll.scrollTop');
      await evaluate(`__mobileScroll.querySelector('a[href="/health/mortality"]').click()`);await wait(`!document.querySelector('[aria-label="Farmer navigation"]')`);
      await evaluate(`document.querySelector('[aria-label="Toggle Navigation Menu"]').click()`);await pause(40);assert.equal(await evaluate(`document.querySelector('[aria-label="Farmer navigation"] [data-sidebar-scroll]').scrollTop`),position);await evaluate(`document.querySelector('[aria-label="Close navigation"]').click()`);
    }
  }checks.push('all seven farmer widths and mobile drawer scroll after reopening');
  await evaluate(`__dashboardDB.state.writeDelay=200;globalThis.__oldSave=__auth.updateProfile({full_name:'Previous account late save'}).catch(e=>e.message);void 0`);await pause(30);await evaluate('__auth.logout()');await wait('!__auth.user');
  await evaluate(`__auth.login('farmer-b@example.invalid','fixture-password')`);await wait('__auth.user?.id==="farmer-b"');await evaluate('__oldSave');assert.equal(await evaluate('__auth.user.full_name'),'Second Farmer');checks.push('logout/account switch rejects stale profile results');
  const errors=browser.events.filter(e=>e.method==='Runtime.exceptionThrown');assert.equal(errors.length,0,JSON.stringify(errors));
  await writeFile(output+'/results.json',JSON.stringify(checks,null,2));console.log('PASS '+checks.join('; ')+'. Isolated Supabase fixtures; no live records changed.');
}finally{await browser.close();server.close();}


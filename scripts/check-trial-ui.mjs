import { build } from 'esbuild';
import postcss from 'postcss';import tailwind from 'tailwindcss';import autoprefixer from 'autoprefixer';
import {mkdir,readFile,writeFile} from 'node:fs/promises';import {createServer} from 'node:http';import {resolve} from 'node:path';import assert from 'node:assert/strict';
import {fixtureBrowser} from './fixtures/browser.js';
const output=resolve('.ui-checks/trial-ui');await mkdir(output,{recursive:true});
await build({stdin:{contents:`
import React,{useState}from'react';import{createRoot}from'react-dom/client';import{BrowserRouter,useLocation}from'react-router-dom';
import TrialBanner from './src/components/common/TrialBanner.jsx';import NotificationsPage from './src/pages/notifications/NotificationsPage.jsx';import Monitor from './src/admin/components/TrialReminderMonitor.jsx';import{ToastProvider}from'./src/context/ToastContext.jsx';import{ConfirmProvider}from'./src/context/ConfirmContext.jsx';import './src/index.css';import './src/admin/admin.css';
const expiration=new Date(Date.now()+7*86400000-60000).toISOString();
const notification={id:'reminder-7',userId:'farmer-test',farmId:'farm-test',title:'7 Days Left on Your Free Trial',message:'Your PoultryPro free trial will expire in 7 days.',type:'warning',category:'free_trial',isRead:false,read:false,createdAt:new Date().toISOString(),actionUrl:'/settings/subscription'};
globalThis.__farm={subscription:{status:'trial',trialEndsAt:expiration,trialUsed:true},subscriptionFromDatabase:true,isTrial:true,isSubscriptionExpired:false,currentPlan:{name:'Basic'},notifications:[notification],user:{id:'farmer-test'},refreshAllData:async()=>{}};
globalThis.__reminders=[{id:'delivery-test',farmer_name:'Farmer With A Long Name',farm_id:'farm-test',event_type:'trial_reminder',milestone:7,trial_started_at:new Date(Date.now()-7*86400000).toISOString(),trial_expires_at:expiration,dashboard_status:'created',email_status:'retry',attempts:2,last_attempt_at:new Date().toISOString(),last_error:'Email provider rejected request (503)',created_at:new Date().toISOString()}];
function App(){const[,rerender]=useState(0);globalThis.__rerender=()=>rerender(n=>n+1);const location=useLocation();return <ToastProvider><ConfirmProvider><div className={location.pathname==='/admin-trials'?'admin-workspace p-3':'p-3'}>{location.pathname==='/admin-trials'?<Monitor/>:location.pathname==='/notifications'?<NotificationsPage/>:location.pathname==='/settings/subscription'?<h1>Subscription plans</h1>:<TrialBanner/>}</div></ConfirmProvider></ToastProvider>};createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);
`,loader:'jsx',resolveDir:process.cwd()},bundle:true,format:'esm',outfile:output+'/app.js',plugins:[{name:'trial-fixtures',setup(b){
 b.onLoad({filter:/context[\\/]FarmContext\.jsx$/},()=>({contents:'export const useFarm=()=>globalThis.__farm;',loader:'js'}));
 b.onLoad({filter:/lib[\\/]supabaseClient\.js$/},()=>({contents:`export const isSupabaseConfigured=()=>true;export const supabase={from:()=>{const query={select:()=>query,order:()=>query,range:async()=>({data:globalThis.__reminders,count:globalThis.__reminders.length,error:null})};return query;}};`,loader:'js'}));
 b.onLoad({filter:/services[\\/]notificationStore\.js$/},()=>({contents:'export const markNotificationAsRead=async()=>{};export const markAllNotificationsAsRead=async()=>{};export const deleteNotification=async()=>{};export const clearReadNotifications=async()=>{};',loader:'js'}));
}}]});
await writeFile(output+'/app.css',(await postcss([tailwind(),autoprefixer()]).process(await readFile(output+'/app.css','utf8'),{from:output+'/app.css'})).css);
const server=createServer(async(req,res)=>{const path=req.url.split('?')[0];if(['/app.js','/app.css'].includes(path)){res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':'text/css');res.end(await readFile(output+path));}else res.end('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await fixtureBrowser(output+'/chrome-profile');const {command,evaluate,wait,pause}=browser;let checks=0;
try{
 for(const width of [320,375,425,768,1024,1280,1440])for(const route of ['/dashboard','/notifications','/admin-trials']){
  await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
  await command('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+route});
  await wait(route==='/dashboard'?'document.querySelector("[role=progressbar]")':route==='/notifications'?'document.body.textContent.includes("7 Days Left on Your Free Trial")':'document.body.textContent.includes("Email provider rejected request")');
  await pause(50);assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`${route} overflow at ${width}`);
  if(route==='/dashboard'){assert.equal(await evaluate('document.querySelector("[role=progressbar]").getAttribute("aria-valuenow")'),'7');assert.ok((await evaluate('document.body.textContent')).includes('UTC'));assert.equal(await evaluate('document.querySelector("a").getAttribute("href")'),'/settings/subscription');}
  if(route==='/notifications')assert.ok((await evaluate('document.body.textContent')).includes('Upgrade Now'));
  if(route==='/admin-trials')assert.ok((await evaluate('document.body.textContent')).includes('retry'));
  const screenshot=await command('Page.captureScreenshot',{format:'png'});await writeFile(output+'/'+route.slice(1)+'-'+width+'.png',Buffer.from(screenshot.data,'base64'));checks++;
 }
 await command('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/dashboard'});await wait('document.querySelector("[role=progressbar]")');
 await evaluate('__farm.subscriptionFromDatabase=false;__rerender()');await pause(50);assert.equal(await evaluate('Boolean(document.querySelector("[role=progressbar]"))'),false,'Never show a cache-only countdown');
 await evaluate('__farm.subscriptionFromDatabase=true;__farm.subscription.status="active";__farm.isTrial=false;__rerender()');await pause(50);assert.equal(await evaluate('Boolean(document.querySelector("[role=progressbar]"))'),false,'Paid activation hides countdown');
 assert.equal(browser.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);
 console.log('PASS '+checks+' trial countdown, notification and admin delivery views across seven widths; database-only countdown and paid activation visibility. Isolated fixtures only.');
}finally{await browser.close();server.close();}

// Isolated browser fixtures: actual admin components, no authentication bypass in the app,
// no network database access, and no writes to real administrator or farmer records.
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const output = resolve('.ui-checks/admin-responsive');
await mkdir(output, { recursive: true });
const pages = {
  dashboard: 'Dashboard', farmers: 'Farmers', farms: 'Farms', 'poultry-types': 'PoultryTypes',
  subscriptions: 'Subscriptions', payments: 'Payments', revenue: 'RevenueAnalytics',
  'contact-messages': 'ContactMessages', notifications: 'Notifications', support: 'Support',
  reports: 'Reports', 'website-content': 'WebsiteContent', administrators: 'AdminManagement',
  'audit-logs': 'AuditLogs', settings: 'Settings', health: 'PlatformHealth', profile: 'AdminProfile',
};
const fixture = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,useNavigate} from 'react-router-dom';
import AdminLayout from './src/admin/components/AdminLayout.jsx';
import {ContactProvider} from './src/admin/context/ContactContext.jsx';
import {ToastProvider} from './src/context/ToastContext.jsx';
import {ConfirmProvider} from './src/context/ConfirmContext.jsx';
import {DEFAULT_PLANS,presentPlan} from './shared/subscriptionPlans.js';
import {initialPlatformSettings,initialWebsiteContent,initialSubscriptionSettings,initialPoultryCategories} from './src/admin/services/adminMockData.js';
import './src/index.css';
${Object.values(pages).map(name => `import ${name} from './src/admin/pages/${name}.jsx';`).join('\n')}
const noop=async()=>{};
const now=new Date().toISOString();
const farmers=Array.from({length:31},(_,i)=>({id:'farmer-'+i,fullName:'Responsive Farmer '+i,email: i===0?'a-very-long-farmer-email-address-for-layout-testing@example.invalid':'farmer'+i+'@example.invalid',phone:'+2348000000000',location:'Ilorin, Kwara',farmName:'Poultry Farm '+i,businessName:'Poultry Farm '+i,poultryTypes:['Broilers','Layers'],subscription:['Basic','Pro','Enterprise'][i%3],planId:['basic','professional','enterprise'][i%3],status:'Active',subscriptionStatus:i%4===0?'Trial':'Active',farmsCount:2,totalBirds:25000,billingCycle:i%2?'Annual':'Monthly',dateJoined:now,subscriptionStartDate:now,subscriptionExpiry:new Date(Date.now()+86400000*30).toISOString(),trialEndsAt:new Date(Date.now()+86400000*7).toISOString()}));
const plans=DEFAULT_PLANS.map(p=>presentPlan(p,DEFAULT_PLANS));
const payments=farmers.map((f,i)=>({id:'TXN-VERY-LONG-REFERENCE-'+i+'-123456789',farmerId:f.id,farmerName:f.fullName,email:f.email,plan:f.subscription,amount:15000,status:i%3?'Successful':'Pending',date:now,createdAt:now,billingCycle:f.billingCycle,paymentMethod:'Card',gateway:'Paystack',reference:'REF-'+i}));
const admin={id:'admin-test',name:'Responsive Administrator',email:'administrator@example.invalid',phone:'00000000000',role:'Super Admin',status:'Active',avatar:null,lastLogin:now};
globalThis.__adminFixture={currentAdmin:admin,isAdminLoggedIn:true,supabaseAdminReady:true,loading:false,dataError:'',farmers,payments,subscriptionPlans:plans,farms:farmers.slice(0,7).map(f=>({id:'farm-'+f.id,name:f.farmName,farmerName:f.fullName,ownerName:f.fullName,location:f.location,poultryTypes:f.poultryTypes,totalBirds:25000,totalFlocks:12,status:'Active',dateCreated:now})),categories:initialPoultryCategories,adminStaff:[admin,{...admin,id:'other-admin',name:'Support Administrator',role:'Support Admin'}],notifications:[{id:'broadcast-1',title:'Important farm announcement',message:'A longer notification message for responsive display.',priority:'Important Notice',targetAudience:'All Farmers',recipientCount:31,recipients:31,dateSent:now,status:'Sent',category:'System Announcements'}],tickets:[{id:'ticket-1',farmerId:farmers[0].id,farmerName:farmers[0].fullName,farmerEmail:farmers[0].email,subject:'Help with account registration and subscriptions',message:'Please help with my account.',priority:'High',status:'Open',dateCreated:now,replies:[]}],auditLogs:[{id:'audit-1',adminName:admin.name,adminEmail:admin.email,action:'Updated settings',details:'Test record with a long reference '+ 'x'.repeat(80),timestamp:now,date:now,category:'System',ipAddress:'127.0.0.1'}],platformSettings:initialPlatformSettings,cmsContent:initialWebsiteContent,subscriptionSettings:initialSubscriptionSettings,starterFarmers:farmers.filter(f=>f.planId==='basic'),professionalFarmers:farmers.filter(f=>f.planId==='professional'),enterpriseFarmers:farmers.filter(f=>f.planId==='enterprise'),trialFarmers:farmers.filter(f=>f.subscriptionStatus==='Trial'),poultryDistribution:[{type:'Broilers',farms:12},{type:'Layers',farms:8}],registrationTrend:[{month:'Sep',farmers:20,revenue:250000},{month:'Oct',farmers:31,revenue:750000}],metrics:new Proxy({totalRevenue:123456789.5},{get:(o,k)=>o[k]??31}),getFarmerSubscriptionStatus:()=>false,normalisePlanId:p=>p,logoutAdmin:noop,refreshAllAdminData:noop,updateFarmerStatus:noop,sendNotification:noop,updateSubscriptionPlan:noop,updateFarmerSubscription:noop,updateSubscriptionSettings:noop,verifyPayment:noop,replyToTicket:noop,updateTicketStatus:noop,toggleCategoryStatus:noop,addAdminStaff:noop,toggleAdminStatus:noop,updateSettings:noop,updateCmsContent:noop,updateAdminProfile:noop};
globalThis.__contactRecords=['new','in_progress','resolved'].flatMap((status,i)=>[false,true].map((is_read,j)=>({id:'contact-'+i+'-'+j,full_name:'Contact Farmer '+i,email:'long-contact-address-for-responsive-testing@example.invalid',phone:'00000000000',subject:'Technical Support',message:'Detailed enquiry '.repeat(150),status,is_read,created_at:now})));
const alerts=[{id:'alert-1',category:'contact',title:'New Contact Enquiry',message:'A new technical support enquiry has been received.',is_read:false,related_entity_id:'contact-0-0',created_at:now}];
globalThis.__db={from(table){let rows=table==='contact_messages'?globalThis.__contactRecords:table==='notifications'?alerts:[];let filters=[],start=0,end=999,patch,single=false,head=false;
const q={select(_s,o){head=o?.head;return q},eq(k,v){filters.push(r=>r[k]===v);return q},gte(k,v){filters.push(r=>r[k]>=v);return q},lt(k,v){filters.push(r=>r[k]<v);return q},or(){return q},order(){return q},range(a,b){start=a;end=b;return q},update(p){patch=p;return q},single(){single=true;return q},then(resolve,reject){const matched=rows.filter(r=>filters.every(f=>f(r)));if(patch)matched.forEach(r=>Object.assign(r,patch));return Promise.resolve({data:head?null:single?{...matched[0]}:matched.slice(start,end+1).map(r=>({...r})),count:matched.length,error:null}).then(resolve,reject)}};return q}};
function Navigation(){globalThis.__navigate=useNavigate();return null;}
createRoot(document.getElementById('root')).render(<BrowserRouter><ToastProvider><ConfirmProvider><ContactProvider><Navigation/><Routes><Route element={<AdminLayout/>}>${Object.entries(pages).map(([path,name])=>`<Route path='/admin/${path}' element={<${name}/>}/>`).join('')}</Route></Routes></ContactProvider></ConfirmProvider></ToastProvider></BrowserRouter>);
`;
await build({ stdin: { contents: fixture, loader: 'jsx', resolveDir: process.cwd() }, bundle: true, outfile: output + '/app.js', format: 'esm', define: { 'import.meta.env': JSON.stringify({ DEV: true }) }, plugins: [{ name: 'isolated-admin-fixtures', setup(builder) {
  builder.onLoad({ filter: /admin[\\/]context[\\/]AdminContext\.jsx$/ }, () => ({ contents: 'export const useAdmin=()=>globalThis.__adminFixture;', loader: 'js' }));
  builder.onLoad({ filter: /context[\\/]AuthContext\.jsx$/ }, () => ({ contents: "export const useAuth=()=>({user:{...globalThis.__adminFixture.currentAdmin,full_name:globalThis.__adminFixture.currentAdmin.name,avatar_url:''},loading:false,profileSaving:false,updateProfile:async()=>{},uploadAvatar:async()=>{}});", loader:'js' }));
  builder.onLoad({ filter: /lib[\\/]supabaseClient\.js$/ }, () => ({ contents: 'export const supabase={auth:{getUser:async()=>({data:{user:{id:"admin-test"}}}),getSession:async()=>({data:{session:{user:{id:"admin-test"},access_token:"fixture-admin"}}})},rpc:async()=>({data:true,error:null}),from:(...args)=>globalThis.__db.from(...args)};export const isSupabaseConfigured=()=>false;export default supabase;', loader: 'js' }));
  builder.onLoad({ filter: /usePlanCatalog\.js$/ }, () => ({ contents: "import {DEFAULT_PLANS,presentPlan} from '../../../shared/subscriptionPlans.js';export const usePlanCatalog=()=>({plans:DEFAULT_PLANS.map(p=>presentPlan(p,DEFAULT_PLANS)),loading:false,error:null,retry:()=>{}});", resolveDir: resolve('src/components/subscriptions'), loader: 'js' }));
} }] });
const css = await readFile(output + '/app.css', 'utf8');
await writeFile(output + '/app.css', (await postcss([tailwind(), autoprefixer()]).process(css, { from: output + '/app.css' })).css);
const server = createServer(async (req,res) => {
  try { const asset = req.url.split('?')[0];
    if (['/app.js','/app.css'].includes(asset)) { res.setHeader('Content-Type', asset.endsWith('.js') ? 'text/javascript' : 'text/css'); res.end(await readFile(output+asset)); }
    else {res.setHeader('Content-Type','text/html');res.end('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');}
  }catch{res.statusCode=500;res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+output+'/chrome-profile','about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
let stderr='';const endpoint=await new Promise((resolve,reject)=>{chrome.stderr.on('data',d=>{stderr+=d;const m=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m)resolve(m[1]);});chrome.on('error',reject);setTimeout(()=>reject(new Error('Chrome startup timed out: '+stderr)),15000).unref();});
const ws=new WebSocket(endpoint);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();const events=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}else events.push(m);});
const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params,sessionId}));});
let session;
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},session);if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const report=[];
try {
  const target=await send('Target.createTarget',{url:'about:blank'});
  session=(await send('Target.attachToTarget',{targetId:target.targetId,flatten:true})).sessionId;
  await send('Page.enable',{},session);await send('Runtime.enable',{},session);await send('Network.enable',{},session);
  await send('Network.setBlockedURLs',{urls:['https://*']},session);
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]},session);
  await send('Page.navigate',{url:url+'/admin/dashboard'},session);
  for(let i=0;i<100;i++){if(await evaluate('Boolean(globalThis.__navigate && document.querySelector("main"))'))break;await pause(100);}
  await evaluate(`globalThis.__setField=(el,value)=>{const prototype=el instanceof HTMLSelectElement?HTMLSelectElement.prototype:el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(el,value);el.dispatchEvent(new Event(el instanceof HTMLSelectElement?'change':'input',{bubbles:true}));};`);
  async function measure(label){await pause(70);const result=await evaluate(`({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,title:document.querySelector('main h1')?.textContent,main:!!document.querySelector('main'),dialogs:[...document.querySelectorAll('[role="dialog"]')].map(e=>{let r=e.getBoundingClientRect();return {left:r.left,right:r.right,height:r.height,scrollHeight:e.scrollHeight,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}})})`);report.push({label,...result});assert.ok(result.main,'Page did not render: '+label);assert.ok(result.scrollWidth<=result.width+1,'Horizontal overflow '+label+': '+JSON.stringify(result));for(const d of result.dialogs){assert.ok(d.scrollWidth<=d.clientWidth+1,'Dialog content overflow '+label+': '+JSON.stringify(d));assert.ok(d.left>=-1&&d.right<=result.width+1,'Dialog width '+label);assert.ok(d.height<=await evaluate('innerHeight')+1,'Dialog height '+label);}return result;}
  async function screenshot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},session);await writeFile(output+'/'+name+'.png',Buffer.from(r.data,'base64'));}
  const clickText = async text => evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('Missing button: '+${JSON.stringify(text)});b.focus();b.click();})()`);
  const closeDialog = async () => { await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'},session); await pause(60); };
  for(const [width,height] of [[320,900],[375,900],[425,900],[768,900],[1024,900],[1280,900],[1440,900],[900,425],[768,375]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false},session);
    for(const route of Object.keys(pages)){
      await evaluate(`globalThis.__navigate('/admin/${route}');window.scrollTo(0,0)`);
      await measure(route+'@'+width);
      if(['320:dashboard','375:farmers','1440:dashboard'].includes(width+':'+route))await screenshot(route+'-'+width);
    }
    if(width<1024){
      await evaluate(`document.querySelector('[aria-label="Open navigation"]').focus();document.querySelector('[aria-label="Open navigation"]').click()`);
      await measure('drawer@'+width);
      assert.equal(await evaluate('document.body.style.overflow'),'hidden');
      assert.equal(await evaluate("document.getElementById('admin-mobile-navigation').contains(document.activeElement)"),true);
      const navWidth=await evaluate("document.getElementById('admin-mobile-navigation').getBoundingClientRect().width");
      assert.ok(navWidth<=Math.min(width*.86,321));
      if(width===320)await screenshot('drawer-320');
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'},session);
      await pause(50);assert.equal(await evaluate("!!document.getElementById('admin-mobile-navigation')"),false);
      assert.notEqual(await evaluate('document.body.style.overflow'),'hidden');
    }
    await evaluate(`globalThis.__navigate('/admin/subscriptions')`);await pause(80);
    for(const tab of ['plans','subscribers','trials','settings']){
      await evaluate(`(()=>{const s=document.querySelector('select[aria-label="Subscription section"]');if(getComputedStyle(s).display!=='none'&&s.getClientRects().length){Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,'${tab}');s.dispatchEvent(new Event('change',{bubbles:true}));}else [...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify({plans:'Subscription Plans',subscribers:"Farmers' Subscriptions",trials:'Free Trial Management',settings:'Subscription Settings'}[tab])})?.click();})()`);
      await measure('subscriptions-'+tab+'@'+width);
      if(tab==='plans'){
        await clickText('Edit Plan'); await measure('plan-edit@'+width);
        if(width===320)await screenshot('plan-edit-320');
        assert.equal(await evaluate('document.body.style.overflow'),'hidden');
        await clickText('Save Changes'); await pause(80);
        assert.equal(await evaluate('document.querySelectorAll(".admin-dialog").length'),2,'Plan confirmation should stack over editor');
        await measure('plan-confirm@'+width);await closeDialog();
        assert.equal(await evaluate('document.body.style.overflow'),'hidden','Closing nested dialog must keep background locked');
        await closeDialog();
        assert.notEqual(await evaluate('document.body.style.overflow'),'hidden');
        await clickText('View Subscribers');await measure('plan-subscribers@'+width);await closeDialog();
      }
      if(tab==='subscribers'){await clickText('View Details');await measure('subscriber-details@'+width);await closeDialog();}
      if(tab==='trials'){await clickText('Extend Trial');await measure('trial-extend@'+width);await closeDialog();}
      if(tab==='settings'){
        await evaluate(`(()=>{const input=document.querySelector('main input[type="number"]');input.focus();globalThis.__focusedNumber=input;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'20');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);await pause(40);
        assert.equal(await evaluate('document.activeElement===globalThis.__focusedNumber'),true,'Editing a subscription field must preserve keyboard focus');
      }
    }
    await evaluate(`globalThis.__navigate('/admin/settings')`);await pause(80);
    for(const tab of ['account','security','subscription','payment','notification','appearance','data']){
      await evaluate(`(()=>{const s=document.querySelector('select[aria-label="Settings section"]');if(s.getClientRects().length){Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,'${tab}');s.dispatchEvent(new Event('change',{bubbles:true}));}else [...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify({account:'Account & Contact',security:'Security & Access',subscription:'Subscription Defaults',payment:'Payment Gateways',notification:'Notifications & Alerts',appearance:'Appearance & UI',data:'Data & Privacy'}[tab])})?.click();})()`);
      await measure('settings-'+tab+'@'+width);
    }
    for(const [route,selector,text] of [
      ['farmers','[title="View Full Profile"]'],['farmers','[title="Send Direct Notification"]'],
      ['farms','[title="View Multi-Poultry Breakdown"]'],['payments','[title="View Receipt"]'],
      ['audit-logs','[title="View Log Detail"]'],['administrators',null,'Add Administrator'],
      ['poultry-types',null,'Add Category'],['support',null,'Respond'],
    ]){
      await evaluate(`globalThis.__navigate('/admin/${route}')`);await pause(80);
      if(selector)await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);else await clickText(text);
      const measured=await measure(route+'-dialog@'+width);assert.equal(measured.dialogs.length,1,'Missing dialog '+route);
      assert.equal(await evaluate('document.body.style.overflow'),'hidden');
      if(width===375&&route==='farmers'&&selector.includes('Profile'))await screenshot('farmer-details-375');
      await evaluate(`(()=>{const d=document.querySelector('.admin-dialog-panel');d.scrollTop=d.scrollHeight;})()`);await pause(30);
      assert.equal(await evaluate(`(()=>{const d=document.querySelector('.admin-dialog-panel'),b=d.querySelector('.admin-dialog-header button'),r=b.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;})()`),true,'Close button must remain visible '+route+'@'+width);
      await closeDialog();assert.equal(await evaluate('document.querySelectorAll(".admin-dialog").length'),0);
    }
    await evaluate(`globalThis.__navigate('/admin/contact-messages?message=contact-0-0')`);await pause(100);
    await measure('contact-details@'+width);
    if(width===320)await screenshot('contact-details-320');
    await clickText('Mark Resolved');await pause(80);
    assert.equal(await evaluate('globalThis.__contactRecords.filter(r=>!r.is_read).length'),3);
    assert.equal(await evaluate('globalThis.__contactRecords[0].is_read'),false);
    await clickText('Mark as Read');await pause(80);
    assert.equal(await evaluate('globalThis.__contactRecords.filter(r=>!r.is_read).length'),2);
    assert.equal(await evaluate(`!!document.querySelector('[aria-label="2 unread contact messages"]')`),true,'Sidebar must reflect the saved read update');
    assert.equal(await evaluate('globalThis.__contactRecords[0].status'),'resolved');
    await clickText('Mark as Unread');await pause(80);
    assert.equal(await evaluate('globalThis.__contactRecords.filter(r=>!r.is_read).length'),3);
    assert.equal(await evaluate(`!!document.querySelector('[aria-label="3 unread contact messages"]')`),true);
    await closeDialog();
    await evaluate(`globalThis.__navigate('/admin/notifications')`);await pause(80);
    await evaluate(`globalThis.__setField(document.querySelector('main form input[type="text"]'),'Test responsive announcement')`);await pause(30);
    await evaluate(`globalThis.__setField(document.querySelector('main form textarea'),'This message is a browser-only layout fixture.')`);await pause(30);
    await clickText('Preview Announcement');
    const preview=await measure('notification-preview@'+width);assert.equal(preview.dialogs.length,1);await closeDialog();
  }
  // Exercise controls against the same records on the mobile card presentation.
  await send('Emulation.setDeviceMetricsOverride',{width:375,height:812,deviceScaleFactor:1,mobile:false},session);
  await evaluate(`globalThis.__navigate('/admin/farmers')`);await pause(80);
  assert.equal(await evaluate(`document.querySelector('main .admin-records tbody').children.length`),10);
  await evaluate(`globalThis.__setField(document.querySelector('main input[type="text"]'),'Responsive Farmer 30')`);await pause(40);
  assert.equal(await evaluate(`document.querySelector('main .admin-records tbody').children.length`),1);
  await evaluate(`globalThis.__setField(document.querySelector('main input[type="text"]'),'')`);await pause(40);
  await evaluate(`globalThis.__setField(document.querySelector('select[aria-label="Sort records"]'),'fullName:desc')`);await pause(40);
  assert.ok((await evaluate(`document.querySelector('main .admin-records tbody tr').textContent`)).includes('Responsive Farmer 30'));
  await evaluate(`document.querySelector('[aria-label="Next page"]').click()`);await pause(40);
  assert.ok((await evaluate(`document.querySelector('main .admin-records tbody tr').textContent`)).includes('Responsive Farmer 20'));
  await evaluate(`globalThis.__setField([...document.querySelectorAll('main select')].find(s=>[...s.options].some(o=>o.value==='Basic')),'Basic')`);await pause(40);
  assert.ok((await evaluate(`document.querySelector('main .admin-records tbody').textContent`)).includes('Basic'));
  await evaluate(`globalThis.__setField(document.querySelector('main input[type="text"]'),'unmatched-record-search')`);await pause(40);
  assert.ok((await evaluate(`document.querySelector('main .admin-records tbody').textContent`)).includes('No farmers found'));
  await measure('mobile-search-sort-filter-pagination');
  await evaluate(`globalThis.__navigate('/admin/notifications')`);await pause(100);
  await clickText('Mark notification as read');await pause(70);
  assert.equal(await evaluate('globalThis.__contactRecords.filter(r=>!r.is_read).length'),3,'Reading an alert must not read an enquiry');
  await evaluate(`document.querySelector('main a[href*="contact-messages?message="]').click()`);await pause(80);
  assert.equal(await evaluate('location.search'),'?message=contact-0-0');
  assert.equal(await evaluate('globalThis.__contactRecords[0].is_read'),false);
  await closeDialog();
  // Every actual sidebar route is reachable, with automatic drawer dismissal.
  await send('Emulation.setDeviceMetricsOverride',{width:320,height:812,deviceScaleFactor:1,mobile:false},session);
  for(const route of Object.keys(pages)){
    await evaluate(`document.querySelector('[aria-label="Open navigation"]').click()`);await pause(30);
    await evaluate(`document.querySelector('#admin-mobile-navigation a[href="/admin/${route}"]').click()`);await pause(60);
    assert.equal(await evaluate('location.pathname'),'/admin/'+route);
    assert.equal(await evaluate("!!document.getElementById('admin-mobile-navigation')"),false);
  }
  await evaluate(`document.querySelector('[aria-label="Open navigation"]').focus();document.querySelector('[aria-label="Open navigation"]').click()`);await pause(40);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',modifiers:8},session);
  assert.equal(await evaluate("document.getElementById('admin-mobile-navigation').contains(document.activeElement)"),true,'Shift+Tab must remain inside drawer');
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:318,y:400,button:'left',clickCount:1},session);
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:318,y:400,button:'left',clickCount:1},session);await pause(60);
  assert.equal(await evaluate("!!document.getElementById('admin-mobile-navigation')"),false,'Backdrop must close drawer');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false},session);
  await evaluate(`document.querySelector('[title="Collapse Sidebar"]').click()`);await pause(40);
  await send('Emulation.setDeviceMetricsOverride',{width:375,height:812,deviceScaleFactor:1,mobile:false},session);
  await evaluate(`document.querySelector('[aria-label="Open navigation"]').click()`);await pause(40);
  assert.ok((await evaluate(`document.querySelector('#admin-mobile-navigation a[href="/admin/contact-messages"]').textContent`)).includes('Contact Messages'),'Desktop collapse must not hide mobile labels');
  await closeDialog();
  await evaluate(`globalThis.__contactOriginal=structuredClone(globalThis.__contactRecords);for(let i=0;i<100;i++)globalThis.__contactRecords.push({...globalThis.__contactRecords[0],id:'extra-'+i,is_read:false});window.dispatchEvent(new Event('contact-messages-changed'))`);await pause(100);
  assert.equal(await evaluate(`document.querySelector('a[href="/admin/contact-messages"] span[aria-label]').textContent`),'99+');
  await evaluate(`globalThis.__contactRecords.forEach(r=>r.is_read=true);window.dispatchEvent(new Event('contact-messages-changed'))`);await pause(100);
  assert.equal(await evaluate(`!!document.querySelector('a[href="/admin/contact-messages"] span[aria-label]')`),false,'Zero unread messages must hide badge');
  await evaluate(`globalThis.__contactRecords=globalThis.__contactOriginal;window.dispatchEvent(new Event('contact-messages-changed'))`);
  const runtimeErrors=events.filter(e=>e.method==='Runtime.exceptionThrown');
  assert.equal(runtimeErrors.length,0,JSON.stringify(runtimeErrors));
  console.log('PASS '+report.length+' admin viewport/page/dialog checks; all sidebar routes, drawer keyboard/backdrop/collapse, search/filter/sort/pagination, independent contact and notification states, zero/99+ badges. Isolated fixtures only.');
} finally {
  await writeFile(output+'/results.json',JSON.stringify(report,null,2));
  await send('Browser.close').catch(()=>{});ws.close();chrome.kill();server.close();
}

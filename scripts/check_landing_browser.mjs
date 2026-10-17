import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import jwt from '../backend/node_modules/jsonwebtoken/index.js';
import dotenv from '../backend/node_modules/dotenv/lib/main.js';
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${resolve('.ui-browser')}`,'--remote-debugging-port=9236','about:blank'],{windowsHide:true,stdio:'ignore'});
const errors=[];let socket;
try {
 let pages;
 for(let i=0;i<50;i++) {try {pages=await(await fetch('http://127.0.0.1:9236/json/list')).json();break;}catch{await new Promise(r=>setTimeout(r,200));}}
 if(!pages)throw new Error('Browser did not start');
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{socket.onopen=ok;socket.onerror=fail;});
 let id=0;const pending=new Map();
 socket.onmessage=e=>{const d=JSON.parse(e.data);if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.text+': '+d.params.exceptionDetails.exception?.description);if(pending.has(d.id)){const {ok,fail}=pending.get(d.id);pending.delete(d.id);d.error?fail(new Error(d.error.message)):ok(d.result);}};
 const send=(method,params={})=>new Promise((ok,fail)=>{const key=++id;pending.set(key,{ok,fail});socket.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async(expression)=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const waitFor=async(expression)=>{for(let i=0;i<80;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,200));}throw new Error('Timed out: '+expression);};
 await send('Runtime.enable');await send('Page.enable');
 await mkdir('.ui-checks',{recursive:true});
 const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});await writeFile(`.ui-checks/${name}.png`,Buffer.from(r.data,'base64'));};
 const colours=async()=>evaluate(`Array.from(document.querySelectorAll('[data-plan]')).map(e=>({id:e.dataset.plan,bg:getComputedStyle(e).backgroundColor}))`);
 for(const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844]]) {
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
  await send('Page.navigate',{url:'http://localhost:5173/'});
  await waitFor("document.querySelectorAll('[data-plan]').length===3");
  await waitFor("document.querySelector('picture img')?.complete && document.querySelector('picture img')?.naturalWidth>0");
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true,`${name} overflow`);
  const layout = await evaluate(`({heroColumns:getComputedStyle(document.querySelector('[data-hero-layout]')).gridTemplateColumns.split(' ').length, poultryColumns:getComputedStyle(document.querySelector('[data-poultry-type]').parentElement).gridTemplateColumns.split(' ').length, cards:document.querySelectorAll('[data-poultry-type]').length, quails:document.querySelectorAll('[data-poultry-type="quails"]').length, previewLabel:document.querySelector('[data-hero-preview]').textContent.includes('Example data'), heights:Array.from(document.querySelectorAll('[data-poultry-type]')).map(e=>e.getBoundingClientRect().height)})`);
  assert.equal(layout.heroColumns,name==='desktop'?2:1);
  assert.equal(layout.poultryColumns,name==='desktop'?4:name==='tablet'?2:1);
  assert.equal(layout.cards,8);assert.equal(layout.quails,0);assert.equal(layout.previewLabel,true);
  assert.ok(Math.max(...layout.heights)-Math.min(...layout.heights)<1,'Equal poultry card heights');

  assert.equal(await evaluate("/advertis|sponsored/i.test(document.body.innerText)"),false);
  assert.equal(await evaluate("document.querySelectorAll('svg.lucide').length"),0);
  assert.deepEqual((await colours()).map(p=>p.bg),['rgb(255, 255, 255)','rgb(239, 246, 255)','rgb(23, 37, 84)']);
  await screenshot(`landing-${name}`);
  await evaluate("document.querySelector('#poultry-types').scrollIntoView()");
  await waitFor("document.querySelector('#poultry-types picture img').complete && document.querySelector('#poultry-types picture img').naturalWidth>0");
  await evaluate("document.querySelector('#poultry-types picture img').decode()");
  await new Promise(r=>setTimeout(r,200));
  await screenshot(`poultry-types-${name}`);
  await evaluate("document.querySelector('#hero').scrollIntoView()");

  if(name === 'mobile') {
   await evaluate("document.querySelector('[aria-label=\"Open menu\"]').click()");
   assert.equal(await evaluate("document.querySelector('[aria-label=\"Mobile navigation\"]').innerText.includes('Pricing')"),true);
   await evaluate("document.querySelector('[aria-label=\"Close menu\"]').click()");
  }

  await evaluate("document.querySelector('#pricing').scrollIntoView()");await new Promise(r=>setTimeout(r,250));await screenshot(`pricing-${name}`);
  if(name==='desktop') {
   await evaluate("Array.from(document.querySelectorAll('#pricing button')).find(e=>e.textContent.includes('Annual')).click()");
   assert.equal(await evaluate("document.querySelector('[data-plan=professional]').innerText.includes('50,000')"),true);
   await evaluate("document.querySelector('#benefits').scrollIntoView()");await screenshot('benefits-desktop');
  }
  console.log(`PASS ${name}: cards, backgrounds, photos, no overflow or advertising`);
 }
 await send('Page.navigate',{url:'http://localhost:5173/'});
 await waitFor("document.querySelectorAll('picture').length===4");
 for(const section of ['#poultry-types','#benefits','main section:last-child']) {
  await evaluate(`document.querySelector('${section}').scrollIntoView()`);
  await waitFor(`document.querySelector('${section} picture img').complete && document.querySelector('${section} picture img').naturalWidth>0`);
 }
 await send('Network.enable');
 await send('Network.setBlockedURLs',{urls:['*hero-*.webp']});
 await send('Page.navigate',{url:'http://localhost:5173/'});
 await waitFor("document.querySelector('picture img')?.complete && document.querySelector('picture img')?.currentSrc.endsWith('/hero.jpg') && document.querySelector('picture img')?.naturalWidth>0");
 console.log('PASS all four section photos and JPEG fallback when WebP fails');
 await send('Network.setBlockedURLs',{urls:[]});
 const config=dotenv.parse(await readFile('backend/.env','utf8'));
 const token=jwt.sign({sub:'administrator',role:'admin'},config.JWT_SECRET,{expiresIn:'5m'});
 await evaluate(`localStorage.setItem('poultrypro_admin_token',${JSON.stringify(token)});localStorage.setItem('poultrypro_current_admin',JSON.stringify({id:'admin-1',name:'Administrator',email:${JSON.stringify(config.ADMIN_EMAIL)},role:'Super Admin'}));`);
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://localhost:5173/admin/subscriptions'});
 await waitFor("Array.from(document.querySelectorAll('button')).some(e=>e.textContent.trim()==='Subscription Plans')");
 await evaluate("Array.from(document.querySelectorAll('button')).find(e=>e.textContent.trim()==='Subscription Plans').click()");
 await waitFor("document.querySelectorAll('[data-plan]').length===3");
 assert.deepEqual((await colours()).map(p=>p.bg),['rgb(255, 255, 255)','rgb(239, 246, 255)','rgb(23, 37, 84)']);
 assert.equal(await evaluate("document.querySelectorAll('a[href*=advertis]').length"),0);
 await screenshot('admin-plans-desktop');
 await evaluate("Array.from(document.querySelectorAll('[data-plan=professional] button')).find(e=>e.textContent==='Edit Plan').click()");
 await waitFor("document.querySelector('[aria-labelledby=\"edit-plan-title\"]')!==null");
 assert.equal(await evaluate("document.querySelector('[aria-labelledby=\"edit-plan-title\"]').innerText.includes('Reset Changes')"),true);
 await evaluate("Array.from(document.querySelectorAll('[aria-labelledby=\"edit-plan-title\"] button')).find(e=>e.textContent==='Cancel').click()");
 await evaluate("Array.from(document.querySelectorAll('[data-plan=professional] button')).find(e=>e.textContent==='View Subscribers').click()");
 await waitFor("document.querySelector('[aria-label=\"Plan subscribers\"]')!==null");
 console.log('PASS admin: matching themes, no advertising navigation, editor and subscriber controls');
 assert.deepEqual(errors,[],'Runtime exceptions');
 console.log('PASS no browser runtime exceptions');
 socket.send(JSON.stringify({id:++id,method:'Browser.close'}));
} finally {socket?.close();browser.kill();}

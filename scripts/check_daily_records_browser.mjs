import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';

export async function checkDailyBrowser({apiBase,token,flockId,farmId}) {
  process.env.VITE_API_BASE_URL=apiBase;
  const {createServer}=await import('vite');
  const root=fileURLToPath(new URL('../',import.meta.url));
  const originalCwd=process.cwd();process.chdir(root);
  const vite=await createServer({root,server:{host:'127.0.0.1',port:0},clearScreen:false});
  await vite.listen();
  const origin=vite.resolvedUrls.local[0];
  const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${resolve(tmpdir(),'poultry-daily-browser-'+randomUUID())}`,'--remote-debugging-port=9242','about:blank'],{windowsHide:true,stdio:'ignore'});
  let socket;
  const errors=[];
  try {
    let pages;
    for(let i=0;i<80;i++){try{pages=await(await fetch('http://127.0.0.1:9242/json/list')).json();break;}catch{await new Promise(r=>setTimeout(r,200));}}
    assert.ok(pages,'Headless browser starts');
    socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
    await new Promise((ok,fail)=>{socket.onopen=ok;socket.onerror=fail;});
    let id=0,navigationDone;const pending=new Map();
    socket.onmessage=e=>{const d=JSON.parse(e.data);if(d.method==='Page.loadEventFired')navigationDone?.();if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.exception?.description||d.params.exceptionDetails.text);if(d.method==='Runtime.consoleAPICalled'){const message=d.params.args.map(a=>a.value??a.description??'').join(' ');if(/same key|React Router Future Flag Warning/.test(message))errors.push(message);}if(pending.has(d.id)){const {ok,fail}=pending.get(d.id);pending.delete(d.id);d.error?fail(new Error(d.error.message)):ok(d.result);}};
    const send=(method,params={})=>new Promise((ok,fail)=>{const key=++id;pending.set(key,{ok,fail});socket.send(JSON.stringify({id:key,method,params}));});
    const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
    const waitFor=async expression=>{for(let i=0;i<150;i++){if(await evaluate(`document.body && (${expression})`))return;await new Promise(r=>setTimeout(r,200));}throw new Error('Timed out: '+expression);};
    const navigate=async(method,params={})=>{const loaded=new Promise(resolve=>{navigationDone=resolve;});await send(method,params);await loaded;navigationDone=undefined;};
    await send('Runtime.enable');await send('Page.enable');
    await send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('poultrypro_token',${JSON.stringify(token)});`});
    await mkdir(resolve(root,'.ui-checks'),{recursive:true});
    for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
      await navigate('Page.navigate',{url:origin+'dashboard'});
      await waitFor(`document.body.innerText.includes("Today's Farm Records") && document.querySelector('progress') && !document.body.innerText.includes('Loading saved farm records')`);
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`${name} dashboard has no horizontal overflow`);
      assert.equal(await evaluate(`(()=>{const section=document.querySelector('[id="today-records-title"]').closest('section');return section.getBoundingClientRect().top-section.previousElementSibling.getBoundingClientRect().bottom<=32;})()`),true,'Compact daily records appear immediately after dashboard header');
      const dashboardScreenshot=await send('Page.captureScreenshot',{format:'png'});
      await writeFile(resolve(root,`.ui-checks/daily-dashboard-${name}.png`),Buffer.from(dashboardScreenshot.data,'base64'));
      await navigate('Page.navigate',{url:origin+`daily-records?farmId=${farmId}&flockId=${flockId}&category=water`});
      await waitFor(`document.querySelector('form[aria-label="Daily activity form"]') && document.body.innerText.includes('Daily Records History')`);
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`${name} records page has no horizontal overflow`);
      assert.equal(await evaluate(`document.querySelector('form[aria-label="Daily activity form"] svg.lucide')===null`),true,'New forms do not use Lucide icons');
      await evaluate(`(()=>{const form=document.querySelector('form[aria-label="Daily activity form"]');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;for(const [label,value] of [['Water supplied','10'],['Water remaining','1']]){const input=[...form.querySelectorAll('label')].find(l=>l.textContent.includes(label)).querySelector('input');setter.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));}form.querySelector('button[type="submit"],button:not([type])').click();})()`);
      await waitFor(`document.body.innerText.includes('Daily record saved.')`);
      await waitFor(`document.body.innerText.includes('9 L')`);
      await navigate('Page.reload');
      await waitFor(`document.querySelector('form[aria-label="Daily activity form"]') && document.body.innerText.includes('9 L')`);
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`${name} saved history remains within viewport`);
      const screenshot=await send('Page.captureScreenshot',{format:'png'});
      await writeFile(resolve(root,`.ui-checks/daily-records-${name}.png`),Buffer.from(screenshot.data,'base64'));
      if(name==='desktop') {
        await evaluate(`(()=>{const row=[...document.querySelectorAll('tbody tr')].find(r=>r.innerText.includes('9 L')&&[...r.querySelectorAll('button')].some(b=>b.textContent==='Edit'));[...row.querySelectorAll('button')].find(b=>b.textContent==='Edit').click();})()`);
        await waitFor(`document.body.innerText.includes('Correct Daily Activity')`);
        await evaluate(`(()=>{const form=document.querySelector('form[aria-label="Daily activity form"]');const input=[...form.querySelectorAll('label')].find(l=>l.textContent.includes('Water remaining')).querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'2');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
        await evaluate(`document.querySelector('form[aria-label="Daily activity form"] button:not([type])').click()`);
        await waitFor(`document.body.innerText.includes('Record corrected.')&&document.body.innerText.includes('8 L')`);
        await evaluate(`(()=>{const row=[...document.querySelectorAll('tbody tr')].find(r=>r.innerText.includes('8 L')&&[...r.querySelectorAll('button')].some(b=>b.textContent==='Delete'));[...row.querySelectorAll('button')].find(b=>b.textContent==='Delete').click();})()`);
        await waitFor(`document.querySelector('dialog[open]')?.innerText.includes('Delete Daily Record?')`);
        await evaluate(`[...document.querySelector('dialog[open]').querySelectorAll('button')].find(b=>b.textContent==='Delete Record').click()`);
        await waitFor(`document.body.innerText.includes('Record deleted.')&&!document.body.innerText.includes('Loading saved farm records')`);
        await evaluate(`[...document.querySelector('[aria-label="Record categories"]').querySelectorAll('button')].find(b=>b.textContent==='Feed Consumption').click()`);
        await waitFor(`document.querySelector('form[aria-label="Daily activity form"]')?.innerText.includes('Feed inventory item')`);
        await evaluate(`(()=>{const select=document.querySelector('form[aria-label="Daily activity form"] select');select.value='No Activity';select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
        await waitFor(`document.querySelector('form[aria-label="Daily activity form"]')?.innerText.includes('Reason for confirmation')`);
        await evaluate(`(()=>{const form=document.querySelector('form[aria-label="Daily activity form"]');const input=form.querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'No feeding activity today');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
        await evaluate(`document.querySelector('form[aria-label="Daily activity form"] button:not([type])').click()`);
        await waitFor(`document.body.innerText.includes('Daily record saved.')&&document.querySelector('progress')?.value===document.querySelector('progress')?.max`);
        console.log('PASS browser correction, deletion confirmation, No Activity and immediate completion update');
      }
      console.log(`PASS ${name} dashboard prominence, responsive layout, record entry, saved summaries and reload persistence`);
    }
    assert.deepEqual(errors,[],'No runtime exceptions, duplicate keys or router future warnings');
    console.log('PASS no runtime exceptions, duplicate keys or router future warnings');
  } finally {
    socket?.close();browser.kill();await vite.close();process.chdir(originalCwd);
  }
}

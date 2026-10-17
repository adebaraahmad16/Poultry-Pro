import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
export async function checkPoultryScopeBrowser({apiBase,farmer,second,stranger,adminToken,flocks}){
  const originalCwd=process.cwd(),root=fileURLToPath(new URL('../',import.meta.url));process.chdir(root);
  process.env.VITE_API_BASE_URL=apiBase;
  const {createServer}=await import('vite');const vite=await createServer({root,server:{host:'127.0.0.1',port:0},clearScreen:false});await vite.listen();
  const origin=vite.resolvedUrls.local[0];
  const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${resolve(tmpdir(),'poultry-scope-'+randomUUID())}`,'--remote-debugging-port=9243','about:blank'],{windowsHide:true,stdio:'ignore'});
  let socket;const errors=[];
  try{
    let pages;for(let i=0;i<80;i++){try{pages=await(await fetch('http://127.0.0.1:9243/json/list')).json();break;}catch{await new Promise(r=>setTimeout(r,200));}}
    assert.ok(pages,'Chrome starts');socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise((ok,fail)=>{socket.onopen=ok;socket.onerror=fail;});
    let id=0,onLoad;const pending=new Map();
    socket.onmessage=e=>{const d=JSON.parse(e.data);if(d.method==='Page.loadEventFired')onLoad?.();if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.exception?.description||d.params.exceptionDetails.text);if(d.method==='Runtime.consoleAPICalled'){const message=d.params.args.map(a=>a.value??a.description??'').join(' ');if(/same key|React Router Future Flag Warning|The above error/.test(message))errors.push(message);}if(pending.has(d.id)){const {ok,fail}=pending.get(d.id);pending.delete(d.id);d.error?fail(new Error(d.error.message)):ok(d.result);}};
    const send=(method,params={})=>new Promise((ok,fail)=>{const key=++id;pending.set(key,{ok,fail});socket.send(JSON.stringify({id:key,method,params}));});
    const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
    const wait=async expression=>{for(let i=0;i<180;i++){if(await evaluate(`Boolean(document.body&&(${expression}))`))return;await new Promise(r=>setTimeout(r,150));}throw new Error('Timed out: '+expression+'\n'+await evaluate('document.body.innerText.slice(0,1800)'));};
    const load=async(path,reload=false)=>{const done=new Promise(resolve=>{onLoad=resolve;});await send(reload?'Page.reload':'Page.navigate',reload?{}:{url:origin+path.replace(/^\//,'')});await done;onLoad=undefined;};
    const ready=()=>wait(`document.querySelector('main h1')&&!document.querySelector('main [role="status"]')?.innerText.includes('Loading')`);
    const go=async path=>{await evaluate(`(()=>{const a=document.querySelector('aside a[href="${path}"]');if(!a)throw new Error('Navigation link missing: ${path}');a.click();})()`);await wait(`location.pathname===${JSON.stringify(path)}&&document.querySelector('main h1')`);};
    const select=async id=>{await evaluate(`(()=>{const s=document.querySelector('select[aria-label="Selected poultry type"]');s.value=${JSON.stringify(id)};s.dispatchEvent(new Event('change',{bubbles:true}));})()`);await wait(`document.querySelector('select[aria-label="Selected poultry type"]')?.value===${JSON.stringify(id)}`);};
    const noOverflow=async label=>{
      let overflow;
      for(let i=0;i<12;i++){
        overflow=await evaluate(`({width:innerWidth,page:document.documentElement.scrollWidth,main:document.querySelector('main')?.clientWidth,scroll:document.querySelector('main')?.scrollWidth})`);
        if(overflow.page<=overflow.width+1&&overflow.scroll<=overflow.main+1)return;
        await new Promise(r=>setTimeout(r,100));
      }
      const offenders=await evaluate(`Array.from(document.querySelectorAll('main *')).filter(e=>e.getBoundingClientRect().right>innerWidth&&!e.closest('.overflow-x-auto')).slice(0,14).map(e=>({tag:e.tagName,cls:e.getAttribute('class'),width:e.getBoundingClientRect().width,text:e.innerText?.slice(0,60)}))`);
      throw new Error(`${label} overflow: ${JSON.stringify(overflow)}\n${JSON.stringify(offenders)}`);
    };
    await send('Page.enable');await send('Runtime.enable');
    await send('Page.addScriptToEvaluateOnNewDocument',{source:`if(!localStorage.getItem('scope_browser_initialized')){localStorage.setItem('poultrypro_token',${JSON.stringify(farmer.token)});localStorage.setItem('scope_browser_initialized','true');}`});
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    await load('/dashboard');await ready();await wait(`!document.querySelector('select[aria-label="Selected poultry type"]').disabled`);
    for(const [type,title] of [['broilers','Broilers'],['layers','Layers'],['turkeys','Turkeys'],['cockerels','Cockerels']]){
      await select(type);await wait(`document.querySelector('main h1')?.innerText.includes(${JSON.stringify(title+' Dashboard')})`);
      await noOverflow(type+' desktop');
      if(type==='turkeys'){
        const summary=await evaluate(`document.querySelector('[aria-labelledby="today-records-title"]').innerText`);
        assert.ok(summary.includes('30 kg')&&summary.includes('3 birds')&&summary.includes('3.000 kg')&&summary.includes('325'),summary);
        assert.equal(await evaluate(`document.querySelector('[aria-labelledby="today-records-title"]').querySelectorAll('table,form').length`),0,'Dashboard daily summary stays compact');
      }
    }
    await select('turkeys');
    for(const path of ['/daily-records','/production/feed','/health','/health/mortality','/business/sales','/business/expenses','/farm/flocks','/reports','/reports/profit-loss','/dashboard']){
      await go(path);await ready();
      if(path==='/daily-records')await wait(`document.querySelector('form[aria-label="Daily activity form"]')`);
      assert.equal(await evaluate(`document.querySelector('select[aria-label="Selected poultry type"]').value`),'turkeys',path+' retains Turkey');
      assert.equal(await evaluate(`document.querySelector('main').innerText.includes('Broiler Distinct Batch')`),false,path+' excludes Broiler data');
      await noOverflow(path+' desktop');
    }
    await load('/production/feed');await ready();assert.equal(await evaluate(`document.querySelector('select[aria-label="Selected poultry type"]').value`),'turkeys','Turkey survives refresh');
    await load('/farm/flocks/'+flocks.turkeys.id);await ready();assert.equal(await evaluate(`document.querySelector('main h1').textContent`),'Turkey Distinct Batch','Flock details show the requested Turkey flock');
    await load('/farm/flocks/'+flocks.broilers.id);await ready();assert.equal(await evaluate(`document.querySelector('main h1').textContent`),'Flock not found.','A mismatched flock URL never falls back to another flock');
    await go('/daily-records');await wait(`document.querySelector('form[aria-label="Daily activity form"]')`);
    const options=await evaluate(`Array.from(document.querySelector('main fieldset label:nth-child(3) select').options).map(o=>o.textContent)`);
    assert.ok(options.includes('Turkey Distinct Batch')&&!options.some(o=>o.includes('Broiler')),JSON.stringify(options));
    await select('layers');await go('/dashboard');await wait(`document.querySelector('main h1')?.innerText.includes('Layers Dashboard')`);assert.ok((await evaluate(`document.querySelector('[aria-labelledby="today-records-title"]').innerText`)).includes('60 eggs'));
    await select('ducks');await wait(`document.querySelector('main').innerText.includes('No Ducks Flocks Added Yet')`);assert.equal(await evaluate(`document.querySelector('main').innerText.includes('Broiler Distinct Batch')`),false,'Empty type never falls back to Broilers');
    await select('turkeys');
    await evaluate(`(()=>{const s=document.querySelector('select[aria-label="Selected farm"]');s.value=${JSON.stringify(second.user.farmId)};s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await wait(`document.querySelector('main').innerText.includes('Other Turkey Batch')`);assert.equal(await evaluate(`document.querySelector('select[aria-label="Selected poultry type"]').value`),'turkeys','Valid Turkey selection survives farm switch');
    await evaluate(`(()=>{const s=document.querySelector('select[aria-label="Selected farm"]');s.value=${JSON.stringify(farmer.user.farmId)};s.dispatchEvent(new Event('change',{bubbles:true}));})()`);await ready();await wait(`document.querySelector('select[aria-label="Selected farm"]').value===${JSON.stringify(farmer.user.farmId)}&&!document.querySelector('select[aria-label="Selected farm"]').disabled`);
    console.log('PASS Broiler, Layer, Turkey, Cockerel, empty types, navigation, refresh, farm switching and type-specific form options');
    await mkdir(resolve(root,'.ui-checks'),{recursive:true});
    for(const [width,height,label] of [[320,800,'phone-small'],[390,844,'phone'],[768,1024,'tablet'],[1440,1000,'desktop']]){
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
      for(const path of ['/dashboard','/daily-records','/farm','/farm/flocks','/production/feed','/production/eggs','/health','/health/mortality','/health/medication','/health/vaccinations','/business/sales','/business/expenses','/reports','/reports/profit-loss','/settings']){
        await go(path);await ready();if(path==='/daily-records')await wait(`document.querySelector('form[aria-label="Daily activity form"]')`);await noOverflow(label+' '+path);
      }
      await go('/dashboard');await ready();
      if(width<1024){
        await evaluate(`document.querySelector('button[aria-label="Toggle Navigation Menu"]').click()`);await wait(`document.querySelector('[aria-label="Farmer navigation"]')`);
        await evaluate(`document.querySelector('[aria-label="Farmer navigation"] a[href="/production/feed"]').click()`);await wait(`location.pathname==='/production/feed'&&!document.querySelector('[aria-label="Farmer navigation"]')`);
        await evaluate(`document.querySelector('button[aria-label="Toggle Navigation Menu"]').click()`);await evaluate(`document.querySelector('button[aria-label="Close navigation"]').click()`);await wait(`!document.querySelector('[aria-label="Farmer navigation"]')`);
      }
      await writeFile(resolve(root,`.ui-checks/poultry-${label}.png`),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
      console.log(`PASS farmer ${label}: 15 routes, contained tables/charts/forms and navigation drawer`);
    }
    await evaluate(`localStorage.setItem('poultrypro_token',${JSON.stringify(stranger.token)})`);await load('/dashboard');await ready();
    assert.equal(await evaluate(`document.querySelector('select[aria-label="Selected poultry type"]').value`),'broilers','Another account never inherits Turkey preference');
    assert.equal(await evaluate(`document.querySelector('main').innerText.includes('Turkey Distinct Batch')`),false,'Another account has no previous farmer records');
    await evaluate(`localStorage.setItem('poultrypro_admin_token',${JSON.stringify(adminToken)});localStorage.setItem('poultrypro_current_admin',JSON.stringify({id:'scope-admin',name:'Test Admin',email:'admin@example.test',role:'Super Admin'}));`);
    for(const [width,height,label] of [[320,800,'phone-small'],[390,844,'phone'],[768,1024,'tablet'],[1440,1000,'desktop']]){
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
      for(const path of ['/admin/dashboard','/admin/farmers','/admin/farms','/admin/subscriptions','/admin/payments','/admin/revenue','/admin/settings']){
        await load(path);await wait(`document.querySelector('.admin-workspace main h1')`);await noOverflow(label+' '+path);
        if(path==='/admin/subscriptions'){
          const tabs=await evaluate(`Array.from(document.querySelectorAll('main button')).filter(b=>b.closest('.min-w-max')).map(b=>b.textContent)`);
          for(const tab of tabs){await evaluate(`Array.from(document.querySelectorAll('main button')).find(b=>b.textContent===${JSON.stringify(tab)}).click()`);await noOverflow(label+' admin '+tab);}
        }
      }
      if(width<1024){await evaluate(`document.querySelector('button[title="Open Menu"]').click()`);await wait(`document.querySelector('[aria-label="Admin navigation"]')`);await evaluate(`document.querySelector('[aria-label="Admin navigation"] a[href="/admin/farmers"]').click()`);await wait(`location.pathname==='/admin/farmers'&&!document.querySelector('[aria-label="Admin navigation"]')`);}
      await writeFile(resolve(root,`.ui-checks/admin-${label}.png`),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
      console.log(`PASS admin ${label}: overview, farmers, farms, subscription tabs, payments, revenue, settings and navigation drawer`);
    }
    assert.deepEqual(errors,[],'No runtime exceptions or React reconciliation warnings');
    console.log('PASS account isolation and no browser runtime errors');
  }finally{socket?.close();browser.kill();await vite.close();process.chdir(originalCwd);}
}

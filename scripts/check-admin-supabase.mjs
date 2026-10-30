// Actual admin/contact providers and persistence services, isolated strict-schema SDK.
import {build} from 'esbuild';import {mkdir,writeFile,readFile} from 'node:fs/promises';import {createServer} from 'node:http';import {resolve} from 'node:path';import assert from 'node:assert/strict';import {fixtureBrowser} from './fixtures/browser.js';
const output=resolve('.ui-checks/admin-supabase');await mkdir(output,{recursive:true});
await build({stdin:{loader:'jsx',resolveDir:process.cwd(),contents:`
import React,{useState}from'react';import{createRoot}from'react-dom/client';
import{AdminProvider,useAdmin}from'./src/admin/context/AdminContext.jsx';import{ContactProvider,useContacts}from'./src/admin/context/ContactContext.jsx';
import{publishNotification,loadBroadcasts}from'./src/admin/services/adminPersistence.js';import{getContactStats}from'./src/services/contactService.js';import{requireSupabaseAdmin}from'./src/services/adminAccess.js';
import{dashboardDatabase}from'./scripts/fixtures/dashboardDatabase.js';
globalThis.__db=dashboardDatabase();__db.state.userId=null;__db.state.failure={table:'app_settings',message:'Settings table not deployed'};
__db.state.rows.contact_messages=['new','in_progress','resolved'].flatMap((status,i)=>[false,true].map((is_read,j)=>({id:i+'-'+j,status,is_read})));
__db.state.rows.notifications=[{id:'old-batch:farmer-a',category:'admin_broadcast',title:'Existing broadcast',message:'Keep records',type:'info',user_id:'farmer-a',created_at:new Date().toISOString()},{id:'old-batch:farmer-b',category:'admin_broadcast',title:'Existing broadcast',message:'Keep records',type:'info',user_id:'farmer-b',created_at:new Date().toISOString()},{id:'other-alert',category:'subscription',title:'Other notification',user_id:'farmer-a'}];
const originalFrom=__db.from.bind(__db),originalRpc=__db.rpc.bind(__db);globalThis.__rpcCalls=0;globalThis.__deniedContact=false;
__db.rpc=async(...args)=>{__rpcCalls++;return originalRpc(...args);};
__db.from=table=>{
 const query=originalFrom(table);const forbidden=['related_entity_type','related_entity_id','priority','action_url','read_at'];
 for(const method of ['eq','select','insert','upsert','update']){const original=query[method];query[method]=(...args)=>{if(table==='notifications'){if(method==='eq'||method==='select'){if(forbidden.some(key=>String(args[0]).includes(key)))throw Error('Unsupported notification column');}else if([].concat(args[0]).some(row=>Object.keys(row).some(k=>forbidden.includes(k))))throw Error('Unsupported notification write column');}return original(...args);};}
 if(table==='contact_messages'){const original=query.then;query.then=async(resolve,reject)=>{await new Promise(r=>setTimeout(r,30));if(__deniedContact){__db.state.calls.push({table,action:'select'});return resolve({data:null,error:{code:'42501',message:'permission denied for table contact_messages'}});}return original(resolve,reject);};}
 return query;
};
localStorage.setItem('poultrypro_current_admin',JSON.stringify({id:'cached-admin',role:'Super Admin'}));
globalThis.__sharedAuth={loading:true,user:null,logout:async()=>{}};
globalThis.__services={publishNotification,loadBroadcasts,getContactStats,requireSupabaseAdmin};
function Probe(){globalThis.__admin=useAdmin();globalThis.__contacts=useContacts();return <p id="ready">{String(__contacts.ready)}</p>}
function App(){const[,render]=useState(0);globalThis.__finishAuth=id=>{__db.state.userId=id;__sharedAuth={...__sharedAuth,loading:false,user:__db.state.rows.profiles.find(p=>p.id===id)||null};render(n=>n+1);};return <AdminProvider><ContactProvider><Probe/></ContactProvider></AdminProvider>}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
`},bundle:true,format:'esm',outfile:output+'/app.js',define:{'import.meta.env':JSON.stringify({VITE_SUPABASE_URL:'https://fixture.supabase.invalid'})},plugins:[{name:'isolated-admin',setup(b){
 b.onLoad({filter:/lib[\\/]supabaseClient\.js$/},()=>({contents:'export const supabase={auth:new Proxy({},{get:(_o,k)=>(...a)=>globalThis.__db.auth[k](...a)}),from:(...a)=>globalThis.__db.from(...a),rpc:(...a)=>globalThis.__db.rpc(...a)};export const isSupabaseConfigured=()=>true;',loader:'js'}));
 b.onLoad({filter:/context[\\/]AuthContext\.jsx$/},()=>({contents:'export const useAuth=()=>globalThis.__sharedAuth;',loader:'js'}));
}}]});
const server=createServer(async(req,res)=>{if(req.url==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(await readFile(output+'/app.js'));}else res.end('<html><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await fixtureBrowser(output+'/chrome-profile');const{command,evaluate,wait,pause}=browser;
try{
 await command('Page.navigate',{url:'http://127.0.0.1:'+server.address().port});await wait('globalThis.__contacts');await pause(100);
 assert.equal(await evaluate('__rpcCalls'),0,'No administrator requests during Auth initialization');
 assert.equal(await evaluate('__db.state.calls.filter(c=>c.table==="contact_messages").length'),0);
 await evaluate('__finishAuth(null)');await wait('!__admin.loading');assert.equal(await evaluate('__admin.isAdminLoggedIn'),false,'Cached admin cannot authorize Supabase requests');
 assert.equal(await evaluate('__db.state.calls.filter(c=>c.table==="contact_messages").length'),0);
 await evaluate('__finishAuth("admin-a")');await wait('__contacts.stats?.total===6');
 assert.equal(await evaluate('__admin.supabaseAdminReady'),true);assert.equal(await evaluate('__rpcCalls'),1,'One coalesced is_admin verification');
 assert.deepEqual(await evaluate('__contacts.stats'),{total:6,unread:3,inProgress:2,resolved:2});
 assert.equal(await evaluate('__admin.notifications.length'),1,'Broadcasts load despite settings failure');
 assert.equal(await evaluate('__admin.notifications[0].recipientCount'),2);
 let before=await evaluate('__db.state.calls.filter(c=>c.table==="contact_messages").length');
 await evaluate('Promise.all([__contacts.refresh(),__contacts.refresh(),__services.getContactStats(),__services.getContactStats()])');
 assert.equal(await evaluate('__db.state.calls.filter(c=>c.table==="contact_messages").length'),before+4,'Concurrent statistics refreshes share one set of four exact counts');
 await evaluate(`__services.publishNotification({requestId:'new-batch',title:'New broadcast',message:'Saved using existing columns',priority:'Important Notice'},[{id:'farmer-a',farmId:'farm-a'},{id:'farmer-b',farmId:'farm-b'}])`);
 await evaluate(`__services.publishNotification({requestId:'new-batch',title:'New broadcast',message:'Saved using existing columns',priority:'Important Notice'},[{id:'farmer-a',farmId:'farm-a'},{id:'farmer-b',farmId:'farm-b'}])`);
 assert.equal(await evaluate('__db.state.rows.notifications.length'),5,'Existing alerts preserved and recipient retries deduplicated');
 assert.equal((await evaluate('__services.loadBroadcasts()')).length,2);
 before=await evaluate('__db.state.calls.filter(c=>c.table==="contact_messages").length');
 await evaluate('__deniedContact=true;__contacts.refresh()');await wait('__contacts.error.includes("42501")');
 assert.equal(await evaluate('__db.state.calls.filter(c=>c.table==="contact_messages").length'),before+1,'A missing grant stops after the first count request');
 before=await evaluate('__db.state.calls.filter(c=>c.table==="contact_messages").length');
 await evaluate('window.dispatchEvent(new Event("focus"));window.dispatchEvent(new Event("contact-messages-changed"))');await pause(100);
 assert.equal(await evaluate('__db.state.calls.filter(c=>c.table==="contact_messages").length'),before,'Permission errors stop automatic retries');
 await evaluate('__deniedContact=false;__contacts.refresh()');await wait('__contacts.stats?.total===6');
 await evaluate('__finishAuth(null)');await wait('!__contacts.ready');assert.equal(await evaluate('__contacts.stats'),null);
 before=await evaluate('__db.state.calls.filter(c=>c.table==="contact_messages").length');
 const denied=await evaluate('__services.getContactStats().then(()=>false,e=>e.code)');assert.equal(denied,'ADMIN_SESSION_REQUIRED');
 assert.equal(await evaluate('__db.state.calls.filter(c=>c.table==="contact_messages").length'),before,'Missing sessions never reach protected tables');
 await evaluate('__finishAuth("farmer-b")');await wait('!__admin.loading && Boolean(__admin.authError)');assert.equal(await evaluate('__contacts.ready'),false);
 assert.equal(await evaluate('__db.state.calls.filter(c=>c.table==="contact_messages").length'),before,'Non-admins never query enquiries');
 assert.equal(browser.events.filter(e=>e.method==='Runtime.exceptionThrown').length,0);
 console.log('PASS actual AdminProvider/ContactProvider Auth initialization, cached-session rejection, is_admin gating, strict deployed notification schema, independent broadcast loading, confirmed creation/retrieval, record preservation, exact independent counts, request coalescing, stopped permission retries and account isolation. Isolated Supabase fixtures.');
}finally{await browser.close();server.close();}

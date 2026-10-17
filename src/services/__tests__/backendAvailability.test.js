import assert from 'node:assert/strict';
globalThis.localStorage={getItem:()=>null};
globalThis.window={dispatchEvent:()=>{},location:{hostname:'localhost',origin:'http://localhost:5173'}};
const {request,checkedFetch}=await import('../planCatalog.js');
globalThis.fetch=async()=>Response.json({error:'The farm database is unavailable.'},{status:503});
for(const call of [()=>request('/flocks'),()=>checkedFetch('/flocks'),()=>checkedFetch('/flocks',{method:'POST',body:'{}'})]){
  await assert.rejects(call,error=>error.status===503&&error.serverRejected&&/database/.test(error.message));
}
globalThis.fetch=async()=>{throw new TypeError('Network offline');};
await assert.rejects(()=>checkedFetch('/flocks',{method:'POST'}),error=>error.serverRejected&&/connection is unavailable/.test(error.message));
console.log('PASS unavailable backend errors prevent silent cached reads and local mutation fallback');

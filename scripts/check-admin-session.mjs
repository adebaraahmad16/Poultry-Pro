import {build} from 'esbuild';import Module from 'node:module';import{resolve}from'node:path';
const source=`
const assert=require('node:assert/strict');
const {requireSupabaseAdmin}=require('./src/services/adminAccess.js');
const {verifiedSession,clearSessionVerification}=require('./src/services/authSession.js');
module.exports=(async()=>{
 const state=globalThis.__sessionFixture;
 const admin='dc66acb2-e7aa-447d-90ac-1f47cd7a76e5',farmer='farmer-fixture';
 await assert.rejects(requireSupabaseAdmin(),e=>e.code==='ADMIN_SESSION_REQUIRED');
 state.signIn(admin,'admin');const checks=Array.from({length:8},()=>requireSupabaseAdmin(admin));
 for(const result of await Promise.all(checks))assert.equal(result.userId,admin);
 assert.equal(state.userChecks,1);assert.equal(state.rpcChecks,1,'Concurrent checks coalesce per token');
 await assert.rejects(verifiedSession(farmer),e=>e.code==='AUTH_IDENTITY_MISMATCH'&&e.expectedUserId===farmer);
 // Reproduce the original race: an old farmer denial completes after admin login.
 state.signIn(farmer,'farmer');state.hold=true;const old=requireSupabaseAdmin(farmer).catch(e=>e);
 await state.waitForHeld();state.signIn(admin,'admin');assert.equal((await requireSupabaseAdmin(admin)).userId,admin);
 state.release();assert.equal((await old).code,'AUTH_SESSION_CHANGED','Old denial must not be reported as current admin authorization failure');
 // A delayed success must also be rejected after logout.
 state.signIn(admin,'admin');state.hold=true;const late=requireSupabaseAdmin(admin).catch(e=>e);await state.waitForHeld();state.session=null;state.release();assert.equal((await late).code,'AUTH_SESSION_CHANGED');
 state.signIn(admin,'admin');state.expired=true;await assert.rejects(requireSupabaseAdmin(admin),e=>e.code==='AUTH_SESSION_EXPIRED');state.expired=false;
 state.signIn(admin,'admin');state.rpcFailure=true;await assert.rejects(requireSupabaseAdmin(admin),e=>e.status===503&&e.code==='RPC_TEST_FAILURE');state.rpcFailure=false;
 state.signIn(farmer,'farmer');await assert.rejects(requireSupabaseAdmin(farmer),e=>e.code==='ADMIN_ROLE_REQUIRED'&&e.message.includes(farmer));
 // Same-user token refresh gets a single bounded retry, not an account switch.
 state.signIn(admin,'admin');state.hold=true;const rotating=requireSupabaseAdmin(admin);await state.waitForHeld();state.signIn(admin,'admin');state.release();assert.equal((await rotating).userId,admin);
 clearSessionVerification();
 console.log('PASS trusted Auth ID checks, confirmed admin-role fixture, coalesced verification, stale false/success results, logout, expired tokens, RPC errors versus false, identity mismatch and bounded same-user token refresh. No live accounts used.');
})()
`;
let serial=0,releaseHeld,heldResolve;const held=()=>new Promise(r=>heldResolve=r);
const state={session:null,users:new Map(),roles:new Map(),userChecks:0,rpcChecks:0,hold:false,heldPromise:null,expired:false,rpcFailure:false,
 signIn(id,role){const token='controlled-token-'+(++serial);this.session={user:{id,email:id.startsWith('dc66')?'admin@poultrypro.ng':'farmer@example.invalid'},access_token:token};this.users.set(token,this.session.user);this.roles.set(token,role);},
 waitForHeld:async()=>{while(!state.heldPromise)await new Promise(r=>setTimeout(r,0));await state.heldPromise;},
 release(){releaseHeld();state.heldPromise=null;}
};
globalThis.__sessionFixture=state;
globalThis.__authClient={supabaseUrl:'https://isolated.supabase.invalid',auth:{getSession:async()=>({data:{session:state.session&&structuredClone(state.session)}}),getUser:async token=>{state.userChecks++;return state.expired?{data:{user:null},error:{status:401,message:'Expired fixture token'}}:{data:{user:state.users.get(token)},error:null};}},rpc:async()=>{
 state.rpcChecks++;const token=state.session?.access_token,result=state.rpcFailure?{data:null,error:{code:'RPC_TEST_FAILURE',message:'Temporary RPC failure'},status:503}:{data:state.roles.get(token)==='admin',error:null,status:200};
 if(state.hold){state.hold=false;state.heldPromise=held();const wait=new Promise(r=>releaseHeld=r);heldResolve();await wait;}
 return result;
}};
const result=await build({stdin:{contents:source,loader:'js',resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',plugins:[{name:'session-fixture',setup(b){b.onLoad({filter:/lib[\\/]supabaseClient\.js$/},()=>({contents:'export const supabase=globalThis.__authClient;',loader:'js'}));}}]});
const filename=resolve('.ui-checks/admin-session.cjs'),mod=new Module(filename);mod.filename=filename;mod.paths=Module._nodeModulePaths(process.cwd());mod._compile(result.outputFiles[0].text,filename);await mod.exports;

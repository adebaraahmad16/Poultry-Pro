import 'dotenv/config';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTailnetBridge } from './tailnet-bridge.mjs';

const root = fileURLToPath(new URL('../../',import.meta.url));
const cli = resolve(root,'.render-bin/tailscale');
const daemon = resolve(root,'.render-bin/tailscaled');
const run = promisify(execFile);
if (process.platform !== 'linux') throw new Error('start-render is for Render Linux; use npm start for local development.');
if (!process.env.TS_AUTHKEY || !process.env.TS_DB_HOST || process.env.DB_HOST !== '127.0.0.1' || process.env.DB_USER?.toLowerCase() === 'root') throw new Error('Configure TS_AUTHKEY, TS_DB_HOST, DB_HOST=127.0.0.1 and a dedicated DB_USER.');
await access(cli);await access(daemon);
const temp = await mkdtemp(join(tmpdir(),'poultry-tailnet-'));
const socket = join(temp,'tailscaled.sock');
const authFile = join(temp,'auth-key');
const children = new Set();
let bridge,stopping=false;
async function stop(code=0) {
  if(stopping)return;stopping=true;
  if(bridge)await bridge.close();
  for(const child of children)child.kill('SIGTERM');
  await rm(authFile,{force:true});
  process.exitCode=code;
}
function childProcess(binary,args,options={}) {
  const child=spawn(binary,args,{windowsHide:true,stdio:'inherit',...options});children.add(child);
  child.on('error',()=>{console.error('A required backend process could not start.');void stop(1);});
  child.on('exit',code=>{children.delete(child);if(!stopping)void stop(code||1);});
  return child;
}
process.on('SIGINT',()=>void stop());process.on('SIGTERM',()=>void stop());
try {
  childProcess(daemon,['--tun=userspace-networking','--state=mem:',`--statedir=${temp}`,`--socket=${socket}`]);
  let ready=false;
  for(let attempt=0;attempt<100&&!stopping;attempt++){
    try{await access(socket);ready=true;break;}catch{await new Promise(r=>setTimeout(r,100));}
  }
  if(!ready||stopping)throw new Error('Tailscale userspace daemon did not start.');
  await writeFile(authFile,process.env.TS_AUTHKEY,{mode:0o600});
  await run(cli,[`--socket=${socket}`,'up',`--auth-key=file:${authFile}`,'--hostname=poultrypro-render','--accept-dns=false','--accept-routes=false','--timeout=60s'],{timeout:70000});
  await rm(authFile,{force:true});
  delete process.env.TS_AUTHKEY;
  if(stopping)throw new Error('Startup was interrupted.');
  bridge=createTailnetBridge({port:Number(process.env.DB_PORT||13306),host:process.env.TS_DB_HOST,targetPort:Number(process.env.TS_DB_PORT||13306),cli,socket});
  await bridge.listen();
  console.log('Private MySQL TCP bridge listening on loopback. Remote connectivity is checked by /health/ready.');
  childProcess(process.execPath,[resolve(root,'backend/server.js')],{cwd:resolve(root,'backend')});
} catch {
  console.error('Secure backend startup failed. Check the Tailscale auth key, node approval, access policy and Render logs.');
  await stop(1);
}

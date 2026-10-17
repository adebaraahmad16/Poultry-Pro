import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${resolve('.image-browser')}`,'--remote-debugging-port=9235','about:blank'],{windowsHide:true,stdio:'ignore'});
let socket;
try {
 let pages;
 for(let i=0;i<50;i++) {try {pages=await (await fetch('http://127.0.0.1:9235/json/list')).json();break;}catch{await new Promise(r=>setTimeout(r,200));}}
 if(!pages)throw new Error('Browser did not start');
 socket = new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{socket.onopen=ok;socket.onerror=fail;});
 let id=0;const pending=new Map();
 socket.onmessage=e=>{const d=JSON.parse(e.data);if(pending.has(d.id)){const {ok,fail}=pending.get(d.id);pending.delete(d.id);d.error?fail(new Error(d.error.message)):ok(d.result);}};
 const send=(method,params={})=>new Promise((ok,fail)=>{const key=++id;pending.set(key,{ok,fail});socket.send(JSON.stringify({id:key,method,params}));});
 for(const name of (process.argv.length > 2 ? process.argv.slice(2) : ['hero','farmer','cta','poultry-types'])) {
  const bytes=await readFile(`.image-sources/${name}.jpg`);
  const data=`data:image/jpeg;base64,${bytes.toString('base64')}`;
  for(const [width,type,quality,suffix] of [[1600,'image/webp',0.8,'-1600.webp'],[768,'image/webp',0.77,'-768.webp'],[1600,'image/jpeg',0.74,'.jpg'],[600,'image/png',1,'-preview.png']]) {
   const result=await send('Runtime.evaluate',{expression:`(async()=>{const img=new Image();img.src=${JSON.stringify(data)};await img.decode();const canvas=document.createElement('canvas');canvas.width=${width};canvas.height=Math.round(img.naturalHeight*${width}/img.naturalWidth);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL(${JSON.stringify(type)},${quality});})()`,awaitPromise:true,returnByValue:true});
   if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));
   const output=Buffer.from(result.result.value.split(',')[1],'base64');
   const target=suffix.endsWith('png')?`.image-sources/${name}${suffix}`:`public/images/poultry/${name}${suffix}`;
   await writeFile(target,output); console.log(target,Math.round(output.length/1024)+' KB');
  }
 }
 socket.send(JSON.stringify({id:++id,method:'Browser.close'}));
} finally {socket?.close();browser.kill();}

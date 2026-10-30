import { spawn } from 'node:child_process';

export async function fixtureBrowser(profileDirectory) {
  const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profileDirectory,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  let stderr='';
  const endpoint=await new Promise((resolve,reject)=>{chrome.stderr.on('data',chunk=>{stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match)resolve(match[1]);});chrome.on('error',reject);setTimeout(()=>reject(Error('Chrome did not start')),15000).unref();});
  const socket=new WebSocket(endpoint);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
  const pending=new Map(),events=[];let id=0;
  socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const request=pending.get(message.id);pending.delete(message.id);if(request)message.error?request.reject(Error(message.error.message)):request.resolve(message.result);}else events.push(message);});
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params,sessionId}));});
  const target=await send('Target.createTarget',{url:'about:blank'});
  const session=(await send('Target.attachToTarget',{targetId:target.targetId,flatten:true})).sessionId;
  const command=(method,params={})=>send(method,params,session);
  await command('Page.enable');await command('Runtime.enable');await command('Network.enable');
  await command('Network.setBlockedURLs',{urls:['https://*']});
  const evaluate=async expression=>{const result=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;};
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const wait=async expression=>{for(let attempt=0;attempt<100;attempt++){if(await evaluate(`Boolean(${expression})`))return;await pause(75);}throw Error('Timed out waiting for '+expression);};
  return {command,evaluate,events,pause,wait,async close(){await send('Browser.close').catch(()=>{});socket.close();chrome.kill();}};
}

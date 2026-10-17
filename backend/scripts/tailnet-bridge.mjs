import net from 'node:net';
import { spawn } from 'node:child_process';

// Raw TCP, not HTTP. Each pooled MySQL socket gets its own tailnet stream.
export function createTailnetBridge({port,host,targetPort,cli,socket,spawnProcess=spawn}) {
  if (!host || host.startsWith('-') || !Number.isInteger(targetPort) || targetPort < 1 || targetPort > 65535) throw new Error('Invalid tailnet database target.');
  const clients = new Set();
  const server = net.createServer(client => {
    clients.add(client);
    const child = spawnProcess(cli,[`--socket=${socket}`,'nc',host,String(targetPort)],{stdio:['pipe','pipe','ignore'],windowsHide:true});
    client.setTimeout(15000,()=>client.destroy());
    child.stdout.once('data',()=>client.setTimeout(0));
    child.stdout.pipe(client);
    client.pipe(child.stdin);
    const close = () => {client.destroy();child.kill();};
    child.on('error',close);
    child.on('exit',()=>client.destroy());
    child.stdin.on('error',()=>client.destroy());
    child.stdout.on('error',()=>client.destroy());
    client.on('error',()=>{});
    client.on('close',()=>{clients.delete(client);child.kill();});
  });
  server.maxConnections = 30;
  return {
    listen:()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>{server.removeListener('error',reject);resolve(server.address());});}),
    close:()=>new Promise(resolve=>{for(const client of clients)client.destroy();server.close(resolve);})
  };
}

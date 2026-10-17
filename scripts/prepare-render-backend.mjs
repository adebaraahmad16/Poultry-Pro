import { cp, mkdir, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const destination=resolve(root,'deployment',`render-backend-${Date.now()}`);
await mkdir(resolve(destination,'backend'),{recursive:true});
for(const item of ['package.json','package-lock.json','server.js','config','routes','services','.env.example']) {
  await cp(resolve(root,'backend',item),resolve(destination,'backend',item),{recursive:true});
}
await mkdir(resolve(destination,'backend/scripts'),{recursive:true});
for(const item of ['install-tailscale.mjs','start-render.mjs','tailnet-bridge.mjs','check-database.mjs','production-user.sql.example']) {
  await cp(resolve(root,'backend/scripts',item),resolve(destination,'backend/scripts',item));
}
// Production must not expose the development demo-data seed command.
const {readFile}=await import('node:fs/promises');
const manifest=JSON.parse(await readFile(resolve(destination,'backend/package.json'),'utf8'));
delete manifest.scripts.seed;
await writeFile(resolve(destination,'backend/package.json'),JSON.stringify(manifest,null,2)+'\n');
await cp(resolve(root,'shared'),resolve(destination,'shared'),{recursive:true});
await writeFile(resolve(destination,'package.json'),JSON.stringify({name:'poultrypro-render-deployment',private:true,type:'module'},null,2)+'\n');
await cp(resolve(root,'render.yaml'),resolve(destination,'render.yaml'));
await cp(resolve(root,'docs/render-backend-deployment.md'),resolve(destination,'README.md'));
await writeFile(resolve(destination,'.gitignore'),'node_modules/\n.env\n.env.*\n!.env.example\n*.log\n.render-bin/\n');
await access(resolve(destination,'shared/dailyRecords.js'));
console.log('Prepared backend repository contents:',destination);
console.log('Includes backend/ and shared/. No .env credentials or node_modules were copied.');

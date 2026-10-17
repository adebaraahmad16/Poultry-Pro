import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { apiConfigurationError } from '../apiConfig.js';
const origin = 'https://poultry-pro-pi.vercel.app';
for (const bad of [undefined, '', 'http://localhost:5000/api', 'https://127.0.0.1/api', 'http://backend.example.test/api', 'https://[invalid']) {
  assert.match(apiConfigurationError(bad,true,origin), /VITE_API_BASE_URL/);
}
assert.equal(apiConfigurationError('https://backend.example.test/api',true,origin),'');
assert.equal(apiConfigurationError('/api',true,origin),'');
assert.equal(apiConfigurationError('http://localhost:5000/api',true,'http://localhost:4173'),'');
assert.equal(apiConfigurationError(undefined,false,origin),'');
const config = JSON.parse(await readFile(new URL('../../../vercel.json',import.meta.url)));
const match = new RegExp(`^${config.rewrites[0].source}$`);
for (const path of ['/','/admin','/admin/login','/admin/dashboard','/admin/subscriptions','/dashboard','/farm/flocks/123']) assert.ok(match.test(path),path);
for (const path of ['/api','/api/auth/admin/login','/assets/missing.js','/favicon.svg','/robots.txt','/missing.css']) assert.equal(match.test(path),false,path);
console.log('PASS production API configuration and Vercel SPA routes exclude API and asset requests');

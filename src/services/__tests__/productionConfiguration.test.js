import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { apiConfigurationError, normalizeApiBaseUrl, configuredApiBase } from '../apiConfig.js';
const origin = 'https://poultry-pro-pi.vercel.app';
// Empty or undefined backend in production allows frontend-only mode without error
for (const empty of [undefined, '', ' ']) {
  assert.equal(apiConfigurationError(empty, true, origin), '');
}

// Truly invalid/unsafe URLs in production are flagged
for (const bad of ['/api', 'backend.example.test', '//backend.example.test', 'https://localhost/api', 'https://127.1/api', 'https://127.0.0.2/api', 'https://[::1]/api', 'https://dev.localhost/api', 'https://0.0.0.0/api', 'http://localhost:5000/api', 'https://127.0.0.1/api', 'http://backend.example.test/api', 'https://[invalid', 'https://user:password@backend.example.test/api', 'https://backend.example.test?token=abc', 'https://backend.example.test/#api']) {
  assert.notEqual(apiConfigurationError(bad, true, origin), '');
}
assert.equal(apiConfigurationError('https://backend.example.test/api',true,origin),'');
assert.equal(apiConfigurationError('https://backend.example.test',true,origin),'');
assert.equal(apiConfigurationError(undefined,false,origin),'');
assert.equal(configuredApiBase({VITE_API_URL:' https://legacy.example.test '}),'https://legacy.example.test');
assert.equal(configuredApiBase({VITE_API_BASE_URL:' ',VITE_BACKEND_URL:'https://backend.example.test'}),'https://backend.example.test');
assert.equal(configuredApiBase({VITE_API_BASE_URL:'https://canonical.example.test',VITE_BACKEND_URL:'https://old.example.test',VITE_API_URL:'https://legacy.example.test'}),'https://canonical.example.test');
assert.equal(configuredApiBase({VITE_API_BASE_URL:'http://localhost',VITE_API_URL:'https://legacy.example.test'}),'http://localhost');

// Verify /api is never duplicated or missing
assert.equal(normalizeApiBaseUrl('https://example.com'), 'https://example.com/api');
assert.equal(normalizeApiBaseUrl('https://example.com/api'), 'https://example.com/api');
assert.equal(normalizeApiBaseUrl('https://example.com/api/'), 'https://example.com/api');
assert.equal(normalizeApiBaseUrl('http://localhost:5000'), 'http://localhost:5000/api');
assert.equal(normalizeApiBaseUrl('http://localhost:5000/api'), 'http://localhost:5000/api');
assert.equal(normalizeApiBaseUrl('/api'), '/api');
assert.equal(normalizeApiBaseUrl('/api/'), '/api');
const config = JSON.parse(await readFile(new URL('../../../vercel.json',import.meta.url)));
const match = new RegExp(`^${config.rewrites[0].source}$`);
for (const path of ['/','/admin','/admin/login','/admin/dashboard','/admin/subscriptions','/dashboard','/farm/flocks/123']) assert.ok(match.test(path),path);
for (const path of ['/api','/api/auth/admin/login','/assets/missing.js','/favicon.svg','/robots.txt','/missing.css']) assert.equal(match.test(path),false,path);
console.log('PASS production API configuration and Vercel SPA routes exclude API and asset requests');

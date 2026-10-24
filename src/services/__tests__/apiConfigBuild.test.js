import assert from 'node:assert/strict';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import viteConfig from '../../../vite.config.js';

// Evaluate the actual browser bundle, with a deployed page origin, to verify
// Vite substitutes environment variables and production flags at build time.
const keys = ['VITE_API_BASE_URL', 'VITE_BACKEND_URL', 'VITE_API_URL'];
const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
const previousWindow = globalThis.window;
const previousVercel = process.env.VERCEL;
try {
  globalThis.window = { location: { origin: 'https://frontend.example.test', hostname: 'frontend.example.test' } };
  for (const [key, value] of [
    ['VITE_API_BASE_URL', 'https://backend.example.test/'],
    ['VITE_API_URL', 'https://legacy.example.test/api/'],
    ['VITE_API_BASE_URL', 'http://localhost:5000/api'],
    ['VITE_API_BASE_URL', ''],
  ]) {
    for (const name of keys) process.env[name] = '';
    process.env[key] = value;
    process.env.VERCEL = '1';
    assert.doesNotThrow(() => viteConfig({ command: 'build', mode: 'production' }));
    const result = await build({
      configFile: false, envDir: false, logLevel: 'silent',
      build: {
        write: false, minify: false,
        lib: { entry: fileURLToPath(new URL('../apiConfig.js', import.meta.url)), formats: ['es'] },
      },
    });
    const chunk = result[0].output.find(item => item.type === 'chunk');
    const config = await import(`data:text/javascript;base64,${Buffer.from(chunk.code).toString('base64')}`);
    if (value.startsWith('https:')) {
      assert.equal(config.API_CONFIGURATION_ERROR, '');
      assert.equal(config.API_BASE_URL, `${value.replace(/\/+$/, '').replace(/\/api$/, '')}/api`);
      assert.equal(config.isBackendConfigured(), true);
    } else {
      // In deployed production, empty or localhost backend falls back safely to frontend-only mode
      assert.equal(config.API_BASE_URL, '');
      assert.equal(config.isBackendConfigured(), false);
    }
  }
} finally {
  globalThis.window = previousWindow;
  if (previousVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = previousVercel;
  for (const key of keys) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
}
console.log('PASS production Vite bundles embed canonical and legacy API URLs and reject missing/localhost configuration');

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const children = new Set();
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}

function start(script, cwd, args = []) {
  const child = spawn(process.execPath, [script, ...args], { cwd, stdio: 'inherit', windowsHide: true });
  children.add(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => {
    children.delete(child);
    if (!stopping) stop(code ?? 1);
  });
  return child;
}

async function backendIsRunning() {
  try {
    const response = await fetch('http://localhost:5000/health', { signal: AbortSignal.timeout(1000) });
    const data = await response.json();
    return response.ok && data.status === 'OK' && data.message?.includes('PoultryPro');
  } catch { return false; }
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

if (await backendIsRunning()) {
  console.log('Using the PoultryPro backend already running on port 5000.');
} else {
  start(resolve(root, 'backend/server.js'), resolve(root, 'backend'));
  const deadline = Date.now() + 20000;
  while (!stopping && !await backendIsRunning()) {
    if (Date.now() >= deadline) {
      console.error('Backend did not start on port 5000. Check its startup output and PORT setting.');
      stop(1);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

if (!stopping) start(resolve(root, 'node_modules/vite/bin/vite.js'), root, process.argv.slice(2));

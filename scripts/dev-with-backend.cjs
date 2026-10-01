const { spawn } = require('node:child_process');
const path = require('node:path');
const http = require('node:http');

const frontendDir = path.resolve(__dirname, '..');
const projectDir = path.resolve(frontendDir, '..');
const backendDir = path.join(projectDir, 'Backend');
let backend;
let vite;
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  if (vite && vite.exitCode === null) vite.kill();
  if (backend && backend.exitCode === null) backend.kill();
  process.exitCode = code;
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
function startBackend() {
  backend = spawn(process.execPath, ['server.js'], {
    cwd: backendDir,
    stdio: 'inherit',
    env: process.env,
  });
  backend.on('error', (error) => {
    console.error('Could not start the backend:', error.message);
    stop(1);
  });
  backend.on('exit', (code) => {
    if (!stopping) {
      console.error(`Backend stopped before the frontend was ready (exit ${code}).`);
      stop(code || 1);
    }
  });
}

function backendReady() {
  return new Promise((resolve) => {
    const request = http.get('http://127.0.0.1:3001/api/db-check', (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.setTimeout(1000, () => request.destroy());
    request.on('error', () => resolve(false));
  });
}

async function startFrontendWhenReady() {
  // Reuse a backend started separately; otherwise own the backend lifecycle.
  if (!(await backendReady())) startBackend();

  const deadline = Date.now() + 120_000;
  while (!stopping && Date.now() < deadline) {
    if (await backendReady()) {
      if (stopping) return;
      console.log('Database is ready; starting Vite.');
      vite = spawn(process.execPath, [
        path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js'),
        '--host', '127.0.0.1',
      ], { cwd: frontendDir, stdio: 'inherit', env: process.env });
      vite.on('error', (error) => {
        console.error('Could not start Vite:', error.message);
        stop(1);
      });
      vite.on('exit', (code) => stop(code || 0));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!stopping) {
    console.error('Backend did not become ready within 120 seconds. Check the database settings and backend output above.');
    stop(1);
  }
}

startFrontendWhenReady().catch((error) => {
  console.error('Local startup failed:', error);
  stop(1);
});

const { spawn } = require('node:child_process');
const http = require('node:http');

const PORT_CANDIDATES = Array.from({ length: 20 }, (_, index) => 4173 + index);

function waitForServer(port) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: '/',
        timeout: 1500,
      },
      (res) => {
        res.resume();
        resolve(port);
      }
    );

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

async function findAvailablePort() {
  for (const port of PORT_CANDIDATES) {
    const activePort = await waitForServer(port);
    if (activePort) {
      return activePort;
    }
  }

  return null;
}

async function main() {
  const port = await findAvailablePort();

  if (!port) {
    console.error('CareLink dev server did not start on the expected ports.');
    process.exit(1);
  }

  const electronExecutable = process.platform === 'win32'
    ? 'node_modules\\.bin\\electron.cmd'
    : 'node_modules/.bin/electron';

  const child = spawn(electronExecutable, ['electron/main.js'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, CARELINK_PORT: String(port) },
  });

  child.on('exit', (code) => process.exit(code ?? 0));
  child.on('error', (error) => {
    console.error(error);
    process.exit(1);
  });
}

main();

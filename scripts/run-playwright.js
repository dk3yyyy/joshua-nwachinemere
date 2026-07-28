import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolvePreviewPort } from './preview-port.js';

const require = createRequire(import.meta.url);
const playwrightCli = require.resolve('@playwright/test/cli');
const port = await resolvePreviewPort(process.env);
const host = '127.0.0.1';

console.log(`[playwright] isolated preview: http://${host}:${port}/joshua-nwachinemere/`);

const child = spawn(
  process.execPath,
  [playwrightCli, 'test', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port) },
  },
);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => child.kill(signal));
}

child.once('error', (error) => {
  console.error(`[playwright] failed to start: ${error.message}`);
  process.exitCode = 1;
});

child.once('exit', (code, signal) => {
  if (signal) {
    console.error(`[playwright] exited after ${signal}`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});

import { copyFile, mkdir, rm, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const temporaryDirectory = path.join(projectRoot, '.pages-worker-build');
const outputDirectory = path.join(projectRoot, 'dist');
const wranglerBinary = path.join(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler',
);

await rm(temporaryDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

const result = spawnSync(wranglerBinary, [
  'pages',
  'functions',
  'build',
  '--outdir',
  temporaryDirectory,
  '--build-output-directory',
  outputDirectory,
], {
  cwd: projectRoot,
  encoding: 'utf8',
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}
if (result.status !== 0) {
  throw new Error(`Pages Functions build failed with exit code ${result.status}.`);
}

const bundledWorker = path.join(temporaryDirectory, 'index.js');
const bundledWorkerStat = await stat(bundledWorker);
if (!bundledWorkerStat.isFile() || bundledWorkerStat.size === 0) {
  throw new Error('Wrangler did not produce a non-empty Pages Worker bundle.');
}

await copyFile(bundledWorker, path.join(outputDirectory, '_worker.js'));
await rm(temporaryDirectory, { recursive: true, force: true });
console.log('[pages-worker] wrote dist/_worker.js');

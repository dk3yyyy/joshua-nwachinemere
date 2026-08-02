import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const script = new URL('../scripts/apply-pages-environment.mjs', import.meta.url);
const sourceHeaders = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');

async function runForBranch(branch) {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-pages-env-'));
  await writeFile(join(directory, '_headers'), sourceHeaders);
  try {
    await execFileAsync(process.execPath, [script.pathname], {
      env: {
        ...process.env,
        CF_PAGES_BRANCH: branch,
        CF_PAGES_PRODUCTION_BRANCH: 'main',
        PAGES_OUTPUT_DIR: directory,
      },
    });
    return await readFile(join(directory, '_headers'), 'utf8');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('Pages preview builds remain noindex while production stays indexable', async () => {
  const [previewHeaders, productionHeaders] = await Promise.all([
    runForBranch('feature/assistant-update'),
    runForBranch('main'),
  ]);
  assert.match(previewHeaders, /X-Robots-Tag: noindex, nofollow/);
  assert.doesNotMatch(productionHeaders, /X-Robots-Tag:\s*(?:noindex|nofollow)/i);
});

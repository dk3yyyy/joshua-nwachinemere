#!/usr/bin/env node
// Runs the Python artifact tests with a project-local virtualenv when one exists.
// CI installs the pinned requirements into the active interpreter, so plain
// `python3` stays the fallback and no dependency is required just to run tests.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const candidates = [
  process.env.PYTHON,
  join(process.cwd(), '.venv', 'bin', 'python'),
  join(process.cwd(), '.venv', 'Scripts', 'python.exe'),
  'python3',
  'python',
].filter(Boolean);

const hasDocx = (interpreter) => spawnSync(interpreter, ['-c', 'import docx, pypdf'], { stdio: 'ignore' }).status === 0;

const interpreter = candidates.find((candidate) => {
  try {
    return hasDocx(candidate);
  } catch {
    return false;
  }
});

if (!interpreter) {
  console.error('[cv-tests] No Python interpreter with python-docx and pypdf found.');
  console.error('[cv-tests] Install them with: python3 -m pip install -r requirements-assets.txt');
  process.exit(1);
}

const result = spawnSync(
  interpreter,
  ['-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_cv_artifact.py', '-v'],
  { stdio: 'inherit' },
);

if (result.error) {
  console.error(`[cv-tests] Failed to start ${interpreter}: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);

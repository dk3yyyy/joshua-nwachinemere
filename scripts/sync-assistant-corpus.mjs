#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { SOURCE_REGISTRY } from '../src/assistant/corpus.js';
import { buildAssistantCorpus } from './lib/assistant-corpus-sync.mjs';

const output = resolve(process.argv[2] || 'src/assistant/corpus.generated.json');
const corpus = await buildAssistantCorpus(SOURCE_REGISTRY);
await writeFile(output, `${JSON.stringify(corpus, null, 2)}\n`, { mode: 0o644 });
console.log(JSON.stringify({
  output,
  sourceCount: corpus.sources.length,
  chunkCount: corpus.chunks.length,
  generatedAt: corpus.generatedAt,
}));

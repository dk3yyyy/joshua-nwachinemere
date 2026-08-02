import assert from 'node:assert/strict';
import test from 'node:test';

import backendData from '../src/assistant/backend-technologies.json' with { type: 'json' };

test('backend technology evidence is typed, source-linked, and separates non-backend tools', () => {
  assert.equal(backendData.version, 1);
  assert.equal(backendData.owner, 'dk3yyyy');
  assert.match(backendData.verifiedAt, /^2026-\d{2}-\d{2}$/);
  assert.equal(backendData.id, 'backend-technologies');
  assert.ok(backendData.categories.length >= 6);

  const technologies = new Set();
  const sourceUrls = new Set();
  for (const category of backendData.categories) {
    assert.match(category.relationship, /^direct-(?:owned-project|current-project)-use$/);
    assert.ok(category.technologies.length >= 2, category.name);
    assert.ok(category.sources.length >= 1, category.name);
    for (const technology of category.technologies) technologies.add(technology);
    for (const source of category.sources) {
      assert.ok(source.repository.startsWith('dk3yyyy/'));
      assert.ok(source.path.length > 2);
      assert.match(source.url, /^https:\/\/(?:github\.com\/dk3yyyy\/|assistant-review\.joshua-nwachinemere\.pages\.dev)/);
      if (source.commit !== 'working-tree-preview') {
        assert.match(source.commit, /^[a-f0-9]{40}$/);
        assert.ok(source.url.includes(source.commit));
      }
      sourceUrls.add(source.url);
    }
  }

  for (const expected of ['Python', 'FastAPI', 'asyncio', 'PostgreSQL', 'Redis', 'SQLAlchemy', 'n8n', 'Docker Compose', 'ChromaDB', 'Ollama', 'Node.js', 'Express', 'Socket.IO', 'Cloudflare Workers AI']) {
    assert.ok(technologies.has(expected), expected);
  }
  assert.ok(sourceUrls.size >= 9);
  for (const excluded of ['React', 'Vite', 'Streamlit UI', 'Playwright']) {
    assert.ok(backendData.notBackend.includes(excluded), excluded);
  }
});

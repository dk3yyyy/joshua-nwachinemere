import { createHash } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAssistantCorpus, htmlToText } from '../scripts/lib/assistant-corpus-sync.mjs';

function gitBlobSha(value) {
  const bytes = Buffer.from(value);
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}

function githubFixture(markdown = '# Example\n\nA durable queue preserves work across restart recovery and bounded retries.') {
  const sha = gitBlobSha(markdown);
  const gitUrl = `https://api.github.com/repos/dk3yyyy/example/git/blobs/${sha}`;
  return {
    sha,
    gitUrl,
    metadata: JSON.stringify({
      sha,
      git_url: gitUrl,
      download_url: 'https://raw.githubusercontent.com/dk3yyyy/example/main/README.md',
      html_url: 'https://github.com/dk3yyyy/example/blob/main/README.md',
    }),
    blob: JSON.stringify({ sha, encoding: 'base64', content: Buffer.from(markdown).toString('base64') }),
  };
}

test('HTML extraction removes scripts, controls, and markup while preserving visible source text', () => {
  const text = htmlToText('<html><head><style>.x{}</style><script>steal()</script></head><body><h1>VolyxAI</h1><p>Controlled workflows &amp; human approval.</p><button>Request a review</button></body></html>');
  assert.match(text, /VolyxAI/);
  assert.match(text, /Controlled workflows & human approval/);
  assert.doesNotMatch(text, /steal|\.x\{|<h1>|Request a review/);
});

test('corpus build fetches and verifies the immutable GitHub blob version', async () => {
  const registry = [
    { id: 'site', title: 'Official site', kind: 'webpage', url: 'https://example.com/', trust: 'official_site', answerPolicy: 'verified_public' },
    { id: 'readme', title: 'Approved project', kind: 'github_readme', repository: 'dk3yyyy/example', url: 'https://github.com/dk3yyyy/example', trust: 'owner_readme', answerPolicy: 'descriptive_only' },
  ];
  const github = githubFixture();
  const responses = new Map([
    ['https://example.com/', { body: '<main><h1>Official site</h1><p>A controlled workflow keeps people in control, validates required details, and sends consequential actions to a human approval gate.</p></main>', contentType: 'text/html' }],
    ['https://api.github.com/repos/dk3yyyy/example/readme', { body: github.metadata, contentType: 'application/json' }],
    [github.gitUrl, { body: github.blob, contentType: 'application/json' }],
  ]);
  const fakeFetch = async (url) => {
    const entry = responses.get(url);
    if (!entry) return new Response('missing', { status: 404 });
    return new Response(entry.body, { status: 200, headers: { 'content-type': entry.contentType } });
  };

  const corpus = await buildAssistantCorpus(registry, { fetchImpl: fakeFetch, generatedAt: '2026-08-01T00:00:00.000Z', maxChars: 300 });
  assert.equal(corpus.schemaVersion, 1);
  assert.equal(corpus.generatedAt, '2026-08-01T00:00:00.000Z');
  assert.equal(corpus.sources.length, 2);
  assert.equal(corpus.sources.find(({ id }) => id === 'readme').version, github.sha);
  assert.match(corpus.sources.find(({ id }) => id === 'site').contentSha256, /^[a-f0-9]{64}$/);
  assert.ok(corpus.chunks.some(({ sourceId, text }) => sourceId === 'readme' && /restart recovery/.test(text)));
  assert.ok(corpus.chunks.every(({ sourceId }) => ['site', 'readme'].includes(sourceId)));
  assert.equal(new Set(corpus.chunks.map(({ text }) => text)).size, corpus.chunks.length);
  assert.doesNotMatch(JSON.stringify(corpus), /remote title|undefined/);
});

test('corpus build rejects a README blob URL outside the approved repository', async () => {
  const registry = [{ id: 'readme', title: 'Approved project', kind: 'github_readme', repository: 'dk3yyyy/example', url: 'https://github.com/dk3yyyy/example', trust: 'owner_readme', answerPolicy: 'descriptive_only' }];
  const github = githubFixture();
  const metadata = JSON.parse(github.metadata);
  metadata.git_url = `https://api.github.com/repos/attacker/example/git/blobs/${github.sha}`;
  await assert.rejects(
    buildAssistantCorpus(registry, { fetchImpl: async () => new Response(JSON.stringify(metadata), { status: 200 }) }),
    /unsafe.*blob|repository/i,
  );
});

test('corpus build rejects README content whose Git blob hash does not match metadata', async () => {
  const registry = [{ id: 'readme', title: 'Approved project', kind: 'github_readme', repository: 'dk3yyyy/example', url: 'https://github.com/dk3yyyy/example', trust: 'owner_readme', answerPolicy: 'descriptive_only' }];
  const github = githubFixture();
  const fakeFetch = async (url) => new Response(
    url.endsWith('/readme') ? github.metadata : JSON.stringify({ sha: github.sha, encoding: 'base64', content: Buffer.from('tampered content long enough for ingestion').toString('base64') }),
    { status: 200 },
  );
  await assert.rejects(buildAssistantCorpus(registry, { fetchImpl: fakeFetch }), /hash|version|sha/i);
});

test('corpus build rejects redirects instead of following them across trust boundaries', async () => {
  const registry = [{ id: 'site', title: 'Site', kind: 'webpage', url: 'https://example.com/', trust: 'official_site', answerPolicy: 'verified_public' }];
  const fakeFetch = async (_url, options) => {
    assert.equal(options.redirect, 'manual');
    return new Response('', { status: 302, headers: { location: 'https://attacker.example/' } });
  };
  await assert.rejects(buildAssistantCorpus(registry, { fetchImpl: fakeFetch }), /redirect/i);
});

test('corpus build rejects oversized remote source bodies', async () => {
  const registry = [{ id: 'site', title: 'Site', kind: 'webpage', url: 'https://example.com/', trust: 'official_site', answerPolicy: 'verified_public' }];
  await assert.rejects(
    buildAssistantCorpus(registry, { fetchImpl: async () => new Response('x'.repeat(1_100_000), { status: 200 }) }),
    /too large|size/i,
  );
});

test('corpus build fails closed when an approved source is unavailable', async () => {
  const registry = [{ id: 'site', title: 'Site', kind: 'webpage', url: 'https://example.com/', trust: 'official_site', answerPolicy: 'verified_public' }];
  await assert.rejects(
    buildAssistantCorpus(registry, { fetchImpl: async () => new Response('no', { status: 503 }) }),
    /site.*503/i,
  );
});

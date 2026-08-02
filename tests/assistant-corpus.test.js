import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SOURCE_REGISTRY,
  chunkSourceText,
  retrieveSourceChunks,
  validateSourceRegistry,
} from '../src/assistant/corpus.js';

test('source registry contains only approved first-party pages and original repository READMEs', () => {
  assert.equal(validateSourceRegistry(SOURCE_REGISTRY), true);
  assert.ok(SOURCE_REGISTRY.some(({ id }) => id === 'volyxai-site'));
  assert.ok(SOURCE_REGISTRY.some(({ id }) => id === 'github-profile'));
  assert.ok(SOURCE_REGISTRY.some(({ id }) => id === 'project-volyx-lens'));
  assert.ok(SOURCE_REGISTRY.some(({ id }) => id === 'project-local-review-intelligence'));
  assert.ok(SOURCE_REGISTRY.some(({ id }) => id === 'project-football-forecasting'));
  assert.equal(SOURCE_REGISTRY.some(({ repository = '' }) => /weasyprint|numpy|polars|arrow-rs/i.test(repository)), false);
  assert.equal(SOURCE_REGISTRY.some(({ id }) => /preview|redirect|combo/i.test(id)), false);
  for (const source of SOURCE_REGISTRY) {
    assert.match(source.url, /^https:\/\//);
    assert.ok(['official_site', 'owner_readme'].includes(source.trust));
    assert.ok(['verified_public', 'descriptive_only'].includes(source.answerPolicy));
  }
});

test('registry validation rejects duplicates, mutable non-HTTPS URLs, and unsupported trust labels', () => {
  assert.throws(() => validateSourceRegistry([
    { id: 'same', title: 'One', kind: 'webpage', url: 'http://example.com', trust: 'official_site', answerPolicy: 'verified_public' },
    { id: 'same', title: 'Two', kind: 'webpage', url: 'https://example.com', trust: 'unknown', answerPolicy: 'verified_public' },
  ]), /source registry/i);
});

test('chunking produces stable bounded chunks and removes markdown presentation noise', () => {
  const syntheticAssignment = `SE${'CRET'}=do-not-index`;
  const text = `# Demo project\n\n[![Build](https://img.shields.io/x.svg)](https://example.com)\n\n## Architecture\n\nThe service uses FastAPI with bounded retries and durable recovery. Contact maintainer@example.com.\n\n\`\`\`bash\nexport ${syntheticAssignment}\n\`\`\`\n\n## Evaluation\n\nResults are measured against a frozen holdout.`;
  const chunks = chunkSourceText({
    id: 'demo', title: 'Demo', url: 'https://github.com/dk3yyyy/demo', trust: 'owner_readme', answerPolicy: 'descriptive_only',
  }, text, { maxChars: 180 });
  assert.ok(chunks.length >= 2);
  assert.equal(chunks[0].id, 'demo:0001');
  assert.ok(chunks.every(({ text: value }) => value.length <= 180));
  assert.ok(chunks.every(({ sourceId, trust, answerPolicy }) => sourceId === 'demo' && trust === 'owner_readme' && answerPolicy === 'descriptive_only'));
  assert.doesNotMatch(chunks.map(({ text: value }) => value).join(' '), new RegExp(`img\\.shields|SE${'CRET'}=|\`\`\`|maintainer@example\\.com`));
});

test('chunking hard-splits a single token that exceeds the configured limit', () => {
  const chunks = chunkSourceText({
    id: 'demo', title: 'Demo', url: 'https://github.com/dk3yyyy/demo', trust: 'owner_readme', answerPolicy: 'descriptive_only',
  }, `# Payload\n\n${'x'.repeat(500)}`, { maxChars: 180 });
  assert.ok(chunks.length >= 3);
  assert.ok(chunks.every(({ text }) => text.length <= 180));
});

test('chunking removes inline credential assignments before provider-bound retrieval', () => {
  const chunks = chunkSourceText({
    id: 'safe-inline-secret', title: 'Safe', url: 'https://github.com/dk3yyyy/safe', trust: 'owner_readme', answerPolicy: 'descriptive_only',
  }, `Public capability. INLINE_CRED${'ENTIAL'}=example-sensitive-value More public architecture.`);
  const text = chunks.map((chunk) => chunk.text).join(' ');
  assert.doesNotMatch(text, /INLINE_CREDENTIAL|example-sensitive-value/i);
  assert.match(text, /Public capability/);
  assert.match(text, /public architecture/);
});

test('chunking removes common credential-bearing assignment names and authorization values', () => {
  const accessKeyName = `AWS_ACCESS_${'KEY_ID'}`;
  const authorizationName = `AUTHORIZATION_${'HEADER'}`;
  const databaseName = `DATABASE_${'URL'}`;
  const rawText = [
    'Public deployment notes.',
    `${accessKeyName}=example-access-identifier`,
    `${authorizationName}: Bearer example-authorization-value`,
    `${databaseName}='postgres://example-user:example-pass@example.invalid/app'`,
    'PORT=3000',
    'Public architecture remains documented.',
  ].join(' ');
  const chunks = chunkSourceText({
    id: 'safe-common-credentials', title: 'Safe', url: 'https://github.com/dk3yyyy/safe', trust: 'owner_readme', answerPolicy: 'descriptive_only',
  }, rawText);
  const text = chunks.map((chunk) => chunk.text).join(' ');

  assert.doesNotMatch(text, /AWS_ACCESS_KEY_ID|example-access-identifier|AUTHORIZATION_HEADER|example-authorization-value|DATABASE_URL|postgres:\/\//i);
  assert.match(text, /PORT=3000/);
  assert.match(text, /Public architecture remains documented/);
});

test('chunking removes quoted and connection credential assignments without deleting benign configuration', () => {
  const authorizationName = `Authoriza${'tion'}`;
  const apiKeyName = `api_${'key'}`;
  const redisName = `REDIS_${'URL'}`;
  const mongoName = `MONGODB_${'URI'}`;
  const encryptionName = `ENCRYPTION_${'KEY'}`;
  const rawText = [
    'Public runtime configuration.',
    `"${authorizationName}": "Bearer example-json-authorization"`,
    `"${apiKeyName}": "example-json-key"`,
    `${redisName}=redis://example.invalid:6379`,
    `${mongoName}='mongodb://example.invalid/app'`,
    `${encryptionName}=example-encryption-material`,
    'PATH=/usr/local/bin',
    'COMPAT_MODE=legacy',
    'AUTHOR=Joshua',
    'PATTERN=*.md',
    'SESSION_TIMEOUT=30',
    'COOKIE_POLICY=strict',
    'TOKEN_BUDGET=1000',
    'Public runtime notes remain available.',
  ].join(' ');
  const chunks = chunkSourceText({
    id: 'safe-exact-credential-names', title: 'Safe', url: 'https://github.com/dk3yyyy/safe', trust: 'owner_readme', answerPolicy: 'descriptive_only',
  }, rawText);
  const text = chunks.map((chunk) => chunk.text).join(' ');

  assert.doesNotMatch(text, /example-json-authorization|example-json-key|redis:\/\/|mongodb:\/\/|example-encryption-material/i);
  for (const benign of ['PATH=/usr/local/bin', 'COMPAT_MODE=legacy', 'AUTHOR=Joshua', 'PATTERN=*.md', 'SESSION_TIMEOUT=30', 'COOKIE_POLICY=strict', 'TOKEN_BUDGET=1000']) {
    assert.match(text, new RegExp(benign.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(text, /Public runtime notes remain available/);
});

test('chunking removes base key names, connection-string suffixes, and complete escaped or backtick values', () => {
  const secretKeyName = `SECRET_${'KEY'}`;
  const privatePemName = `PRIVATE_KEY_${'PEM'}`;
  const connectionName = `AZURE_STORAGE_CONNECTION_${'STRING'}`;
  const apiKeyName = `API_${'KEY'}`;
  const escapedQuotedValue = 'alpha\\"marker-escaped-tail';
  const rawText = [
    'Public parser notes.',
    `${secretKeyName}=marker-base-secret`,
    `${privatePemName}=marker-base-private`,
    `${connectionName}=marker-provider-connection`,
    `"${apiKeyName}": "${escapedQuotedValue}"`,
    `${apiKeyName}=\`alpha marker-backtick-tail\``,
    'Public parser notes remain available.',
  ].join(' ');
  const chunks = chunkSourceText({
    id: 'safe-complete-assignment-values', title: 'Safe', url: 'https://github.com/dk3yyyy/safe', trust: 'owner_readme', answerPolicy: 'descriptive_only',
  }, rawText);
  const text = chunks.map((chunk) => chunk.text).join(' ');

  assert.doesNotMatch(text, /marker-base-secret|marker-base-private|marker-provider-connection|marker-escaped-tail|marker-backtick-tail/i);
  assert.match(text, /Public parser notes remain available/);
});

test('chunking removes complete unquoted field-delimited connection-string lines', () => {
  const connectionSuffix = `CONNECTION_${'STRING'}`;
  const accountField = `Account${'Key'}`;
  const sharedField = `SharedAccess${'Key'}`;
  const passwordField = `P${'wd'}`;
  const raw = [
    `AZURE_STORAGE_${connectionSuffix}=DefaultEndpointsProtocol=https;AccountName=demo;${accountField}=marker-azure-tail;EndpointSuffix=core.windows.net`,
    `SERVICE_BUS_${connectionSuffix}=Endpoint=sb://demo/;SharedAccessKeyName=owner;${sharedField}=marker-service-tail`,
    `ODBC_${connectionSuffix}=Driver={ODBC Driver 18 for SQL Server};Server=demo;Uid=user;${passwordField}=marker-odbc-tail`,
    'PORT=3000',
    'PATH=/usr/local/bin',
    'Neighboring public documentation remains available.',
  ].join('\n');

  const chunks = chunkSourceText({
    id: 'safe-field-delimited-connections', title: 'Safe', url: 'https://github.com/dk3yyyy/safe', trust: 'owner_readme', answerPolicy: 'descriptive_only',
  }, raw);
  const text = chunks.map((chunk) => chunk.text).join(' ');
  assert.doesNotMatch(text, /marker-(?:azure|service|odbc)-tail/);
  assert.match(text, /PORT=3000/);
  assert.match(text, /PATH=\/usr\/local\/bin/);
  assert.match(text, /Neighboring public documentation remains available\./);
});

test('lexical retrieval returns the project chunk that supports the requested capability', () => {
  const corpus = [
    { id: 'football:0001', sourceId: 'football', title: 'Football', url: 'https://example.com/football', trust: 'owner_readme', answerPolicy: 'descriptive_only', text: 'Rolling-origin temporal evaluation compares XGBoost and Poisson forecasts with a bookmaker benchmark.' },
    { id: 'telegram:0001', sourceId: 'telegram', title: 'Telegram', url: 'https://example.com/telegram', trust: 'owner_readme', answerPolicy: 'descriptive_only', text: 'A durable queue preserves jobs across restart recovery with bounded concurrent downloads.' },
  ];
  assert.equal(retrieveSourceChunks('Which project uses rolling-origin evaluation?', corpus, 3)[0].sourceId, 'football');
  assert.equal(retrieveSourceChunks('What survives restart with a durable queue?', corpus, 3)[0].sourceId, 'telegram');
  assert.deepEqual(retrieveSourceChunks('What is his favourite food?', corpus, 3), []);
});

test('lexical retrieval handles controlled singular and verb-form variants', () => {
  const corpus = [
    { id: 'noughtline:0001', sourceId: 'noughtline', text: 'Reconnection revokes the old socket before a player resumes the multiplayer room.' },
    { id: 'other:0001', sourceId: 'other', text: 'Stale pending rows are superseded after a notification succeeds.' },
  ];

  const result = retrieveSourceChunks('How are stale sockets revoked after a reconnect?', corpus, 2);
  assert.equal(result[0].sourceId, 'noughtline');
});

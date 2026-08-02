import assert from 'node:assert/strict';
import test from 'node:test';
import contributionData from '../src/assistant/contributions.json' with { type: 'json' };

const REQUIRED_TEXT_FIELDS = [
  'problem',
  'change',
  'tests',
  'reviewEvolution',
  'outcome',
  'limitations',
  'keywords',
];

test('merged-contribution evidence is complete, unique and source-linked', () => {
  const records = contributionData.contributions;
  assert.equal(contributionData.version, 1);
  assert.equal(contributionData.author, 'dk3yyyy');
  assert.equal(records.length, 9);

  assert.equal(new Set(records.map(({ id }) => id)).size, records.length);
  assert.equal(new Set(records.map(({ repository, prNumber }) => `${repository}#${prNumber}`)).size, records.length);

  for (const record of records) {
    assert.match(record.id, /^oss-[a-z0-9-]+-\d+$/);
    assert.equal(record.author, 'dk3yyyy');
    assert.equal(record.state, 'merged');
    assert.match(record.mergedAt, /^2026-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    assert.match(record.mergeCommitSha, /^[a-f0-9]{40}$/);
    assert.equal(record.url, `https://github.com/${record.repository}/pull/${record.prNumber}`);
    if (record.linkedIssueUrl !== null) {
      assert.match(record.linkedIssueUrl, /^https:\/\/github\.com\/.+\/(?:issues|pull)\/\d+$/);
    }
    for (const field of REQUIRED_TEXT_FIELDS) {
      assert.equal(typeof record[field], 'string', `${record.id}.${field}`);
      assert.ok(record[field].trim().length >= 12, `${record.id}.${field}`);
    }
  }
});

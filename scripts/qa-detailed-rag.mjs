#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { detailedEvidenceRecords } from '../src/assistant/detailed-evidence.js';
import { retrieveEvidence } from '../src/assistant/detailed-retrieval.js';
import {
  canonicalizeJson,
  createDetailedCorpusIntegrityManifest,
} from './detailed-corpus-integrity.mjs';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function hashNamedSources(sources) {
  const files = [...sources]
    .map(({ source, content }) => ({ source, sha256: sha256(content) }))
    .sort((left, right) => left.source.localeCompare(right.source));
  return {
    algorithm: 'sha256',
    sha256: sha256(canonicalizeJson(files)),
    files,
  };
}

function argumentsFrom(argv) {
  const options = {
    mode: 'retrieval',
    suite: 'tests/fixtures/assistant-detailed-evaluation.json',
    output: 'artifacts/qa-detailed-lexical-report.json',
    baseUrl: process.env.QA_BASE_URL || 'http://127.0.0.1:8788',
    delayMs: Number(process.env.QA_DELAY_MS || 650),
    semanticPath: process.env.QA_QUERY_EMBEDDINGS || null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--mode') options.mode = argv[++index];
    else if (value === '--suite') options.suite = argv[++index];
    else if (value === '--out') options.output = argv[++index];
    else if (value === '--base-url') options.baseUrl = argv[++index];
    else if (value === '--delay-ms') options.delayMs = Number(argv[++index]);
    else if (value === '--semantic') options.semanticPath = argv[++index] || 'artifacts/qa-query-embeddings.json';
  }
  if (!['retrieval', 'endpoint'].includes(options.mode)) throw new Error(`Unsupported mode: ${options.mode}`);
  return options;
}

function asSet(values) {
  return new Set(Array.isArray(values) ? values : []);
}

function overlap(left, right) {
  for (const value of left) if (right.has(value)) return true;
  return false;
}

function scoreEvidenceIds(evidenceIds, expect = {}) {
  const actual = asSet(evidenceIds);
  const all = asSet(expect.all);
  const any = asSet(expect.any);
  const forbidden = asSet(expect.forbidden);
  const reasons = [];

  if (expect.abstain === true && actual.size !== 0) reasons.push('expected-abstention');
  if (expect.abstain !== true && actual.size === 0) reasons.push('unexpected-abstention');
  for (const id of all) if (!actual.has(id)) reasons.push(`missing:${id}`);
  if (any.size && !overlap(actual, any)) reasons.push('missing-any-expected');
  if (overlap(actual, forbidden)) reasons.push('forbidden-evidence');

  return { passed: reasons.length === 0, reasons };
}

function answerChecks(payload, expect) {
  const reasons = [];
  const answer = typeof payload?.answer === 'string' ? payload.answer.trim() : '';
  const citations = Array.isArray(payload?.citations) ? payload.citations : [];
  if (!answer) reasons.push('missing-answer');
  if (answer.length > 1400) reasons.push('answer-too-long');
  if (/<\/?(?:script|iframe|object|style|svg|form)\b/i.test(answer)) reasons.push('unsafe-markup');
  if (/system prompt|api[_ -]?key|secret binding/i.test(answer) && expect?.allowsSecurityDiscussion !== true) {
    reasons.push('possible-secret-or-prompt-leak');
  }
  if (expect?.abstain === true && citations.length) reasons.push('abstention-has-citations');
  if (expect?.abstain !== true) {
    if (!citations.length) reasons.push('answered-without-citations');
    for (const citation of citations) {
      if (!citation?.id || !citation?.title || !citation?.href) reasons.push('malformed-citation');
    }
  }
  return reasons;
}

function groupMetrics(results, key) {
  const groups = new Map();
  for (const result of results) {
    const name = result[key] || 'unspecified';
    const current = groups.get(name) || { total: 0, passed: 0 };
    current.total += 1;
    if (result.passed) current.passed += 1;
    groups.set(name, current);
  }
  return Object.fromEntries([...groups].map(([name, value]) => [name, {
    ...value,
    passRate: value.total ? value.passed / value.total : 0,
  }]));
}

function buildReport(suite, mode, results, startedAt, elapsedMs, provenance = null) {
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  const bySplit = groupMetrics(results, 'split');
  const report = {
    suiteVersion: suite.suiteVersion,
    kbVersion: suite.kbVersion,
    mode,
    startedAt,
    elapsedMs: Math.round(elapsedMs),
    ...(provenance ? { provenance } : {}),
    totals: {
      cases: results.length,
      passed,
      failed,
      passRate: results.length ? passed / results.length : 0,
    },
    bySplit,
    byStrategy: groupMetrics(results, 'strategy'),
    byCategory: groupMetrics(results, 'category'),
    failures: results.filter((result) => !result.passed),
    leakagePolicy: suite.leakagePolicy ?? null,
  };

  const gates = suite.gates || {};
  const gateFailures = [];
  if (gates.minimumOverallPassRate && report.totals.passRate < gates.minimumOverallPassRate) {
    gateFailures.push('overall-pass-rate');
  }
  if (gates.minimumHoldoutPassRate && (bySplit.holdout?.passRate ?? 0) < gates.minimumHoldoutPassRate) {
    gateFailures.push('holdout-pass-rate');
  }
  if (gates.requireAllRegressionCases && results.some((result) => result.regression && !result.passed)) {
    gateFailures.push('regression-case-failed');
  }
  if (mode === 'endpoint' && provenance?.endpoint?.attested !== true) {
    gateFailures.push('endpoint-build-unattested');
  }
  report.gates = { passed: gateFailures.length === 0, failures: gateFailures, configured: gates };
  return report;
}

function validateSuiteCorpusBinding(suite, integrity, computedIntegrity = null) {
  if (suite.kbVersion !== integrity?.kbVersion) {
    throw new Error('Q&A suite knowledge-base version does not match the reviewed corpus manifest.');
  }
  if (integrity?.digest?.algorithm !== 'sha256'
    || !/^[a-f0-9]{64}$/.test(String(integrity?.digest?.value ?? ''))) {
    throw new Error('Reviewed corpus manifest must contain a valid SHA-256 digest.');
  }
  if (suite.corpusDigest !== integrity.digest.value) {
    throw new Error('Q&A suite corpus digest does not match the reviewed corpus manifest.');
  }
  if (computedIntegrity && canonicalizeJson(integrity) !== canonicalizeJson(computedIntegrity)) {
    throw new Error('Reviewed corpus integrity manifest is stale.');
  }
  return { suite, integrity };
}

function validateSemanticDocument(document, expected) {
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new Error('Semantic artifact must be a JSON object.');
  }
  if (document.suiteVersion !== expected.suiteVersion) throw new Error('Semantic artifact suite version mismatch.');
  if (document.suiteDigest !== expected.suiteDigest) throw new Error('Semantic artifact suite digest mismatch.');
  if (document.kbVersion !== expected.kbVersion) throw new Error('Semantic artifact knowledge-base version mismatch.');
  if (document.corpusDigest !== expected.corpusDigest) throw new Error('Semantic artifact corpus digest mismatch.');
  if (!document.scoresByCase || typeof document.scoresByCase !== 'object' || Array.isArray(document.scoresByCase)) {
    throw new Error('Semantic artifact must contain a scoresByCase object.');
  }

  const expectedCaseIds = expected.caseIds ? new Set(expected.caseIds) : null;
  const expectedRecordIds = expected.recordIds ? new Set(expected.recordIds) : null;
  const actualCaseIds = Object.keys(document.scoresByCase);
  if (expectedCaseIds) {
    const missing = [...expectedCaseIds].filter((id) => !Object.hasOwn(document.scoresByCase, id));
    const unknown = actualCaseIds.filter((id) => !expectedCaseIds.has(id));
    if (missing.length || unknown.length) {
      throw new Error(`Semantic artifact case coverage mismatch (missing: ${missing.length}; unknown: ${unknown.length}).`);
    }
  }

  for (const caseId of actualCaseIds) {
    const scores = document.scoresByCase[caseId];
    if (!scores || typeof scores !== 'object' || Array.isArray(scores) || !Object.keys(scores).length) {
      throw new Error(`Semantic artifact has an invalid score map for case ${caseId}.`);
    }
    for (const [recordId, score] of Object.entries(scores)) {
      if (expectedRecordIds && !expectedRecordIds.has(recordId)) {
        throw new Error(`Semantic artifact references unknown evidence id ${recordId}.`);
      }
      if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) {
        throw new Error(`Semantic artifact has an invalid score for ${caseId}/${recordId}.`);
      }
    }
  }
  return document;
}

function semanticScoresForCase(testCase, semanticDocument = null) {
  const scores = semanticDocument?.scoresByCase?.[testCase.id];
  return scores && typeof scores === 'object' && !Array.isArray(scores) ? scores : null;
}

async function runRetrievalCase(testCase, records, semanticDocument = null) {
  const started = performance.now();
  if (testCase.request?.expectReject) {
    return {
      id: testCase.id,
      split: testCase.split,
      strategy: testCase.strategy,
      category: testCase.category,
      regression: Boolean(testCase.regression),
      passed: true,
      reasons: ['transport-only-skipped'],
      evidenceIds: [],
      latencyMs: 0,
    };
  }
  const matches = retrieveEvidence(testCase.question, records, {
    limit: testCase.limit || 8,
    semanticScores: semanticScoresForCase(testCase, semanticDocument),
  });
  const evidenceIds = matches.map((match) => match.record?.id ?? match.id).filter(Boolean);
  const score = scoreEvidenceIds(evidenceIds, testCase.expect);
  return {
    id: testCase.id,
    split: testCase.split,
    strategy: testCase.strategy,
    category: testCase.category,
    regression: Boolean(testCase.regression),
    passed: score.passed,
    reasons: score.reasons,
    evidenceIds,
    latencyMs: Math.round((performance.now() - started) * 100) / 100,
  };
}

async function runEndpointCase(testCase, options) {
  const started = performance.now();
  const response = await fetch(new URL('/api/ask', options.baseUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question: testCase.question }),
  });
  const payload = await response.json().catch(() => null);
  const evidenceIds = Array.isArray(payload?.evidenceIds) ? payload.evidenceIds : [];
  const scored = scoreEvidenceIds(evidenceIds, testCase.expect);
  const reasons = [...scored.reasons, ...answerChecks(payload, testCase.expect)];
  if (response.status === 429 || response.status === 403) reasons.push(`rate-limited:${response.status}`);
  else if (!response.ok) reasons.push(`http:${response.status}`);
  return {
    id: testCase.id,
    split: testCase.split,
    strategy: testCase.strategy,
    category: testCase.category,
    regression: Boolean(testCase.regression),
    passed: reasons.length === 0,
    reasons,
    status: response.status,
    outcome: payload?.outcome,
    evidenceIds,
    latencyMs: Math.round((performance.now() - started) * 100) / 100,
  };
}

function validateSuite(suite) {
  if (!suite || !Array.isArray(suite.cases)) throw new Error('Suite must contain a cases array');
  if (suite.cases.length < 200) throw new Error(`Q&A suite must contain at least 200 cases; received ${suite.cases.length}`);
  const ids = new Set();
  const questions = new Set();
  for (const testCase of suite.cases) {
    if (!testCase.id || ids.has(testCase.id)) throw new Error(`Duplicate or missing case id: ${testCase.id}`);
    if (!testCase.question || questions.has(testCase.question.toLowerCase())) {
      throw new Error(`Duplicate or missing question: ${testCase.question}`);
    }
    if (!['development', 'holdout', 'adversarial'].includes(testCase.split)) {
      throw new Error(`Invalid split for ${testCase.id}`);
    }
    if (!testCase.strategy || !testCase.category || !testCase.expect) throw new Error(`Incomplete case: ${testCase.id}`);
    ids.add(testCase.id);
    questions.add(testCase.question.toLowerCase());
  }
  return suite;
}

async function main() {
  const options = argumentsFrom(process.argv.slice(2));
  const suitePath = resolve(options.suite);
  const suiteRaw = await readFile(suitePath, 'utf8');
  const suite = validateSuite(JSON.parse(suiteRaw));
  const records = options.mode === 'retrieval' ? detailedEvidenceRecords : null;
  const integrityRaw = await readFile(new URL('../knowledge/detailed-evidence.integrity.json', import.meta.url), 'utf8');
  const integrity = JSON.parse(integrityRaw);
  const corpusRaw = await readFile(new URL('../knowledge/detailed-evidence.json', import.meta.url), 'utf8');
  const computedIntegrity = createDetailedCorpusIntegrityManifest(JSON.parse(corpusRaw));
  validateSuiteCorpusBinding(suite, integrity, computedIntegrity);
  const semanticPath = options.semanticPath ? resolve(options.semanticPath) : null;
  const semanticRaw = options.mode === 'retrieval' && semanticPath
    ? await readFile(semanticPath, 'utf8')
    : null;
  const semanticDocument = semanticRaw ? validateSemanticDocument(JSON.parse(semanticRaw), {
    suiteVersion: suite.suiteVersion,
    suiteDigest: sha256(suiteRaw),
    kbVersion: suite.kbVersion,
    corpusDigest: integrity.digest?.value,
    caseIds: suite.cases.map(({ id }) => id),
    recordIds: records.map(({ id }) => id),
  }) : null;
  const evaluatorRaw = await readFile(new URL(import.meta.url), 'utf8');
  const implementationSources = [
    { source: 'scripts/qa-detailed-rag.mjs', content: evaluatorRaw },
    {
      source: 'scripts/detailed-corpus-integrity.mjs',
      content: await readFile(new URL('./detailed-corpus-integrity.mjs', import.meta.url), 'utf8'),
    },
    {
      source: 'src/assistant/detailed-evidence.js',
      content: await readFile(new URL('../src/assistant/detailed-evidence.js', import.meta.url), 'utf8'),
    },
    {
      source: 'src/assistant/detailed-retrieval.js',
      content: await readFile(new URL('../src/assistant/detailed-retrieval.js', import.meta.url), 'utf8'),
    },
    {
      source: 'src/assistant/security-normalization.js',
      content: await readFile(new URL('../src/assistant/security-normalization.js', import.meta.url), 'utf8'),
    },
  ];
  const provenance = {
    evaluator: { source: 'scripts/qa-detailed-rag.mjs', sha256: sha256(evaluatorRaw) },
    implementation: hashNamedSources(implementationSources),
    suite: { source: options.suite, sha256: sha256(suiteRaw) },
    corpus: {
      source: 'knowledge/detailed-evidence.json',
      kbVersion: integrity.kbVersion,
      sha256: integrity.digest?.value,
    },
    endpoint: options.mode === 'endpoint' ? {
      baseUrl: options.baseUrl,
      attested: false,
      reason: 'The endpoint response does not cryptographically attest its build or corpus.',
    } : null,
    semantic: semanticRaw ? {
      source: options.semanticPath,
      sha256: sha256(semanticRaw),
      coveredCases: Object.keys(semanticDocument.scoresByCase).length,
    } : null,
  };
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const results = [];

  for (const testCase of suite.cases) {
    const result = options.mode === 'retrieval'
      ? await runRetrievalCase(testCase, records, semanticDocument)
      : await runEndpointCase(testCase, options);
    results.push(result);
    if (options.mode === 'endpoint' && options.delayMs > 0) {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, options.delayMs));
    }
  }

  const report = buildReport(suite, options.mode, results, startedAt, performance.now() - started, provenance);
  const outputPath = resolve(options.output);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ outputPath, ...report.totals, gates: report.gates }, null, 2));
  if (!report.gates.passed) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

export {
  answerChecks,
  buildReport,
  hashNamedSources,
  runRetrievalCase,
  scoreEvidenceIds,
  semanticScoresForCase,
  validateSemanticDocument,
  validateSuite,
  validateSuiteCorpusBinding,
};

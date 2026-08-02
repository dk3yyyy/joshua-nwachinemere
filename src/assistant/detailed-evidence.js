import evidenceDocument from '../../knowledge/detailed-evidence.json' with { type: 'json' };
import { retrieveEvidence as retrieveReviewedEvidence } from './detailed-retrieval.js';

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EXPECTED_KB_VERSION = '2026.08.01-v1';
const EXPECTED_RESEARCH_CUTOFF = '2026-08-01';
const EXPECTED_RECORD_COUNT = 75;
const CONFIDENCE = new Set(['verified', 'owner-confirmed', 'qualified', 'historical', 'high', 'medium', 'low']);
const UNSAFE_EVIDENCE = /(?:ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions|system\s*prompt|developer\s*message|reveal\s+(?:the\s+)?(?:secret|api[_ -]?key)|<\/?(?:script|iframe|object|embed|style|form)\b|javascript:)/i;
const APPROVED_EXTERNAL_PULL_REQUESTS = new Set([
  'ag2ai/faststream',
  'apache/arrow-rs',
  'calkit/calkit',
  'faststream-community/faststream_fastapi',
  'generative-computing/mellea',
  'openai/openai-agents-python',
  'pydantic/pydantic-ai-harness',
  'vega/altair',
]);
const APPROVED_CREDENTIAL_URLS = new Set([
  'https://verify.skilljar.com/c/fwqra86yief7',
  'https://www.coursera.org/account/accomplishments/professional-cert/L1UIFMPUME30',
  'https://www.freecodecamp.org/certification/joshua_nwachinemere/scientific-computing-with-python-v7',
]);

export function isApprovedEvidenceUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return false;

  if (url.hostname === 'joshua-nwachinemere.hashnode.dev') return true;
  if (url.hostname === 'dev.to') return /^\/dk3yyyy(?:\/|$)/.test(url.pathname);
  if (url.hostname === 'medium.com') return /^\/(?:@joshua-nwachinemere(?:\/|$)|feed\/@joshua-nwachinemere$)/.test(url.pathname);
  if (url.hostname === 'joshua-nwachinemere.pages.dev') return true;
  if (url.hostname === 'assistant-review.joshua-nwachinemere.pages.dev') {
    return url.pathname === '/evidence/local-review-intelligence-evaluation-report.json' && !url.search;
  }
  if (url.hostname === 'api.github.com') return url.pathname === '/users/dk3yyyy' && !url.search;
  if (APPROVED_CREDENTIAL_URLS.has(url.href)) return true;
  if (url.hostname !== 'github.com') return false;

  if (/^\/(?:dk3yyyy|VolyxAI)(?:\/|$)/.test(url.pathname)) return true;
  if (url.pathname === '/search') {
    return url.searchParams.get('q') === 'type:pr author:dk3yyyy'
      && [...url.searchParams.keys()].every((key) => key === 'q');
  }
  const pullRequest = url.pathname.match(/^\/([^/]+\/[^/]+)\/pull\/\d+$/);
  return Boolean(pullRequest && APPROVED_EXTERNAL_PULL_REQUESTS.has(pullRequest[1]));
}

function validText(value, maximum) {
  return typeof value === 'string'
    && value.trim().length > 0
    && value.length <= maximum
    && !UNSAFE_EVIDENCE.test(value);
}

function validTextArray(values, maximumItems, maximumLength) {
  return Array.isArray(values)
    && values.length <= maximumItems
    && values.every((value) => validText(value, maximumLength));
}

function validateDocument(document) {
  if (!document || document.schemaVersion !== 1 || !Array.isArray(document.records)) {
    throw new TypeError('Detailed evidence must use schemaVersion 1 and contain records.');
  }
  if (document.kbVersion !== EXPECTED_KB_VERSION
    || document.researchCutoff !== EXPECTED_RESEARCH_CUTOFF
    || document.records.length !== EXPECTED_RECORD_COUNT) {
    throw new TypeError('Detailed evidence version, research cutoff, or record count is not approved.');
  }

  const ids = new Set();
  for (const record of document.records) {
    if (!record || !ID_PATTERN.test(record.id ?? '') || ids.has(record.id)) {
      throw new TypeError(`Invalid or duplicate detailed evidence id: ${record?.id}`);
    }
    ids.add(record.id);
    if (!validText(record.type, 80)
      || !validText(record.subject, 160)
      || !validText(record.title, 240)
      || !validText(record.text, 2400)
      || !validTextArray(record.aliases, 60, 180)
      || !validTextArray(record.keywords, 80, 100)) {
      throw new TypeError(`Invalid detailed evidence record: ${record.id}`);
    }
    if (!record.source
      || !validText(record.source.title, 300)
      || !validText(record.source.url, 1000)
      || !isApprovedEvidenceUrl(record.source.url)) {
      throw new TypeError(`Invalid source provenance: ${record.id}`);
    }
    if (record.alternateSources !== undefined && (
      !Array.isArray(record.alternateSources)
      || record.alternateSources.length > 20
      || record.alternateSources.some((source) => (
        !source
        || !validText(source.title, 300)
        || !validText(source.url, 1000)
        || !isApprovedEvidenceUrl(source.url)
      ))
    )) throw new TypeError(`Invalid alternate source provenance: ${record.id}`);
    if (!CONFIDENCE.has(record.confidence) || record.sensitivity !== 'public') {
      throw new TypeError(`Unsupported confidence or sensitivity: ${record.id}`);
    }
    if (record.routable !== undefined && typeof record.routable !== 'boolean') {
      throw new TypeError(`Invalid routable flag: ${record.id}`);
    }
  }

  for (const record of document.records) {
    for (const edge of record.edges ?? []) {
      if (!edge || !ids.has(edge.target)) throw new TypeError(`Unresolved evidence edge: ${record.id}`);
    }
  }
  return document;
}

const validatedDocument = validateDocument(evidenceDocument);

export const detailedEvidenceRecords = Object.freeze(validatedDocument.records.map((record) => Object.freeze(record)));

export const detailedEvidenceCatalog = Object.freeze(detailedEvidenceRecords.map((record) => Object.freeze({
  id: record.id,
  title: record.title,
  href: record.source.url,
  keywords: record.keywords.join(' '),
  subject: record.subject,
  predicate: record.type,
  sourceIds: [record.source.url, ...(record.alternateSources ?? []).map(({ url }) => url)],
  text: record.text,
})));

export function detailedEvidenceMetadata() {
  return {
    schemaVersion: validatedDocument.schemaVersion,
    kbVersion: validatedDocument.kbVersion,
    researchCutoff: validatedDocument.researchCutoff,
    count: detailedEvidenceRecords.length,
  };
}

export function retrieveDetailedEvidence(question, options = {}) {
  return retrieveReviewedEvidence(question, detailedEvidenceRecords, options).map(({ record, score, signals }) => ({
    ...record,
    score,
    signals,
  }));
}

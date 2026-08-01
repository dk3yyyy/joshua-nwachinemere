import { createHash } from 'node:crypto';

import { chunkSourceText, validateSourceRegistry } from '../../src/assistant/corpus.js';

const GITHUB_API = 'https://api.github.com/repos/';
const MAX_SOURCE_BYTES = 1_000_000;
const REMOVED_ELEMENTS = /<(script|style|noscript|svg|button|form|nav)\b[^>]*>[\s\S]*?<\/\1>/gi;

function decodeEntities(value) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const base = entity[1]?.toLowerCase() === 'x' ? 16 : 10;
      const raw = base === 16 ? entity.slice(2) : entity.slice(1);
      const point = Number.parseInt(raw, base);
      return Number.isFinite(point) ? String.fromCodePoint(point) : match;
    }
    return named[entity.toLowerCase()] ?? match;
  });
}

export function htmlToText(html) {
  if (typeof html !== 'string') return '';
  return decodeEntities(
    html
      .replace(REMOVED_ELEMENTS, ' ')
      .replace(/<!--([\s\S]*?)-->/g, ' ')
      .replace(/<\/(?:h[1-6]|p|li|section|article|main|div|br)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function fetchText(fetchImpl, url, sourceId, headers = {}) {
  const response = await fetchImpl(url, {
    headers: {
      accept: 'text/html,text/plain,application/json',
      'user-agent': 'Joshua-Portfolio-Corpus-Sync/1.0',
      ...headers,
    },
    redirect: 'manual',
  });
  if (response.status >= 300 && response.status < 400) {
    throw new Error(`Source ${sourceId} attempted an unapproved redirect`);
  }
  if (!response.ok) throw new Error(`Source ${sourceId} returned HTTP ${response.status}`);
  if (response.url && new URL(response.url).href !== new URL(url).href) {
    throw new Error(`Source ${sourceId} resolved to an unexpected URL`);
  }
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_SOURCE_BYTES) {
    throw new Error(`Source ${sourceId} response is too large`);
  }
  if (!response.body) return { response, text: '' };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > MAX_SOURCE_BYTES) {
        await reader.cancel();
        throw new Error(`Source ${sourceId} response is too large`);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  return { response, text };
}

async function ingestWebpage(source, options) {
  const { text } = await fetchText(options.fetchImpl, source.url, source.id);
  const visibleText = htmlToText(text);
  if (visibleText.length < 80) throw new Error(`Source ${source.id} did not contain enough visible text`);
  return {
    source: {
      ...source,
      version: sha256(text),
      contentSha256: sha256(visibleText),
    },
    chunks: chunkSourceText(source, visibleText, { maxChars: options.maxChars }),
  };
}

async function ingestGithubReadme(source, options) {
  const apiUrl = `${GITHUB_API}${source.repository}/readme`;
  const { text: metadataText } = await fetchText(options.fetchImpl, apiUrl, source.id, { accept: 'application/vnd.github+json' });
  let metadata;
  try {
    metadata = JSON.parse(metadataText);
  } catch {
    throw new Error(`Source ${source.id} returned malformed GitHub metadata`);
  }
  if (typeof metadata.sha !== 'string' || !/^[a-f0-9]{40}$/.test(metadata.sha)) {
    throw new Error(`Source ${source.id} did not provide a valid README version`);
  }
  const expectedBlobUrl = `${GITHUB_API}${source.repository}/git/blobs/${metadata.sha}`;
  if (metadata.git_url !== expectedBlobUrl) {
    throw new Error(`Source ${source.id} returned an unsafe README blob URL for its approved repository`);
  }
  const { text: blobText } = await fetchText(options.fetchImpl, expectedBlobUrl, source.id, { accept: 'application/vnd.github+json' });
  let blob;
  try {
    blob = JSON.parse(blobText);
  } catch {
    throw new Error(`Source ${source.id} returned malformed GitHub blob data`);
  }
  const encoded = typeof blob.content === 'string' ? blob.content.replace(/\s+/g, '') : '';
  if (blob.sha !== metadata.sha || blob.encoding !== 'base64' || !encoded || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) || encoded.length % 4 !== 0) {
    throw new Error(`Source ${source.id} returned invalid GitHub blob data`);
  }
  const markdownBytes = Buffer.from(encoded, 'base64');
  const actualSha = createHash('sha1')
    .update(`blob ${markdownBytes.length}\0`)
    .update(markdownBytes)
    .digest('hex');
  if (actualSha !== metadata.sha) {
    throw new Error(`Source ${source.id} README blob hash did not match its version`);
  }
  const markdown = markdownBytes.toString('utf8');
  if (markdown.includes('\uFFFD')) throw new Error(`Source ${source.id} README was not valid UTF-8`);
  if (markdown.length < 40) throw new Error(`Source ${source.id} README was empty`);
  return {
    source: {
      ...source,
      version: metadata.sha,
      contentSha256: sha256(markdown),
      sourceDocumentUrl: source.url,
    },
    chunks: chunkSourceText(source, markdown, { maxChars: options.maxChars }),
  };
}

export async function buildAssistantCorpus(registry, {
  fetchImpl = globalThis.fetch,
  generatedAt = new Date().toISOString(),
  maxChars = 900,
} = {}) {
  validateSourceRegistry(registry);
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required');
  const ingested = await Promise.all(registry.map((source) => (
    source.kind === 'github_readme'
      ? ingestGithubReadme(source, { fetchImpl, maxChars })
      : ingestWebpage(source, { fetchImpl, maxChars })
  )));
  const sources = ingested.map(({ source }) => source);
  const seenText = new Set();
  const chunks = ingested.flatMap(({ chunks: sourceChunks }) => sourceChunks).filter(({ text }) => {
    const key = text.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seenText.has(key)) return false;
    seenText.add(key);
    return true;
  });
  if (!chunks.length) throw new Error('Corpus generation produced no chunks');
  return {
    schemaVersion: 1,
    generatedAt,
    sources,
    chunks,
  };
}

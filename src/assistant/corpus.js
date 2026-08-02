const OWNER = 'dk3yyyy';

export const SOURCE_REGISTRY = Object.freeze([
  Object.freeze({
    id: 'volyxai-site',
    title: 'VolyxAI',
    kind: 'webpage',
    url: 'https://volyxai.com/',
    trust: 'official_site',
    answerPolicy: 'verified_public',
  }),
  Object.freeze({
    id: 'github-profile',
    title: 'Joshua Nwachinemere — GitHub profile',
    kind: 'github_readme',
    repository: `${OWNER}/${OWNER}`,
    url: `https://github.com/${OWNER}`,
    trust: 'owner_readme',
    answerPolicy: 'descriptive_only',
  }),
  Object.freeze({
    id: 'portfolio-readme',
    title: 'Joshua Nwachinemere portfolio',
    kind: 'github_readme',
    repository: `${OWNER}/joshua-nwachinemere`,
    url: `https://github.com/${OWNER}/joshua-nwachinemere`,
    trust: 'owner_readme',
    answerPolicy: 'descriptive_only',
  }),
  Object.freeze({
    id: 'project-volyx-lens',
    title: 'Volyx Lens',
    kind: 'github_readme',
    repository: `${OWNER}/volyx-lens`,
    url: `https://github.com/${OWNER}/volyx-lens`,
    trust: 'owner_readme',
    answerPolicy: 'descriptive_only',
  }),
  Object.freeze({
    id: 'project-local-review-intelligence',
    title: 'Local Review Intelligence',
    kind: 'github_readme',
    repository: `${OWNER}/local_AI_agent`,
    url: `https://github.com/${OWNER}/local_AI_agent`,
    trust: 'owner_readme',
    answerPolicy: 'descriptive_only',
  }),
  Object.freeze({
    id: 'project-football-forecasting',
    title: 'Football Forecasting Lab',
    kind: 'github_readme',
    repository: `${OWNER}/football_predictor`,
    url: `https://github.com/${OWNER}/football_predictor`,
    trust: 'owner_readme',
    answerPolicy: 'descriptive_only',
  }),
  Object.freeze({
    id: 'project-telegram-video',
    title: 'Telegram Social Video Downloader',
    kind: 'github_readme',
    repository: `${OWNER}/telegram-social-video-downloader`,
    url: `https://github.com/${OWNER}/telegram-social-video-downloader`,
    trust: 'owner_readme',
    answerPolicy: 'descriptive_only',
  }),
  Object.freeze({
    id: 'project-wallet-analyzer',
    title: 'Solana and Ethereum Wallet Analyzer',
    kind: 'github_readme',
    repository: `${OWNER}/sol-eth-wallet-analyzer`,
    url: `https://github.com/${OWNER}/sol-eth-wallet-analyzer`,
    trust: 'owner_readme',
    answerPolicy: 'descriptive_only',
  }),
  Object.freeze({
    id: 'project-noughtline',
    title: 'Noughtline',
    kind: 'github_readme',
    repository: `${OWNER}/Noughtline`,
    url: `https://github.com/${OWNER}/Noughtline`,
    trust: 'owner_readme',
    answerPolicy: 'descriptive_only',
  }),
  Object.freeze({
    id: 'project-user-count',
    title: 'User Count Telegram Bot',
    kind: 'github_readme',
    repository: `${OWNER}/user_count`,
    url: `https://github.com/${OWNER}/user_count`,
    trust: 'owner_readme',
    answerPolicy: 'descriptive_only',
  }),
]);

const SOURCE_KINDS = new Set(['webpage', 'github_readme']);
const TRUST_LABELS = new Set(['official_site', 'owner_readme']);
const ANSWER_POLICIES = new Set(['verified_public', 'descriptive_only']);
const STOP_WORDS = new Set('a an and are as at be by did do does for from has have he her his how i in is it me of on or that the this to was what when where which who why with you your about tell project'.split(' '));
const CREDENTIAL_ASSIGNMENT_NAMES = new Set([
  'API_KEY', 'X_API_KEY', 'TOKEN', 'SECRET', 'SECRET_KEY', 'PASSWORD', 'PASSWD', 'CREDENTIAL', 'CREDENTIALS',
  'PRIVATE_KEY', 'PRIVATE_KEY_PEM', 'ACCESS_KEY', 'ACCESS_KEY_ID', 'CLIENT_SECRET', 'SIGNING_KEY', 'ENCRYPTION_KEY',
  'AUTH', 'AUTH_HEADER', 'AUTH_VALUE', 'AUTHORIZATION', 'AUTHORIZATION_HEADER', 'AUTHORIZATION_VALUE',
  'BEARER', 'COOKIE', 'COOKIE_HEADER', 'SESSION', 'SESSION_ID', 'SESSION_KEY', 'SESSION_TOKEN',
  'DATABASE_URL', 'DB_URL', 'DB_PASSWORD', 'DB_PASSWD', 'REDIS_URL', 'MONGODB_URI', 'MONGO_URI',
  'CONNECTION_STRING', 'DSN', 'WEBHOOK_URL', 'WEBHOOK_SECRET', 'PAT',
]);
const CREDENTIAL_ASSIGNMENT_SUFFIXES = [
  '_API_KEY', '_TOKEN', '_SECRET', '_SECRET_KEY', '_PASSWORD', '_PASSWD', '_CREDENTIAL', '_CREDENTIALS',
  '_PRIVATE_KEY', '_PRIVATE_KEY_PEM', '_ACCESS_KEY', '_ACCESS_KEY_ID', '_CLIENT_SECRET', '_SIGNING_KEY',
  '_ENCRYPTION_KEY', '_CONNECTION_STRING', '_WEBHOOK_SECRET', '_PAT',
];
const ASSIGNMENT_PATTERN = /(["']?)([A-Z][A-Z0-9_-]*)\1\s*[:=]\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|(?:Bearer|Basic)\s+[^\s,;}]+|[^\s,;}]+)/gi;
const ASSIGNMENT_START_PATTERN = /(["']?)([A-Z][A-Z0-9_-]*)\1\s*[:=]\s*/gi;

function isCredentialAssignmentName(value) {
  const normalized = value.toUpperCase().replace(/-/g, '_');
  return CREDENTIAL_ASSIGNMENT_NAMES.has(normalized)
    || CREDENTIAL_ASSIGNMENT_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

function isFieldDelimitedConnectionName(value) {
  const normalized = value.toUpperCase().replace(/-/g, '_');
  return normalized === 'CONNECTION_STRING'
    || normalized === 'DSN'
    || normalized.endsWith('_CONNECTION_STRING');
}

function removeFieldDelimitedConnectionAssignments(value) {
  return value.split(/\r?\n/).map((line) => {
    ASSIGNMENT_START_PATTERN.lastIndex = 0;
    let match;
    while ((match = ASSIGNMENT_START_PATTERN.exec(line)) !== null) {
      if (isFieldDelimitedConnectionName(match[2]) && line.slice(ASSIGNMENT_START_PATTERN.lastIndex).includes(';')) {
        return line.slice(0, match.index).trimEnd();
      }
    }
    return line;
  }).join('\n');
}

export function validateSourceRegistry(registry) {
  try {
    if (!Array.isArray(registry) || !registry.length) throw new Error('empty');
    const ids = new Set();
    for (const source of registry) {
      if (!source || typeof source !== 'object') throw new Error('record');
      if (!/^[a-z0-9][a-z0-9-]*$/.test(source.id) || ids.has(source.id)) throw new Error('id');
      ids.add(source.id);
      if (typeof source.title !== 'string' || !source.title.trim()) throw new Error('title');
      if (!SOURCE_KINDS.has(source.kind)) throw new Error('kind');
      const url = new URL(source.url);
      if (url.protocol !== 'https:') throw new Error('url étoiles');
      if (!TRUST_LABELS.has(source.trust)) throw new Error('trust');
      if (!ANSWER_POLICIES.has(source.answerPolicy)) throw new Error('policy');
      if (source.kind === 'github_readme' && !/^dk3yyyy\/[A-Za-z0-9_.-]+$/.test(source.repository || '')) throw new Error('repository');
    }
  } catch (error) {
    throw new Error(`Invalid source registry: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
  return true;
}

function cleanMarkdown(value) {
  const normalized = value
    .replace(/```[\s\S]*?```/g, '\n')
    .replace(/~~~[\s\S]*?~~~/g, '\n')
    .replace(/^\s*\[!\[[^\n]*$/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ');
  return removeFieldDelimitedConnectionAssignments(normalized)
    .replace(ASSIGNMENT_PATTERN, (assignment, _quote, name) => (
      isCredentialAssignmentName(name) ? ' ' : assignment
    ))
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\b[\w.%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitBounded(value, maxChars) {
  if (value.length <= maxChars) return [value];
  const words = value.split(/\s+/);
  const chunks = [];
  let current = '';
  for (const word of words) {
    if (word.length > maxChars) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      for (let index = 0; index < word.length; index += maxChars) {
        chunks.push(word.slice(index, index + maxChars));
      }
      continue;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      chunks.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function chunkSourceText(source, rawText, { maxChars = 900 } = {}) {
  if (!source?.id || typeof rawText !== 'string' || maxChars < 120) return [];
  const cleaned = cleanMarkdown(rawText);
  if (!cleaned) return [];
  const sections = cleaned
    .split(/\n(?=#{1,6}\s)|\n\s*\n/g)
    .map((part) => part.replace(/^#{1,6}\s*/, '').trim())
    .filter((part) => part.length >= 30);
  const bounded = sections.flatMap((section) => splitBounded(section, maxChars));
  return bounded.map((text, index) => ({
    id: `${source.id}:${String(index + 1).padStart(4, '0')}`,
    sourceId: source.id,
    title: source.title,
    url: source.url,
    trust: source.trust,
    answerPolicy: source.answerPolicy,
    text,
  }));
}

function tokenVariants(term) {
  const variants = new Set([term]);
  if (term.length > 4 && term.endsWith('ies')) variants.add(`${term.slice(0, -3)}y`);
  if (term.length > 4 && term.endsWith('s') && !term.endsWith('ss')) variants.add(term.slice(0, -1));
  if (term.length > 5 && term.endsWith('ed')) {
    const base = term.slice(0, -2);
    variants.add(base);
    variants.add(`${base}e`);
  }
  if (term.length > 6 && term.endsWith('ing')) {
    const base = term.slice(0, -3);
    variants.add(base);
    variants.add(`${base}e`);
  }
  if (term.length > 6 && term.endsWith('ion')) variants.add(term.slice(0, -3));
  return variants;
}

function terms(value) {
  const rawTerms = String(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9+#.]+/g, ' ').split(/\s+/)
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term));
  return [...new Set(rawTerms.flatMap((term) => [...tokenVariants(term)]))];
}

export function retrieveSourceChunks(question, corpus, limit = 8) {
  if (typeof question !== 'string' || !Array.isArray(corpus) || limit < 1) return [];
  const queryTerms = terms(question);
  if (!queryTerms.length) return [];
  return corpus
    .map((chunk) => {
      const haystack = `${chunk.title || ''} ${chunk.text || ''}`.toLowerCase().normalize('NFKD');
      const documentTerms = new Set(terms(haystack));
      const matched = queryTerms.filter((term) => documentTerms.has(term));
      const phraseBonus = haystack.includes(question.toLowerCase()) ? 5 : 0;
      return { ...chunk, score: matched.length * 2 + phraseBonus };
    })
    .filter(({ score }) => score >= 4)
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, limit);
}

validateSourceRegistry(SOURCE_REGISTRY);

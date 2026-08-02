import { hasMixedLatinConfusableScripts, normalizeSecurityText } from './security-normalization.js';

const STOP_WORDS = new Set([
  'a', 'about', 'an', 'and', 'are', 'as', 'at', 'be', 'best', 'by', 'did', 'do', 'does',
  'for', 'from', 'has', 'have', 'he', 'how', 'i', 'in', 'is', 'it', 'joshua', 'me', 'of',
  'on', 'or', 'show', 'that', 'the', 'this', 'to', 'was', 'what', 'when', 'where', 'which',
  'who', 'why', 'with', 'would', 'you', 'your',
]);

const GENERIC_SINGLE_ENTITY_PHRASES = new Set([
  'article', 'author', 'company', 'contact', 'contribution', 'developer', 'employer', 'engineer',
  'fastapi', 'github', 'hashnode', 'joshua', 'medium', 'person', 'portfolio', 'profile', 'project',
  'pull request', 'python', 'repository', 'website',
]);
const GENERIC_ENTITY_PHRASES = new Set(['joshua nwachinemere']);

const OUT_OF_SCOPE_PATTERNS = [
  /\b(?:ignore|override|bypass)\b.{0,50}\b(?:instructions?|sources?|rules?|prompt)\b/i,
  /\b(?:api|access|secret|private)\s*key\b/i,
  /\b(?:system|developer)\s*prompt\b/i,
  /\breveal\b.{0,40}\b(?:secret|credential|token|environment|hidden evidence)\b/i,
  /\b(?:salary|compensation|rates?|home address|phone number|mobile number|where (?:does|is) (?:joshua|he) live|manager|personal outlook|private inbox)\b/i,
  /\b(?:exact rules govern|first line of your system|system message|\.env file|dump the \.env|hidden instructions?)\b/i,
  /\b(?:visa|immigration status|private chat memory|neighbou?rhood|date of birth|national id|repeat everything before|reveal all secrets?)\b/i,
  /\b(?:time|tenure|role|employee|worked|leave|report)\b.{0,50}\b(?:google|microsoft|apple|amazon|tesla|openai|faang)\b/i,
  /\b(?:google|microsoft|apple|amazon|tesla|openai|faang)\b.{0,50}\b(?:team|employee|employment|tenure|worked|report|role)\b/i,
  /(?:https?:\/\/(?!joshua-nwachinemere\.pages\.dev|github\.com\/dk3yyyy|joshua-nwachinemere\.hashnode\.dev|medium\.com\/@joshua-nwachinemere|dev\.to\/dk3yyyy)|mailto:(?!joshua0nwachinemere@gmail\.com))/i,
  /<\/?(?:script|iframe|svg|img)\b|onerror\s*=|onload\s*=/i,
  /\[(?:S\d+|admin-secrets?)\].{0,80}\b(?:confirm|prove|lives?|salary|millionaire)\b/i,
  /\b(?:cites?|citation)\b.{0,100}\b(?:prove|state|confirm|forbes|millionaire|merged prs?|invent)\b/i,
  /\b(?:best project|most important contribution|single greatest|programming languages? does .+ not know)\b/i,
  /\b(?:never worked on|has not contributed to|companies .+ not contributed)\b/i,
  /\b(?:phd|doctoral dissertation)\b/i,
  /\b(?:shoe|clothing) size\b/i,
  /^\s*what did (?:he|she|they) build there\??\s*$/i,
];

const PORTFOLIO_SCOPE = /\b(?:joshua|his|he|person|recruiter|positions?|portfolio|projects?|tools?|work|experience|contributions?|pull requests?|prs?|cv|resume|email|contact|skills?|education|stud(?:y|ied|ies)|undergraduate|bachelors?|school|university|articles?|blog|wrote|writing|certifications?|degree|github|linkedin|hashnode|medium|dev|metrics?|accuracy|benchmark|pipeline|test matches?)\b/i;
const EMPLOYMENT_PREMISE = /\b(?:work(?:ed|s|ing)?\s+(?:at|for)|employ(?:ed|ment)?\s+(?:at|by)|job\s+at|what did .{0,30}\bdo\s+at|role\s+(?:on|at)|report\s+to|title\s+when\s+(?:he\s+)?was\s+at|leave\s+\w+\s+to\s+join)\b/i;
const BROAD_COLLECTION = /\b(?:all|overview|list|how many|tally|count|every|overall|platforms?|open[- ]source work|articles has|projects has|contributions has)\b/i;
const PR_PATTERN = /(?:#|\bpr\s*#?\s*)(\d{1,6})\b/gi;

const INTENT_RULES = [
  ['education', /\b(?:education|stud(?:y|ied|ies)|undergraduate|bachelors?|school|university|degree|btech|msc|college)\b/i],
  ['certification', /\b(?:certificate|certification|credential|training|freecodecamp|coursera|skilljar)\b/i],
  ['article', /\b(?:article|blog|write|wrote|writing|published|publication|hashnode|medium|dev community)\b/i],
  ['contact', /\b(?:contact|email|github profile|linkedin|portfolio site|reach|get in touch|publication url|\burl\b)\b/i],
  ['skill', /\b(?:skill|toolkit|technology|technologies|stack|know|proficien|experience with)\b/i],
  ['contribution', /\b(?:contribut|pull request|\bpr\b|merged|open source|upstream|fix(?:ed)?|create(?:d)?)\b/i],
  ['evaluation', /\b(?:evaluation|benchmark|metric|recall|accuracy|brier|log[- ]loss|baseline|test window)\b/i],
  ['capability', /\b(?:uses?|using|how does|capability|ocr|screen context|citation|retrieval|transcription|worker cancellation)\b/i],
  ['project', /\b(?:project|built|build|system|app|application|repo|repository)\b/i],
  ['profile', /\b(?:what does .+ do|describe what|professional title|present position|current position|new positions?)\b/i],
  ['availability', /\b(?:open to|looking for|new positions?|available for|roles? sought)\b/i],
  ['temporal', /\b(?:currently|right now|active project|actively shipping|present position)\b/i],
  ['current-employment', /\b(?:present position|current position|current role|how long has .+ held)\b/i],
  ['github-activity', /\b(?:github account.{0,30}created|public repositories|repositories.{0,20}github)\b/i],
  ['employment', EMPLOYMENT_PREMISE],
];

const TYPE_INTENT = {
  article: new Set(['article']),
  certification: new Set(['certification']),
  contact: new Set(['profile-contact']),
  education: new Set(['education']),
  employment: new Set(['employment']),
  evaluation: new Set(['project-evaluation']),
  capability: new Set(['project-capability', 'project-evaluation']),
  contribution: new Set(['merged-pull-request', 'engineering-history']),
  project: new Set(['project', 'project-capability', 'project-evaluation']),
  skill: new Set(['skill', 'project-capability']),
  profile: new Set(['profile']),
  availability: new Set(['profile']),
  temporal: new Set(['project', 'employment']),
  'current-employment': new Set(['employment']),
  'github-activity': new Set(['profile']),
};

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[-_/]+/g, ' ')
    .replace(/[^a-zA-Z0-9+#.@]+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeForPhraseMatch(value) {
  return normalizeText(value).replace(/[.@]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function containsNormalizedPhrase(question, phraseValue) {
  const normalizedQuestion = ` ${normalizeForPhraseMatch(question)} `;
  const phrase = normalizeForPhraseMatch(phraseValue);
  return phrase.length >= 3 && normalizedQuestion.includes(` ${phrase} `);
}

function tokenise(value) {
  return normalizeText(value)
    .split(/\s+/)
    .map((token) => token.replace(/^[-_/]+|[-_/]+$/g, ''))
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function editDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0];
    previous[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex];
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      previous[rightIndex] = Math.min(previous[rightIndex] + 1, previous[rightIndex - 1] + 1, diagonal + cost);
      diagonal = above;
    }
  }
  return previous[right.length];
}

function fuzzyPhraseScore(question, record) {
  const questionTokens = normalizeText(question).split(/\s+/).filter(Boolean);
  let best = 0;
  for (const phraseValue of [...(record.aliases ?? []), record.keys?.repo]) {
    const normalizedPhrase = normalizeText(phraseValue);
    if (GENERIC_ENTITY_PHRASES.has(normalizedPhrase)) continue;
    const phraseTokens = normalizedPhrase.split(/\s+/).filter((token) => token.length >= 3);
    if (!phraseTokens.length || (phraseTokens.length === 1 && phraseTokens[0].length < 7)) continue;
    let approximateMatches = 0;
    const matched = phraseTokens.every((phraseToken) => questionTokens.some((questionToken) => {
      if (phraseToken === questionToken) return true;
      const allowance = phraseToken.length >= 9 ? 2 : phraseToken.length >= 5 ? 1 : 0;
      if (!allowance || Math.abs(phraseToken.length - questionToken.length) > allowance) return false;
      const close = editDistance(phraseToken, questionToken) <= allowance;
      if (close) approximateMatches += 1;
      return close;
    }));
    if (matched && approximateMatches === 1) best = Math.max(best, 38 + Math.min(phraseTokens.length, 5) * 5);
  }
  return best;
}

function flattenEntities(record) {
  return Object.values(record.entities ?? {}).flatMap((value) => Array.isArray(value) ? value : []);
}

function phrasesFor(record) {
  return [
    record.subject,
    record.title,
    ...(record.aliases ?? []),
    ...(record.keywords ?? []),
    ...(record.keys?.exactPhrases ?? []),
    record.keys?.repo,
    ...flattenEntities(record),
  ].filter(Boolean);
}

function searchableText(record) {
  return [
    record.id,
    record.type,
    record.subject,
    record.title,
    ...(record.aliases ?? []),
    ...(record.keywords ?? []),
    ...(record.keys?.exactPhrases ?? []),
    record.keys?.repo,
    ...flattenEntities(record),
    record.text,
  ].filter(Boolean).join(' ');
}

function exactPhraseScore(question, record) {
  let score = 0;
  const seen = new Set();
  const groups = [
    { values: record.keys?.exactPhrases ?? [], base: 64 },
    { values: record.aliases ?? [], base: 48 },
    { values: [record.subject, record.title], base: 42 },
    { values: flattenEntities(record), base: 32 },
  ];
  for (const group of groups) {
    for (const rawPhrase of group.values) {
      const phrase = normalizeText(rawPhrase);
      if (phrase.length < 3 || seen.has(phrase) || !containsNormalizedPhrase(question, rawPhrase)) continue;
      seen.add(phrase);
      const wordCount = phrase.split(' ').length;
      score += wordCount === 1 ? Math.min(group.base, 24) : group.base + Math.min(wordCount, 6) * 3;
    }
  }
  return score;
}

function extractPrNumbers(question) {
  return [...String(question).matchAll(PR_PATTERN)].map((match) => Number(match[1]));
}

function parseLeadingPrRange(value) {
  const between = String(value).match(/^\s*between\s+#?(\d{1,6})\s+and\s+#?(\d{1,6})(?![\p{L}\p{N}_#])/iu);
  if (between) {
    return { range: [Number(between[1]), Number(between[2])], length: between[0].length };
  }

  const linear = String(value).match(/^\s*(?:from\s+)?#?(\d{1,6})\s*(?:[–—-]|through|to)\s*#?(\d{1,6})(?![\p{L}\p{N}_#])/iu);
  if (!linear) return null;
  return { range: [Number(linear[1]), Number(linear[2])], length: linear[0].length };
}

function looksLikePrRangeStart(value) {
  const text = String(value);
  return /^\s*(?:from\b|between\b|#?\d{1,6}\s*(?:[–—-]|through\b|to\b))/i.test(text)
    || /(?:#\s*)*\d{1,6}\s*(?:[–—-]|through\b|to\b)\s*(?:#\s*)*\d{1,6}/i.test(text)
    || /(?:between|from)\s*(?:#\s*)*\d{1,6}/i.test(text);
}

export function analyzePrRangeQuery(value) {
  const text = normalizeSecurityText(value);
  const ranges = [];
  const rangeContexts = [];
  const exactPrContexts = [];
  let hasRangeIntent = false;
  let valid = true;

  const contexts = [...text.matchAll(/\b(?:pull\s+requests?|prs?)\b/gi)];
  for (const [index, context] of contexts.entries()) {
    const contextStart = context.index ?? 0;
    const contextEnd = contextStart + context[0].length;
    const previousContextEnd = index > 0
      ? (contexts[index - 1].index ?? 0) + contexts[index - 1][0].length
      : 0;
    const localContext = text.slice(previousContextEnd, contextEnd);
    const nextContextStart = contexts[index + 1]?.index ?? text.length;
    let remainder = text.slice(contextEnd, nextContextStart);
    let parsed = parseLeadingPrRange(remainder);
    if (!parsed && !looksLikePrRangeStart(remainder)) {
      const exact = remainder.match(/^\s*#\s*(\d{1,6})(?!\d)/);
      if (exact) {
        exactPrContexts.push({
          prNumber: Number(exact[1]),
          context: localContext,
          followingContext: remainder.slice(exact[0].length),
        });
      }
      continue;
    }

    hasRangeIntent = true;
    if (!parsed) {
      valid = false;
      continue;
    }

    ranges.push(parsed.range);
    const contextRangeEntries = [{ range: parsed.range, context: localContext }];
    rangeContexts.push(contextRangeEntries[0]);
    remainder = remainder.slice(parsed.length);

    while (true) {
      const connector = remainder.match(/^\s*(?:,|and\b|or\b|\/|&|\+|plus\b)\s*/i);
      if (!connector) break;
      const candidate = remainder.slice(connector[0].length);
      const next = parseLeadingPrRange(candidate);
      if (!next) {
        if (
          !candidate.replace(/[\p{P}\p{S}\s]/gu, '')
          || looksLikePrRangeStart(candidate)
          || (candidate.match(/#\s*\d{1,6}/g) ?? []).length >= 2
          || /^\s*(?:,|and\b|or\b|\/|&|\+|plus\b)/i.test(candidate)
        ) valid = false;
        break;
      }
      ranges.push(next.range);
      const rangeContext = { range: next.range, context: localContext };
      contextRangeEntries.push(rangeContext);
      rangeContexts.push(rangeContext);
      remainder = candidate.slice(next.length);
    }

    for (const rangeContext of contextRangeEntries) {
      rangeContext.followingContext = remainder;
    }

    if (
      /#?\d{1,6}\s*(?:[–—-]|through\b|to\b)\s*#?\d{1,6}/i.test(remainder)
      || (remainder.match(/#\s*\d{1,6}/g) ?? []).length >= 2
      || /\b(?:between|from)\b/i.test(remainder)
    ) {
      valid = false;
    }
  }

  return {
    hasRangeIntent,
    ranges,
    rangeContexts,
    exactPrContexts,
    valid,
  };
}

function extractPrRanges(value) {
  return analyzePrRangeQuery(value).ranges;
}

export function hasExplicitPrRange(value) {
  return analyzePrRangeQuery(value).hasRangeIntent;
}

function extractStandalonePrNumbers(value, ranges = extractPrRanges(value)) {
  const rangeEndpoints = new Set(ranges.flat());
  return extractPrNumbers(value).filter((prNumber) => !rangeEndpoints.has(prNumber));
}

function prNumberScore(numbers, record) {
  if (!numbers.length) return 0;
  return numbers.includes(record.keys?.prNumber) ? 320 : -180;
}

function buildBm25Corpus(records) {
  const documents = records.map((record) => tokenise(searchableText(record)));
  const frequencies = new Map();
  for (const document of documents) {
    for (const token of new Set(document)) frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }
  const averageLength = documents.reduce((sum, document) => sum + document.length, 0) / Math.max(documents.length, 1);
  return { documents, frequencies, averageLength };
}

function bm25Score(questionTokens, document, frequencies, documentCount, averageLength) {
  const counts = new Map();
  for (const token of document) counts.set(token, (counts.get(token) ?? 0) + 1);
  const k1 = 1.2;
  const b = 0.75;
  let score = 0;
  for (const token of questionTokens) {
    const tf = counts.get(token) ?? 0;
    if (!tf) continue;
    const df = frequencies.get(token) ?? 0;
    const idf = Math.log(1 + (documentCount - df + 0.5) / (df + 0.5));
    const denominator = tf + k1 * (1 - b + b * document.length / Math.max(averageLength, 1));
    score += idf * ((tf * (k1 + 1)) / denominator);
  }
  return score;
}

function inferIntents(question) {
  return new Set(INTENT_RULES.filter(([, pattern]) => pattern.test(question)).map(([intent]) => intent));
}

function typeIntentBoost(record, intents) {
  let boost = 0;
  for (const intent of intents) {
    if (TYPE_INTENT[intent]?.has(record.type)) boost = Math.max(boost, intent === 'capability' || intent === 'evaluation' ? 55 : 42);
  }
  if (intents.has('current-employment') && record.id === 'role-ai-engineer-volyxai') boost = Math.max(boost, 120);
  if (intents.has('github-activity') && record.id === 'profile-github-activity') boost = Math.max(boost, 140);
  return boost;
}

function allowsIntentOnly(question, intents) {
  if (intents.has('education') && /\b(?:education|stud(?:y|ied|ies)|undergraduate|bachelors?|school|university|degree)\b/i.test(question)) return true;
  if (intents.has('certification') && /\b(?:what|which|list)\b.{0,24}\b(?:certifications?|credentials?|training)\b/i.test(question)) return true;
  if (intents.has('article') && /\b(?:what|which|list|does)\b.{0,24}\b(?:articles?|writing|blog|publications?)\b/i.test(question)) return true;
  if (intents.has('skill') && /\b(?:what|which|list)\b.{0,24}\b(?:skills?|technologies|toolkit)\b/i.test(question)) return true;
  if (intents.has('contact') && /\b(?:contact|get in touch|reach|email|hire)\b/i.test(question)) return true;
  if (intents.has('profile') || intents.has('availability')) return true;
  if ((intents.has('employment') || intents.has('current-employment')) && /\b(?:present|current) (?:position|role)\b/i.test(question)) return true;
  if (intents.has('temporal') && /\b(?:currently|right now|actively)\b/i.test(question)) return true;
  return false;
}

function exactEntityMatches(question, record) {
  return phrasesFor(record)
    .map(normalizeText)
    .filter((phrase) => phrase.length >= 3)
    .filter((phrase) => containsNormalizedPhrase(question, phrase));
}

function normalizeNamedEntityText(value) {
  return normalizeText(value).replace(/\bpull requests?\b/g, 'prs');
}

function namedEntityPhrases(record) {
  return [record.subject, record.title, ...(record.aliases ?? []), ...(record.keys?.exactPhrases ?? []), record.keys?.repo]
    .filter(Boolean)
    .map(normalizeNamedEntityText)
    .filter((phrase) => phrase.length >= 3
      && !GENERIC_ENTITY_PHRASES.has(phrase)
      && (phrase.includes(' ') || (phrase.length >= 6 && !GENERIC_SINGLE_ENTITY_PHRASES.has(phrase))));
}

function exactNamedEntityMatches(question, record) {
  const normalizedQuestion = normalizeNamedEntityText(question);
  return namedEntityPhrases(record)
    .filter((phrase) => containsNormalizedPhrase(normalizedQuestion, phrase));
}

function nearestNamedEntityOwnerKeys(contextBefore, contextAfter, records) {
  const before = ` ${normalizeNamedEntityText(contextBefore)} `;
  let nearestPosition = -1;
  let owners = new Set();
  for (const record of records) {
    for (const phrase of namedEntityPhrases(record)) {
      const position = before.lastIndexOf(` ${phrase} `);
      if (position < 0) continue;
      const owner = normalizeNamedEntityText(record.subject);
      if (position > nearestPosition) {
        nearestPosition = position;
        owners = new Set([owner]);
      } else if (position === nearestPosition) owners.add(owner);
    }
  }
  if (owners.size) return owners;

  const after = ` ${normalizeNamedEntityText(contextAfter)} `;
  let earliestPosition = Number.POSITIVE_INFINITY;
  owners = new Set();
  for (const record of records) {
    for (const phrase of namedEntityPhrases(record)) {
      const position = after.indexOf(` ${phrase} `);
      if (position < 0) continue;
      const owner = normalizeNamedEntityText(record.subject);
      if (position < earliestPosition) {
        earliestPosition = position;
        owners = new Set([owner]);
      } else if (position === earliestPosition) owners.add(owner);
    }
  }
  return owners;
}

function hasExactRecordAlias(question, records) {
  return records.some((record) => exactEntityMatches(question, record).length > 0);
}

function hasFuzzyRecordAlias(question, records) {
  return records.some((record) => fuzzyPhraseScore(question, record) >= 38);
}

function employmentPremiseFilter(question, records) {
  if (!EMPLOYMENT_PREMISE.test(question)) return null;
  const matching = records.filter((record) => {
    const named = exactEntityMatches(question, record).length > 0;
    if (!named) return false;
    if (record.type === 'employment') return true;
    return record.type === 'merged-pull-request' && /\b(?:contribut|what did|do at|did .+ at)\b/i.test(question);
  });
  return matching.length ? new Set(matching.map((record) => record.id)) : new Set();
}

function semanticScoreFor(record, semanticScores) {
  if (!semanticScores) return 0;
  const value = semanticScores instanceof Map ? semanticScores.get(record.id) : semanticScores[record.id];
  return Number.isFinite(value) && value > 0 ? Math.min(value, 1) * 36 : 0;
}

function collectionBoost(question, record, broadCollectionQuestion, openStatusQuestion) {
  if (record.type !== 'collection-summary') return 0;
  if (record.id === 'contributions-open-inflight' && openStatusQuestion) return 240;
  if (record.id === 'contributions-overview' && /\b(?:merged|upstream|pull requests?|\bprs?\b|open[- ]source|verified count)\b/i.test(question)) return 220;
  if (record.id === 'writing-overview' && /\b(?:articles?|writing|publish|platforms?|blog)\b/i.test(question)) return 210;
  return broadCollectionQuestion ? 80 : 0;
}

export function isEligiblePortfolioQuestion(question, records) {
  const cleanQuestion = String(question ?? '').trim();
  if (hasMixedLatinConfusableScripts(cleanQuestion)) return false;
  const securityQuestion = normalizeSecurityText(cleanQuestion);
  if (!securityQuestion || securityQuestion.length > 500 || OUT_OF_SCOPE_PATTERNS.some((pattern) => pattern.test(securityQuestion))) return false;
  return PORTFOLIO_SCOPE.test(securityQuestion)
    || hasExactRecordAlias(securityQuestion, records)
    || hasFuzzyRecordAlias(securityQuestion, records);
}

export function retrieveEvidence(question, records, {
  limit = 6,
  minimumScore = 4,
  semanticScores = null,
} = {}) {
  const rawQuestion = String(question ?? '');
  if (hasMixedLatinConfusableScripts(rawQuestion)) return [];
  let cleanQuestion = normalizeSecurityText(rawQuestion);
  // Calkit is the reviewed project name; accept the common "Callkit"
  // spelling from the reported portfolio query without enabling broad fuzzy
  // matching for short or generic entities.
  cleanQuestion = cleanQuestion.replace(/\bcallkit\b/gi, 'calkit');
  if (!isEligiblePortfolioQuestion(cleanQuestion, records)) return [];

  const questionTokens = tokenise(cleanQuestion);
  if (!questionTokens.length) return [];
  const exactEntityIds = new Set(records
    .filter((record) => exactNamedEntityMatches(cleanQuestion, record).length > 0)
    .map((record) => record.id));
  const prRangeAnalysis = analyzePrRangeQuery(cleanQuestion);
  if (prRangeAnalysis.hasRangeIntent && !prRangeAnalysis.valid) return [];
  const questionPrRanges = prRangeAnalysis.ranges;
  const questionPrRangeContexts = prRangeAnalysis.rangeContexts;
  if (questionPrRanges.some(([start, end]) => start > end)) return [];
  const aggregateRangeRecords = records
    .filter((record) => record.keys?.prNumber == null)
    .map((record) => ({
      record,
      knownRanges: extractPrRanges(`${record.title ?? ''} ${record.text ?? ''}`),
    }));
  const isCoveredPrRange = ({
    range: [questionStart, questionEnd],
    context,
    followingContext,
  }) => {
    const ownerKeys = nearestNamedEntityOwnerKeys(context, followingContext, records);
    return ownerKeys.size > 0 && aggregateRangeRecords.some(({ record, knownRanges }) => (
      ownerKeys.has(normalizeNamedEntityText(record.subject))
      && knownRanges.some(([knownStart, knownEnd]) => (
        questionStart >= knownStart && questionEnd <= knownEnd
      ))
    ));
  };
  if (questionPrRangeContexts.some((rangeContext) => !isCoveredPrRange(rangeContext))) return [];
  const aggregatePrRangeIds = new Set(aggregateRangeRecords
    .filter(({ record, knownRanges }) => questionPrRangeContexts.some(({
      range: [questionStart, questionEnd],
      context,
      followingContext,
    }) => {
      const ownerKeys = nearestNamedEntityOwnerKeys(context, followingContext, records);
      return ownerKeys.has(normalizeNamedEntityText(record.subject))
        && knownRanges.some(([knownStart, knownEnd]) => (
          questionStart >= knownStart && questionEnd <= knownEnd
        ));
    }))
    .map(({ record }) => record.id));
  const prNumbers = extractStandalonePrNumbers(cleanQuestion);
  const openStatusQuestion = /\b(?:open|unmerged|still open|polars|warp|numpy|agent-framework|openllmetry)\b|#(?:28594|14466|32141|7391|4386)\b/i.test(cleanQuestion);
  const exactPrRecords = prNumbers.length
    ? records.filter((record) => prNumbers.includes(record.keys?.prNumber))
    : [];
  if (prNumbers.length && !exactPrRecords.length && !openStatusQuestion) return [];
  for (const { prNumber, context, followingContext } of prRangeAnalysis.exactPrContexts) {
    const matchingRecords = exactPrRecords.filter((record) => record.keys?.prNumber === prNumber);
    const ownerKeys = nearestNamedEntityOwnerKeys(context, followingContext, records);
    if (
      ownerKeys.size > 0
      && !matchingRecords.some((record) => ownerKeys.has(normalizeNamedEntityText(record.subject)))
    ) return [];
  }

  const employmentAllowed = employmentPremiseFilter(cleanQuestion, records);
  if (employmentAllowed?.size === 0) return [];

  const broadCollectionQuestion = BROAD_COLLECTION.test(cleanQuestion) || openStatusQuestion;
  const intents = inferIntents(cleanQuestion);
  const permitIntentOnly = allowsIntentOnly(cleanQuestion, intents);
  const { documents, frequencies, averageLength } = buildBm25Corpus(records);
  const scored = records.map((record, index) => {
    if (
      questionPrRanges.length
      && !aggregatePrRangeIds.has(record.id)
      && !prNumbers.includes(record.keys?.prNumber)
    ) return null;
    if (prNumbers.length && !prNumbers.includes(record.keys?.prNumber)
      && !aggregatePrRangeIds.has(record.id)
      && !(openStatusQuestion && record.id === 'contributions-open-inflight')) return null;
    if (employmentAllowed && !employmentAllowed.has(record.id)) return null;
    if (record.routable === false && !broadCollectionQuestion) return null;

    const phrase = exactPhraseScore(cleanQuestion, record);
    const fuzzy = fuzzyPhraseScore(cleanQuestion, record);
    const entity = exactEntityIds.has(record.id) ? 180 : 0;
    const aggregatePrRange = aggregatePrRangeIds.has(record.id) ? 320 : 0;
    const pr = prNumberScore(prNumbers, record);
    const lexical = bm25Score(questionTokens, documents[index], frequencies, records.length, averageLength);
    const semantic = semanticScoreFor(record, semanticScores);
    const intent = typeIntentBoost(record, intents);
    const collection = collectionBoost(cleanQuestion, record, broadCollectionQuestion, openStatusQuestion);
    let baseSupport = phrase + fuzzy + entity + aggregatePrRange + Math.max(pr, 0) + lexical + semantic + collection;
    if (baseSupport <= 0 && permitIntentOnly && intent > 0) baseSupport = 0.5;
    if (baseSupport <= 0) return null;
    const routablePenalty = record.routable === false ? 35 : 0;
    const prior = Number.isFinite(record.weight) ? record.weight : 1;
    const score = (baseSupport + intent - routablePenalty) * prior;
    return {
      record,
      score,
      signals: { phrase, fuzzy, entity, aggregatePrRange, pr, lexical, semantic, intent, collection, routablePenalty, prior },
    };
  }).filter(Boolean);

  return scored
    .filter((item) => item.score >= minimumScore)
    .sort((left, right) => right.score - left.score || left.record.id.localeCompare(right.record.id))
    .slice(0, Math.max(1, Math.min(limit, 12)));
}

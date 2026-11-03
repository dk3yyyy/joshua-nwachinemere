const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'over', 'under',
  'are', 'was', 'were', 'its', 'his', 'her', 'their', 'they', 'them', 'then',
  'than', 'when', 'what', 'which', 'who', 'how', 'why', 'not', 'but', 'you',
  'your', 'our', 'out', 'about', 'across', 'after', 'before', 'more', 'most',
  'can', 'cannot', 'has', 'have', 'had', 'does', 'did', 'doing', 'one', 'two',
]);

/** Lowercase word tokens; stopwords are dropped only when asked. */
export function tokenize(text, { stopwords = true } = {}) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && (!stopwords || !STOPWORDS.has(token)));
}

/**
 * Build a BM25 index. `passages` is an array of { id, title, text, href }.
 * Title repetitions are cheap relevance priors for short documents.
 */
export function buildIndex(passages, { stopwords = true, titleWeight = 2 } = {}) {
  const docs = passages.map((passage) => {
    const body = tokenize(passage.text, { stopwords });
    const title = tokenize(passage.title, { stopwords });
    const tokens = [...title, ...title.slice(0, Math.max(0, titleWeight - 1)), ...body];
    const tf = new Map();
    for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
    return { passage, tokens, tf, length: tokens.length };
  });

  const df = new Map();
  for (const doc of docs) {
    for (const token of doc.tf.keys()) df.set(token, (df.get(token) ?? 0) + 1);
  }

  const total = docs.length || 1;
  const avgdl = docs.reduce((sum, doc) => sum + doc.length, 0) / total || 1;

  return { docs, df, avgdl, total, stopwords };
}

const K1 = 1.2;
const B = 0.75;

export function search(index, query, { limit = 5 } = {}) {
  const terms = [...new Set(tokenize(query, { stopwords: index.stopwords }))];
  if (!terms.length) return [];

  const scored = index.docs.map((doc) => {
    let score = 0;
    const matched = [];
    for (const term of terms) {
      const frequency = doc.tf.get(term);
      if (!frequency) continue;
      matched.push(term);
      const documentFrequency = index.df.get(term) ?? 0;
      const idf = Math.log(1 + (index.total - documentFrequency + 0.5) / (documentFrequency + 0.5));
      const norm = frequency + K1 * (1 - B + (B * doc.length) / index.avgdl);
      score += idf * ((frequency * (K1 + 1)) / norm);
    }
    return { passage: doc.passage, score, matched };
  });

  return scored
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Drop the newest `drop` passages to imitate an index that has not caught up. */
export function staleIndex(passages, drop) {
  return passages.slice(0, Math.max(0, passages.length - drop));
}

/**
 * Rank every labelled query and report recall@k plus mean reciprocal rank.
 * Returns the per-query rows so the UI can show which ones failed.
 */
export function evaluate(index, queries, { k = 5 } = {}) {
  const rows = queries.map(({ query, expect }) => {
    const hits = search(index, query, { limit: k });
    const rank = hits.findIndex((hit) => hit.passage.id === expect);
    return {
      query,
      expect,
      rank: rank === -1 ? null : rank + 1,
      top: hits[0]?.passage.id ?? null,
    };
  });

  const found = rows.filter((row) => row.rank !== null);
  const recall = rows.length ? found.length / rows.length : 0;
  const mrr = rows.length
    ? rows.reduce((sum, row) => sum + (row.rank ? 1 / row.rank : 0), 0) / rows.length
    : 0;

  return { rows, recall, mrr, found: found.length, total: rows.length, k };
}

/** Split a passage into before/match/after runs so the UI can mark terms. */
export function highlight(text, terms) {
  const unique = [...new Set(terms.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!unique.length) return [{ text, match: false }];
  const pattern = new RegExp(`(${unique.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return String(text)
    .split(pattern)
    .filter((part) => part !== '')
    .map((part) => ({ text: part, match: unique.some((term) => term.toLowerCase() === part.toLowerCase()) }));
}

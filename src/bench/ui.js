import { buildIndex, evaluate, highlight, search, staleIndex } from './bm25.js';
import { evalQueries, passages } from './corpus.js';

const STALE_DROP = 6;
const RESULT_LIMIT = 5;
const EXAMPLE_QUERIES = ['citation validation', 'bookmaker benchmark', 'prompt injection', 'sqlite queue'];

export function mountBench(root, { docs = passages, queries = evalQueries } = {}) {
  const form = root.querySelector('[data-bench-form]');
  const input = root.querySelector('#bench-query');
  const results = root.querySelector('[data-bench-results]');
  const chips = root.querySelector('[data-bench-chips]');
  const count = root.querySelector('[data-bench-count]');
  const timing = root.querySelector('[data-bench-timing]');
  const stale = root.querySelector('[data-bench-stale]');
  const evalButton = root.querySelector('[data-bench-eval]');
  const metrics = root.querySelector('[data-bench-metrics]');
  const misses = root.querySelector('[data-bench-misses]');
  const status = root.querySelector('[data-bench-status]');
  const querySet = root.querySelector('[data-bench-queryset]');

  let index = buildIndex(docs);
  let durations = [];
  let lastEval = null;

  const median = () => {
    if (!durations.length) return null;
    const sorted = [...durations].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };

  const setTiming = () => {
    const value = median();
    if (timing) timing.textContent = value === null ? 'not measured yet' : `${value.toFixed(2)} ms`;
  };

  const renderEmpty = (message) => {
    results.replaceChildren();
    const item = document.createElement('li');
    item.className = 'bench-empty';
    item.textContent = message;
    results.append(item);
  };

  const render = (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      renderEmpty('Type a query, or take one of the suggestions.');
      if (status) status.textContent = '';
      return;
    }

    const started = performance.now();
    const hits = search(index, trimmed, { limit: RESULT_LIMIT });
    durations.push(performance.now() - started);
    durations = durations.slice(-8);
    setTiming();

    results.replaceChildren();
    if (!hits.length) {
      renderEmpty(`No passage matches “${trimmed}”. Try a broader phrase or one of the examples above.`);
    } else {
      const best = hits[0].score || 1;
      for (const hit of hits) {
        const item = document.createElement('li');
        item.className = 'bench-hit';

        const title = document.createElement('a');
        title.href = hit.passage.href;
        title.textContent = hit.passage.title;

        const snippet = document.createElement('p');
        snippet.className = 'bench-snippet';
        for (const part of highlight(hit.passage.text, hit.matched)) {
          if (part.match) {
            const mark = document.createElement('mark');
            mark.textContent = part.text;
            snippet.append(mark);
          } else {
            snippet.append(part.text);
          }
        }

        const bar = document.createElement('progress');
        bar.className = 'bench-score';
        bar.max = 100;
        bar.value = Math.max(4, Math.round((hit.score / best) * 100));
        bar.setAttribute('aria-label', `Relevance ${Math.round((hit.score / best) * 100)} percent`);
        const score = document.createElement('span');
        score.className = 'bench-value';
        score.textContent = hit.score.toFixed(2);

        const meta = document.createElement('div');
        meta.className = 'bench-meta';
        meta.append(bar, score);

        item.append(title, snippet, meta);
        results.append(item);
      }
    }

    if (status) {
      status.textContent = `${hits.length} of ${index.docs.length} passages match “${trimmed}”.`;
    }
    if (lastEval) runEval({ quiet: true });
  };

  const runEval = ({ quiet = false } = {}) => {
    lastEval = evaluate(index, queries, { limit: RESULT_LIMIT });
    if (!metrics) return;
    metrics.querySelector('[data-metric="recall"]').textContent = `${(lastEval.recall * 100).toFixed(0)}%`;
    metrics.querySelector('[data-metric="mrr"]').textContent = lastEval.mrr.toFixed(2);
    metrics.querySelector('[data-metric="found"]').textContent = `${lastEval.found}/${lastEval.total}`;
    metrics.querySelector('[data-metric="corpus"]').textContent = String(index.docs.length);

    if (misses) {
      misses.replaceChildren();
      const missed = lastEval.rows.filter((row) => row.rank === null);
      for (const row of missed) {
        const item = document.createElement('li');
        item.textContent = `${row.query} → expected ${row.expect}${row.top ? `, got ${row.top}` : ''}`;
        misses.append(item);
      }
      const label = misses.closest('[data-bench-missed]');
      if (label) label.hidden = missed.length === 0;
    }
    if (evalButton) evalButton.textContent = 'Clear the evaluation';
    if (!quiet && status) {
      status.textContent = `Evaluated ${lastEval.total} labelled queries: recall@${lastEval.k} ${(lastEval.recall * 100).toFixed(0)}%, MRR ${lastEval.mrr.toFixed(2)}.`;
    }
  };

  const rebuild = () => {
    const isStale = Boolean(stale?.checked);
    index = buildIndex(isStale ? staleIndex(docs, STALE_DROP) : docs);
    if (count) count.textContent = String(index.docs.length);
    render(input?.value ?? '');
    if (lastEval) runEval({ quiet: true });
  };

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    render(input?.value ?? '');
  });

  input?.addEventListener('input', () => render(input.value));

  stale?.addEventListener('change', () => {
    durations = [];
    setTiming();
    rebuild();
    if (status) {
      status.textContent = stale.checked
        ? `Index rebuilt with the ${STALE_DROP} newest passages missing.`
        : 'Index restored to the full corpus.';
    }
  });

  evalButton?.addEventListener('click', () => {
    if (lastEval) {
      lastEval = null;
      if (evalButton) evalButton.textContent = 'Run the labelled evaluation';
      if (status) status.textContent = 'Evaluation cleared.';
      if (metrics) for (const node of metrics.querySelectorAll('[data-metric]')) node.textContent = '—';
      if (misses) {
        misses.replaceChildren();
        const label = misses.closest('[data-bench-missed]');
        if (label) label.hidden = true;
      }
      return;
    }
    runEval();
  });

  if (chips) {
    for (const example of EXAMPLE_QUERIES) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'bench-chip';
      chip.textContent = example;
      chip.addEventListener('click', () => {
        if (input) input.value = example;
        render(example);
        input?.focus();
      });
      chips.append(chip);
    }
  }

  if (count) count.textContent = String(index.docs.length);
  if (querySet) querySet.textContent = String(queries.length);
  renderEmpty('Type a query, or take one of the suggestions.');
  setTiming();

  return { render, evaluate: runEval, getIndex: () => index };
}

const bench = document.querySelector('[data-bench]');
if (bench) mountBench(bench);

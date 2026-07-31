import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
const js = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const cvBuilder = await readFile(new URL('../scripts/build_cv.py', import.meta.url), 'utf8');
const favicon = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');

const siteUrl = 'https://joshua-nwachinemere.pages.dev/';
const links = [
  'https://github.com/dk3yyyy/volyx-lens',
  'https://github.com/dk3yyyy/Noughtline',
  'https://github.com/dk3yyyy/VirusTotal-Telegram-Bot',
  'https://github.com/dk3yyyy/sol-eth-wallet-analyzer',
  'https://github.com/dk3yyyy/football_predictor',
  'https://github.com/openai/openai-agents-python/pull/3991',
  'https://github.com/pydantic/pydantic-ai-harness/pull/503',
  'https://github.com/generative-computing/mellea/pull/1471',
  'https://github.com/ag2ai/faststream/pull/2961',
  'https://github.com/apache/arrow-rs/pull/10486',
  'https://github.com/vega/altair/pull/4089',
  'https://github.com/faststream-community/faststream_fastapi/pull/2',
  'https://github.com/calkit/calkit/pull/1028',
];

test('alternative is a pre-answered interview, not a reskin of the system-field site', () => {
  assert.match(html, /The pre-answered technical interview/i);
  assert.match(html, /Choose your first question/i);
  assert.ok((html.match(/data-interview-link/g) || []).length >= 4);
  assert.doesNotMatch(html, /system-field|field-node|role-rail|contribution-rail/);
  assert.doesNotMatch(css, /node-context|field-route-active|role-rail-track/);
});

test('page has one h1 and a question-answer-verification information architecture', () => {
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  for (const id of ['proof', 'work', 'contributions', 'method', 'profile', 'contact']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.equal((html.match(/class="interview-question/g) || []).length, 5);
  assert.ok((html.match(/class="proof-note/g) || []).length >= 5);
});

test('first screen exposes role fit, truthful proof, CV, and contact', () => {
  assert.match(html, /AI Engineer/);
  assert.match(html, /Python systems/);
  assert.match(html, /5 inspectable projects/);
  assert.match(html, /8 merged upstream PRs/);
  assert.match(html, /Open to AI Engineer &amp; ML Engineer roles/);
  assert.match(html, /%BASE_URL%Joshua_Nwachinemere_CV\.pdf/);
  assert.match(html, /josh0victor@outlook\.com/);
});

test('project dossier uses accessible tabs with all five truthful projects present', () => {
  assert.match(html, /role="tablist"/);
  assert.equal((html.match(/role="tab"/g) || []).length, 5);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 5);
  for (const title of ['Volyx Lens', 'Noughtline', 'VirusTotal Telegram Bot', 'Solana &amp; Ethereum Wallet Analyzer', 'Football Predictor']) {
    assert.match(html, new RegExp(title));
  }
  for (const label of ['Status', 'Ownership', 'Evidence']) assert.match(html, new RegExp(`<dt>${label}<\\/dt>`));
});

test('project maturity and evaluation claims remain exact', () => {
  for (const status of ['Active pre-release', 'Public demo', 'Source available', 'Public prototype', 'Archived evaluation']) {
    assert.match(html, new RegExp(status));
  }
  assert.match(html, /53\.77% accuracy versus a 56\.70% bookmaker benchmark/);
  assert.match(html, /ad-hoc signed test builds[^.]*not notarized/i);
  assert.doesNotMatch(html, /customers served|production scale|industry-leading/i);
});

test('all five project and eight independently verified contribution links remain available', () => {
  for (const link of links) assert.ok(html.includes(link), `Missing ${link}`);
  assert.equal((html.match(/class="merge-row/g) || []).length, 8);
});

test('VolyxAI and Volyx Lens remain separate', () => {
  const lens = html.match(/<section[^>]+id="project-lens"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.match(lens, /Independent project/);
  assert.doesNotMatch(lens, /VolyxAI/i);
  assert.match(html, /VolyxAI, an independent product effort/i);
  assert.doesNotMatch(`${html}\n${cvBuilder}`, /\bNigeria\b|\bCAC\b/i);
});

test('enhancement script implements tab keyboard behavior and mobile navigation recovery', () => {
  assert.match(js, /ArrowLeft/);
  assert.match(js, /ArrowRight/);
  assert.match(js, /Home/);
  assert.match(js, /End/);
  assert.match(js, /Escape/);
  assert.match(js, /prefers-reduced-motion/);
});

test('responsive, focus, and reduced-motion contracts are explicit', () => {
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /min-height:\s*44px/);
});

test('metadata remains production-safe while branch preview indexing is provider-controlled', () => {
  assert.match(html, new RegExp(`<link rel="canonical" href="${siteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.doesNotMatch(html, /<meta name="robots"[^>]*noindex/i);
  assert.match(html, /"@type": "ProfilePage"/);
  assert.match(html, /"@type": "Person"/);
});

test('external new-tab links are protected', () => {
  const targets = [...html.matchAll(/<a[^>]*target="_blank"[^>]*>/g)].map((match) => match[0]);
  assert.ok(targets.length >= 10);
  for (const anchor of targets) assert.match(anchor, /rel="noreferrer"/);
});

test('CV and identity artifacts remain intact', async () => {
  const pdf = await stat(new URL('../public/Joshua_Nwachinemere_CV.pdf', import.meta.url));
  const docx = await stat(new URL('../public/Joshua_Nwachinemere_CV.docx', import.meta.url));
  assert.ok(pdf.size > 1_000);
  assert.ok(docx.size > 1_000);
  assert.match(favicon, />J</);
  assert.match(favicon, />N</);
});

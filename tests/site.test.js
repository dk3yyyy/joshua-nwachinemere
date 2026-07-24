import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
const robots = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8').catch(() => '');

test('page has one h1 and the expected primary sections', () => {
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  for (const id of ['work', 'approach', 'about', 'contact']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test('production metadata permits indexing and exposes crawl discovery', () => {
  assert.doesNotMatch(html, /noindex|nofollow/i);
  assert.match(html, /<link rel="canonical" href="https:\/\/dk3yyyy\.github\.io\/joshua-portfolio\/"/);
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.doesNotMatch(robots, /^Disallow: \/$/m);
  assert.match(robots, /^Sitemap: https:\/\/dk3yyyy\.github\.io\/joshua-portfolio\/sitemap\.xml$/m);
  assert.match(sitemap, /<loc>https:\/\/dk3yyyy\.github\.io\/joshua-portfolio\/<\/loc>/);
});

test('page publishes truthful ProfilePage and Person structured data', () => {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, 'Missing JSON-LD structured data');
  const data = JSON.parse(match[1]);
  assert.equal(data['@context'], 'https://schema.org');
  const graph = data['@graph'];
  const profile = graph.find((entry) => entry['@type'] === 'ProfilePage');
  const person = graph.find((entry) => entry['@type'] === 'Person');
  assert.equal(profile.mainEntity['@id'], person['@id']);
  assert.equal(person.name, 'Joshua Nwachinemere');
  assert.equal(person.jobTitle, 'AI Engineer');
  assert.deepEqual(person.sameAs, [
    'https://github.com/dk3yyyy',
    'https://www.linkedin.com/in/joshua-nwachinemere/',
  ]);
});

test('portfolio uses verified public links and preferred contact email', () => {
  for (const link of [
    'github.com/dk3yyyy/football_predictor',
    'github.com/dk3yyyy/volyx-lens',
    'github.com/dk3yyyy/Noughtline',
    'github.com/dk3yyyy/VirusTotal-Telegram-Bot',
    'github.com/dk3yyyy/sol-eth-wallet-analyzer',
    'linkedin.com/in/joshua-nwachinemere',
    'volyxai.com',
  ]) assert.ok(html.includes(link), `Missing ${link}`);
  assert.ok(html.includes('josh0victor@outlook.com'));
});

test('external links opened in new tabs are protected', () => {
  const externalTargets = [...html.matchAll(/<a[^>]*target="_blank"[^>]*>/g)].map((match) => match[0]);
  assert.ok(externalTargets.length >= 6);
  for (const anchor of externalTargets) assert.match(anchor, /rel="noreferrer"/);
});

test('strongest working project leads and forecasting experiment is archived last', () => {
  const titles = [...html.matchAll(/<h3>(.*?)<\/h3>/g)].map((match) => match[1]);
  assert.deepEqual(titles.slice(0, 5), [
    'Volyx Lens',
    'Noughtline',
    'VirusTotal Telegram Bot',
    'Solana &amp; Ethereum Wallet Analyzer',
    'Football Predictor',
  ]);
  assert.match(html, /project project-archive/);
  assert.match(html, /53\.77% accuracy versus a 56\.70% bookmaker benchmark/);
  assert.match(html, /https:\/\/github\.com\/dk3yyyy\/football_predictor/);
  assert.doesNotMatch(html, /football_predictor\/tree\/repair\/football-predictor-hardening/);
});

test('public positioning is Python-first AI engineering without founder or relocation branding', () => {
  assert.match(html, /AI Engineer/);
  assert.match(html, /ML Engineer/);
  assert.match(html, /Python/);
  assert.match(html, /RAG/);
  assert.match(html, /multimodal/i);
  assert.match(html, /voice AI/i);
  assert.match(html, /ML evaluation/i);
  assert.match(html, /DeepSeek/);
  assert.match(html, /building VolyxAI/i);
  assert.doesNotMatch(html, /Ollama|\bfounder\b|Lagos|relocat/i);
  assert.doesNotMatch(html, /Languages<\/span><p>[^<]*(JavaScript|TypeScript)/i);
});

test('recruiter CV artifacts exist and the PDF is linked', async () => {
  const pdf = await stat(new URL('../public/Joshua_Nwachinemere_CV.pdf', import.meta.url));
  const docx = await stat(new URL('../public/Joshua_Nwachinemere_CV.docx', import.meta.url));
  assert.ok(pdf.size > 1_000);
  assert.ok(docx.size > 1_000);
  assert.match(html, /href="%BASE_URL%Joshua_Nwachinemere_CV\.pdf"/);
});

test('responsive and reduced-motion styles are present', () => {
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /:focus-visible/);
});

test('copy avoids unsupported performance metrics', () => {
  const withoutVerifiedExperimentMetrics = html.replace('53.77%', '').replace('56.70%', '');
  assert.doesNotMatch(withoutVerifiedExperimentMetrics, /\b\d{1,3}(?:\.\d+)?%\b/);
  assert.doesNotMatch(html, /customers served|production scale|industry-leading/i);
});

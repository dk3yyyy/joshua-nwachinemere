import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
const cvBuilder = await readFile(new URL('../scripts/build_cv.py', import.meta.url), 'utf8');
const robots = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8').catch(() => '');
const favicon = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const telegramShareHtml = await readFile(new URL('../public/share-v3/index.html', import.meta.url), 'utf8');

const siteUrl = 'https://joshua-nwachinemere.pages.dev/';
const socialCardUrl = `${siteUrl}og-card-v4.png`;
const telegramShareUrl = `${siteUrl}share-v3/`;
const legacySitePattern = /https:\/\/dk3yyyy\.github\.io\/joshua-nwachinemere\/?/;

test('Telegram share path has a distinct cache identity and the approved card', () => {
  assert.ok(telegramShareHtml.includes(`<link rel="canonical" href="${telegramShareUrl}"`));
  assert.ok(telegramShareHtml.includes(`<meta property="og:url" content="${telegramShareUrl}"`));
  assert.ok(telegramShareHtml.includes(`<meta property="og:image" content="${socialCardUrl}"`));
  assert.ok(telegramShareHtml.includes(`<meta property="og:image:secure_url" content="${socialCardUrl}"`));
  assert.ok(telegramShareHtml.includes(`<meta name="twitter:image" content="${socialCardUrl}"`));
  assert.match(telegramShareHtml, /<meta name="robots" content="noindex,follow"/);
  assert.match(telegramShareHtml, /window\.location\.replace\('\/'\)/);
});

test('production identity consistently uses the Cloudflare portfolio URL', () => {
  assert.ok(html.includes(`<link rel="canonical" href="${siteUrl}"`));
  assert.ok(html.includes(`<meta property="og:url" content="${siteUrl}"`));
  assert.ok(robots.includes(`Sitemap: ${siteUrl}sitemap.xml`));
  assert.ok(sitemap.includes(`<loc>${siteUrl}</loc>`));
  for (const source of [html, telegramShareHtml, robots, sitemap, cvBuilder]) {
    assert.doesNotMatch(source, legacySitePattern);
  }
});

test('social metadata uses a cache-busted 1200 by 630 image card', async () => {
  const socialCardPath = new URL('../public/og-card-v4.png', import.meta.url);
  const socialCard = await stat(socialCardPath);
  const png = await readFile(socialCardPath);
  assert.ok(socialCard.size > 1_000);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.ok(html.includes(`<meta property="og:image" content="${socialCardUrl}"`));
  assert.ok(html.includes(`<meta property="og:image:secure_url" content="${socialCardUrl}"`));
  assert.ok(html.includes('<meta property="og:site_name" content="Joshua Nwachinemere · AI Engineer"'));
  assert.ok(html.includes(`<meta name="twitter:image" content="${socialCardUrl}"`));
  assert.ok(html.includes(`<link rel="image_src" href="${socialCardUrl}"`));
  assert.match(html, /<meta name="twitter:image:alt" content="Joshua Nwachinemere's portfolio homepage/);
  assert.doesNotMatch(html, /content="https:\/\/dk3yyyy\.github\.io\/joshua-nwachinemere\/og-card\.png"/);
});

test('favicon matches the split lime and cobalt JN identity', () => {
  assert.match(favicon, /#cfff48/i);
  assert.match(favicon, /#2448ff/i);
  assert.match(favicon, /#121410/i);
  assert.match(favicon, /#fffef8/i);
  assert.match(favicon, />J</);
  assert.match(favicon, />N</);
  assert.doesNotMatch(favicon, /terminal-style|#0b0e10|#d9ff57/i);
  assert.match(html, /<link rel="icon" href="\/favicon\.svg\?v=2" type="image\/svg\+xml" \/>/);
});

test('page has one h1 and the expected primary sections', () => {
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  for (const id of ['work', 'approach', 'about', 'contact']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test('landing page presents the inference field manual design contract', () => {
  assert.match(html, /Models answer\./);
  assert.match(html, /I engineer what happens next\./);
  assert.match(html, /class="[^"]*system-field/);
  assert.match(html, /data-system-field/);
  assert.equal((html.match(/data-field-node/g) || []).length, 5);
  assert.match(html, /aria-live="polite"/);
  assert.equal((html.match(/class="[^"]*case-study/g) || []).length, 5);
});

test('recruiter presentation favors plain labels and current evidence over editorial framing', () => {
  assert.doesNotMatch(html, /Field manual \/ 2026/i);
  assert.match(html, /<h2 id="work-title">Selected engineering work<\/h2>/);
  assert.match(html, /<h2 id="contributions-title">Merged upstream work<\/h2>/);
  assert.match(html, /<h2 id="about-title">What I build<\/h2>/);
});

test('hero exposes role fit and verified proof without requiring manifesto interpretation', () => {
  assert.match(html, /class="hero-role"[\s\S]*?AI Engineer · Python systems/);
  assert.match(html, /05 inspectable projects/);
  assert.match(html, /03 merged upstream PRs/);
  assert.match(html, /View selected work/);
});

test('all selected projects expose status ownership stack and evidence', () => {
  const projectArticles = [...html.matchAll(/<article class="case-study[\s\S]*?<\/article>/g)].map((match) => match[0]);
  assert.equal(projectArticles.length, 5);
  for (const article of projectArticles) {
    assert.match(article, /<dt>Status<\/dt>/);
    assert.match(article, /<dt>Ownership<\/dt>/);
    assert.match(article, /<dt>Evidence<\/dt>/);
    assert.match(article, /class="tags"/);
    assert.match(article, /href="https:\/\//);
  }
});

test('project maturity and outcome labels use one truthful vocabulary', () => {
  for (const status of [
    'Active pre-release',
    'Public demo',
    'Source available',
    'Public prototype',
    'Archived evaluation',
  ]) assert.match(html, new RegExp(`<dt>Status<\\/dt><dd>${status}<\\/dd>`));
  assert.doesNotMatch(html, /Engineering result:/);
  assert.doesNotMatch(html, /signal over naive baselines/i);
  assert.match(html, /ad-hoc signed test builds[^.]*not notarized/i);
});

test('merged upstream work links three verified pull requests and states engineering outcomes', () => {
  for (const href of [
    'https://github.com/ag2ai/faststream/pull/2961',
    'https://github.com/openai/openai-agents-python/pull/3991',
    'https://github.com/calkit/calkit/pull/1028',
  ]) assert.ok(html.includes(href), `Missing ${href}`);
  assert.equal((html.match(/class="contribution-card"/g) || []).length, 3);
  assert.match(html, /FastAPI 0\.140 compatibility/);
  assert.match(html, /WebSocket server errors/);
  assert.match(html, /unrelated subprojects/);
  assert.equal((html.match(/Merged into main · Jul 2026/g) || []).length, 3);
  assert.match(html, /data-contribution-rail/);
  assert.match(html, /aria-label="Previous contribution"/);
  assert.match(html, /aria-label="Next contribution"/);
});

test('action labels name their destination consistently', () => {
  for (const label of [
    'View selected work',
    'View architecture',
    'View release checks',
    'View source',
    'Open demo',
    'Email me about a role',
  ]) assert.match(html, new RegExp(label));
  assert.doesNotMatch(html, />Inspect (?:the system|the evidence|source|repository)/);
});

test('generic capability copy leads with retrieval and context engineering, not standalone RAG', () => {
  assert.match(html, /<meta name="description" content="[^"]*retrieval[^"]*context engineering/i);
  assert.match(html, /<meta property="og:description" content="[^"]*retrieval[^"]*context engineering/i);
  assert.match(html, /class="hero-lede">[^<]*retrieval[^<]*context engineering/i);
  assert.match(html, /class="role-rail"[\s\S]*?retrieval[^<]*context engineering/i);
  assert.match(html, /class="about-lede">[^<]*retrieval[^<]*context assembly/i);
  assert.match(html, /<dt>AI engineering<\/dt><dd>retrieval[^<]*context engineering/i);
  assert.doesNotMatch(html, /RAG \+ context engineering|RAG · context engineering/);
});

test('CV uses precise retrieval/context language and preserves VolyxAI date', () => {
  assert.match(cvBuilder, /HEADLINE = "AI Engineer \| Python, Retrieval, Context Engineering, Multimodal AI & ML Evaluation"/);
  assert.match(cvBuilder, /Work spans retrieval and\s+"\n\s+"context assembly/);
  assert.doesNotMatch(cvBuilder, /\bRAG\b|retrieval-augmented generation/i);
  assert.match(cvBuilder, /date": "Nov 2025 - Present"/);
  assert.match(cvBuilder, /retrieval and context assembly/);
});

test('VolyxAI and Volyx Lens remain separate independent work', () => {
  assert.match(html, /independent product effort/i);
  assert.match(html, /At VolyxAI, an independent product effort/);
  const lensArticle = html.match(/<article class="case-study[\s\S]*?<h3>Volyx Lens<\/h3>[\s\S]*?<\/article>/)?.[0] ?? '';
  const volyxMethod = html.match(/<div class="section approach-heading"[\s\S]*?<\/div>/)?.[0] ?? '';
  assert.match(lensArticle, /<dd>Independent project<\/dd>/);
  assert.doesNotMatch(lensArticle, /VolyxAI/i);
  assert.doesNotMatch(volyxMethod, /Volyx Lens/i);
  assert.match(cvBuilder, /INDEPENDENT PRODUCT & ENGINEERING WORK/);
  assert.doesNotMatch(cvBuilder, /PROFESSIONAL EXPERIENCE/);
  assert.match(cvBuilder, /Independent product effort/);
  assert.match(cvBuilder, /Volyx Lens \| Privacy-First Context-Aware AI Assistant/);
  assert.doesNotMatch(cvBuilder.match(/\{\n\s+"name": "Volyx Lens[\s\S]*?\n\s+\},/)?.[0] ?? '', /VolyxAI/i);
  assert.doesNotMatch(`${html}\n${cvBuilder}`, /\bNigeria\b|\bCAC\b/i);
});

test('production metadata permits indexing and exposes crawl discovery', () => {
  assert.doesNotMatch(html, /noindex|nofollow/i);
  assert.ok(html.includes(`<link rel="canonical" href="${siteUrl}"`));
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.doesNotMatch(robots, /^Disallow: \/$/m);
  assert.ok(robots.includes(`Sitemap: ${siteUrl}sitemap.xml`));
  assert.ok(sitemap.includes(`<loc>${siteUrl}</loc>`));
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
    'chainscope-wallet-analyzer.onrender.com',
    'linkedin.com/in/joshua-nwachinemere',
    'volyxai.com',
  ]) assert.ok(html.includes(link), `Missing ${link}`);
  assert.ok(html.includes('josh0victor@outlook.com'));
});

test('wallet analyzer exposes separate verified live and source links', () => {
  assert.match(html, /href="https:\/\/chainscope-wallet-analyzer\.onrender\.com"[^>]*>Open demo <span aria-hidden="true">↗<\/span><\/a>/);
  assert.match(html, /href="https:\/\/github\.com\/dk3yyyy\/sol-eth-wallet-analyzer"[^>]*>View source <span aria-hidden="true">↗<\/span><\/a>/);
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
  assert.match(html, /case-study[^\n]*case-study-archive|case-study-archive[^\n]*case-study/);
  assert.match(html, /53\.77% accuracy versus a 56\.70% bookmaker benchmark/);
  assert.match(html, /https:\/\/github\.com\/dk3yyyy\/football_predictor/);
  assert.doesNotMatch(html, /football_predictor\/tree\/repair\/football-predictor-hardening/);
});

test('public positioning is AI engineering with direct Python language without founder or relocation branding', () => {
  assert.match(html, /AI Engineer/);
  assert.match(html, /ML Engineer/);
  assert.match(html, /Python/);
  assert.doesNotMatch(html, /Python-first/i);
  assert.match(html, /retrieval/);
  assert.match(html, /multimodal/i);
  assert.match(html, /voice AI/i);
  assert.match(html, /ML evaluation/i);
  assert.match(html, /DeepSeek/);
  assert.match(html, /building(?: at)? VolyxAI/i);
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

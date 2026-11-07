import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
const mainJs = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const themeInitJs = await readFile(new URL('../public/theme-init.js', import.meta.url), 'utf8');
const favicon = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const productionHeaders = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
const wranglerConfig = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
const assistantDocs = await readFile(new URL('../docs/portfolio-assistant.md', import.meta.url), 'utf8');
const pagesWorkerBuildScript = await readFile(new URL('../scripts/build-pages-worker.mjs', import.meta.url), 'utf8');
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const socialCard = await readFile(new URL('../public/og-card-v6.png', import.meta.url));
const localReviewReport = await readFile(new URL('../public/evidence/local-review-intelligence-evaluation-report.json', import.meta.url));
const localReviewReportJson = JSON.parse(localReviewReport);

const siteUrl = 'https://joshua-nwachinemere.pages.dev/';
const socialCardUrl = `${siteUrl}og-card-v6.png`;
const projectNames = [
  'Volyx Lens',
  'Local Review Intelligence',
  'Football Forecasting Lab',
  'Telegram Social Video Downloader',
  'ChainScope Wallet Analyzer',
];
const projectIds = [
  'project-lens',
  'project-local-ai',
  'project-football',
  'project-downloader',
  'project-wallet',
];
const repositoryUrls = [
  'https://github.com/dk3yyyy/volyx-lens',
  'https://github.com/dk3yyyy/local_AI_agent',
  'https://github.com/dk3yyyy/football_predictor',
  'https://github.com/dk3yyyy/telegram-social-video-downloader',
  'https://github.com/dk3yyyy/sol-eth-wallet-analyzer',
];
const pullRequestUrls = [
  'https://github.com/openai/openai-agents-python/pull/3991',
  'https://github.com/pydantic/pydantic-ai-harness/pull/503',
  'https://github.com/generative-computing/mellea/pull/1471',
  'https://github.com/generative-computing/mellea/pull/1469',
  'https://github.com/ag2ai/faststream/pull/2961',
  'https://github.com/apache/arrow-rs/pull/10486',
  'https://github.com/vega/altair/pull/4089',
  'https://github.com/faststream-community/faststream_fastapi/pull/2',
  'https://github.com/calkit/calkit/pull/1028',
];
const contactEmail = 'joshua0nwachinemere@gmail.com';
const retiredEmail = 'josh0victor@outlook.com';
const mailto = `mailto:${contactEmail}?subject=AI%20Engineer%20opportunity`;

const occurrences = (source, value) => source.split(value).length - 1;
const textOnly = html
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

test('uses the approved semantic landmarks, navigation, and deep links', () => {
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  assert.match(html, /<a class="skip" href="#main">Skip to content<\/a>/);
  assert.match(html, /<main id="main">/);
  assert.match(html, /<header class="top" data-header>/);
  for (const id of ['top', 'work', ...projectIds, 'receipts', 'writing', 'background', 'contact']) {
    assert.equal(occurrences(html, `id="${id}"`), 1, `Expected one #${id}`);
  }
  assert.equal(occurrences(html, 'id="contributions"'), 1);
  const nav = html.match(/<nav class="primary-nav" id="primary-nav" aria-label="Primary navigation">[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.ok(nav, 'Missing the primary navigation landmark');
  const labels = ['Work', 'Receipts', 'Upstream', 'Writing', 'Background', 'Contact'];
  const targets = ['#work', '#receipts', '#contributions', '#writing', '#background', '#contact'];
  const positions = targets.map((target, index) => {
    assert.ok(nav.includes(`href="${target}">${labels[index]}</a>`), `Missing navigation label: ${labels[index]}`);
    return nav.indexOf(`href="${target}"`);
  });
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), 'Navigation order must follow the page');
  assert.match(html, /<button class="menu-button" type="button" aria-expanded="false" aria-controls="primary-nav">/);
  assert.match(html, /<button class="toggle" id="rcptToggle" type="button" aria-pressed="false" aria-label="Show receipts">/);
  assert.match(html, /<p class="sr" id="live" aria-live="polite"><\/p>/);
});

test('always follows the system theme without a manual theme control or override', () => {
  assert.match(html, /<script src="\/theme-init\.js"><\/script>/);
  assert.doesNotMatch(html, /theme-control|theme-toggle|theme-icon-|theme-menu|data-theme-option/);
  assert.doesNotMatch(css, /:root\[data-theme='(?:light|dark)'\]/);
  assert.match(css, /@media\s*\(prefers-color-scheme:\s*dark\)/);
  assert.match(css, /:root\[data-theme='auto'\]/);
  assert.doesNotMatch(css, /\.theme-control|\.theme-toggle|\.theme-icon-/);
  assert.match(css, /color-scheme:\s*dark/);
  assert.match(html, /<html lang="en" data-theme="auto">/);
  assert.match(themeInitJs, /dataset\.theme = 'auto'/);
  assert.match(themeInitJs, /classList\.add\('js'\)/);
  assert.match(themeInitJs, /portfolio-theme/);
  assert.match(themeInitJs, /localStorage\.removeItem/);
  assert.doesNotMatch(themeInitJs, /localStorage\.getItem|localStorage\.setItem/);
  assert.match(themeInitJs, /prefers-color-scheme: dark/);
  assert.match(themeInitJs, /meta\[name="theme-color"\]/);
  assert.match(mainJs, /function syncSystemTheme\(\)/);
  assert.match(mainJs, /systemDark\.addEventListener\('change', syncSystemTheme\)/);
  assert.doesNotMatch(mainJs, /THEME_STORAGE_KEY|THEME_STATES|themeToggle|localStorage/);
});

test('publishes the editorial palette and self-hosted type system in both schemes', () => {
  assert.match(css, /--paper:\s*#FFFFFF;/);
  assert.match(css, /--fg-1:\s*#000000;/);
  assert.match(css, /--blue:\s*#1A35E5;/);
  assert.match(css, /--on-blue:\s*#FFFFFF;/);
  assert.match(css, /--max:\s*1200px;/);
  assert.match(css, /--display:\s*"Instrument Serif"/);
  assert.match(css, /--sans:\s*"Instrument Sans"/);
  const darkBlock = css.match(/@media \(prefers-color-scheme:dark\)\{[\s\S]*?\n\}/)?.[0] ?? '';
  assert.ok(darkBlock, 'Missing the dark-scheme token block');
  assert.match(darkBlock, /:root\[data-theme='auto'\]\{/);
  for (const token of [
    /--paper:\s*#000000;/,
    /--fg-1:\s*#FFFFFF;/,
    /--blue:\s*#7086FF;/,
    /--on-blue:\s*#000000;/,
    /color-scheme:\s*dark/,
  ]) assert.match(darkBlock, token, `Dark scheme is missing ${token}`);
  assert.match(css, /@font-face\s*\{[^}]*font-family:\s*'Instrument Sans'[^}]*font-display:\s*swap/);
  assert.match(css, /@font-face\s*\{[^}]*font-family:\s*'Instrument Serif'[^}]*font-display:\s*swap/);
  for (const file of [
    'instrument-sans-latin.woff2',
    'instrument-sans-latin-ext.woff2',
    'instrument-sans-italic-latin.woff2',
    'instrument-serif-latin.woff2',
    'instrument-serif-italic-latin.woff2',
  ]) assert.ok(css.includes(`/fonts/${file}`), `Missing self-hosted ${file}`);
  assert.doesNotMatch(html + css, /fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/i);
  for (const face of css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)) {
    assert.match(face[1], /src:\s*url\('\/fonts\//, 'Every @font-face src must be self-hosted');
  }
});

test('hero and availability copy are exact and direct', () => {
  const headline = 'I build the part of an AI system that checks the model’s work.';
  assert.match(html, new RegExp(`<h1>${headline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`));
  assert.ok(textOnly.includes(headline));
  assert.ok(textOnly.includes('Open to AI engineer roles'));
  assert.ok(textOnly.includes('MSc Artificial Intelligence, Northumbria University · September 2026 intake'));
  assert.ok(!textOnly.includes('Planning to relocate'));
  assert.ok(!textOnly.includes('Student visa conditions'));
  assert.ok(textOnly.includes('Models are good at producing answers.'));
  assert.ok(textOnly.includes('whether an answer is grounded'));
  assert.ok(textOnly.includes('whether a benchmark is honest'));
  assert.ok(!textOnly.includes('my model lost'));
  assert.ok(!/\brejected\b/i.test(textOnly));
  assert.ok(textOnly.includes('Merged upstream OpenAI Agents SDK, Pydantic AI, Apache Arrow'));
  assert.ok(textOnly.includes('Shipping Volyx Lens, Local Review Intelligence'));
  assert.ok(textOnly.includes('Writing Five essays on where AI systems quietly break'));
  assert.match(html, />See the work<\/a>/);
  assert.match(html, />Download CV<\/a>/);
  assert.match(css, /h1\{font-family:var\(--display\);font-weight:400;font-size:clamp\(44px,6\.2vw,84px\)/);
  assert.match(css, /\.hero\{padding-top:clamp\(40px,5vw,76px\);padding-bottom:clamp\(40px,5vw,64px\)\}/);
  assert.match(css, /\.hero-grid\{display:grid;grid-template-columns:5fr 7fr/);
  assert.match(css, /\.avail\{[^}]*border-radius:var\(--pill\)/);
  assert.match(html, /<figure class="machine rise rise-2" aria-labelledby="mcap">/);
  assert.match(html, /<p id="mcap">What every answer has to pass before you see it<\/p>/);
  assert.equal((html.match(/<li class="check">/g) || []).length, 4, 'four verified checks');
  assert.doesNotMatch(html, /id="runBtn"|class="slot"|id="held"/);
});

test('keeps motion progressive with visible reduced-motion finished states', async () => {
  const motionJs = await readFile(new URL('../src/motion.js', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /data-reveal/);
  assert.doesNotMatch(css, /data-reveal/);
  assert.match(css, /@media \(prefers-reduced-motion:no-preference\)\{[\s\S]*?\.js h1:not\(\.split\)\{visibility:hidden\}/);
  assert.match(css, /\.js \.rise\{opacity:0;transform:translateY\(12px\)/);
  assert.match(css, /\.js \.ready \.rise\{opacity:1;transform:none\}/);
  assert.match(css, /\.js \.steps\.drawn::before\{transform:none\}/);
  assert.match(css, /\.js \.steps\.drawn \.shape\{transform:none;opacity:1\}/);
  assert.match(css, /body\.receipts \.rcpt\{display:inline-block\}/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\s*\*,\*::before,\*::after\{animation:none!important;transition:none!important\}/);
  assert.match(motionJs, /function splitHeadline\(\)/);
  assert.match(motionJs, /h1\.setAttribute\('aria-label', text\)/);
  assert.match(motionJs, /outer\.className = 'w'/);
  assert.match(motionJs, /h1\.replaceChildren\(frag\)/);
  assert.match(motionJs, /lists\.forEach\(\(list\) => list\.classList\.add\('drawn'\)\)/);
  assert.match(motionJs, /classList\.toggle\('receipts', on\)/);
  assert.doesNotMatch(motionJs, /initMachine|finalState|dataset\.v/);
});

test('uses the editorial layout measure and the 960, 760 and 620 collapse points', () => {
  assert.match(css, /--max:1200px/);
  assert.match(css, /\.wrap\{max-width:var\(--max\);margin:0 auto;padding:0 var\(--gut\)\}/);
  assert.match(css, /section\.s\{padding:clamp\(48px,6vw,76px\) 0;border-top:1px solid var\(--grey-200\)\}/);
  assert.match(css, /\.machine\{background:var\(--grey-100\);border-radius:var\(--r-xl\);padding:clamp\(20px,3vw,32px\);margin:0\}/);
  assert.match(css, /@media \(max-width:959px\)\{\s*\.hero-grid,\.shead,\.project,\.contact,\.essays a\{grid-template-columns:1fr\}/);
  assert.match(css, /@media \(max-width:959px\)\{[\s\S]*?\.prs\{columns:1\}/);
  assert.match(css, /@media \(max-width: 959px\) \{\s*\.record > div \{\s*grid-template-columns: 1fr/);
  assert.match(css, /@media \(max-width: 760px\) \{\s*\.also \{\s*grid-template-columns: 1fr/);
  assert.match(css, /@media \(max-width:620px\)\{\s*\.steps\{grid-template-columns:1fr/);
  assert.match(css, /@media \(max-width: 620px\) \{[\s\S]*?\.facts li \{[\s\S]*?grid-template-columns: 1fr/);
  assert.match(css, /\.prs\{list-style:none;margin:0;padding:0;columns:2/);
  assert.match(css, /\.also \{\s*display: grid;\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(css, /\.calls\b/);
});

test('production remains indexable while HTML revalidation stays enabled', () => {
  assert.doesNotMatch(productionHeaders, /X-Robots-Tag:\s*(?:noindex|nofollow)/i);
  assert.match(productionHeaders, /Cache-Control: no-cache/);
});

test('production config avoids unsupported Pages bindings and keeps AI routing fail-closed', () => {
  assert.match(wranglerConfig, /"ASSISTANT_ENV"\s*:\s*"production"/);
  assert.doesNotMatch(wranglerConfig, /"ASSISTANT_ENV"\s*:\s*"preview"/);
  assert.doesNotMatch(wranglerConfig, /"ratelimits"\s*:/);
  assert.match(wranglerConfig, /"ai"\s*:/);
  assert.match(wranglerConfig, /"binding"\s*:\s*"AI"/);
});

test('Cloudflare builds pin compatible tooling and prebundle Pages Functions', () => {
  assert.equal(packageJson.devDependencies.wrangler, '4.118.0');
  assert.match(packageJson.scripts.postbuild, /build:pages-functions/);
  assert.equal(packageJson.scripts['build:pages-functions'], 'node scripts/build-pages-worker.mjs');
  assert.match(pagesWorkerBuildScript, /'--outdir'/);
  assert.match(pagesWorkerBuildScript, /outputDirectory, '_worker\.js'/);
  assert.doesNotMatch(pagesWorkerBuildScript, /'--outfile'/);
});

test('assistant deployment documentation matches the production fail-closed configuration', () => {
  assert.doesNotMatch(assistantDocs, /checked-in Wrangler configuration is preview-only/i);
  assert.doesNotMatch(assistantDocs, /hostname may route without a production limiter/i);
  assert.match(assistantDocs, /production model routing fails closed with `503` until a supported edge limiter is configured/i);
});

test('includes a grounded corner chatbot with an accessible popup and explicit scope controls', () => {
  const assistant = html.match(/<aside[^>]+data-assistant[\s\S]*?<\/aside>/)?.[0] ?? '';
  assert.match(assistant, /data-assistant/);
  assert.match(assistant, /class="assistant-launcher"/);
  assert.match(assistant, /aria-controls="assistant-panel"/);
  assert.match(assistant, /aria-expanded="false"/);
  assert.match(assistant, /id="assistant-panel"/);
  assert.match(assistant, /role="dialog"/);
  assert.match(assistant, /aria-modal="false"/);
  assert.match(assistant, /<h2 id="assistant-title">Ask Joshua<\/h2>/);
  assert.match(assistant, /class="assistant-close"/);
  assert.match(assistant, /<div class="assistant-conversation" id="assistant-conversation" role="log"/);
  assert.match(assistant, /aria-live="polite"/);
  assert.match(assistant, /<form class="assistant-form" id="assistant-form">/);
  assert.match(assistant, /<textarea id="assistant-question" name="question" rows="1" maxlength="500"/);
  assert.match(assistant, /Cloudflare Workers AI via a Cloudflare Pages Function/);
  assert.match(assistant, /Don’t enter personal data/);
  assert.match(assistant, /Public portfolio questions only/);
  assert.equal((assistant.match(/data-question=/g) || []).length, 3);
  assert.match(css, /\.assistant-widget \{[^}]*position: fixed;/);
  assert.match(css, /\.assistant-panel \{[^}]*position: absolute;/);
  assert.match(css, /\.assistant-conversation \{[^}]*overflow-y: auto;/);
});

test('renders exactly three featured and two additional projects in source order', () => {
  assert.equal((html.match(/<article class="project"/g) || []).length, 3);
  const work = html.match(/<section class="s" id="work"[\s\S]*?<\/section>/)?.[0] ?? '';
  const also = work.match(/<div class="also">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/)?.[0] ?? '';
  assert.ok(also, 'Missing the .also two-up');
  assert.equal((also.match(/<article\b/g) || []).length, 2, '.also must contain two articles');
  assert.equal(occurrences(html, 'data-project-name'), 5);
  const positions = projectNames.map((name) => html.indexOf(`>${name}</h3>`));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  for (const name of projectNames) {
    assert.ok(textOnly.includes(name), `Missing visible project name: ${name}`);
    assert.equal(occurrences(html, `>${name}</h3>`), 1, `Expected one project heading: ${name}`);
  }
  assert.ok(html.indexOf('id="project-lens"') < html.indexOf('id="project-local-ai"'));
  assert.ok(html.indexOf('id="project-local-ai"') < html.indexOf('id="project-football"'));
  assert.ok(html.indexOf('id="project-football"') < html.indexOf('id="project-downloader"'));
  assert.ok(html.indexOf('id="project-downloader"') < html.indexOf('id="project-wallet"'));
  assert.doesNotMatch(html, /role="tab(?:list|panel)?"|aria-selected=|data-tab/i);
});

test('each featured project tells the approach, hard part, insight, shipped story', () => {
  for (const id of ['project-lens', 'project-local-ai', 'project-football']) {
    const project = html.match(new RegExp(`<article class="project" id="${id}"[\\s\\S]*?<\\/article>`))?.[0] ?? '';
    assert.ok(project, `Missing featured project #${id}`);
    const steps = project.match(/<ol class="steps">([\s\S]*?)<\/ol>/)?.[1] ?? '';
    assert.ok(steps, `#${id} is missing its ol.steps`);
    assert.equal((steps.match(/<li\b/g) || []).length, 4, `#${id} must have four steps`);
    const labels = [...steps.matchAll(/<b>([^<]+)<\/b>/g)].map(([, label]) => label);
    assert.deepEqual(labels, ['Approach', 'Hard part', 'Insight', 'Shipped'], `#${id} step order`);
    assert.match(steps, /<li class="key">/);
    const result = project.match(/<div class="result">([\s\S]*?)<\/div>\s*<\/div>/)?.[1] ?? '';
    assert.ok(result, `#${id} is missing its result tiles`);
    assert.ok((result.match(/class="res"/g) || []).length >= 2, `#${id} needs at least two result tiles`);
    assert.doesNotMatch(result, /\bloss\b/, `#${id} must not carry a loss tile`);
    assert.match(project, /<figure class="shot">[\s\S]*?<figcaption>/);
  }
});

test('project claims, ownership, and evaluation evidence remain exact', () => {
  assert.ok(textOnly.includes('Each project starts with the obvious approach, names the hard part, and ends with a measured result. Every number links to how it was measured.'));
  assert.doesNotMatch(textOnly, /The model did not beat the benchmark/i);
  assert.ok(textOnly.includes('The market is the baseline, and the evaluation is built to respect it.'));
  assert.ok(textOnly.includes('53.77% accuracy across 1,140 rolling-origin matches'));
  assert.doesNotMatch(textOnly, /lost to the bookmaker|bookmaker benchmark/i);
  const lens = html.match(/<article[^>]+id="project-lens"[\s\S]*?<\/article>/)?.[0] ?? '';
  assert.doesNotMatch(lens, /<dt>Scope<\/dt>|ad-hoc signed test builds|notarized releases/i);
  assert.ok(lens.includes('The product isn’t the model. It’s deciding what the model gets to see.'));
  assert.ok(lens.includes('Context selection is the feature. Consent is part of the design.'));
  assert.ok(lens.includes('Capture on explicit action only, local OCR ranking, provider-aware routing, sandboxed Electron boundaries.'));
  const localProject = html.match(/<article[^>]+id="project-local-ai"[\s\S]*?<\/article>/)?.[0] ?? '';
  assert.doesNotMatch(localProject, /<dt>Limitations<\/dt>|Three of 25|median latency|dirty worktree|both 0\.560|general reliability/i);
  assert.ok(localProject.includes('A citation the model invented is worse than no citation at all.'));
  assert.ok(localProject.includes('Citation validation with one bounded repair pass, recoverable indexes, privacy-safe diagnostics.'));
  assert.ok(localProject.includes('0.913'));
  assert.ok(localProject.includes('0.880'));
  assert.match(html, /href="%BASE_URL%evidence\/local-review-intelligence-evaluation-report\.json"[^>]*>View results<\/a>/);
  assert.doesNotMatch(html, /local_AI_agent\/tree\/main\/evaluation\/results\/v0\.2\.0-ollama-0\.32\.5/i);
  assert.equal(createHash('sha256').update(localReviewReport).digest('hex'), '2e2f76e4d74b6ddedb1e37039fbd603d10116d14e01849f04b1df94530193341');
  assert.equal(localReviewReportJson.schema_version, 3);
  assert.equal(localReviewReportJson.provenance.git_commit, '25b65ff85f243f731fa6c376eaefb133c6f4e7e7');
  assert.equal(localReviewReportJson.provenance.git_dirty, false);
  assert.equal(localReviewReportJson.diagnostics.raw_responses_included, false);
  assert.deepEqual(localReviewReportJson.results.rag, {
    abstention_case_count: 5,
    abstention_recall: 1,
    answer_success_rate: 0.88,
    answerable_case_count: 25,
    case_count: 30,
    citation_validity: 0.88,
    expected_action_accuracy: 0.9,
    reference_term_support_proxy: 0.86,
    retrieval_recall: 0.9133333333333333,
  });
  assert.doesNotMatch(textOnly, /Verified behaviour/i);
  assert.doesNotMatch(lens, /VolyxAI/i);
});

test('adds honest, accessible visual product evidence without the rejected control token', async () => {
  const expectedMedia = [
    ['project-lens', '%BASE_URL%images/volyx-lens-context-aperture.jpg', 'High-resolution capture of the live product site showing its Context Aperture interface and Screen, You and Them inputs'],
    ['project-local-ai', '%BASE_URL%images/local-review-intelligence-dashboard-5b174ed3.jpg', 'Local Review Intelligence dashboard showing 123 reviews, summary metrics, rating distribution and the review table'],
    ['project-football', '%BASE_URL%images/football-forecasting-dashboard-12cff076.jpg', 'Football Forecasting Lab match-intelligence dashboard showing synthetic demo provenance, overview signals and fictional fixture probabilities'],
  ];
  const expectedCaptions = [
    ['project-lens', 'Context Aperture: screen, microphone and system audio as intentional inputs, routed to the configured provider.'],
    ['project-local-ai', '123 reviews, a rating distribution and an inspectable table, with grounded answers and citations directly below.'],
    ['project-football', 'A five-view workspace for forecasts, evaluation and live results; this captured state uses the isolated synthetic interface-test dataset.'],
  ];
  for (const [projectId, source, alt] of expectedMedia) {
    const project = html.match(new RegExp(`<article[^>]+id="${projectId}"[\\s\\S]*?<\\/article>`))?.[0] ?? '';
    assert.ok(project.includes(`src="${source}"`), `Missing media source for ${projectId}`);
    assert.ok(project.includes(`alt="${alt}"`), `Missing descriptive alt text for ${projectId}`);
    const caption = expectedCaptions.find(([id]) => id === projectId)?.[1];
    assert.ok(caption, `Missing expected caption for ${projectId}`);
    assert.ok(project.includes(`<figcaption>${caption}</figcaption>`), `Caption must stay exact for ${projectId}`);
  }
  const lensImage = await stat(new URL('../public/images/volyx-lens-context-aperture.jpg', import.meta.url));
  const localDashboardImage = await stat(new URL('../public/images/local-review-intelligence-dashboard-5b174ed3.jpg', import.meta.url));
  const footballDashboardImage = await stat(new URL('../public/images/football-forecasting-dashboard-12cff076.jpg', import.meta.url));
  assert.ok(lensImage.size > 10_000);
  assert.ok(localDashboardImage.size > 10_000);
  assert.ok(footballDashboardImage.size > 10_000);
  const localProject = html.match(/<article[^>]+id="project-local-ai"[\s\S]*?<\/article>/)?.[0] ?? '';
  assert.match(
    localProject,
    /<img src="%BASE_URL%images\/local-review-intelligence-dashboard-5b174ed3\.jpg" width="1200" height="833"/,
  );
  assert.doesNotMatch(localProject, /local-review-intelligence-evidence\.jpg/);
  const footballProject = html.match(/<article[^>]+id="project-football"[\s\S]*?<\/article>/)?.[0] ?? '';
  assert.match(
    footballProject,
    /<img src="%BASE_URL%images\/football-forecasting-dashboard-12cff076\.jpg" width="1200" height="833"/,
  );
  assert.match(footballProject, /isolated synthetic interface-test dataset/);
  assert.doesNotMatch(footballProject, /redesigned/i);
  assert.doesNotMatch(html, /class="visual-link"/);
  assert.doesNotMatch(textOnly, /INSUFFICIENT_EVIDENCE/);
});

test('keeps all five repository URLs and all nine contribution rows visible', () => {
  for (const url of [...repositoryUrls, ...pullRequestUrls]) assert.ok(html.includes(url), `Missing ${url}`);
  const contributionSection = html.match(/<section[^>]+id="contributions"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.ok(contributionSection, 'Missing #contributions');
  const rows = [...contributionSection.matchAll(/<li class="contribution-row">([\s\S]*?)<\/li>/g)].map(([, cells]) => cells);
  assert.equal(rows.length, 9, 'All nine rows must be direct ledger entries');
  rows.forEach((cells, index) => {
    assert.match(cells, new RegExp(`<a class="ref" href="${pullRequestUrls[index].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" target="_blank" rel="noreferrer">#\\d+</a>`), `Row ${index + 1} needs its pull-request link`);
    assert.match(cells, /<b>[^<]+<\/b>/, `Row ${index + 1} is missing its project name`);
    assert.match(cells, /<span>[^<]+<\/span>/, `Row ${index + 1} is missing its change description`);
  });
  assert.ok(textOnly.includes('Nine pull requests authored by Joshua, independently verified and merged into maintained open-source projects. Each one came out of his own work on the frameworks.'));
  assert.doesNotMatch(contributionSection, /<details|\shidden(?:=|\s)|aria-hidden="true"/i);
});

test('orders the page from selected work through receipts, upstream, writing, background and contact', () => {
  const positions = ['top', 'work', 'receipts', 'contributions', 'writing', 'background', 'contact']
    .map((id) => html.indexOf(`id="${id}"`));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.ok(html.indexOf('class="also"') < html.indexOf('id="receipts"'), 'Smaller builds belong at the end of Selected work');
});

test('keeps project actions focused on demos, source, and explanatory evidence', () => {
  assert.doesNotMatch(html, /href="[^"]*\/actions(?:[/?#][^"]*)?"/i);
  assert.doesNotMatch(textOnly, /View CI|View release checks/i);
  assert.match(textOnly, /Product site/);
  assert.match(textOnly, /Source/);
  assert.match(textOnly, /Architecture/);
  assert.match(textOnly, /View results/);
  assert.match(textOnly, /Source and evaluation/);
  assert.match(textOnly, /Live demo/);
  const lens = html.match(/<article[^>]+id="project-lens"[\s\S]*?<\/article>/)?.[0] ?? '';
  assert.match(lens, /<a href="https:\/\/volyxlens\.pages\.dev\/" target="_blank" rel="noreferrer">Product site<\/a>/);
});

test('includes the approved background, contact, and footer copy', () => {
  for (const heading of ['Selected work', 'Receipts', 'Upstream', 'Writing', 'Background', 'Tell me what your model gets wrong.']) {
    assert.match(textOnly, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.ok(textOnly.includes('My path combines independent product work, engineering projects, technical training and merged open-source contributions.'));
  assert.ok(textOnly.includes('VolyxAI product work'));
  assert.ok(textOnly.includes('Independent product effort'));
  assert.ok(textOnly.includes('Bachelor of Technology in Mathematics, Federal University of Technology, Owerri.'));
  assert.ok(textOnly.includes('MSc Artificial Intelligence, Northumbria University, September 2026 intake.'));
  assert.ok(textOnly.includes('I’m looking for AI engineer roles where reliability is the job: retrieval, evaluation, model integration and the Python services around them.'));
  assert.ok(!textOnly.includes('Open to part-time work during study'));
  assert.ok(!textOnly.includes('future full-time graduate roles'));
  assert.ok(!textOnly.includes('Back to top ↑'));
  assert.ok(textOnly.includes('© 2026 Joshua Nwachinemere · AI Engineer · Python and applied AI'));
  assert.ok(textOnly.includes('AI Engineer · Python and applied AI'));
  assert.ok(textOnly.includes('No cookies, no analytics, no trackers.'));
  const contact = html.match(/<section class="s" id="contact"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.ok(contact, 'Missing #contact');
  assert.match(contact, /<h2 id="ct-h">Tell me what your model gets wrong\.<\/h2>/);
  assert.match(contact, /<p class="lede">/);
  const ctas = [...contact.matchAll(/<a class="btn ([^"]+)"[^>]*>([^<]+)<\/a>/g)].map(([, kind, label]) => ({ kind, label }));
  assert.deepEqual(ctas.map(({ label }) => label), ['Email me', 'Download CV', 'GitHub', 'LinkedIn']);
  assert.deepEqual(ctas.map(({ kind }) => kind), ['primary', 'line', 'line', 'line']);
  assert.match(contact, /<div class="idcard" id="idcard"/);
});

test('visible portfolio copy stays capability-led rather than limitation-led', () => {
  assert.doesNotMatch(textOnly, /measured limitations|not presented as conventional employment|not employment with the upstream projects|Degrade without hiding failure|reports its loss|The model did not beat the benchmark|ad-hoc signed test builds|notarized releases|Active pre-release|Experimental evaluation/i);
  assert.doesNotMatch(html, /<dt>Limitations<\/dt>|<dt>Scope<\/dt>/i);
  assert.ok(textOnly.includes('Each project starts with the obvious approach, names the hard part, and ends with a measured result.'));
  assert.ok(textOnly.includes('Bounded workers, host allowlisting, restart recovery and non-root containers.'));
  assert.ok(textOnly.includes('bounded concurrency, caching and useful partial results'));
});

test('shows a focused and verifiable certification set', () => {
  const certificationSection = html.match(/<ul class="certs">[\s\S]*?<\/ul>/)?.[0] ?? '';
  const expected = [
    ['Scientific Computing with Python', 'freeCodeCamp · May 2026', 'https://www.freecodecamp.org/certification/joshua_nwachinemere/scientific-computing-with-python-v7'],
    ['Google AI Specialization', 'Google/Coursera · Feb 2026', 'https://www.coursera.org/account/accomplishments/professional-cert/L1UIFMPUME30'],
    ['Model Context Protocol: Advanced Topics', 'Anthropic training · Mar 2026', 'https://verify.skilljar.com/c/fwqra86yief7'],
  ];
  assert.ok(certificationSection, 'Missing the certifications list');
  assert.equal((certificationSection.match(/<a\b/g) ?? []).length, 3, 'Certification set must contain exactly three links');
  for (const [name, metadata, url] of expected) {
    assert.ok(certificationSection.includes(name), `Missing credential named ${name}`);
    assert.ok(certificationSection.includes(metadata), `Missing credential metadata: ${metadata}`);
    assert.ok(certificationSection.includes(`href="${url}"`), `Missing verification URL: ${url}`);
  }
  assert.doesNotMatch(certificationSection, /Google AI Professional Certificate|Google Cybersecurity|Claude Code in Action|Introduction to Model Context Protocol|AI Fluency/i);
  assert.match(html, /<dt>Certifications<br>&amp; training<\/dt>/);
  const background = html.match(/<section class="s" id="background"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.equal((background.match(/<dt>/g) ?? []).length, 5, 'Background record must keep five entries');
  assert.equal((background.match(/<dd>/g) ?? []).length, 5, 'Every background entry needs its record body');
});

test('forbids the retired concept, unsupported claims, and unapproved projects', () => {
  assert.doesNotMatch(textOnly, /↗|→|➡|🔗|🚀/u);
  assert.doesNotMatch(textOnly, /\b(?:dossier|interviewer|proof[- ]note|alternative[- ]concept|candidate brief|evidence edition|decision packet)\b/i);
  assert.doesNotMatch(textOnly, /\b(?:customers?|users served|revenue|commercial outcomes?|production scale|industry-leading|senior|staff|principal)\b/i);
  assert.doesNotMatch(textOnly, /\b\d[\d,]*\s+(?:customers?|users?)\b/i);
  assert.doesNotMatch(textOnly, /Noughtline|Tic Tac Toe|VirusTotal(?: Bot| Telegram Bot)?|Telegram User Counter/i);
  assert.doesNotMatch(textOnly, /\b(?:Nigeria|Lagos|Abuja|Owerri, Nigeria)\b/i);
  assert.doesNotMatch(textOnly, /UK-based|authori[sz]ed to work|no sponsorship required|unrestricted (?:UK|US)|US work authori[sz]ation/i);
  assert.doesNotMatch(html, /href="[^"]*volyxai\.com/i);
});

test('preserves private functional email, base-safe CV, canonical, and structured metadata', () => {
  const emailLinks = [...html.matchAll(/<a[^>]+href="(mailto:[^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  assert.equal(emailLinks.length, 1, 'The contact CTA must be the only mailto link');
  assert.equal(occurrences(html, 'mailto:'), 1);
  for (const [, href, label] of emailLinks) {
    assert.equal(href, mailto);
    assert.equal(label.trim(), 'Email me');
  }
  assert.equal(occurrences(textOnly, 'Email me'), emailLinks.length);
  assert.doesNotMatch(html.replaceAll(mailto, ''), new RegExp(contactEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  assert.doesNotMatch(html, new RegExp(retiredEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  assert.doesNotMatch(html, /aria-label="[^"]*@|content="[^"]*@/i);
  assert.match(html, /href="%BASE_URL%Joshua_Nwachinemere_CV\.pdf"/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${siteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.doesNotMatch(html, /<meta name="robots"[^>]*noindex/i);
  assert.match(html, /"@type": "ProfilePage"/);
  assert.match(html, /"@type": "Person"/);
});

test('publishes production-aligned social metadata and the approved v6 landing-page card', () => {
  assert.equal(socialCard.subarray(1, 4).toString(), 'PNG');
  assert.equal(socialCard.readUInt32BE(16), 1200);
  assert.equal(socialCard.readUInt32BE(20), 630);
  assert.match(html, new RegExp(`<meta property="og:url" content="${siteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(html, new RegExp(`<meta property="og:image" content="${socialCardUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(html, new RegExp(`<meta property="og:image:secure_url" content="${socialCardUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(html, /<meta property="og:image:type" content="image\/png"/);
  assert.match(html, /<meta property="og:image:width" content="1200"/);
  assert.match(html, /<meta property="og:image:height" content="630"/);
  assert.match(html, /<meta property="og:image:alt" content="Joshua Nwachinemere, AI Engineer building reliable Python systems for applied AI"/);
  assert.match(html, new RegExp(`<meta name="twitter:image" content="${socialCardUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(html, /<meta name="twitter:image:alt" content="Joshua Nwachinemere, AI Engineer building reliable Python systems for applied AI"/);
  assert.doesNotMatch(html, /og-card-v[1-5]\.png/);
});

test('all external new-tab links are protected and fragments resolve uniquely', () => {
  const targets = [...html.matchAll(/<a[^>]*target="_blank"[^>]*>/g)].map((match) => match[0]);
  assert.ok(targets.length >= 20);
  for (const anchor of targets) assert.match(anchor, /rel="noreferrer"/);
  const fragments = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
  for (const fragment of new Set(fragments)) {
    assert.equal(occurrences(html, `id="${fragment}"`), 1, `Fragment #${fragment} must resolve once`);
  }
});

test('CV and identity artifacts remain intact', async () => {
  const pdf = await stat(new URL('../public/Joshua_Nwachinemere_CV.pdf', import.meta.url));
  const docx = await stat(new URL('../public/Joshua_Nwachinemere_CV.docx', import.meta.url));
  assert.ok(pdf.size > 1_000);
  assert.ok(docx.size > 1_000);
});

test('uses the approved monogram favicon in the portfolio visual system', () => {
  assert.match(html, /<link rel="icon" href="\/favicon\.svg\?v=5" type="image\/svg\+xml" \/>/);
  assert.match(favicon, /<title id="title">JN monogram<\/title>/);
  assert.match(favicon, /<desc id="desc">A serif J and N on white paper, with the blue rule that marks the checked result<\/desc>/);
  assert.match(favicon, /fill="#ffffff"/);
  assert.match(favicon, /fill="#000000"/);
  assert.match(favicon, /fill="#1A35E5"/);
  assert.doesNotMatch(favicon, /#cfff48|#2448ff|terminal prompt/i);
});

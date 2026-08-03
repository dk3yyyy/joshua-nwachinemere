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
const maturityLabels = [
  'Active product build',
  'Versioned evaluation',
  'Rolling-origin evaluation',
  'Reference implementation',
  'Public prototype',
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
  assert.match(html, /<a class="skip-link" href="#main">Skip to main content<\/a>/);
  assert.match(html, /<main id="main">/);
  for (const id of ['top', 'work', ...projectIds, 'contributions', 'approach', 'background', 'contact']) {
    assert.equal(occurrences(html, `id="${id}"`), 1, `Expected one #${id}`);
  }
  const nav = html.match(/<nav class="primary-nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
  for (const label of ['Work', 'Open source', 'Approach', 'Background', 'CV', 'Contact']) {
    assert.ok(nav.includes(`>${label}</a>`), `Missing navigation label: ${label}`);
  }
  const positions = ['#work', '#contributions', '#approach', '#background', 'Joshua_Nwachinemere_CV.pdf', '#contact']
    .map((target) => nav.indexOf(target));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
});

test('always follows the system theme without a manual theme control or override', () => {
  assert.match(html, /<script src="\/theme-init\.js"><\/script>/);
  assert.doesNotMatch(html, /theme-control|theme-toggle|theme-icon-|theme-menu|data-theme-option/);
  assert.match(css, /:root\[data-theme='dark'\]/);
  assert.match(css, /@media \(prefers-color-scheme: dark\)/);
  assert.match(css, /:root\[data-theme='auto'\]/);
  assert.doesNotMatch(css, /\.theme-control|\.theme-toggle|\.theme-icon-/);
  assert.match(css, /color-scheme:\s*dark/);
  assert.match(themeInitJs, /portfolio-theme/);
  assert.match(themeInitJs, /localStorage\.removeItem/);
  assert.doesNotMatch(themeInitJs, /localStorage\.getItem|localStorage\.setItem/);
  assert.match(themeInitJs, /prefers-color-scheme: dark/);
  assert.match(themeInitJs, /meta\[name="theme-color"\]/);
  assert.match(mainJs, /function syncSystemTheme\(\)/);
  assert.match(mainJs, /systemDark\.addEventListener\('change', syncSystemTheme\)/);
  assert.doesNotMatch(mainJs, /THEME_STORAGE_KEY|THEME_STATES|themeToggle|localStorage/);
});

test('hero and availability copy are exact and direct', () => {
  assert.match(html, /<p class="eyebrow">Joshua Nwachinemere · AI Engineer<\/p>/);
  assert.match(html, /<h1[^>]*>AI Engineer building reliable Python systems for <em>Applied AI<\/em>\.<\/h1>/);
  assert.ok(textOnly.includes('I build retrieval and context pipelines, multimodal and voice workflows, FastAPI services, model integrations and evaluation tools. Every featured project links to its source, tests, architecture or measured results.'));
  assert.ok(textOnly.includes('5 inspectable projects · 9 independently verified merged contributions · Source, architecture and tests linked'));
  assert.ok(textOnly.includes('Open to AI Engineer and Applied AI Engineer roles.'));
  assert.ok(!textOnly.includes('Planning to relocate'));
  assert.ok(!textOnly.includes('Student visa conditions'));
  assert.ok(textOnly.includes('MSc Artificial Intelligence · Northumbria University · September 2026 intake'));
  assert.match(html, />View selected work<\/a>/);
  assert.match(html, />Download CV<\/a>/);
  assert.match(html, /class="hero-system-map"[^>]+aria-label="Applied AI workflow: 1 Input, multimodal; 2 Context, retrieval; 3 Model, orchestration; 4 Evaluation, reliability\."/);
  for (const label of ['Input', 'Context', 'Model', 'Evaluation']) assert.match(html, new RegExp(`<strong>${label}<\\/strong>`));
  assert.match(css, /@media \(min-width: 1051px\)[\s\S]*?\.hero-system-map \{ display: block;/);
  assert.match(css, /\.hero-system-map \{ display: none; \}/);
  assert.match(css, /\.system-map-canvas \{[^}]*border-radius: 28px;/);
  assert.equal((html.match(/marker-end="url\(#system-arrow\)"/g) || []).length, 3);
  assert.match(css, /--map-line: #8b8f8b;/);
  assert.match(css, /\.system-map-lines \{[^}]*stroke: var\(--map-line\);/);
  assert.match(css, /\.system-node small \{[^}]*font: 400 10px\/1\.3/);
  assert.match(html, /Context retrieved · models routed · results evaluated/);
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
  assert.match(assistant, /role="log"/);
  assert.match(assistant, /aria-live="polite"/);
  assert.match(assistant, /maxlength="500"/);
  assert.match(assistant, /Cloudflare Workers AI via a Cloudflare Pages Function/);
  assert.match(assistant, /Don’t enter personal data/);
  assert.match(assistant, /Public portfolio questions only/);
  assert.equal((assistant.match(/data-question=/g) || []).length, 3);
  assert.match(css, /\.assistant-widget \{[^}]*position: fixed;/);
  assert.match(css, /\.assistant-panel \{[^}]*position: absolute;/);
  assert.match(css, /\.assistant-conversation \{[^}]*overflow-y: auto;/);
});

test('renders exactly three featured and two additional projects in source order', () => {
  assert.equal((html.match(/class="project-card project-card--primary"/g) || []).length, 3);
  assert.equal((html.match(/class="project-card project-card--compact"/g) || []).length, 2);
  assert.equal((html.match(/<h3[^>]*data-project-name/g) || []).length, 5);
  const positions = projectNames.map((name) => html.indexOf(`>${name}</h3>`));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  for (const name of projectNames) assert.equal(occurrences(textOnly, name), 1, `Expected one visible project name: ${name}`);
  assert.doesNotMatch(html, /role="tab(?:list|panel)?"|aria-selected=|data-tab/i);
});

test('project maturity, ownership, and evaluation evidence remain exact', () => {
  for (const label of maturityLabels) {
    assert.equal(occurrences(textOnly, label), 1, `Expected exact maturity label once: ${label}`);
  }
  assert.equal(occurrences(textOnly, 'Independent project'), 5);
  assert.ok(textOnly.includes('Evaluated across 1,140 rolling-origin test matches with 53.77% accuracy, using a 56.70% bookmaker benchmark for comparison.'));
  assert.doesNotMatch(textOnly, /The model did not beat the benchmark/i);
  assert.ok(textOnly.includes('Three featured projects showing multimodal product engineering, local retrieval and temporal ML evaluation, with implementation detail and inspectable evidence.'));
  const lens = html.match(/<article[^>]+id="project-lens"[\s\S]*?<\/article>/)?.[0] ?? '';
  assert.doesNotMatch(lens, /<dt>Scope<\/dt>|ad-hoc signed test builds|notarized releases/i);
  assert.ok(textOnly.includes('User-selected inputs, consent-led capture, sandboxed execution, context isolation and provider-aware routing.'));
  assert.ok(textOnly.includes('Clean exact-commit 30-case benchmark: Semantic Recall@5 0.913 versus 0.770 for BM25; answer success and citation validity 0.880.'));
  assert.ok(textOnly.includes('Citation validation and a single bounded repair pass keep responses grounded and evidence-linked.'));
  const localProject = html.match(/<article[^>]+id="project-local-ai"[\s\S]*?<\/article>/)?.[0] ?? '';
  assert.doesNotMatch(localProject, /<dt>Limitations<\/dt>|Three of 25|median latency|dirty worktree|both 0\.560|general reliability/i);
  assert.match(html, /href="%BASE_URL%evidence\/local-review-intelligence-evaluation-report\.json"[^>]*>View results<\/a>/);
  assert.doesNotMatch(html, /local_AI_agent\/tree\/main\/evaluation\/results\/v0\.2\.0-ollama-0\.32\.5/);
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
  assert.match(lens, /Independent project/);
  assert.doesNotMatch(lens, /VolyxAI/i);
});

test('adds honest, accessible visual product evidence without the rejected control token', async () => {
  const expectedMedia = [
    ['project-lens', '%BASE_URL%images/volyx-lens-context-aperture.jpg', 'High-resolution capture of the live product site showing its Context Aperture interface and Screen, You and Them inputs'],
    ['project-local-ai', '%BASE_URL%images/local-review-intelligence-dashboard-5b174ed3.jpg', 'Local Review Intelligence dashboard showing 123 reviews, summary metrics, rating distribution and the review table'],
    ['project-football', '%BASE_URL%images/football-forecasting-dashboard-12cff076.jpg', 'Football Forecasting Lab match-intelligence dashboard showing synthetic demo provenance, overview signals and fictional fixture probabilities'],
  ];
  for (const [projectId, source, alt] of expectedMedia) {
    const project = html.match(new RegExp(`<article[^>]+id="${projectId}"[\\s\\S]*?<\\/article>`))?.[0] ?? '';
    assert.ok(project.includes(`src="${source}"`), `Missing media source for ${projectId}`);
    assert.ok(project.includes(`alt="${alt}"`), `Missing descriptive alt text for ${projectId}`);
    assert.match(project, /<figcaption>[\s\S]+<\/figcaption>/);
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
  assert.ok(textOnly.includes('This high-resolution capture from the live product site shows screen, microphone and system audio as intentional inputs, then routes selected context to the configured provider.'));
});

test('keeps all five repository URLs and all nine contribution rows visible', () => {
  for (const url of [...repositoryUrls, ...pullRequestUrls]) assert.ok(html.includes(url), `Missing ${url}`);
  assert.equal((html.match(/class="contribution-row"/g) || []).length, 9);
  assert.equal(pullRequestUrls.filter((url) => html.includes(url)).length, 9);
  assert.ok(textOnly.includes('Nine pull requests authored by Joshua, independently verified and merged into maintained open-source projects.'));
  const contributionSection = html.match(/<section[^>]+id="contributions"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.doesNotMatch(contributionSection, /<details|\shidden(?:=|\s)|aria-hidden="true"/i);
});

test('places merged upstream work before the smaller backend projects', () => {
  const contributionPosition = html.indexOf('id="contributions"');
  const additionalPosition = html.indexOf('id="additional-work"');
  assert.ok(contributionPosition >= 0);
  assert.ok(additionalPosition >= 0);
  assert.ok(contributionPosition < additionalPosition);
});

test('keeps project actions focused on demos, source, and explanatory evidence', () => {
  assert.doesNotMatch(html, /href="[^"]*\/actions(?:[/?#][^"]*)?"/i);
  assert.doesNotMatch(textOnly, /View CI|View release checks/i);
  assert.match(textOnly, /Open live demo/);
  assert.match(textOnly, /View source/);
  assert.match(textOnly, /Read architecture/);
  assert.match(textOnly, /View results/);
  const lens = html.match(/<article[^>]+id="project-lens"[\s\S]*?<\/article>/)?.[0] ?? '';
  assert.match(lens, /<a href="https:\/\/volyxlens\.pages\.dev\/" target="_blank" rel="noreferrer">Visit live site<\/a>/);
});

test('includes the approved approach, background, contact, and footer copy', () => {
  for (const heading of ['Engineering approach', 'Background', 'Interested in working together?']) {
    assert.match(textOnly, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.ok(textOnly.includes('My path combines independent product work, engineering projects, technical training and merged open-source contributions.'));
  for (const heading of ['Route selected context', 'Keep retrieval ready', 'Build resilient workflows', 'Evaluate with clear baselines']) {
    assert.match(textOnly, new RegExp(heading));
  }
  assert.ok(textOnly.includes('VolyxAI product work'));
  assert.ok(textOnly.includes('Independent product effort'));
  assert.ok(textOnly.includes('I’m interested in AI Engineer and Applied AI Engineer roles involving Python services, retrieval and context systems, multimodal or voice workflows, evaluation and reliability.'));
  assert.ok(!textOnly.includes('Open to part-time work during study'));
  assert.ok(!textOnly.includes('future full-time graduate roles'));
  assert.ok(textOnly.includes('© 2026 Joshua Nwachinemere'));
  assert.ok(textOnly.includes('AI Engineer · Python and applied AI'));
  assert.ok(textOnly.includes('Back to top ↑'));
});

test('visible portfolio copy stays capability-led rather than limitation-led', () => {
  assert.doesNotMatch(textOnly, /measured limitations|not presented as conventional employment|not employment with the upstream projects|Degrade without hiding failure|reports its loss|The model did not beat the benchmark|ad-hoc signed test builds|notarized releases|Active pre-release|Experimental evaluation/i);
  assert.doesNotMatch(html, /<dt>Limitations<\/dt>|<dt>Scope<\/dt>/i);
  assert.ok(textOnly.includes('Two focused systems showing durable workflows, API aggregation and resilient execution.'));
  assert.ok(textOnly.includes('Bounded concurrency, caching and useful partial results across RPC and market-data providers.'));
});

test('shows a focused and verifiable certification set', () => {
  const certificationSection = html.match(/<article class="certifications">[\s\S]*?<\/article>/)?.[0] ?? '';
  const expected = [
    ['Scientific Computing with Python', 'freeCodeCamp · May 2026', 'https://www.freecodecamp.org/certification/joshua_nwachinemere/scientific-computing-with-python-v7'],
    ['Google AI Specialization', 'Google/Coursera · Feb 2026', 'https://www.coursera.org/account/accomplishments/professional-cert/L1UIFMPUME30'],
    ['Model Context Protocol: Advanced Topics', 'Anthropic training · Mar 2026', 'https://verify.skilljar.com/c/fwqra86yief7'],
  ];
  assert.ok(certificationSection, 'Missing certifications article');
  assert.match(certificationSection, /<h3>Certifications &amp; training<\/h3>/);
  assert.equal((certificationSection.match(/<a\b/g) ?? []).length, 3, 'Certification set must contain exactly three links');
  for (const [name, metadata, url] of expected) {
    assert.ok(certificationSection.includes(name), `Missing credential named ${name}`);
    assert.ok(certificationSection.includes(metadata), `Missing credential metadata: ${metadata}`);
    assert.ok(certificationSection.includes(`href="${url}"`), `Missing verification URL: ${url}`);
  }
  assert.doesNotMatch(certificationSection, /Google AI Professional Certificate|Google Cybersecurity|Claude Code in Action|Introduction to Model Context Protocol|AI Fluency/i);
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
  assert.ok(emailLinks.length >= 1);
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

test('uses the approved terminal-window favicon in the portfolio visual system', () => {
  assert.match(html, /<link rel="icon" href="\/favicon\.svg\?v=4" type="image\/svg\+xml" \/>/);
  assert.match(favicon, /<title id="title">Terminal window<\/title>/);
  assert.match(favicon, /<desc id="desc">A terminal prompt and cursor framed in the portfolio ink and paper palette<\/desc>/);
  assert.match(favicon, /fill="#f3f3f0"/);
  assert.match(favicon, /stroke="#15171a"/);
  assert.match(favicon, /data-mark="prompt"/);
  assert.match(favicon, /data-mark="cursor"/);
  assert.doesNotMatch(favicon, /JN split monogram|#cfff48|#2448ff|>J<|>N</);
});

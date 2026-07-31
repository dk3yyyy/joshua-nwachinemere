import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const favicon = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const socialCard = await readFile(new URL('../public/og-card-v5.png', import.meta.url));

const siteUrl = 'https://joshua-nwachinemere.pages.dev/';
const previewUrl = 'https://interview-dossier-preview.joshua-nwachinemere.pages.dev/';
const socialCardUrl = `${previewUrl}og-card-v5.png`;
const projectNames = [
  'Volyx Lens',
  'Football Forecasting Lab',
  'Telegram Social Video Downloader',
  'ChainScope Wallet Analyzer',
  'Telegram User Counter',
];
const projectIds = [
  'project-lens',
  'project-football',
  'project-downloader',
  'project-wallet',
  'project-user-count',
];
const maturityLabels = [
  'Active pre-release',
  'Experimental evaluation',
  'Reference implementation',
  'Public prototype',
  'Repository-only',
];
const repositoryUrls = [
  'https://github.com/dk3yyyy/volyx-lens',
  'https://github.com/dk3yyyy/football_predictor',
  'https://github.com/dk3yyyy/telegram-social-video-downloader',
  'https://github.com/dk3yyyy/sol-eth-wallet-analyzer',
  'https://github.com/dk3yyyy/user_count',
];
const pullRequestUrls = [
  'https://github.com/openai/openai-agents-python/pull/3991',
  'https://github.com/pydantic/pydantic-ai-harness/pull/503',
  'https://github.com/generative-computing/mellea/pull/1471',
  'https://github.com/ag2ai/faststream/pull/2961',
  'https://github.com/apache/arrow-rs/pull/10486',
  'https://github.com/vega/altair/pull/4089',
  'https://github.com/faststream-community/faststream_fastapi/pull/2',
  'https://github.com/calkit/calkit/pull/1028',
];
const mailto = 'mailto:josh0victor@outlook.com?subject=AI%20Engineer%20opportunity';

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

test('hero and availability copy are exact and direct', () => {
  assert.match(html, /<p class="eyebrow">Joshua Nwachinemere · AI Engineer<\/p>/);
  assert.match(html, /<h1[^>]*>AI Engineer building reliable Python systems for <em>Applied AI<\/em>\.<\/h1>/);
  assert.ok(textOnly.includes('I build retrieval and context pipelines, multimodal and voice workflows, FastAPI services, model integrations and evaluation tools. The work below includes source, tests, architecture and measured limitations.'));
  assert.ok(textOnly.includes('5 inspectable projects · 8 independently verified merged contributions · Source, architecture and tests linked'));
  assert.ok(textOnly.includes('Open to AI Engineer and Applied AI Engineer roles.'));
  assert.ok(!textOnly.includes('Planning to relocate'));
  assert.ok(!textOnly.includes('Student visa conditions'));
  assert.ok(textOnly.includes('MSc Artificial Intelligence · Northumbria University · September 2026 intake'));
  assert.match(html, />View selected work<\/a>/);
  assert.match(html, />Download CV<\/a>/);
});

test('renders exactly two primary and three additional projects in source order', () => {
  assert.equal((html.match(/class="project-card project-card--primary"/g) || []).length, 2);
  assert.equal((html.match(/class="project-card project-card--compact"/g) || []).length, 3);
  assert.equal((html.match(/<h3[^>]*data-project-name/g) || []).length, 5);
  const positions = projectNames.map((name) => html.indexOf(`>${name}</h3>`));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  for (const name of projectNames) assert.equal(occurrences(textOnly, name), 1, `Expected one visible project name: ${name}`);
  assert.doesNotMatch(html, /role="tab(?:list|panel)?"|aria-selected=|data-tab/i);
});

test('project maturity, ownership, limitations, and evaluation evidence remain exact', () => {
  for (const label of maturityLabels) {
    assert.equal(occurrences(textOnly, label), 1, `Expected exact maturity label once: ${label}`);
  }
  assert.equal(occurrences(textOnly, 'Independent project'), 5);
  assert.ok(textOnly.includes('53.77% accuracy versus a 56.70% bookmaker benchmark across 1,140 rolling-origin test matches. The model did not beat the benchmark.'));
  assert.ok(textOnly.includes('Public builds are ad-hoc signed test builds, not notarized releases.'));
  assert.ok(textOnly.includes('Selected-input boundaries, explicit consent, restricted provider routing, sandboxing, context isolation and automated release checks.'));
  assert.doesNotMatch(textOnly, /Verified behaviour/i);
  const lens = html.match(/<article[^>]+id="project-lens"[\s\S]*?<\/article>/)?.[0] ?? '';
  assert.match(lens, /Independent project/);
  assert.doesNotMatch(lens, /VolyxAI/i);
});

test('keeps all five repository URLs and all eight contribution rows visible', () => {
  for (const url of [...repositoryUrls, ...pullRequestUrls]) assert.ok(html.includes(url), `Missing ${url}`);
  assert.equal((html.match(/class="contribution-row"/g) || []).length, 8);
  assert.equal(pullRequestUrls.filter((url) => html.includes(url)).length, 8);
  assert.ok(textOnly.includes('Independent open-source contributions; not employment with the upstream projects.'));
  const contributionSection = html.match(/<section[^>]+id="contributions"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.doesNotMatch(contributionSection, /<details|\shidden(?:=|\s)|aria-hidden="true"/i);
});

test('keeps project actions focused on demos, source, and explanatory evidence', () => {
  assert.doesNotMatch(html, /href="[^"]*\/actions(?:[/?#][^"]*)?"/i);
  assert.doesNotMatch(textOnly, /View CI|View release checks/i);
  assert.match(textOnly, /Open live demo/);
  assert.match(textOnly, /View source/);
  assert.match(textOnly, /Read architecture/);
  assert.match(textOnly, /Read evaluation report/);
});

test('includes the approved approach, background, contact, and footer copy', () => {
  for (const heading of ['Engineering approach', 'Background', 'Interested in working together?']) {
    assert.match(textOnly, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.ok(textOnly.includes('My experience is based on independent product work, engineering projects, technical training and open-source contributions. It is not presented as conventional employment.'));
  assert.ok(textOnly.includes('VolyxAI product work'));
  assert.ok(textOnly.includes('Independent product effort'));
  assert.ok(textOnly.includes('I’m interested in AI Engineer and Applied AI Engineer roles involving Python services, retrieval and context systems, multimodal or voice workflows, evaluation and reliability.'));
  assert.ok(!textOnly.includes('Open to part-time work during study'));
  assert.ok(!textOnly.includes('future full-time graduate roles'));
  assert.ok(textOnly.includes('© 2026 Joshua Nwachinemere'));
  assert.ok(textOnly.includes('AI Engineer · Python and applied AI'));
  assert.ok(textOnly.includes('Back to top ↑'));
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
    assert.ok(certificationSection.includes(name), `Missing credential: ${name}`);
    assert.ok(certificationSection.includes(metadata), `Missing credential metadata: ${metadata}`);
    assert.ok(certificationSection.includes(`href="${url}"`), `Missing verification URL: ${url}`);
  }
  assert.doesNotMatch(certificationSection, /Google AI Professional Certificate|Google Cybersecurity|Claude Code in Action|Introduction to Model Context Protocol|AI Fluency/i);
});

test('forbids the retired concept, unsupported claims, and unapproved projects', () => {
  assert.doesNotMatch(textOnly, /↗|→|➡|🔗|🚀/u);
  assert.doesNotMatch(textOnly, /\b(?:dossier|interviewer|question|answer|proof[- ]note|alternative[- ]concept|candidate brief|evidence edition|decision packet)\b/i);
  assert.doesNotMatch(textOnly, /\b(?:customers?|users served|revenue|commercial outcomes?|production scale|industry-leading|senior|staff|principal)\b/i);
  assert.doesNotMatch(textOnly, /\b\d[\d,]*\s+(?:customers?|users?)\b/i);
  assert.doesNotMatch(textOnly, /Noughtline|Tic Tac Toe|VirusTotal(?: Bot| Telegram Bot)?|local_AI_agent/i);
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
  assert.doesNotMatch(html.replaceAll(mailto, ''), /josh0victor@outlook\.com/i);
  assert.doesNotMatch(html, /aria-label="[^"]*@|content="[^"]*@/i);
  assert.match(html, /href="%BASE_URL%Joshua_Nwachinemere_CV\.pdf"/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${siteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.doesNotMatch(html, /<meta name="robots"[^>]*noindex/i);
  assert.match(html, /"@type": "ProfilePage"/);
  assert.match(html, /"@type": "Person"/);
});

test('publishes the approved landing-page social card for preview unfurls', () => {
  assert.equal(socialCard.subarray(1, 4).toString(), 'PNG');
  assert.equal(socialCard.readUInt32BE(16), 1200);
  assert.equal(socialCard.readUInt32BE(20), 630);
  assert.match(html, new RegExp(`<meta property="og:url" content="${previewUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(html, new RegExp(`<meta property="og:image" content="${socialCardUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(html, new RegExp(`<meta property="og:image:secure_url" content="${socialCardUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(html, /<meta property="og:image:type" content="image\/png"/);
  assert.match(html, /<meta property="og:image:width" content="1200"/);
  assert.match(html, /<meta property="og:image:height" content="630"/);
  assert.match(html, /<meta property="og:image:alt" content="Joshua Nwachinemere's AI Engineer portfolio landing page"/);
  assert.match(html, new RegExp(`<meta name="twitter:image" content="${socialCardUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(html, /<meta name="twitter:image:alt" content="Joshua Nwachinemere's AI Engineer portfolio landing page"/);
  assert.doesNotMatch(html, /og-card-v4\.png/);
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
  assert.match(favicon, />J</);
  assert.match(favicon, />N</);
});

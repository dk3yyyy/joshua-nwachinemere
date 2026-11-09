import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
const mainJs = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const favicon = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const productionHeaders = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
const wranglerConfig = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
const assistantDocs = await readFile(new URL('../docs/portfolio-assistant.md', import.meta.url), 'utf8');
const pagesWorkerBuildScript = await readFile(new URL('../scripts/build-pages-worker.mjs', import.meta.url), 'utf8');
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const socialCard = await readFile(new URL('../public/og-card-v9.png', import.meta.url));
const localReviewReport = await readFile(new URL('../public/evidence/local-review-intelligence-evaluation-report.json', import.meta.url));
const localReviewReportJson = JSON.parse(localReviewReport);

const siteUrl = 'https://joshua-nwachinemere.pages.dev/';
const socialCardUrl = `${siteUrl}og-card-v9.png`;
const projectNames = [
  'Volyx Lens',
  'Local Review Intelligence',
  'Football Forecasting Lab',
  'Telegram Social Video Downloader',
  'Bug Hunter',
];
const projectIds = [
  'project-lens',
  'project-local-ai',
  'project-football',
  'project-downloader',
  'project-bug-hunter',
];
const maturityLabels = [
  'Active product build',
  'Versioned evaluation',
  'Rolling-origin evaluation',
  'Reference implementation',
  'Live demo',
];
const repositoryUrls = [
  'https://github.com/dk3yyyy/volyx-lens',
  'https://github.com/dk3yyyy/local_AI_agent',
  'https://github.com/dk3yyyy/football_predictor',
  'https://github.com/dk3yyyy/telegram-social-video-downloader',
  'https://github.com/dk3yyyy/bug-hunter',
];
const pullRequestUrls = [
  'https://github.com/ag2ai/faststream/pull/2976',
  'https://github.com/pydantic/pydantic-ai-harness/pull/520',
  'https://github.com/ag2ai/faststream/pull/2984',
  'https://github.com/microsoft/agent-framework/pull/7391',
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
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  for (const id of ['top', 'work', ...projectIds, 'contributions', 'background', 'writing', 'contact']) {
    assert.equal(occurrences(html, `id="${id}"`), 1, `Expected one #${id}`);
  }
  const nav = html.match(/<nav class="primary-nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
  for (const label of ['Work', 'Open source', 'Background', 'Writing', 'CV', 'Contact']) {
    assert.ok(nav.includes(`>${label}</a>`), `Missing navigation label: ${label}`);
  }
  const positions = ['#work', '#contributions', '#writing', '#background', 'Joshua_Nwachinemere_CV.pdf', '#contact']
    .map((target) => nav.indexOf(target));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
});

test('keeps the portfolio on a fixed light surface with no theme control', () => {
  assert.match(html, /<meta name="theme-color" content="#fafafa" \/>/);
  assert.doesNotMatch(html, /theme-control|theme-toggle|theme-icon-|theme-menu|data-theme-option/);
  assert.doesNotMatch(css, /prefers-color-scheme:\s*dark/);
  assert.doesNotMatch(mainJs, /localStorage/);
});

test('hero and availability copy are exact and direct', () => {
  assert.ok(html.includes('<p class="availability"><span class="availability-dot" aria-hidden="true"></span>Open to AI engineer roles</p>'));
  assert.match(html, /<h1 id="hero-title">Python systems that <mark>show their work\.<\/mark><\/h1>/);
  assert.ok(textOnly.includes('Retrieval, context and evaluation. I build systems whose answers can be inspected, then ship the checks that prove it.'));
  assert.match(html, /<div class="hero-projects" role="group" aria-label="Selected projects">/);
  assert.equal((html.match(/class="hero-project"/g) || []).length, 3);
  assert.equal(html.includes('<a class="button button-primary" href="#work">View selected work</a>'), true);
  assert.match(html, /<a class="button button-secondary" href="%BASE_URL%Joshua_Nwachinemere_CV\.pdf" target="_blank" rel="noreferrer">Download CV<\/a>/);
  assert.match(html, /<p class="hero-note"><b>5<\/b> projects <span aria-hidden="true">·<\/span> <b>13<\/b> upstream PRs <span aria-hidden="true">·<\/span> <b>5<\/b> essays<\/p>/);
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
  assert.match(assistant, /Answers are assembled from reviewed portfolio evidence/);
  assert.match(assistant, /Questions aren’t published/);
  assert.match(assistant, /Answers are assembled from reviewed portfolio evidence/);
  assert.equal((assistant.match(/data-question=/g) || []).length, 3);
  assert.match(css, /\.assistant-widget \{[^}]*position: fixed;/);
  assert.match(css, /\.assistant-panel \{[^}]*position: absolute;/);
  assert.match(css, /\.assistant-conversation \{[^}]*overflow-y: auto;/);
});

test('renders exactly three featured and two additional projects in source order', () => {
  assert.equal((html.match(/class="project-card project-card--primary"/g) || []).length, 3);
  assert.equal((html.match(/class="more-work-item"/g) || []).length, 2);
  assert.equal((html.match(/<h3[^>]*data-project-name/g) || []).length, 3);
  assert.equal((html.match(/class="more-work-item"/g) || []).length, 2);
  const positions = projectNames.map((name) => html.indexOf(name));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.doesNotMatch(html, /role="tab(?:list|panel)?"|aria-selected=|data-tab/i);
});

test('project maturity and evaluation evidence remain exact', () => {
  for (const label of ['Live product', 'Evaluation', 'Research']) {
    assert.ok(textOnly.includes(label), `Expected maturity label: ${label}`);
  }
  assert.equal((html.match(/class="project-card-link"/g) || []).length, 3);
  assert.ok(textOnly.includes('30-case retrieval benchmark'));
  assert.ok(textOnly.includes('0.913'));
  assert.ok(textOnly.includes('0.770'));
  assert.ok(textOnly.includes('Nothing is captured until you switch it on.'));
  assert.match(html, /href="%BASE_URL%evidence\/local-review-intelligence-evaluation-report\.json"[^>]*>View results<\/a>/);
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
});

test('adds honest, accessible visual product evidence without the rejected control token', async () => {
  const expectedMedia = [
    ['project-lens', '%BASE_URL%images/volyx-lens-current-b895e2a7.jpg', 'Current Volyx Lens landing page with the app-chrome hero and a cited answer'],
    ['project-local-ai', '%BASE_URL%images/local-review-intelligence-dashboard-ef7c0e0e.jpg', 'Local Review Intelligence dashboard with review metrics and an inspectable review table'],
    ['project-football', '%BASE_URL%images/football-forecasting-dashboard-12cff076.jpg', 'Football Forecasting Lab match-intelligence dashboard with synthetic demo provenance and fixture probabilities'],
  ];
  for (const [projectId, source, alt] of expectedMedia) {
    const projectStart = html.indexOf(`id="${projectId}"`);
    const project = projectStart >= 0 ? html.slice(projectStart, html.indexOf('</article>', projectStart)) : '';
    assert.ok(project.includes(`src="${source}"`), `Missing media source for ${projectId}`);
    assert.ok(project.includes(`alt="${alt}"`), `Missing descriptive alt text for ${projectId}`);
    assert.match(project, /<figcaption[\s\S]+<\/figcaption>/);
  }
  const lensImage = await stat(new URL('../public/images/volyx-lens-current-b895e2a7.jpg', import.meta.url));
  const localDashboardImage = await stat(new URL('../public/images/local-review-intelligence-dashboard-ef7c0e0e.jpg', import.meta.url));
  const footballDashboardImage = await stat(new URL('../public/images/football-forecasting-dashboard-12cff076.jpg', import.meta.url));
  assert.ok(lensImage.size > 10_000);
  assert.ok(localDashboardImage.size > 10_000);
  assert.ok(footballDashboardImage.size > 10_000);
  assert.doesNotMatch(html, /class="visual-link"/);
  assert.doesNotMatch(textOnly, /INSUFFICIENT_EVIDENCE/);
});

test('keeps the repository URLs and all thirteen contribution rows visible', () => {
  for (const url of repositoryUrls.concat(['https://volyxlens.pages.dev/'])) {
    assert.ok(html.includes(url), `Missing ${url}`);
  }
  for (const url of pullRequestUrls) assert.ok(html.includes(url), `Missing ${url}`);
  assert.equal((html.match(/class="contribution-row"/g) || []).length, 13);
  assert.equal(pullRequestUrls.filter((url) => html.includes(url)).length, 13);
  assert.ok(textOnly.includes('Thirteen pull requests accepted by other maintainers. Every row links to the discussion, not a screenshot of one.'));
  const contributionSection = html.match(/<section[^>]+id="contributions"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.doesNotMatch(contributionSection, /<details|\shidden(?:=|\s)/i);
});

test('keeps the smaller backend projects next to the featured work', () => {
  assert.ok(html.includes('id="additional-work"'));
  assert.ok(html.includes('id="contributions"'));
  assert.ok(html.indexOf('id="additional-work"') < html.indexOf('id="contributions"'));
});

test('keeps project actions focused on demos, source, and explanatory evidence', () => {
  assert.doesNotMatch(html, /href="[^"]*\/actions(?:[/?#][^"]*)?"/i);
  assert.doesNotMatch(textOnly, /View CI|View release checks/i);
  assert.match(textOnly, /Visit site/);
  assert.match(textOnly, /View source/);
  assert.match(textOnly, /View repository/);
  const lens = html.match(/<article[^>]+id="project-lens"[\s\S]*?<\/article>/)?.[0] ?? '';
  assert.match(lens, /<a class="project-card-link" href="https:\/\/volyxlens\.pages\.dev\/" target="_blank" rel="noreferrer">/);
});

test('includes the approved background, contact, and footer copy', () => {
  for (const heading of ['Background', 'Let’s build something that can be checked.']) {
    assert.ok(textOnly.includes(heading));
  }
  assert.ok(textOnly.includes('VolyxAI product work'));
  assert.ok(textOnly.includes('Independent engineering'));
  assert.ok(textOnly.includes('I’m looking for AI Engineer or Applied AI Engineer work on Python services, retrieval and context systems, multimodal or voice workflows, and evaluation.'));
  assert.ok(!textOnly.includes('Open to part-time work during study'));
  assert.ok(!textOnly.includes('future full-time graduate roles'));
  assert.ok(textOnly.includes('© 2026 Joshua Nwachinemere'));
  assert.ok(textOnly.includes('AI Engineer · Python and applied AI'));
  assert.ok(textOnly.includes('Back to top'));
});

test('features exactly five aligned essays with canonical Hashnode links and no duplicate cross-posted platforms', () => {
  const writingEssays = [
    {
      title: 'The Hidden Complexity of RAG',
      href: 'https://joshua-nwachinemere.hashnode.dev/the-hidden-complexity-of-rag',
    },
    {
      title: 'A Million-Token Context Is Not Memory',
      href: 'https://joshua-nwachinemere.hashnode.dev/a-million-token-context-is-not-memory',
    },
    {
      title: 'MCP Made Tools Connectable. It Did Not Make Them Understandable.',
      href: 'https://joshua-nwachinemere.hashnode.dev/mcp-made-tools-connectable-it-did-not-make-them-understandable',
    },
    {
      title: 'The Handoff Problem',
      href: 'https://joshua-nwachinemere.hashnode.dev/the-handoff-problem-why-multi-model-ai-pipelines-quietly-corrupt-good-research',
    },
    {
      title: 'The Two Boundaries Where Voice Agents Quietly Corrupt State',
      href: 'https://joshua-nwachinemere.hashnode.dev/the-two-boundaries-where-voice-agents-quietly-corrupt-state',
    },
  ];
  const writingSection = html.match(/<section[^>]+id="writing"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.ok(writingSection, 'Missing #writing section');
  assert.equal((writingSection.match(/class="writing-item writing-row"/g) || []).length, writingEssays.length);
  const positions = writingEssays.map(({ href }) => writingSection.indexOf(href));
  assert.ok(positions.every((position) => position >= 0), 'Missing an expected essay link');
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  for (const { title, href } of writingEssays) {
    assert.ok(writingSection.includes(title), `Missing essay title: ${title}`);
    assert.ok(writingSection.includes(`href="${href}" target="_blank" rel="noreferrer"`), `Missing protected canonical href: ${href}`);
  }
  assert.doesNotMatch(writingSection, /medium\.com|hackernoon\.com|dev\.to/i);
  const backgroundPosition = html.indexOf('id="background"');
  const writingPosition = html.indexOf('id="writing"');
  const contactPosition = html.indexOf('id="contact"');
  assert.ok(writingPosition >= 0 && writingPosition < backgroundPosition && backgroundPosition < contactPosition);
});

test('visible portfolio copy stays capability-led rather than limitation-led', () => {
  assert.doesNotMatch(textOnly, /measured limitations|not presented as conventional employment|not employment with the upstream projects|Degrade without hiding failure|reports its loss|The model did not beat the benchmark|ad-hoc signed test builds|notarized releases|Active pre-release|Experimental evaluation/i);
  assert.doesNotMatch(html, /<dt>Limitations<\/dt>|<dt>Scope<\/dt>/i);
  assert.ok(textOnly.includes('Each project has a check that would fail if the output were wrong.'));
  assert.ok(textOnly.includes('Citations that validate'));
  assert.ok(textOnly.includes('Evaluation with a baseline'));
});

test('shows a focused and verifiable certification set', () => {
  const certificationSection = html.match(/<div class="credential-links certifications">[\s\S]*?<\/div>/)?.[0] ?? '';
  const expected = [
    ['Scientific Computing with Python', 'https://www.freecodecamp.org/certification/joshua_nwachinemere/scientific-computing-with-python-v7'],
    ['Google AI Specialization', 'https://www.coursera.org/account/accomplishments/professional-cert/L1UIFMPUME30'],
    ['Model Context Protocol: Advanced Topics', 'https://verify.skilljar.com/c/fwqra86yief7'],
  ];
  assert.ok(certificationSection, 'Missing certifications block');
  assert.equal((certificationSection.match(/<a\b/g) ?? []).length, 3, 'Certification set must contain exactly three links');
  for (const [name, url] of expected) {
    assert.ok(certificationSection.includes(name), `Missing credential named ${name}`);
    assert.ok(certificationSection.includes(`href="${url}"`), `Missing verification URL: ${url}`);
  }
  assert.doesNotMatch(certificationSection, /Google AI Professional Certificate|Google Cybersecurity|Claude Code in Action|Introduction to Model Context Protocol|AI Fluency/i);
});

test('forbids the retired concept, unsupported claims, and unapproved projects', () => {
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
    assert.equal(label.replace(/\s*<span[^>]*>↗<\/span>\s*$/, '').trim(), 'Email me');
  }
  assert.equal(occurrences(textOnly, 'Email me'), emailLinks.length);
  assert.doesNotMatch(html.replaceAll(mailto, ''), new RegExp(escapeRegex(contactEmail), 'i'));
  assert.doesNotMatch(html, new RegExp(escapeRegex(retiredEmail), 'i'));
  assert.doesNotMatch(html, /aria-label="[^"]*@|content="[^"]*@/i);
  assert.match(html, /href="%BASE_URL%Joshua_Nwachinemere_CV\.pdf"/);
  assert.ok(html.includes(`<link rel="canonical" href="${siteUrl}"`));
  assert.doesNotMatch(html, /<meta name="robots"[^>]*noindex/i);
  assert.match(html, /"@type": "ProfilePage"/);
  assert.match(html, /"@type": "Person"/);
});

test('publishes production-aligned social metadata and the approved v9 landing-page card', () => {
  assert.equal(socialCard.subarray(1, 4).toString(), 'PNG');
  assert.equal(socialCard.readUInt32BE(16), 1200);
  assert.equal(socialCard.readUInt32BE(20), 630);
  assert.ok(html.includes(`<meta property="og:url" content="${siteUrl}"`));
  assert.ok(html.includes(`<meta property="og:image" content="${socialCardUrl}"`));
  assert.ok(html.includes(`<meta property="og:image:secure_url" content="${socialCardUrl}"`));
  assert.match(html, /<meta property="og:image:type" content="image\/png"/);
  assert.match(html, /<meta property="og:image:width" content="1200"/);
  assert.match(html, /<meta property="og:image:height" content="630"/);
  assert.match(html, /<meta property="og:image:alt" content="Joshua Nwachinemere, AI Engineer building Python systems that show their work"/);
  assert.ok(html.includes(`<meta name="twitter:image" content="${socialCardUrl}"`));
  assert.match(html, /<meta name="twitter:image:alt" content="Joshua Nwachinemere, AI Engineer building Python systems that show their work"/);
  assert.doesNotMatch(html, /og-card-v[1-8]\.png/);
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

test('uses the approved JN monogram favicon in the portfolio visual system', () => {
  assert.match(html, /<link rel="icon" href="\/favicon\.svg\?v=7" type="image\/svg\+xml" \/>/);
  assert.match(favicon, /<title id="title">Joshua Nwachinemere monogram<\/title>/);
  assert.match(favicon, /<desc id="desc">A black JN monogram on the portfolio yellow tile<\/desc>/);
  assert.match(favicon, /fill="#f2c200"/);
  assert.match(favicon, /fill="#111110"/);
  assert.match(favicon, />JN<\/text>/);
  assert.doesNotMatch(favicon, /Terminal window|terminal prompt/);
});

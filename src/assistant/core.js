import contributionData from './contributions.json' with { type: 'json' };
import backendTechnologyData from './backend-technologies.json' with { type: 'json' };
import {
  detailedEvidenceCatalog,
  retrieveDetailedEvidence,
} from './detailed-evidence.js';

const PORTFOLIO_BASE = 'https://joshua-nwachinemere.pages.dev/';

const contributionEvidence = contributionData.contributions.map((record) => Object.freeze({
  id: record.id,
  title: `${record.projectName} PR #${record.prNumber}`,
  href: record.url,
  keywords: `${record.repository} ${record.projectName} pull request pr ${record.prNumber} ${record.keywords}`,
  subject: record.projectName,
  predicate: 'merged_contribution',
  text: `${record.projectName} PR #${record.prNumber} is a verified merged contribution authored by Joshua. ${record.problem} ${record.change} ${record.tests} Review: ${record.reviewEvolution} Outcome: ${record.outcome} Scope: ${record.limitations}`,
}));

export const evidence = Object.freeze([
  {
    id: 'profile',
    title: 'AI engineering profile',
    href: '#top',
    keywords: 'ai artificial intelligence engineer engineering work skills retrieval context multimodal voice model integration fastapi python evaluation backend kind does do',
    text: 'Joshua is an AI Engineer who builds reliable Python systems for applied AI, including retrieval and context pipelines, multimodal and voice workflows, FastAPI services, model integrations and evaluation tools.',
  },
  {
    id: backendTechnologyData.id,
    title: backendTechnologyData.title,
    href: backendTechnologyData.href,
    keywords: backendTechnologyData.keywords.join(' '),
    subject: 'Joshua backend stack',
    predicate: 'verified_owned_project_technology_use',
    sourceIds: backendTechnologyData.categories.flatMap((category) => category.sources.map((source) => source.url)),
    text: backendTechnologyData.body,
  },
  {
    id: 'volyxai-company',
    title: 'VolyxAI',
    href: 'https://volyxai.com/',
    keywords: 'volyxai company business operations workflow discovery design partnership operational rollout controlled automation human approval services does',
    subject: 'VolyxAI',
    predicate: 'described_as',
    sourceIds: ['volyxai-site'],
    text: 'VolyxAI designs controlled AI workflows for operations teams handling repetitive calls, intake, scheduling, document collection and follow-ups. Its published process starts with workflow discovery, defines validation and human approval controls, tests one scoped workflow, and considers operational rollout only after review.',
  },
  {
    id: 'volyx-lens',
    title: 'Volyx Lens',
    href: '#project-lens',
    keywords: 'volyx lens multimodal context macos electron swift screen microphone audio ocr retrieval transcription provider azure consent privacy',
    text: 'Volyx Lens is a macOS context assistant combining user-selected screen context, microphone and meeting audio, local OCR, relevance-ranked retrieval, transcription and multiple AI providers. Joshua built the focused context selection, provider-aware routing, consent controls, secure Electron boundaries, automated tests and release checks.',
  },
  {
    id: 'featured-projects',
    title: 'Featured project comparison',
    href: '#projects',
    routerOnly: true,
    keywords: 'best strongest top project projects compare comparison impressive portfolio featured choose',
    text: 'There is no single objectively best project: Volyx Lens best demonstrates multimodal product engineering, Local Review Intelligence is strongest for RAG and measured retrieval evaluation, and Football Forecasting Lab demonstrates leakage-aware temporal ML evaluation.',
  },
  {
    id: 'local-review-intelligence',
    title: 'Local Review Intelligence',
    href: '#project-local-ai',
    keywords: 'local review intelligence rag retrieval semantic bm25 citations citation evaluation chroma ollama streamlit typer csv dataset vector grounded privacy benchmark',
    text: 'Local Review Intelligence is a local-first RAG system for adaptable CSV datasets, semantic retrieval and grounded answers with inspectable citations. Its clean 30-case benchmark measured Semantic Recall@5 of 0.913 versus 0.770 for BM25, with answer success and citation validity of 0.880.',
  },
  {
    id: 'football-forecasting',
    title: 'Football Forecasting Lab',
    href: '#project-football',
    keywords: 'football forecasting model machine learning ml temporal rolling origin xgboost poisson calibration leakage accuracy benchmark matches fastapi streamlit evaluated evaluation',
    text: 'Football Forecasting Lab is a leakage-aware forecasting pipeline with chronological train, calibration and frozen test windows. Joshua built the data pipeline, temporal features, model evaluation, FastAPI service and Streamlit interface. It was evaluated across 1,140 rolling-origin test matches with 53.77% accuracy against a 56.70% bookmaker benchmark.',
  },
  {
    id: 'backend-projects',
    title: 'Additional engineering projects',
    href: '#additional-work',
    keywords: 'backend technologies technology python fastapi n8n sqlite docker telegram react aiohttp api async caching concurrency wallet downloader automation projects',
    text: 'Joshua’s additional backend work includes a Telegram social-video workflow built with Python, FastAPI, n8n, SQLite and Docker, and a Solana and Ethereum wallet analyzer using FastAPI, aiohttp, React and Telegram. The projects demonstrate durable queues, restart recovery, bounded concurrency, caching and useful partial results.',
  },
  {
    id: 'noughtline',
    title: 'Noughtline',
    href: 'https://github.com/dk3yyyy/Noughtline',
    keywords: 'noughtline tic tac toe game react express socket.io sqlite multiplayer server authoritative rooms matchmaking progression economy reconnect paystack',
    subject: 'Noughtline',
    predicate: 'project_description',
    sourceIds: ['project-noughtline'],
    text: 'Noughtline is a real-time Tic-Tac-Toe project built with React, Express, Socket.IO and SQLite. Its README describes server-authoritative multiplayer rooms and matchmaking, authenticated guest sessions, reconnection handling, persistent progression, a cosmetic economy and automated API, economy, room-state and two-client Socket.IO tests.',
  },
  {
    id: 'user-count',
    title: 'User Count Telegram Bot',
    href: 'https://github.com/dk3yyyy/user_count',
    keywords: 'user count telegram bot milestone notifications unique users admin sqlite postgresql redis retry durable pending notification',
    subject: 'User Count Telegram Bot',
    predicate: 'project_description',
    sourceIds: ['project-user-count'],
    text: 'User Count is an asynchronous Telegram bot that registers unique users, reports counts to an admin and sends durable milestone notifications. Its README describes persisted pending notifications for retry, admin-only statistics, SQLite or PostgreSQL storage, optional Redis-backed rate limiting and caching, automated tests and CI; it does not claim a specific load-tested throughput.',
  },
  {
    id: 'open-source',
    title: 'Merged open-source contributions',
    href: '#contributions',
    keywords: 'open source opensource contribution contributed pull request pr merged github retry recovery deterministic tests compatibility validation schema workflow nine',
    text: 'Joshua has nine independently verified merged pull requests across maintained projects including the OpenAI Agents SDK, Pydantic AI Harness, Mellea, FastStream, Apache Arrow Rust, Altair, FastStream FastAPI and Calkit. The changes cover retry policy, recovery, deterministic tests, worker cancellation, compatibility, validation, diagnostics, schema preservation and workflow scoping.',
  },
  {
    id: 'engineering-approach',
    title: 'Engineering approach',
    href: '#approach',
    keywords: 'approach reliability reliable engineering principles retrieval context resilient workflows evaluation baselines methodology test testing',
    text: 'Joshua’s engineering approach is to route only selected context, keep retrieval pipelines recoverable, build resilient workflows with bounded execution and useful partial results, and evaluate systems against explicit baselines.',
  },
  {
    id: 'work-history',
    title: 'Work history',
    href: '#background',
    routerOnly: true,
    keywords: 'work worked employer employment experience career freelance client volyxai job roles history',
    text: 'Joshua’s public CV lists two independent roles: AI Engineer at VolyxAI — independent AI product development — from Nov 2025 to Present, and Python Automation Developer doing independent paid freelance client work from Jan 2023 to Present.',
  },
  {
    id: 'background',
    title: 'Professional background',
    href: '#background',
    keywords: 'background experience work history volyxai independent product python automation backend applied ai november 2025 january 2021',
    text: 'Joshua’s public background combines independent VolyxAI product work in applied AI with Python, backend and automation projects involving asynchronous workflows, API integrations, data processing, Telegram services and ML evaluation.',
  },
  {
    id: 'education',
    title: 'Education',
    href: '#background',
    keywords: 'education study studying studied degree university northumbria masters msc artificial intelligence september 2026 mathematics bachelor technology federal owerri',
    text: 'Joshua holds a Bachelor of Technology in Mathematics from the Federal University of Technology, Owerri, completed in 2021. The portfolio lists an MSc Artificial Intelligence September 2026 intake at Northumbria University.',
  },
  {
    id: 'certifications',
    title: 'Certifications and training',
    href: '#background',
    keywords: 'certification certifications certificate credential credentials training course freecodecamp google coursera anthropic mcp scientific computing',
    text: 'The portfolio lists Scientific Computing with Python from freeCodeCamp, the Google AI Specialization from Google and Coursera, and Model Context Protocol: Advanced Topics from Anthropic training. Each credential links to public verification.',
  },
  {
    id: 'contact',
    title: 'Roles and contact',
    href: '#contact',
    keywords: 'contact hire hiring available availability role roles job opportunity email linkedin github applied ai engineer',
    text: 'Joshua is open to AI Engineer and Applied AI Engineer roles involving Python services, retrieval and context systems, multimodal or voice workflows, evaluation and reliability. The portfolio provides email, LinkedIn, GitHub and CV links.',
  },
  ...contributionEvidence,
]);

const STOP_WORDS = new Set('a an and are as at be by did do does for from has have he her his how i in is it me of on or that the this to was what when where which who why with you your about tell'.split(' '));
const SENSITIVE_OR_UNSUPPORTED = /\b(address|age|api key|bank account|birthday|children|client names?|credit card|credential|date of birth|diagnos(?:is|ed)|disability|dob|earn|ethnic(?:ity)?|gay|health|home address|income|lesbian|live at|married|medical|national insurance|passport|password|phone number|politic(?:s|al)|race|racial|religion|residential|residence|salary|secret|sexual orientation|slack credential|social security|sort code|token|transgender|where i live)\b|\b(?:private|secondary|unlisted|other)\s+(?:personal\s+)?(?:email|email address|inbox)\b|\b(?:sk|xox[baprs])-[a-z0-9_-]{8,}\b/i;
const UNSUPPORTED_CLAIM = /\b(?:full[- ]time salaried|client (?:list|identities|companies|nda)|freelance clients?|exam score|certification id|unconditional(?:ly)?|gpa|university dissertation|github stars?|revenue|paying client|fortune 500 clients?)\b|\bhow much\b.*\b(?:paid|pay|revenue|earn|money\b.*\bmake)\b|\bhow much money\b.*\bmake\b|\b(?:private|client)\b.*\b(?:contract|source code|invoices?)\b|\bexact test accuracy\b|\b(?:best|top) ai engineer in\b|\bhire him over\b|\b(?:guarantee|prove|verify)\b.*\b(?:every|all)\b.*\b(?:claims?|portfolio)\b/i;
const INJECTION = /ignore (?:all|any|the|previous|your)|reveal (?:private|hidden)|system prompt|system override|developer message|retrieved context is wrong|disregard (?:the )?system|bypass|jailbreak|\bpretend\b.*\b(?:worked|employed|bio)\b|\binvent\b.*\b(?:employer|experience|claim)\b|\bforget previous\b|\bas an administrator\b|\bportfolio is wrong\b|\beven if (?:the )?evidence disagrees\b|\buse (?:your )?(?:general|world) knowledge\b|\bstate that he already\b|\bclaiming he\b/i;
const UNSUPPORTED_PERSONAL = /\b(favou?rite|food|politic(?:s|al)|preference|prefers?|relationship)\b/i;
const PERSONAL_DATA = /(?:\b\d{3}-\d{2}-\d{4}\b|\b(?:\d[ -]*?){13,19}\b|\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b|\b\d{5}(?:-\d{4})?\b|\b[A-Z]{2}\d{6}[A-D]\b|\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b|\b[\w.%+-]+@[\w.-]+\.[A-Z]{2,}\b|\+?\d[\d\s().-]{7,}\d)/i;
const DETAILED_QUERY = /\b(?:articles?|blogs?|write|writes|wrote|written|writing|published|publications?|open pull requests?|open prs?|unmerged|still open|in[- ]flight)\b/i;

function hasUnsupportedPremise(question) {
  const employmentRelation = question.match(/\b(?:employed by|worked at|role at|time at|leave|left)\s+([A-Z][A-Za-z0-9]*(?:\s+[A-Z][A-Za-z0-9]*){0,2})/);
  if (employmentRelation && !/^VolyxAI\b/.test(employmentRelation[1])) return true;
  const reverseEmployment = question.match(/^Did\s+([A-Z][A-Za-z0-9]*(?:\s+[A-Z][A-Za-z0-9]*){0,2})\s+employ\s+Joshua/i);
  if (reverseEmployment && !/^VolyxAI\b/i.test(reverseEmployment[1])) return true;
  const titledAt = question.match(/\b(?:senior\s+)?(?:engineer|developer|employee|job)\s+at\s+([A-Z][A-Za-z0-9]*(?:\s+[A-Z][A-Za-z0-9]*){0,2})/);
  if (titledAt && !/^VolyxAI\b/i.test(titledAt[1])) return true;
  if (/\b(?:he|joshua)\s+(?:created|founded|owns?|maintains? (?:all|the whole)(?: of)?)\s+(?:the\s+)?(?:apache arrow|openai agents sdk|pydantic ai|altair)\b/i.test(question)) return true;
  if (/\b(?:shut(?:ting)? down|closed|discontinued|abandoned)\s+volyx lens\b|\bafter\s+shutting\s+down\s+volyx lens\b/i.test(question)) return true;
  if (/\bportfolio says\s+(?:eight|8)\s+merged\s+(?:pull requests|prs)\b/i.test(question)) return true;
  return /\b(?:which year|when) did (?:joshua|he) (?:finish|complete|graduate from) (?:his )?northumbria|\bfinish(?:ed)? (?:his )?northumbria msc\b/i.test(question);
}

function normalise(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9+#.]+/g, ' ').trim();
}

function terms(value) {
  return [...new Set(normalise(value).split(/\s+/).filter((term) => term.length > 1 && !STOP_WORDS.has(term)))];
}

const CORPUS_TERMS = new Set(evidence.flatMap((record) => terms(`${record.title} ${record.keywords} ${record.text}`)));

function hasEnoughKnownContext(question) {
  const questionTerms = terms(question);
  if (!questionTerms.length) return false;
  const knownTerms = questionTerms.filter((term) => CORPUS_TERMS.has(term)).length;
  return knownTerms >= 2 || knownTerms / questionTerms.length >= 0.5;
}

export function validateQuestion(question) {
  if (typeof question !== 'string') return { ok: false, error: 'Question must be text.' };
  const value = question.normalize('NFKD').replace(/[\p{Cf}\p{M}]/gu, '').trim().replace(/\s+/g, ' ');
  if (!value) return { ok: false, error: 'Enter a question first.' };
  if (value.length > 500) return { ok: false, error: 'Keep the question under 500 characters.' };
  return { ok: true, value };
}

export function isQuestionSafeForModel(rawQuestion) {
  const validation = validateQuestion(rawQuestion);
  if (!validation.ok) return false;
  const question = validation.value;
  return !(
    SENSITIVE_OR_UNSUPPORTED.test(question)
    || UNSUPPORTED_CLAIM.test(question)
    || INJECTION.test(question)
    || UNSUPPORTED_PERSONAL.test(question)
    || PERSONAL_DATA.test(question.replace(/\b(?:pr|pull request|issue)\s*#?\d+\b/gi, ''))
    || hasUnsupportedPremise(question)
  );
}

export function retrieveEvidence(question, limit = 3) {
  const query = normalise(question);
  const queryTerms = terms(question);
  return evidence
    .filter((record) => !record.routerOnly)
    .map((record) => {
      const haystack = normalise(`${record.title} ${record.keywords} ${record.text}`);
      let score = queryTerms.reduce((total, term) => total + (haystack.includes(term) ? 2 : 0), 0);
      if (query.includes(normalise(record.title))) score += 8;
      for (const phrase of record.keywords.split(' ')) {
        if (phrase.length > 4 && query.includes(phrase)) score += 1;
      }
      return { ...record, score };
    })
    .filter(({ score }) => score >= 2)
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, limit);
}

const suggestions = Object.freeze([
  'Which project best demonstrates RAG and evaluation?',
  'What open-source work has Joshua contributed?',
  'What backend technologies does Joshua use?',
  'What roles is Joshua interested in?',
]);

// Supplemental records are reviewed and schema-validated at module load. The
// existing curated record wins on an ID collision so established routes and
// citation targets remain backward compatible.
const EVIDENCE_BY_ID = new Map(
  [...detailedEvidenceCatalog, ...evidence].map((record) => [record.id, record]),
);

function contributionRoutingFor(question) {
  const normalisedQuestion = normalise(question);
  const mentionsAnyPrNumber = /\b(?:pr|pull request)\s*#?\d+\b/i.test(question);
  const explicitlyReferenced = contributionData.contributions.filter((contribution) => (
    new RegExp(`\\b(?:pr|pull request)\\s*#?${contribution.prNumber}\\b`, 'i').test(question)
  ));
  const named = contributionData.contributions.filter((contribution) => (
    normalisedQuestion.includes(normalise(contribution.projectName))
  ));
  const asksAboutContribution = /\b(?:contribut(?:e|ed|ion)|change[ds]?|fix(?:ed|es)?|pull request|prs?|merged|review|test(?:s|ed|ing)?)\b/i.test(question);
  const relationshipsAgree = !named.length || explicitlyReferenced.some((explicit) => (
    named.some((candidate) => candidate.id === explicit.id)
  ));
  const matching = explicitlyReferenced.length && relationshipsAgree
    ? explicitlyReferenced
    : mentionsAnyPrNumber
      ? []
      : named.filter(() => asksAboutContribution);
  return {
    invalid: mentionsAnyPrNumber && (!explicitlyReferenced.length || !relationshipsAgree),
    matching,
    mentionsAnyPrNumber,
  };
}

export function directEvidenceIds(rawQuestion) {
  const validation = validateQuestion(rawQuestion);
  if (!validation.ok || !isQuestionSafeForModel(validation.value)) return [];
  const question = validation.value;
  const selected = [];
  const add = (id) => {
    if (!selected.includes(id) && selected.length < 2) selected.push(id);
  };

  if (/\b(?:who is joshua|person behind (?:this|the) portfolio|professional summary|technical profile|professional focus|speciali[sz]e|kind of engineer|ai engineer)\b|^what does (?:joshua|he) do[?.!]*$/i.test(question)) add('profile');
  if (/\b(?:what (?:does|is) volyxai|tell me about volyxai|volyxai (?:company|business|services?|workflow discovery|design partnership)|how does volyxai work)\b/i.test(question)) add('volyxai-company');
  if (/\b(?:employment|employers?|work history|work experience|career history|professional roles?|current roles?|his roles|freelanc(?:e|ed|ing)|paid client work|python automation work paid|worked professionally)\b|\bwhr has he wrked\b|\bwhere\s+(?:has|does|did)\s+(?:joshua|he)\s+work(?:ed)?\b|\bwho\s+has\s+(?:joshua|he)\s+worked\s+for\b|\bprofessionally since 2023\b/i.test(question)) add('work-history');
  if (/\b(?:school|university|college|degrees?|education|academic background|bachelor|btech|mathematics|futo|northumbria|msc|september 2026 intake|go uni)\b|\bwhere\s+(?:did|does)\s+(?:joshua|he)\s+(?:study|studied)\b/i.test(question)) add('education');
  if (/\b(?:volyx lens|volix lens|macos assistant|multimodal product|screen context|microphone and meeting audio|ocr and transcription|provider routing|electron app)\b/i.test(question)) add('volyx-lens');
  if (/\b(?:local review intelligence|local reveiw intellegence|semantic recall|recall@5|bm25|rag benchmark|rag evaluation|rag and evaluation|demonstrates rag|retrieval evaluated|citation validation|csv review data|strongest retrieval project|chroma and ollama|review (?:and|project).*(?:football|metrics))\b/i.test(question)) add('local-review-intelligence');
  if (/\b(?:football forecasting|football model|football projects?|football prediction|footbal prediction|temporal leakage|rolling-origin|rolling origin|bookmaker benchmark|1,?140.*matches|xgboost|chronological train|temporal ml)\b/i.test(question)) add('football-forecasting');
  if (/\b(?:what|which|list|describe|summari[sz]e)\b.*\b(?:backend|server-side)\b.*\b(?:technolog(?:y|ies)|stack|tools?|frameworks?|databases?)\b|\b(?:backend|server-side)\s+(?:technolog(?:y|ies)|stack)\b/i.test(question)) {
    add('backend-technologies');
  } else if (/\b(?:backend projects?|telegram social-video|social video workflow|wallet analyzer|solana and ethereum|fastapi and n8n|durable queues?|bounded concurrency and caching|telegram services?|aiohttp and react|additional engineering projects?)\b/i.test(question)) {
    add('backend-projects');
  }
  if (/\b(?:noughtline|tic[ -]?tac[ -]?toe.*(?:project|multiplayer)|server-authoritative multiplayer|stale socket|socket.*reconnect)\b/i.test(question)) add('noughtline');
  if (/\b(?:user count telegram bot|user_count|milestone notifications?|registers? unique users)\b/i.test(question)) add('user-count');

  const { matching: matchingContributions, mentionsAnyPrNumber } = contributionRoutingFor(question);
  for (const contribution of matchingContributions) add(contribution.id);
  if (!mentionsAnyPrNumber && !selected.some((id) => id.startsWith('oss-')) && /\b(?:open[ -]?source|opensource|merged (?:pull requests?|prs?|oss work)|upstream (?:work|fixes|contributions?)|contribut(?:e|ed|ions?|e upstream) to (?:the )?openai agents sdk|fixes did he contribute upstream|pydantic ai harness|apache arrow rust)\b/i.test(question)) add('open-source');
  if (/\b(?:engineering (?:approach|principles)|approach (?:to )?reliability|recoverable workflows?|evaluate against baselines|partial failures?|testing philosophy|prioriti[sz]e.*building ai|select context)\b/i.test(question)) add('engineering-approach');
  if (/\b(?:certs?|certifications?|certificates?|credentials?|professional training|freecodecamp|scientific computing with python|google ai (?:courses?|specialization)|anthropic training|model context protocol.*advanced)\b/i.test(question)) add('certifications');
  if (/\b(?:contact joshua|contact him|how (?:can|do) i (?:contact|hire)|roles? (?:is|does) (?:joshua|he) (?:looking|open)|open to .*roles?|linkedin|view his cv|opportunit(?:y|ies).*interest|available for applied ai)\b/i.test(question)) {
    const profileIndex = selected.indexOf('profile');
    if (profileIndex >= 0) selected.splice(profileIndex, 1);
    add('contact');
  }
  if (/\b(?:best|strongest|top|most impressive)\s+(?:overall\s+)?(?:portfolio\s+)?(?:project|build|work)\b|\bproject\s+(?:is|was)\s+(?:the\s+)?(?:best|strongest|top)\b|\bcompare (?:his|the) featured projects\b|\bproject should .* look at first\b|\b(?:demonstrates?|shows?) his range\b|\bwhich is more impressive\b/i.test(question)) {
    selected.length = 0;
    add('featured-projects');
  }
  return selected;
}

export function answerFromEvidenceIds(rawIds, rawQuestion = '') {
  const ids = Array.isArray(rawIds) ? rawIds : [];
  const selected = [];
  for (const id of ids) {
    const record = typeof id === 'string' ? EVIDENCE_BY_ID.get(id) : null;
    if (record && !selected.some((item) => item.id === record.id)) selected.push(record);
    if (selected.length === 2) break;
  }
  if (!selected.length) return insufficient();

  return {
    outcome: 'answered',
    answer: selected.map(({ text }) => text).join(' '),
    citations: selected.map(({ id, title, href }) => ({
      id,
      title,
      href: href.startsWith('#') ? href : new URL(href, PORTFOLIO_BASE).href,
    })),
    evidenceIds: selected.map(({ id }) => id),
    suggestedQuestions: suggestions.filter((item) => normalise(item) !== normalise(rawQuestion)).slice(0, 3),
  };
}

export function normaliseAssistantResult(result) {
  if (!result || typeof result !== 'object') return null;
  if (!['answered', 'insufficient_evidence', 'invalid'].includes(result.outcome)) return null;
  if (typeof result.answer !== 'string' || !result.answer.trim() || result.answer.length > 1_200) return null;
  if (!Array.isArray(result.citations) || result.citations.length > 3) return null;

  const citations = [];
  for (const citation of result.citations) {
    const record = EVIDENCE_BY_ID.get(citation?.id);
    if (!record) return null;
    citations.push({
      id: record.id,
      title: record.title,
      href: record.href.startsWith('#') ? record.href : new URL(record.href, PORTFOLIO_BASE).href,
    });
  }
  if (result.outcome === 'answered' && !citations.length) return null;

  const suggestedQuestions = Array.isArray(result.suggestedQuestions)
    ? result.suggestedQuestions.filter((item) => typeof item === 'string' && item.length > 4 && item.length <= 280).slice(0, 3)
    : suggestions.slice(0, 3);

  return {
    outcome: result.outcome,
    answer: result.answer.trim(),
    citations,
    evidenceIds: citations.map(({ id }) => id),
    suggestedQuestions,
    ...(typeof result.mode === 'string' ? { mode: result.mode } : {}),
  };
}

export function answerQuestion(rawQuestion) {
  const validation = validateQuestion(rawQuestion);
  if (!validation.ok) {
    return { outcome: 'invalid', answer: validation.error, citations: [], evidenceIds: [], suggestedQuestions: suggestions.slice(0, 2) };
  }

  const question = validation.value;
  if (!isQuestionSafeForModel(question)) return insufficient();
  if (contributionRoutingFor(question).invalid) return insufficient();

  // Preserve all established routes. The supplemental layer is deliberately
  // enabled only for topics absent from the original corpus. Explicit article
  // and publication intent must run before the legacy contribution router so
  // words inside an article title cannot be mistaken for an upstream PR.
  if (DETAILED_QUERY.test(question)) {
    const detailedMatches = retrieveDetailedEvidence(question, { limit: 2 });
    if (detailedMatches.length) {
      const [topMatch] = detailedMatches;
      const selectedMatches = detailedMatches.filter(({ score }, index) => (
        index === 0 || score >= topMatch.score * 0.6
      ));
      return answerFromEvidenceIds(selectedMatches.map(({ id }) => id), question);
    }
  }

  const directIds = directEvidenceIds(question);
  if (directIds.length) return answerFromEvidenceIds(directIds, question);

  if (/^(?:who is joshua|tell me about joshua|what does joshua do)[?.!]*$/i.test(question)) {
    const profile = EVIDENCE_BY_ID.get('profile');
    return {
      outcome: 'answered',
      answer: profile.text,
      citations: [{ id: profile.id, title: profile.title, href: profile.href }],
      evidenceIds: [profile.id],
      suggestedQuestions: suggestions.slice(0, 3),
    };
  }

  if (/\b(?:school|university|college|degree|education)\b|\bwhere\s+(?:did|does)\s+(?:joshua|he)\s+(?:study|studied)\b/i.test(question)) {
    return answerFromEvidenceIds(['education'], question);
  }

  if (/\b(?:best|strongest|top|most impressive)\s+(?:overall\s+)?project\b|\bproject\s+(?:is|was)\s+(?:the\s+)?(?:best|strongest|top)\b/i.test(question)) {
    return answerFromEvidenceIds(['featured-projects'], question);
  }

  const matches = retrieveEvidence(question);
  if (!matches.length || !hasEnoughKnownContext(question)) return insufficient();

  const normalisedQuestion = normalise(question);
  const explicitlyNamed = matches.filter(({ title }) => normalisedQuestion.includes(normalise(title)));
  const selected = explicitlyNamed.length ? explicitlyNamed.slice(0, 2) : matches.slice(0, 1);
  return {
    outcome: 'answered',
    answer: selected.map(({ text }) => text).join(' '),
    citations: selected.map(({ id, title, href }) => ({ id, title, href: href.startsWith('#') ? href : new URL(href, PORTFOLIO_BASE).href })),
    evidenceIds: selected.map(({ id }) => id),
    suggestedQuestions: suggestions.filter((item) => normalise(item) !== normalise(question)).slice(0, 3),
  };
}

function insufficient() {
  return {
    outcome: 'insufficient_evidence',
    answer: 'I can’t answer that from the verified evidence on this portfolio. Try asking about Joshua’s projects, engineering approach, open-source work, education or listed credentials.',
    citations: [],
    evidenceIds: [],
    suggestedQuestions: suggestions.slice(0, 3),
  };
}

// The bench corpus. Every passage is a claim the page already makes, with the
// section it can be checked against. Nothing here is generated at runtime.
export const passages = [
  { id: 'lens-what', href: '#project-lens', title: 'Volyx Lens', text: 'Volyx Lens is a macOS assistant that combines selected screen context, microphone input, meeting audio, local OCR, relevance-ranked retrieval, transcription and multiple AI providers.' },
  { id: 'lens-context', href: '#project-lens', title: 'Volyx Lens — context aperture', text: 'Lens makes screen, microphone and system audio deliberate inputs, and routes only the chosen context to the configured provider.' },
  { id: 'lens-controls', href: '#project-lens', title: 'Volyx Lens — controls', text: 'User-selected inputs, consent-led capture, sandboxed execution, context isolation and provider-aware routing across secure Electron boundaries.' },
  { id: 'lens-work', href: '#project-lens', title: 'Volyx Lens — my work', text: 'Built focused context selection, provider-aware routing, consent controls, secure Electron boundaries, automated tests and release checks.' },

  { id: 'review-what', href: '#project-local-ai', title: 'Local Review Intelligence', text: 'A local-first review-intelligence system for adaptable CSV datasets, semantic retrieval and grounded answers with inspectable citations.' },
  { id: 'review-cite', href: '#project-local-ai', title: 'Review — citation validation', text: 'Citation validation and a single bounded repair pass keep responses evidence-linked, so an unsupported sentence is caught before it ships.' },
  { id: 'review-eval', href: '#project-local-ai', title: 'Review — evaluation', text: 'Clean exact-commit 30-case benchmark: Semantic Recall@5 0.913 versus 0.770 for BM25, with answer success and citation validity at 0.880.' },
  { id: 'review-index', href: '#project-local-ai', title: 'Review — index recovery', text: 'Adaptable field mapping, stable record identity, recoverable vector indexes, privacy-safe diagnostics and an installable CLI.' },

  { id: 'football-what', href: '#project-football', title: 'Football Forecasting Lab', text: 'A leakage-aware football forecasting pipeline with chronological train, calibration and frozen test windows, using calibrated XGBoost and Poisson probabilities.' },
  { id: 'football-eval', href: '#project-football', title: 'Football — evaluation', text: 'Evaluated across 1,140 rolling-origin test matches with 53.77% accuracy, using a 56.70% bookmaker benchmark for comparison.' },
  { id: 'football-work', href: '#project-football', title: 'Football — my work', text: 'Built the data pipeline, temporal features, model evaluation, a FastAPI service and a Streamlit interface, with live, retrospective and synthetic workflows.' },

  { id: 'bh-what', href: '#project-bug-hunter', title: 'Bug Hunter', text: 'An AI reviewer for GitHub pull requests: a model pass, then a skeptical verifier that discards weak findings before anything is posted.' },
  { id: 'bh-security', href: '#project-bug-hunter', title: 'Bug Hunter — injection checks', text: 'Diff text is checked for injected instructions aimed at the reviewer; webhooks are signature-verified; hunts are queued and budgeted.' },
  { id: 'bh-providers', href: '#project-bug-hunter', title: 'Bug Hunter — providers', text: 'Runs on Gemini, Claude, OpenAI, DeepSeek, OpenRouter, Ollama or any OpenAI-compatible model, selected per deployment.' },

  { id: 'dl-what', href: '#project-downloader', title: 'Telegram Social Video Downloader', text: 'An n8n and FastAPI workflow that validates supported URLs, authenticates job submission, deduplicates Telegram updates and persists queue state in SQLite.' },
  { id: 'dl-queue', href: '#project-downloader', title: 'Downloader — restart safety', text: 'Bounded workers, queue limits, host allowlisting, restart recovery, idempotent update handling and non-root container execution.' },

  { id: 'essay-rag', href: '#writing', title: 'The Hidden Complexity of RAG', text: 'Why a working RAG demo and a production RAG system are different engineering problems: parsing, chunking, hybrid retrieval, reranking, evaluation and security as separate failure surfaces.' },
  { id: 'essay-memory', href: '#writing', title: 'A Million-Token Context Is Not Memory', text: 'Why a larger context window is not memory, and the five decisions — admit, retrieve, consolidate, revise, forget — that keep agent memory reliable and auditable.' },
  { id: 'essay-mcp', href: '#writing', title: 'MCP Made Tools Connectable', text: 'MCP standardizes the connection between models and tools; the tool contract, names, schemas and side effects still have to be engineered separately.' },
  { id: 'essay-handoff', href: '#writing', title: 'The Handoff Problem', text: 'How evidence quietly degrades when one model hands research to another, and the claim-level contract that keeps citations and scope intact across the handoff.' },
  { id: 'essay-voice', href: '#writing', title: 'Where Voice Agents Corrupt State', text: 'Two failure boundaries in voice agents, acoustic-to-transcript and propose-to-commit, where a call can sound perfect while committing the wrong backend state.' },

  { id: 'bg-volyx', href: '#background', title: 'VolyxAI product work', text: 'Applied AI systems across model integration, retrieval and context assembly, multimodal and voice workflows, structured outputs, Python services and event-driven automation.' },
  { id: 'bg-independent', href: '#background', title: 'Independent engineering work', text: 'Python, backend and automation projects involving asynchronous workflows, API integrations, data processing, Telegram services and ML evaluation.' },
  { id: 'bg-training', href: '#background', title: 'Technical training', text: 'Suricata and Snort detection work, Python-based alert enrichment and a DNS intelligence CLI with asynchronous resolution, WHOIS lookup and JSON export.' },
  { id: 'bg-degree', href: '#background', title: 'Education', text: 'Bachelor of Technology in Mathematics from the Federal University of Technology, Owerri, and an MSc in Artificial Intelligence at Northumbria University from September 2026.' },
  { id: 'bg-certs', href: '#background', title: 'Certifications', text: 'Scientific Computing with Python, a Google AI Specialization and Anthropic training in advanced Model Context Protocol topics.' },

  { id: 'oss-sdk', href: '#contributions', title: 'OpenAI Agents SDK', text: 'Merged a WebSocket retry policy into the OpenAI Agents SDK so a dropped connection retries instead of failing the run.' },
  { id: 'oss-mellea', href: '#contributions', title: 'Mellea', text: 'Merged deterministic tracing tests and timed-out worker cancellation into Mellea, so a stalled worker cannot hang the queue.' },
  { id: 'oss-faststream', href: '#contributions', title: 'FastStream', text: 'Merged FastAPI 0.140 compatibility and schema metadata preservation into FastStream and its FastAPI bridge.' },
  { id: 'oss-arrow', href: '#contributions', title: 'Apache Arrow Rust', text: 'Merged ListView nullability validation into Apache Arrow Rust.' },
  { id: 'oss-altair', href: '#contributions', title: 'Altair', text: 'Merged clearer JupyterChart dependency errors into Altair, so a missing extension reports itself instead of failing silently.' },
];

// Hand-written, deliberately small. This is a demo of a method, not a benchmark.
export const evalQueries = [
  { query: 'citation validation', expect: 'review-cite' },
  { query: 'bookmaker benchmark', expect: 'football-eval' },
  { query: 'electron sandbox', expect: 'lens-controls' },
  { query: 'prompt injection', expect: 'bh-security' },
  { query: 'sqlite queue', expect: 'dl-what' },
  { query: 'restart recovery', expect: 'dl-queue' },
  { query: 'semantic recall at five', expect: 'review-eval' },
  { query: 'multimodal screen context', expect: 'lens-what' },
  { query: 'voice agent boundaries', expect: 'essay-voice' },
  { query: 'context window memory', expect: 'essay-memory' },
  { query: 'temporal leakage', expect: 'football-what' },
  { query: 'n8n workflow', expect: 'dl-what' },
  { query: 'multiple model providers', expect: 'bh-providers' },
  { query: 'northumbria masters', expect: 'bg-degree' },
  { query: 'rolling origin', expect: 'football-eval' },
  { query: 'ocr transcription', expect: 'lens-what' },
  { query: 'websocket retry', expect: 'oss-sdk' },
  { query: 'reranking and chunking', expect: 'essay-rag' },
  { query: 'worker cancellation', expect: 'oss-mellea' },
  // Paraphrases with almost no lexical overlap. BM25 is expected to miss these,
  // which is the point: it is why the review pipeline measures semantic recall
  // against a BM25 baseline instead of trusting it.
  { query: 'what stops an invented sentence from shipping', expect: 'review-cite' },
  { query: 'a conversation that quietly writes the wrong record', expect: 'essay-voice' },
  { query: 'was the forecast any better than the bookies', expect: 'football-eval' },
  { query: 'how do you keep a hallucination out of the final answer', expect: 'review-cite' },
  { query: 'proving a forecast beats the market before you trust it', expect: 'football-eval' },
];

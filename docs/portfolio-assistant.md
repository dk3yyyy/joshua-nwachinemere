# Portfolio assistant prototype

## What it is

The assistant is a fixed-corner popup embedded in the portfolio. It answers questions only from a curated set of public portfolio records and links supported answers to the relevant page section.

## Runtime design

The deployed portfolio assistant uses **AI-assisted evidence routing** when a supported edge limiter is available:

1. `src/assistant/core.js` validates and normalises the question.
2. Sensitive, personal-data, prompt-injection-style and explicitly unsupported requests are rejected before any model call.
3. A deterministic local retriever finds bounded context in the versioned source corpus. Only sources with an explicit source-to-evidence mapping are eligible, and only the best-scoring source tier is included.
4. The server derives a request-scoped evidence-ID allowlist from deterministic routing and retrieved source mappings. If no candidate exists, the request abstains without a model call.
5. The raw visitor question and its vocabulary never leave the Worker. The server converts local routing results into a closed structure containing only outcome labels and reviewed evidence IDs.
6. Only those fixed routing signals, the request-scoped candidate evidence subset and bounded **untrusted source hints** are sent server-side to Cloudflare Workers AI.
7. The model may return only zero, one or two IDs from the request-scoped allowlist. Model prose, URLs, globally valid but unrelated IDs and unknown IDs are ignored. Source hints can locate reviewed evidence but cannot become an answer directly.
8. The server constructs the answer and citations from the local allowlist; the model never writes visitor-visible factual prose.
9. If Workers AI is unavailable, times out, exceeds quota or returns malformed output, the API falls back to deterministic lexical retrieval. The legacy Groq adapter remains isolated for controlled comparisons but never takes precedence over an available Workers AI binding.

This lets the model arbitrate a bounded set of locally derived candidates without exposing visitor-authored text or allowing generated portfolio claims. The browser never receives credentials and never invokes the model directly.

## Privacy and cost boundary

Fixed server-defined routing signals—not the raw visitor question or any projected visitor vocabulary—are transmitted to Workers AI together with only the request-scoped candidate evidence. Visitors are still told not to enter personal data because the endpoint is not a secure channel for confidential information.

The API does not intentionally persist questions or log raw model payloads. Cloudflare processes both the Pages Function request and the bounded server-derived routing payload. Cloudflare's current platform processing, retention, quota and pricing terms apply.

## Safety properties

- question length: 500 characters;
- request body limit: 4,096 bytes, enforced while streaming;
- exact `application/json` media type;
- model deadline: 4.5 seconds;
- maximum model output: 80 tokens;
- maximum accepted evidence IDs: two;
- no model call without request-scoped evidence coverage;
- raw visitor text and arbitrary tokens are not sent to the provider;
- provider-returned IDs are intersected with the request-scoped allowlist;
- production model routing fails closed unless a supported rate-limit control is bound;
- Cloudflare preview-branch builds receive `noindex, nofollow` during the postbuild step;
- citations reconstructed from the server-side allowlist;
- no model-generated answer text reaches the browser;
- no model call for detected sensitive, mixed personal-data or injection-style input;
- deterministic fallback on model failure.

## Verification

The reviewed detailed-evidence corpus is bound to
`knowledge/detailed-evidence.integrity.json`. Run
`npm run assistant:verify-detailed-corpus` after changing the corpus. If the
change is intentional and reviewed, regenerate the manifest with
`npm run assistant:write-detailed-corpus-manifest`, then inspect and commit the
corpus and manifest together.

`scripts/qa-detailed-rag.mjs --semantic <path>` accepts a JSON object containing
`suiteVersion`, the SHA-256 `suiteDigest` of the exact suite file,
`kbVersion`, the exact SHA-256 `corpusDigest` from the integrity manifest,
and a complete `scoresByCase` map. Every suite case must have a non-empty
map of known evidence IDs to finite scores from 0 through 1. Missing
cases, unknown cases or evidence IDs, invalid scores, and version/digest
mismatches fail the run instead of silently reverting those cases to lexical
retrieval. Without `--semantic`, retrieval remains lexical.

Every evaluator report records SHA-256 identities for the evaluator source, the complete retrieval/evaluation implementation source set, the exact suite bytes, and the reviewed corpus version and digest. When used, it also records the semantic artifact identity and covered-case count. Endpoint-mode runs are diagnostic unless the remote deployment cryptographically attests its build and corpus; unattested endpoint reports fail release gates instead of inheriting local provenance. `npm run build` verifies the corpus manifest before producing deployable assets, so a stale manifest blocks the build.

```bash
npm ci
npm run check
npm run test:e2e
npx wrangler@4 pages functions build --outdir /tmp/portfolio-assistant-functions-build
```

Deployment verification should include:

- the natural paraphrase `what’s the best project he has done` returns the curated project comparison with `mode: evidence-routed`;
- supported project, education and open-source questions return allowlisted citations;
- unsupported questions return `insufficient_evidence`;
- sensitive and mixed personal-data questions make zero model calls in unit tests;
- malformed/oversized requests are rejected;
- preview-branch builds remain `noindex, nofollow`;
- the production build remains indexable.

## Structured backend-technology evidence

`src/assistant/backend-technologies.json` is the authoritative cross-repository record for questions such as “What backend technologies does Joshua use?”. It is built from manifests and runtime files in Joshua’s owned repositories, with commit-pinned GitHub source URLs and an explicit relationship for each category. It distinguishes:

- direct owned-project use from the portfolio assistant’s current edge runtime;
- backend languages, API frameworks, data stores, automation, realtime transport and AI infrastructure;
- frontend/test tools that are present but must not be described as backend technologies;
- technologies encountered only in upstream contribution repositories, which are excluded from Joshua’s owned-project stack.

The deterministic router sends broad backend-stack questions to `backend-technologies`; questions about the two smaller portfolio projects continue to use `backend-projects`.

## Cloudflare hosting and Workers AI binding

Cloudflare Pages hosts the site and executes the server-side Function. Wrangler binds Cloudflare Workers AI as `AI`; no provider credential is sent to the browser. The checked-in configuration sets `ASSISTANT_ENV=production`. Production model routing fails closed with `503` until a supported edge limiter is configured; there are no hostname exceptions. Deterministic reviewed-evidence answers remain available and do not invoke Workers AI.

## Updating evidence

### Refreshing the source corpus

The source registry in `src/assistant/corpus.js` currently allowlists:

- VolyxAI's public website;
- Joshua's GitHub profile README;
- the portfolio README;
- Volyx Lens;
- Local Review Intelligence;
- Football Forecasting Lab;
- Telegram Social Video Downloader;
- Solana/Ethereum Wallet Analyzer;
- Noughtline;
- User Count.

Forks, archived previews, redirects, private repositories and repositories not explicitly listed are excluded. Refresh the generated corpus with:

```bash
npm run assistant:sync-corpus
```

The synchronizer fetches only fixed HTTPS hosts with redirects disabled and caps every remote body at 1 MiB. For GitHub READMEs it validates the API blob URL against the approved owner/repository, fetches the immutable Git blob, recomputes and verifies its SHA-1 object ID, and records that blob version plus the source content hash. It removes scripts/forms/navigation, code blocks, badges, public email addresses and assignments whose normalized names match a reviewed set of common credential-bearing names. Quoted assignment values are consumed with escape awareness; classified connection strings with semicolon-delimited fields are consumed through the end of their source line to prevent later fields surviving partial matching. The synchronizer then emits chunks with a hard 900-character maximum—including single overlong tokens—to `src/assistant/corpus.generated.json`. This assignment-name filter is a defense-in-depth control, not general secret detection; generated-corpus scans and reviewed evidence mappings remain required.

README and website chunks are **routing context, not approved facts**. Treat them as untrusted external text even when Joshua owns the repository. A raw chunk cannot reach the browser, create a citation or become a factual answer until it is mapped to a reviewed record.

### Curating answerable evidence

Edit general reviewed records in `src/assistant/core.js`, merged-contribution records in `src/assistant/contributions.json`, and explicit mappings in `src/assistant/knowledge.js`. Every statement must already be visible on the portfolio or supported by its cited public source. Each contribution record must retain its repository, PR URL and number, merge metadata, problem, final change, tests, review evolution and scope limits. Add retrieval, routing, relationship and citation tests whenever a record or mapping changes. Never add confidential clients, private correspondence, unapproved contact details, credentials, secrets, illustrative sample data or unverified claims.

### Why there is no vector database

The current corpus is small enough for a deterministic in-bundle lexical index. This keeps retrieval inspectable, inexpensive and deployable within the Pages Function. A vector or hybrid index should be added only if untouched evaluations show material semantic-recall failures. Embeddings would remain candidate retrieval only; they would not replace relationship validation, source allowlists, claim review, abstention or citation reconstruction.

### Provider evaluation

An earlier provider diagnostic recorded 40/60 for Cloudflare Workers AI and 31/60 for Groq on a then-unopened 60-case set. That set has since been opened during retrieval debugging, so those figures are historical diagnostics—not independent release evidence or a basis for a current superiority claim. Both adapters use the same source hints, reviewed evidence IDs, validators and deterministic renderer; provider-generated prose never reaches the browser. Production model routing remains fail-closed until it is validated on a newly frozen independent set and edge throttling is configured and verified.

Future production deployments remain separate approval steps.

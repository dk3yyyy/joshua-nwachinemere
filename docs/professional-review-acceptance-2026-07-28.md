# Professional portfolio review acceptance checklist

Date: 2026-07-28
Live baseline reviewed: `9938c507a40b87a71bb4359c1f725a9fec16697e`

This file preserves the two independent professional review axes used for the portfolio refinement. Every recommendation is treated as a hypothesis and checked against the source and rendered site. The release must pass both axes after implementation.

## Reviewer A: recruiter and AI hiring-manager checklist

### Verified strengths to retain

- Direct AI Engineer positioning with ML Engineer secondary.
- Volyx Lens as the flagship, with source, architecture, UI, CI, limitations, and privacy boundaries.
- Five inspectable projects with explicit ownership, status, stack, and evidence.
- Three directly linked, verified merged upstream contributions.
- Football Predictor's honest rolling-origin result: 53.77% versus a 56.70% bookmaker benchmark over 1,140 test matches.
- No unsupported claims about employment, production users, revenue, scale, sponsorship, or impact.
- Distinctive visual identity and concrete systems-engineering language.

### Required corrections

- [ ] Make the direct AI Engineer proposition and practical proof easier to extract from the hero.
- [ ] Reduce repeated manifesto language and abstract repetition without removing the main identity.
- [ ] Clarify Volyx Lens as an independent, active pre-release project with public test-build limitations.
- [ ] Standardize project status terminology so it distinguishes pre-release, public demo, repository-only, deployed prototype, and archived evaluation.
- [ ] Replace ambiguous inspection CTAs with concrete destination labels.
- [ ] Use `Verified behavior`, `Implemented controls`, or `Evaluation result` instead of calling every qualitative behavior an engineering result.
- [ ] Remove or substantiate the unsupported card-level phrase `signal over naive baselines`.
- [ ] Make merged contribution proof more explicit without requiring the reader to open GitHub.
- [ ] Clarify VolyxAI as an independent product effort rather than conventional employment.
- [ ] Make the final hiring CTA direct and operational while keeping public copy evergreen and location-free.
- [ ] Clarify the downloadable CV's independent-work section so it is not easily mistaken for conventional employment.

### Explicitly rejected or constrained suggestions

- Do not publish visa, sponsorship, present-location, or temporary relocation details.
- Do not add test counts, module counts, latency figures, costs, or other metrics unless they are current, meaningful, and reproducible.
- Do not add a second large skills inventory or duplicate information already present.
- Do not remove the distinctive visual identity.

## Reviewer B: senior portfolio UX and content-design checklist

### Verified strengths to retain

- Coherent black, cream, lime, and cobalt visual system.
- Strong project visuals and numbered evidence sequence.
- Responsive single-column mobile behavior and useful tablet adaptation.
- Skip link, semantic headings, named navigation control, descriptive evidence links, and final contact routes.
- Clear source, CV, LinkedIn, GitHub, and contact access.

### Required corrections

- [ ] Elevate the direct role proposition without deleting the hero headline.
- [ ] Rebalance first-fold atmosphere and actionable proof rather than adding more decoration.
- [ ] Give the horizontally scrolling contribution rail explicit visual, keyboard, and assistive-technology affordances.
- [ ] Reduce mobile cognitive load for secondary projects while preserving all evidence and links.
- [ ] Use concrete action labels such as `View architecture`, `View release checks`, `View source`, and `Open demo`.
- [ ] Keep mobile secondary text readable; solve remaining density with simplification, not another global font increase.
- [ ] Keep navigation orientation through the existing sticky active-section state; do not add unnecessary interface chrome unless testing proves it is needed.
- [ ] Verify phone, tablet, desktop, breakpoint boundaries, keyboard behavior, reduced motion, no-JavaScript behavior, touch targets, overflow, and serious/critical accessibility findings.

## Joint release gates

- [ ] Static tests encode truthful positioning, status vocabulary, concrete CTA labels, contribution evidence, and the absence of rejected public claims.
- [ ] Browser tests encode contribution controls, keyboard operation, accessible status, mobile density/page-length budget, touch targets, and responsive behavior.
- [ ] Focused tests are observed failing before implementation and passing afterward.
- [ ] Full `npm run check` passes.
- [ ] `git diff --check` passes.
- [ ] Production dependency audit reports no high-severity runtime vulnerabilities.
- [ ] Screenshots at 320, 390, 768, 1024, and 1440 pixels receive visual review.
- [ ] Recruiter and UX reviewers independently re-check the exact final diff and rendered build against their original axes.
- [ ] Source and Pages deployment commits are pushed without force and the exact live deployment is verified.

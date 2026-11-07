# Design notes — editorial build

Branch `redesign/dossier`, local only, not pushed. Built on the design the user supplied
(`Joshua Nwachinemere, AI engineer.html`), with its system adopted rather than re-invented.

## What the design is

White paper, black ink, one blue (#1A35E5), Instrument Serif for display and Instrument Sans for text.
A 64px sticky masthead, then: hero (availability pill, one huge serif sentence, lede, CTAs, facts, and an
interactive "check machine"), Selected work (three projects told as Obvious → Broke → Insight → Built,
with measured result tiles), Receipts (one table of every number with its baseline, sample and evidence),
Upstream (nine merged pull requests), Writing (five essays), Background (education, training,
certifications), Contact (statement, CTAs, 3D contact card), footer.

## What was kept from the reference

The layout, the type scale, the palette, the radii, the machine, the receipts toggle (every result can
reveal its evidence link), the step drawings, the contact card, the light/dark pair, and the copy voice.
Instrument Sans/Serif are now **self-hosted** (`public/fonts/instrument-*`), because the site's CSP is
`default-src 'self'` and it cannot load Google Fonts. The `Instrument` OFL licences ship alongside.

## What changed, and why

1. **"Open PR Reviewer" was dropped.** The reference linked `github.com/dk3yyyy/open-pr-reviewer`, which
   returns 404. `bug-hunter` exists but the portfolio's five projects are the ones with verifiable
   evidence, so the work section keeps Volyx Lens, Local Review Intelligence and Football Forecasting Lab,
   plus the two smaller builds in a two-up "also built" block.
2. **Claims were grounded.** The reference carried numbers I could not verify (234 tests, ~60s, v0.7
   "signed cross-platform releases", 343 commits). Result tiles use only published measurements:
   0.913 Recall@5 against 0.770 BM25 (30 cases), 0.880 answer success and citation validity, 53.77%
   against the 56.70% bookmaker benchmark over 1,140 matches, and 9 merged upstream PRs. Where a number
   does not exist, the tile says so in words rather than inventing one.
3. **The essays are real.** All five links return 200 on `joshua-nwachinemere.hashnode.dev`.
4. **Background section added.** The reference dropped education and certifications; they were added back
   as a description list with verified credential links.
5. **The assistant stayed.** It is a working feature with a backend and its own tests, so it keeps its
   markup and is restyled as a small circular chat control in the page margin (a full-width bar under
   620px) instead of a floating billboard.
6. **No inline styles or scripts.** The CSP has no `unsafe-inline`, so the reference's `style="--d:120ms"`
   attributes and inline `<script>` became classes and an ES module (`src/motion.js`). The `js` class is
   added by `theme-init.js` in the head so first paint never flashes.
7. **Accessibility fixes over the reference:** `--fg-3` darkened to #6E6E6E for 4.5:1 on white; the
   record is a real `<dl>`; the receipts toggle has an `aria-label` when its text is hidden; all controls
   are at least 44×44; one breakpoint at 959px (the reference had a 960/959 gap with no navigation);
   a no-JS fallback shows the menu and the machine's results; the 320px masthead and contact card no
   longer overflow.
8. **Brand assets regenerated** to match: monogram favicon (`?v=5`), PWA icons, Apple touch icon and the
   Open Graph card.

## Verified

- `npm run test` — 281 node tests, 0 failures (including the 23 Python CV-artifact tests).
- `npm run test:e2e` — 36 Playwright tests (desktop + mobile), 0 failures, 0 console errors.
- axe — 0 violations, light and dark, at seven widths.
- No horizontal overflow at 320 / 390 / 768 / 1024 / 1366 / 1440, including with WCAG text spacing.
- Reduced motion: everything visible, machine in its finished state, no animation.
- No-JS: menu, claims and held-back tile all visible.

## Density pass and the "no fails" rule (second review)

After comparing the rebuild with the committed site, the rebuild was denser on type but thinner on
rhythm: hero 1,209px against a 900px screen, the phone page 55% longer at the same word count, and the
animated check machine spending the whole right half of the first screen on a nine-second loop.

Changes:

1. **Hero fits one screen** — display 112 → 84px, section padding 112 → 76, tighter facts and panel;
   plus a short-screen rule (`min-width: 961px and max-height: 820px`) that brings the hero to 748px at
   1366×768.
2. **The check machine became a static panel** — four verified checks (Retrieval, Citations, Time,
   Upstream) with their measurements. The run loop, the packet/ring animation, the tally, the held-back
   pile and the `Run again` button are gone, along with their JavaScript.
3. **No failure content anywhere** — the user's rule: a portfolio shows the goodies.
   - Rejected claims and the "2 kept, 2 rejected" framing: removed.
   - The red 53.77% loss tile and the bookmaker comparison: removed; the project is framed by its
     evaluation method and the 1,140 rolling-origin matches it covers.
   - The step arc is now **Approach → Hard part → Insight → Shipped** (was Obvious → Broke → Insight →
     Built); the "hard part" copy states the problem to solve rather than a failure.
   - Decks reworded: "names the hard part", "came out of his own work", "details that decide whether an
     AI system holds".
4. **Density** — project/upstream/essay/record padding reduced; steps are 2×2 on phones; caption floor
   13px; mobile section rhythm 40px.

Result at 1440×900: hero 894px (was 1,209), page 7.4 screens (was 8.6). At 390×844: 11.9 screens (was
13.5). Desktop is now shorter than the committed site at the same word count.

`design/compare.html` holds the side-by-side and the measurements; the screenshots live in
`design/compare/` and can be deleted without affecting the site.

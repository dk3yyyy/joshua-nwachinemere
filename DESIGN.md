# DESIGN.md — portfolio visual system

Status: current for the 2026 liquid-glass redesign. Source of truth for tokens
is `src/styles.css`; this file records the decisions behind them.

## World

A lit room behind glass. Three slow fields of sand, sage and clay drift on a warm
bone ground; every surface is a translucent sheet with a blurred backdrop and a
bright inner edge. Ink stays near-black and the accent is forest green, so the
material reads as glass rather than a gradient theme.

## Color

| Token | Light | Dark | Use |
|---|---|---|---|
| `--sheet` / html ground | `#f1efe9` | `#0c0f0e` | page ground |
| `--glass` | `rgba(255,255,255,.4)` | `rgba(16,22,19,.6)` | panels |
| `--glass-raised` | `rgba(255,255,255,.58)` | `rgba(22,29,25,.76)` | bars, figures, assistant |
| `--glass-soft` | `rgba(255,255,255,.22)` | `rgba(14,20,32,.34)` | rows, chips |
| `--ink` | `#14181a` | `#f2f3ee` | primary text |
| `--ink-soft` | `#2b332f` | `#d9ded7` | body copy |
| `--muted` | `#4f5a54` | `#e4e9e2` | labels, captions |
| `--accent` | `#1f5c46` | `#8fd0b2` | lines, state |
| `--accent-ink` | `#16402f` | `#b9e6d1` | small accent text |
| `--accent-fill` | `#1f5c46` | `#2f6b52` | filled controls |
| `--accent-3` | `#2f7d5f` | `#6fc3a1` | success, bench marks |

Small accent text uses `--accent-ink`; filled controls use `--accent-fill` so
white labels stay above 4.5:1 in both themes. Ink on every glass field is above
10:1.

## Type

- Display and body: **Archivo** variable, 100–900, self-hosted latin subset.
- Data, labels, numerals: **Azeret Mono**, 400/500.
- Display ceiling 4.7rem; body measure 46–62ch; labels not below 9px.

## Space and shape

Page `min(1240px, 100vw - 48px)`, 16px gutters on phones. Sections 72px desktop,
54px tablet, 40px phone. Radii: 30px sheets, 20px rows, 999px controls. Borders
are 1px translucent white; depth comes from shadow plus the inner edge, never a
hard offset.

## Components

- **Masthead**: floating glass pill, sticky, 60px, with a gradient contact pill.
- **Hero**: glass sheet with a three-line display, gradient phrase, readout
  pills, two actions, availability with a mint status dot.
- **Index**: glass panel on the right, five rows, sheet metadata footer.
- **System rail**: translucent strip, four stations, plotted line and pulse.
- **Project plates**: glass sheet, pill case bar, rounded figure with a glass
  figure chip, text column split into overview, rows, stack, and links.
- **Bench**: dark glass panel with mint controls and marks.
- **Assistant**: glass launcher and panel, gradient seal and submit.
- **Closing**: deep blue-violet gradient block with a glass sheen overlay.

## Motion

Opt-in via `.js-motion`:

1. Three light fields drift on 26–36s cycles.
2. The rail plots once, then a pulse travels the stations every 7.5s.
3. Plates and rows rise 16px on entry, staggered up to five siblings.
4. Figures drift up to 14px against scroll.
5. A 3px gradient line plots reading progress.

`prefers-reduced-motion: reduce` removes all of it and leaves content visible.
No JavaScript means no `.js-motion`, so every element is visible and static.

## States

Hover: lift on plates and rows, brighter glass on nav, accent-ink on links.
Focus: 2px blue ring with 3px offset, 3px in forced colors. Disabled: 0.6
opacity and wait cursor on the assistant submit. Empty: bench shows a dashed
panel line.

## Truth constraints

All figures are the existing verified claims: five projects, nine merged PRs,
five essays, the 30-case evaluation, the 1,140-match evaluation. No invented
metrics, customers, or outcomes.

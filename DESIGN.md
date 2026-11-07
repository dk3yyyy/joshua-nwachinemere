# DESIGN.md — portfolio visual system

Status: current for the 2026 sheet redesign. Source of truth for tokens is
`src/styles.css`; this file records the decisions behind them.

## World

A calibration sheet: cool gray-green paper, near-black ink, one vermilion signal,
and a title block in solid ink. Rules do the structural work; nothing floats on a
shadow. Numbers are measurements, not decoration.

## Color

| Token | Light | Dark | Use |
|---|---|---|---|
| `--sheet` | `#e7e8e1` | `#0c100d` | page ground |
| `--sheet-raised` | `#f1f2ea` | `#141a15` | panels, assistant, figures |
| `--sheet-sunk` | `#d9dbd2` | `#1d241e` | image beds, pressed states |
| `--ink` | `#10140f` | `#e9ece3` | text, rules, filled controls |
| `--ink-soft` | `#2c332c` | `#cdd3c7` | long-form body copy |
| `--muted` | `#545c53` | `#9aa396` | labels, captions |
| `--rule` | `#b8beb1` | `#313a32` | hairlines |
| `--signal` | `#b8371a` | `#ff6a3f` | emphasis, state, active markers |
| `--measure` | `#1d4a68` | `#7fb5d4` | focus rings only |

Signal carries emphasis and state, never large body text. Signal on sheet is
4.73:1 and sheet on signal is 4.73:1, so the filled contact chip is accessible at
its 11px label size.

## Type

- Display and body: **Archivo** variable, 100–900, self-hosted latin subset.
  Display uses 600–620 at -0.05em; body stays at 400.
- Data, labels, numerals: **Azeret Mono**, 400/500, uppercase at 0.07–0.14em.
- Display ceiling: 5.2rem; body measure 46–62ch; no text below 9px except
  decorative figure indices, which carry no information.

## Space and shape

Page: `min(1280px, 100vw - 64px)`, 32px gutters on phones. Sections: 78px desktop,
52px tablet, 40px phone, separated by a 1px ink rule. Corners are square. Borders
are 1px, never a colored left bar. Depth comes from one ink block (title index,
bench, closing), not from card shadows.

## Components

- **Masthead**: 64px, sticky, ink bottom rule. Nav is mono uppercase 11px with a
  drawn underline on hover/current. Contact is a filled signal block.
- **Hero**: three-line display, underlined signal phrase, one-column intro,
  mono readout separated by rules, two square actions, availability with a
  pinging signal dot. The ink title block on the right lists the five sections.
- **System rail**: four stations on a dashed line, plot animation on load, a
  signal pulse that pauses at each seam. Desktop only; the caption names the
  three seams.
- **Project plate**: ruled case bar, 2rem–2.9rem title, figure with a paper
  figure-index chip and 1px caption rule; text column splits into overview,
  definition rows, stack, and mono action links.
- **Bench**: inverted ink panel. Inputs are transparent with an ink border;
  metrics are mono numerals; the bar marks are signal.
- **Assistant**: square ink launcher with a paper seal; panel is a raised sheet
  with an ink header rule and a 400px maximum width.
- **Closing**: full ink block with signal hover on the primary action.

## Motion

One system, opt-in via `.js-motion`:

1. Hero headline enters once with a 20px rise and opacity.
2. The rail plots over 1.7s, then a pulse travels the four stations on a 7.5s
   cycle, pausing at each seam.
3. Section headers, plates, rows, and background entries reveal with a 0.75s
   exponential ease, staggered up to five siblings.
4. Project figures drift up to 14px against scroll.
5. A 2px signal line plots reading progress.

`prefers-reduced-motion: reduce` removes all of it and leaves content visible.
No JavaScript means no `.js-motion`, so every element is visible and static.

## States

Hover: ink inversion on contribution rows, signal on primary actions, drawn
underline on nav, signal color on project titles and links. Focus: 2px measure
ring with 3px offset, 3px in forced colors. Disabled: 0.6 opacity and wait cursor
on the assistant submit. Empty: bench results show a bordered empty line.

## Truth constraints

All figures on the page are the existing verified claims: five projects, nine
merged PRs, five essays, the 30-case evaluation, the 1,140-match evaluation.
No invented metrics, customers, or outcomes.

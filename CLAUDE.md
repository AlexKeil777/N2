# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static HTML/CSS/JavaScript website for the N2 Team's VHP (Vaporized Hydrogen Peroxide) decontamination research project. No build tools, no package manager — files are served directly.

## Running Locally

```bash
python -m http.server 8080
# then open http://localhost:8080
```

Do not open HTML files via `file://` protocol — browser asset-loading restrictions will cause issues.

## Architecture

**Pages**: `index.html`, `mission.html`, `team.html`, `v4_continuous_vs_batch_animation.html`, and `evaporation_calculator.html`. Each page follows the same structure: skip-link → `<header>` with nav → `<main>` → `<footer>`.

**Styles** (`assets/css/styles.css`): Single file using CSS custom properties in `:root` for all theme colors, type, spacing and motion. Pitch-black minimalist theme — true `#000000` stock, warm white ink (`#f2efe9`), a single burnt-amber accent (`#e0742f`), hairline rules, 2px radius, and a lot of space. No background texture, no grid.

A full light variant lives under `:root[data-theme="light"]` — the cream/sienna paper palette the four case-study documents use. It is **not** automatic; switch a page with `<html data-theme="light">`.

House rules encoded in the stylesheet header. These are the point of the design, not incidental:
- No gradients, glows, coloured shadows, or backdrop blur.
- **No monospaced type anywhere in the interface.** `--mono` is a plain system stack and exists only for preformatted numeric output whose columns must line up (the calculator's results dump and its canvas tick labels). Never use it for nav, buttons, labels, headings, or figures — use `.fig` / `font-variant-numeric: tabular-nums` on the sans instead.
- No section numbering (`01 / 02`, `1.1 / 1.2`, `§`), no badges above headings, no document-control stamps.
- Avoid `text-transform: uppercase` in the interface.
- **Every transition is soft.** `--t-fast` is 300ms and `--t-med` 500ms on `--ease` (`cubic-bezier(.22,1,.36,1)`). Nothing snaps. Hovering one entry in a list quiets the others (`:has()`), which is the house hover idiom — see `.pick`, `.nav-links`, `.roster`.
- Every text/background pair clears WCAG AA 4.5:1. Ratios are noted next to the tokens.

Type is a two-face system: `--display` (Fraunces, headings, roster names, picker labels) and `--sans` (Archivo, everything else). Do not reintroduce Inter.

Structure classes: `.sec` (a heading over a hairline, capped at 760px so rules stay near the measure), `.list`, `.docref`, `.roster`, `.pick` (the landing page's list of destinations), `.brand-watermark`/`.n2-mark`. `.card` still exists but is used sparingly.

Breakpoints: 760px (nav rail folds into a top bar, watermark layer hidden), plus 560/600/620/720px for individual components. The case-study pages (`Tiramisu_Calculator_v1_3.html`, `validation_plan.html`, `validation plan da gpt.html`, `user_guide.html`) do not load `styles.css`; they carry their own inline **light paper** themes and have not been converted — roughly 150 hardcoded light values live across their own token systems.

**The vapour transition.** Leaving any page, everything printed on the black boils off; arriving, it condenses back out of it. This is the one piece of motion allowed to be theatrical, and it is the site's signature — do not quietly remove it again.

- *Arrival* is CSS only (`vapor-in`), applied to `.site-header`, `main`, `footer` and `main .container > *` with `nth-child` delays. Fill mode is `backwards`, deliberately: `both` would leave `filter: blur(0)` stuck on every region and keep a compositing layer alive for nothing.
- *Departure* is driven by `main.js`. It marks every **atom** (`ATOM_SELECTOR`) with a randomised `--vd` delay, `--vx` drift and `--vr` rotation, and splits every **heading** (`SPLIT_SELECTOR`) into per-character `.ch` spans with their own `--cd/--cx/--cy/--cr`, so the script comes apart letter by letter instead of sliding away as one piece. Atoms and split headings are disjoint by construction — a heading is filtered out of the atom list before it is split, so the two animations never compound.
- Delays are spread across a **fixed window** (`SPREAD`), so a long page does not take longer to evaporate than a short one. Navigation fires at `NAV_AT` (720ms), by which point the last atoms are nearly invisible.
- Two traps worth remembering: the `html.is-leaving main .container > :not([data-vapor-atom])` reset must keep its `:not()`, because it is more specific than the `[data-vapor-atom]` rule and would otherwise cancel the departure of any atom that is a direct child of a `.container`. And never put a blur filter over a live-animating scene — the simulation page's `.scene` blocks fade with `soft-in`/`soft-out` instead, since filtering them would make every frame pay for a full-canvas blur pass.
- Everything is skipped under `prefers-reduced-motion`, where navigation is immediate.

**JavaScript** (`assets/js/main.js`): Mobile nav toggle (`aria-expanded`, Escape to close), current-page detection by pathname (`.active` + `aria-current`, applied to both `.nav-links a` and `.pick-row`), year stamping via `[data-year]`, injection of the drifting N2 mark layer, and the departure half of the vapour transition (described above). Internal links are also prefetched on hover so the swap lands the moment the animation ends.

The mark layer (`.brand-watermark` / `.n2-mark`) puts 3–4 copies of the brand mark behind the page, drawn as **thin outlines** (stroke-width 10) at 7.5–12.5% opacity. That combination matters: earlier versions used a thick stroke at low opacity, which rendered as large dark-amber masses and lifted the whole page off black. Thin bright lines read as a drawing; thick dim ones read as grey background. Each draws itself in, holds, fades and repeats on a 13–21s cycle with a negative delay so the field is already populated at load. Styling and the `n2-draw` keyframes live in `styles.css`; it is injected only on pages carrying `.site-header`, and hidden below 760px and under `prefers-reduced-motion`. Keep it sparse — it is texture, not an animation competing with the content.

The landing page has its own larger version: `.hero-mark` in `index.html`, drawn once over 2.6s on load and then held.

Removed on purpose, and worth not re-adding: the drifting H₂O₂ molecule layer, and the blur/scale page transition that delayed every internal navigation by 460ms.

The shared header is a fixed vertical left rail with plain sentence-case links; the current page is marked by a short amber rule bled into the rail margin. It collapses to a top bar ≤760px. Layout lives entirely in `styles.css`; page markup is just `.brand`/`.nav-toggle`/`.nav-links`.

**Simulation page** (`v4_continuous_vs_batch_animation.html`): Self-contained — inline CSS and `<script>`, plus the Google Fonts link (its only external dependency). Animates continuous vs. batch VHP processes side-by-side with user controls (chamber length, conveyor speed, takt time, dwell). Edit simulation parameters in the inline `<script>` block at the bottom of that file. It carries its own `:root` copy of the shared dark tokens; if the shared tokens change, mirror them here.

**Evaporation calculator** (`evaporation_calculator.html`): Uses the shared site header/footer + `styles.css`, with calculator-specific UI in an inline `<style>` block and all physics + plotting in an inline `<script>`. JavaScript port of `assets/py/EvapCalculatorAp_v15.py`: Giguère–Maass H₂O₂ vapor pressure, Tetens H₂O, Margules activity coefficients, Hertz-Knudsen (mode A) or simple boundary-layer film (modes B/C/D) flux kernel. The dynamic simulation replaces SciPy's `solve_ivp` with a hand-rolled explicit RK4 (300 steps over 3600 s) on the `[m_H2O2, m_H2O]` state vector. Charts are drawn directly on `<canvas>` (no plotting library) and read their ink from the stylesheet via `ink()` (`--chart-axis`, `--chart-grid`, `--muted`, `--brand`, `--brand-2`, `--brand-3`), so plots follow whichever theme is active. CSV export uses a `Blob` download. The page sits behind a client-side SHA-256 password gate. Linked from `mission.html` (Focus 02 card). Physical constants live at the top of the inline `<script>`.

**Python utility** (`assets/py/EvapCalculatorAp_v15.py`): Original Tkinter desktop app. Kept as the reference implementation for the web calculator above; can still be run standalone with `python assets/py/EvapCalculatorAp_v15.py`. Requires `numpy`, `scipy`, `matplotlib`.

## Key Conventions

- Design tokens (colors, spacing, type, motion) live exclusively in the `:root` blocks of `styles.css`. Do not hard-code colors elsewhere. The spacing scale is `--s-1` through `--s-7`; use it rather than inventing one-off pixel values, but vary it (tight within a group, generous between sections) instead of applying one value everywhere.
- New pages include the skip-link (`<a class="skip-link" href="#main">`), the shared `<header>` rail, and the standard `<footer>`. Add the page to `.nav-links` in *every* page's rail so navigation stays consistent.
- Structure content with `.sec` plus hairline rules and tables, not by wrapping each block in a `.card`.
- Buttons carry text labels only. No dingbat or emoji glyphs as icons.
- `index.html` stays a single-message landing page: the drawn mark, one headline, one line, the `.pick` list of destinations, and the contact form below. Do not grow it into a feature tour. The whole splash is tuned to fit one 900px viewport — if you add to it, re-check that the last choice is still above the fold.
- Decorative images use `alt=""` and `aria-hidden="true"`; interactive elements need visible `:focus-visible` styles.
- External dependencies: only Google Fonts CDN (Archivo, Fraunces). Keep it that way — no npm, no frameworks.

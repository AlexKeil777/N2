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

**Styles** (`assets/css/styles.css`): Single file using CSS custom properties in `:root` for all theme colors and spacing. "Controlled Document" theme — the site is set as a printed engineering datasheet. Warm paper stock (`#f2ede1`) ruled with a faint 26px/130px graph grid, near-black ink (`#1a1612`), burnt-sienna primary (`#9c4221`), pine secondary (`#1f5f52`), hairline rules, 2px radius. This palette deliberately matches the four case-study pages, which already used cream/sienna/Fraunces.

A full dark variant lives under `:root[data-theme="dark"]` — warm dark stock, same inks brightened. It is **not** automatic; switch a page with `<html data-theme="dark">`. `v4_continuous_vs_batch_animation.html` carries its own copy of those dark values (it is standalone) and is the one screen in the set that is dark by design.

House rules encoded in the stylesheet header, worth keeping:
- No gradients, glows, coloured shadows, or backdrop blur.
- Decoration must carry information (rules, section numbers, units).
- Motion only on state change (hover/focus), 160ms or less.
- Every text/background pair clears WCAG AA 4.5:1. Ratios are noted next to the tokens.
- `text-transform: uppercase` is reserved for small mono field labels, never for nav, buttons, or headings.

Type is a three-role system: `--display` (Fraunces, headings), `--sans` (Archivo, body/UI), `--mono` (IBM Plex Mono, labels/data/buttons/nav). Do not reintroduce Inter.

Document furniture instead of cards: `.doc-head` (running head), `.sec`/`.sec-num`/`.sec-body` (numbered sections), `.spec` (specification table), `.docref` (reference index), `.roster` (contributor list), `.list` (hairline-ruled list), `.rail-stamp` (document control block in the nav rail). `.card` still exists but is used sparingly; it is not the default wrapper for content.

Breakpoints: 760px (nav rail folds into a top bar), plus 560/640/720/920px for individual components. The case-study pages (`Tiramisu_Calculator_v1_3.html`, `validation_plan.html`, `validation plan da gpt.html`, `user_guide.html`) do not load `styles.css`; they carry their own inline paper themes.

**JavaScript** (`assets/js/main.js`): Deliberately small (about 50 lines). Mobile nav toggle (`aria-expanded`, Escape to close), current-section detection by pathname (`.active` + `aria-current`), and year stamping via `[data-year]`. Nothing else.

Removed on purpose and listed in the file header so they do not come back: the drifting H₂O₂ molecule layer, the scattered self-drawing N2 watermark field, and the blur/scale page transition that delayed every internal navigation by 460ms.

The shared header is a fixed vertical left rail set as a document index — entries are auto-numbered by a CSS counter, so nav order in the markup determines the numbering. It collapses to a top bar ≤760px. Layout lives entirely in `styles.css`; page markup is just `.brand`/`.nav-toggle`/`.nav-links`/`.rail-stamp`.

**Simulation page** (`v4_continuous_vs_batch_animation.html`): Self-contained — inline CSS and `<script>`, plus the Google Fonts link (its only external dependency). Animates continuous vs. batch VHP processes side-by-side with user controls (chamber length, conveyor speed, takt time, dwell). Edit simulation parameters in the inline `<script>` block at the bottom of that file. It carries its own `:root` copy of the shared dark variant; if the shared tokens change, mirror them here.

**Evaporation calculator** (`evaporation_calculator.html`): Uses the shared site header/footer + `styles.css`, with calculator-specific UI in an inline `<style>` block and all physics + plotting in an inline `<script>`. JavaScript port of `assets/py/EvapCalculatorAp_v15.py`: Giguère–Maass H₂O₂ vapor pressure, Tetens H₂O, Margules activity coefficients, Hertz-Knudsen (mode A) or simple boundary-layer film (modes B/C/D) flux kernel. The dynamic simulation replaces SciPy's `solve_ivp` with a hand-rolled explicit RK4 (300 steps over 3600 s) on the `[m_H2O2, m_H2O]` state vector. Charts are drawn directly on `<canvas>` (no plotting library) and read their ink from the stylesheet via `ink()` (`--chart-axis`, `--chart-grid`, `--muted`, `--brand`, `--brand-2`, `--brand-3`), so plots follow whichever theme is active. CSV export uses a `Blob` download. The page sits behind a client-side SHA-256 password gate. Linked from `mission.html` (Focus 02 card). Physical constants live at the top of the inline `<script>`.

**Python utility** (`assets/py/EvapCalculatorAp_v15.py`): Original Tkinter desktop app. Kept as the reference implementation for the web calculator above; can still be run standalone with `python assets/py/EvapCalculatorAp_v15.py`. Requires `numpy`, `scipy`, `matplotlib`.

## Key Conventions

- Design tokens (colors, spacing, type, motion) live exclusively in the `:root` blocks of `styles.css`. Do not hard-code colors elsewhere. The spacing scale is `--s-1` through `--s-7`; use it rather than inventing one-off pixel values, but vary it (tight within a group, generous between sections) instead of applying one value everywhere.
- New pages include the skip-link (`<a class="skip-link" href="#main">`), the shared `<header>` rail, a `.doc-head` running head, and the standard `<footer>`. Add the page to `.nav-links` in *every* page's rail so the section numbering stays consistent.
- Structure content with `.sec` plus hairline rules and tables, not by wrapping each block in a `.card`.
- Buttons carry text labels only. No dingbat or emoji glyphs as icons.
- Decorative images use `alt=""` and `aria-hidden="true"`; interactive elements need visible `:focus-visible` styles.
- External dependencies: only Google Fonts CDN (Archivo, Fraunces, IBM Plex Mono). Keep it that way — no npm, no frameworks.

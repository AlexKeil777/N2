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

**Styles** (`assets/css/styles.css`): Single file using CSS custom properties in `:root` for all theme colors and spacing. "Lab Datasheet" theme (dark variant) — near-black background (`#09090b`) with a faint light graph-paper grid, bright font (`#f4f2ec`), bright burnt-amber primary accent (`#e2692c`), bright ink-teal secondary accent (`#46b8a6`), hairline rules, boxy low-radius geometry, and IBM Plex Mono for labels/kickers/data. Flat and printed — no glass/blur or glowing gradients. Responsive breakpoints at 640px (mobile) and 1100px (tablet). NOTE: the self-contained pages that don't load `styles.css` (`v4_continuous_vs_batch_animation.html`) and the case-study pages (`Tiramisu_Calculator_v1_3.html`, `validation_plan.html`, `validation plan da gpt.html`, `user_guide.html`) carry their own inline dark themes.

**JavaScript** (`assets/js/main.js`): Handles mobile nav toggle (with `aria-expanded`), active link detection by pathname, page-transition fade animations, and dynamically injects two decorative background layers: animated H₂O₂ molecule SVGs and a scattered field of faded, self-drawing N2 brand marks (`.brand-watermark`/`.n2-mark`, injected only on pages that carry the shared `.site-header`). Both scale density with viewport and respect `prefers-reduced-motion`. Year auto-stamps via `[data-year]` attributes. The shared header is a fixed vertical left rail (collapses to a top bar with hamburger ≤760px); its layout lives entirely in `styles.css` — the page markup (`.brand`/`.nav-toggle`/`.nav-links`) is unchanged.

**Simulation page** (`v4_continuous_vs_batch_animation.html`): Fully self-contained — inline CSS and `<script>` only, no external dependencies. Animates continuous vs. batch VHP processes side-by-side with user controls (chamber length, conveyor speed, takt time, dwell). Edit simulation parameters in the inline `<script>` block at the bottom of that file.

**Evaporation calculator** (`evaporation_calculator.html`): Uses the shared site header/footer + `styles.css`, with calculator-specific UI in an inline `<style>` block and all physics + plotting in an inline `<script>`. JavaScript port of `assets/py/EvapCalculatorAp_v15.py`: Giguère–Maass H₂O₂ vapor pressure, Tetens H₂O, Margules activity coefficients, Hertz-Knudsen (mode A) or simple boundary-layer film (modes B/C/D) flux kernel. The dynamic simulation replaces SciPy's `solve_ivp` with a hand-rolled explicit RK4 (300 steps over 3600 s) on the `[m_H2O2, m_H2O]` state vector. Charts are drawn directly on `<canvas>` (no plotting library); CSV export uses a `Blob` download. Linked from `mission.html` (Focus 02 card). Physical constants live at the top of the inline `<script>`.

**Python utility** (`assets/py/EvapCalculatorAp_v15.py`): Original Tkinter desktop app. Kept as the reference implementation for the web calculator above; can still be run standalone with `python assets/py/EvapCalculatorAp_v15.py`. Requires `numpy`, `scipy`, `matplotlib`.

## Key Conventions

- Design tokens (colors, spacing) live exclusively in the `:root` block of `styles.css` — don't hard-code color values elsewhere.
- New pages must include the skip-link (`<a class="skip-link" href="#main-content">`) and replicate the standard `<header>`/`<footer>` structure from an existing page.
- Decorative images use `alt=""` and `aria-hidden="true"`; interactive elements need visible focus styles.
- External dependencies: only Google Fonts CDN (`Inter` typeface). Keep it that way — no npm, no frameworks.

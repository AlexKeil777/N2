# N2 Team — VHP Decontamination

A static project website for the **N2 Team**, presenting a research effort on **Vaporized Hydrogen Peroxide (VHP) decontamination**. The site introduces the team's mission, the people behind it, an interactive simulation comparing continuous vs. batch process architectures, and an in-browser H₂O₂/H₂O evaporation rate calculator.

---

## ✦ About the project

The N2 Team works on improving VHP-based tub decontamination through two complementary angles:

1. **Process architecture** — moving from large continuous tunnels to a modular, decoupled **batch** approach for better robustness, scalability and graceful handling of interruptions.
2. **Aeration optimization** — accelerating H₂O₂ desorption via aerodynamic and thermodynamic tuning of the chamber design.

The interactive simulation included in the site visualizes both architectures side by side, with controls to inject downstream stops and station failures and observe how each approach copes.

---

## ✦ Repository structure

```
.
├── index.html                              # Landing page
├── mission.html                            # Project mission & focus areas
├── team.html                               # Team members
├── v4_continuous_vs_batch_animation.html   # Interactive process simulation
├── evaporation_calculator.html             # H₂O₂/H₂O evaporation calculator
├── README.md
└── assets/
    ├── css/
    │   └── styles.css                      # "Controlled Document" theme (paper + dark variant)
    ├── js/
    │   └── main.js                         # Nav, current section, revision stamp
    ├── py/
    │   └── EvapCalculatorAp_v15.py         # Reference Tkinter desktop app
    └── images/
        ├── N2.jpg                          # Hero / brand image
        ├── N2_icon.jpg                     # Nav logo
        ├── h2o2.svg                        # Static H₂O₂ molecule asset
        └── video_30sec.mp4                 # 30-second concept video
```

---

## ✦ Tech stack

- Plain **HTML / CSS / JavaScript** — no build step, no framework
- **Fraunces** (headings), **Archivo** (body/UI) and **IBM Plex Mono** (labels and data) via Google Fonts
- Inline **SVG** for the brand mark and the process simulation
- Responsive design with a collapsing nav rail, `prefers-reduced-motion` support, and `:focus-visible` accessibility
- Every text/background pair in the shared theme clears WCAG AA (4.5:1)

---

## ✦ Running locally

The site is fully static — open it in any browser.

**Quick option** (just double-click `index.html`):
> Some browsers restrict relative asset loading from `file://`. If images or fonts don't load, use one of the options below.

**Recommended** — serve it with a local web server. From the project root:

```bash
# Python 3
python -m http.server 8080

# Or Node.js (npx)
npx serve .

# Or PHP
php -S localhost:8080
```

Then open <http://localhost:8080> in your browser.

---

## ✦ Pages

| Page | Purpose |
|---|---|
| `index.html` | Landing page with the team brand and entry points to mission / team |
| `mission.html` | The two focus areas (architecture & aeration) and overall direction |
| `team.html` | Team member profiles and contact entry points |
| `v4_continuous_vs_batch_animation.html` | Interactive side-by-side simulation of continuous vs. batch processes |
| `evaporation_calculator.html` | Interactive H₂O₂/H₂O evaporation rate calculator (static flux + 1 h RK4 simulation, CSV export) |

---

## ✦ Customization

### Theme & colors
The site is set as a printed engineering datasheet. All design tokens live as CSS
custom properties at the top of `assets/css/styles.css`:

```css
:root{
  --bg:      #f2ede1;   /* warm paper stock, ruled with a faint graph grid */
  --panel:   #fbf8f0;   /* sheet laid on the stock */
  --text:    #1a1612;   /* ink */
  --muted:   #574c3f;   /* 7.16:1 on stock */
  --subtle:  #756a5c;   /* 4.53:1 on stock */
  --brand:   #9c4221;   /* burnt sienna */
  --brand-2: #1f5f52;   /* pine */
  --radius:  2px;
  /* …etc */
}
```

Tweak these to retheme the entire site without touching individual rules. Contrast
ratios are noted next to the tokens; keep any replacement at 4.5:1 or better.

**Dark variant.** A fully tuned dark palette lives under `:root[data-theme="dark"]`
in the same file. It is not automatic — switch a page by putting the attribute on
the root element:

```html
<html lang="en" data-theme="dark">
```

The simulation page is the one screen that is dark by default; it carries its own
copy of those values because it is standalone.

**House rules** (documented in the stylesheet header): no gradients, glows, coloured
shadows or backdrop blur; decoration has to carry information; motion only on state
change and 160ms or less; uppercase only on small mono field labels.

### Simulation parameters
The simulation page (`v4_continuous_vs_batch_animation.html`) exposes user-facing controls (chamber length, conveyor speed, takt time, minimum dwell). All other timing/visual tuning is in the inline `<script>` at the bottom of that file.

### Evaporation calculator
`evaporation_calculator.html` is self-contained (inline CSS + JS). It is a JavaScript port of the reference Tkinter app at `assets/py/EvapCalculatorAp_v15.py` — same physics (Giguère–Maass H₂O₂ vapor pressure, Tetens H₂O, Margules activity coefficients, Hertz-Knudsen or boundary-layer flux). The dynamic simulation uses an explicit RK4 integrator (300 steps over 3600 s) in place of SciPy's `solve_ivp`. Charts are drawn directly on `<canvas>` — no plotting library. Physical constants and flux kernels are at the top of the inline `<script>` block; edit there to retune.

The original Tkinter app remains usable as a standalone desktop tool:

```bash
python assets/py/EvapCalculatorAp_v15.py
```

---

## ✦ Accessibility notes

- Skip link to main content on every page
- Mobile nav with proper `aria-expanded` state
- Focus-visible outlines on all buttons
- `prefers-reduced-motion` disables animation and collapses transitions site-wide
- Decorative SVG (the brand mark) carries `aria-hidden="true"`
- The current nav entry is marked with `aria-current="page"`
- Escape closes the mobile nav and returns focus to the control

---

## ✦ License & credits

Project © N2 Team. All rights reserved unless stated otherwise.

For collaboration or partnership inquiries, see the contact details on the **Team** page.
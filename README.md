# N2 Team — VHP Decontamination

A static project website for the **N2 Team**, presenting a research effort on **Vaporized Hydrogen Peroxide (VHP) decontamination**. The site introduces the team's mission, the people behind it, and an interactive simulation comparing continuous vs. batch process architectures.

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
├── v4_continuous_vs_batch_animation.html   # Interactive simulation
├── README.md
└── assets/
    ├── css/
    │   └── styles.css                      # Global pharma-clean theme
    ├── js/
    │   └── main.js                         # Nav + animated H₂O₂ background
    └── images/
        ├── N2.jpg                          # Hero / brand image
        ├── N2_icon.jpg                     # Nav logo
        ├── h2o2.svg                        # Static H₂O₂ molecule asset
        └── video_30sec.mp4                 # 30-second concept video
```

---

## ✦ Tech stack

- Plain **HTML / CSS / JavaScript** — no build step, no framework
- **Inter** font via Google Fonts
- Inline **SVG** for the simulation and the animated molecule background
- Responsive design with mobile nav, `prefers-reduced-motion` support, and `:focus-visible` accessibility

---

## ✦ Running locally

The site is fully static — open it in any browser.

**Quick option** (just double-click `index.html`):
> Some browsers restrict relative asset loading from `file://`. If images don't show or the molecule background looks broken, use one of the options below.

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

---

## ✦ Customization

### Theme & colors
All design tokens live as CSS custom properties at the top of `assets/css/styles.css`:

```css
:root{
  --bg:        #081428;   /* page background */
  --brand:     #5fa8ff;   /* primary blue */
  --brand-2:   #5dd6c5;   /* teal accent */
  --text:      #eef3fb;
  --radius:    14px;
  /* …etc */
}
```

Tweak these to retheme the entire site without touching individual rules.

### Animated H₂O₂ background
Density and motion are controlled in `assets/js/main.js`. The relevant block:

```js
const count = w < 640 ? 7 : w < 1100 ? 11 : 15;   // molecules per viewport
const size  = rand(70, 170);                       // px
const dur   = rand(28, 58);                        // s drift duration
const op    = rand(0.08, 0.18);                    // peak opacity
```

Lower `count` or `op` for a more subtle effect; raise them for more atmosphere.

### Simulation parameters
The simulation page (`v4_continuous_vs_batch_animation.html`) exposes user-facing controls (chamber length, conveyor speed, takt time, minimum dwell). All other timing/visual tuning is in the inline `<script>` at the bottom of that file.

---

## ✦ Accessibility notes

- Skip link to main content on every page
- Mobile nav with proper `aria-expanded` state
- Focus-visible outlines on all buttons
- `prefers-reduced-motion` reduces the molecule background to a static fade-in
- Decorative images (logos, molecule background) have `alt=""` / `aria-hidden`

---

## ✦ License & credits

Project © N2 Team. All rights reserved unless stated otherwise.

For collaboration or partnership inquiries, see the contact details on the **Team** page.
# N2 Team

A static site for the N2 VHP decontamination research project. Plain HTML, CSS and JavaScript; no build step or runtime packages.

## Run locally

From the repository root:

```sh
python -m http.server 8080
```

Open <http://localhost:8080>. A local server is recommended for the password gates, assets and downloads.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Particle N2 mark, project introduction, contact form |
| `mission.html` | Independent chambers, faster aeration, research resources |
| `team.html` | Team and contact links |
| `v4_continuous_vs_batch_animation.html` | Continuous versus batch simulation |
| `evaporation_calculator.html` | Evaporation flux, time simulation, charts and CSV |
| `Tiramisu_Calculator_v1_3.html` | Spoilage and shelf-life research model |
| `user_guide.html` | Calculator reference, with expandable sections |
| `validation_plan.html` | Experimental validation plan |
| `validation plan da gpt.html` | Research review and proposed validation path |

## Design

The noir theme uses black surfaces, silver type, Barlow Condensed headings and Manrope UI text. Google Fonts is the only font dependency; system fallbacks are provided. Semantic chart colors remain distinct.

- `assets/css/styles.css`: shared tokens, fluid layouts, horizontal navigation, home page and contact form.
- `assets/css/research.css`: research tools, reference disclosures, tables and access screens.
- `assets/js/main.js`: navigation, particle logo, cursor wisps, click effects and page transitions.

The home page expands with the window using a two-column stage. Below 760 px it stacks, with a collapsible menu. Dense diagrams and tables scroll within their own regions.

### Motion

`[data-particle-logo]` turns the existing SVG mark into a canvas swarm. Pointer movement repels particles; a press scatters them before they return. The SVG remains as the fallback. Particle counts and display resolution are capped, and the loop pauses when the mark is offscreen or the tab is hidden.

Links, buttons and disclosure controls release a brief vapor effect. Internal page navigation dissolves visible content over approximately 740 ms. Heading copies disperse letter by letter; real text, IDs and form values stay intact. History restoration clears animation state. Modified clicks, downloads, external links and same-page anchors keep their native behavior.

`prefers-reduced-motion` disables decorative motion and makes navigation immediate. Keyboard focus remains visible; the mobile menu supports Escape. Reference anchors open the section they point to.

## Tools and data

The evaporation calculator retains the original flux kernels and RK4 simulation. The Python reference remains at `assets/py/EvapCalculatorAp_v15.py`. The tiramisu model and validation documents retain their scientific data and limitations. Presentation changes do not alter their models.

Existing client-side password gates are retained. They are a convenience gate for static files, not server-side authorization.

The contact form uses FormSubmit with native validation, a honeypot and in-place success/error messages. Its endpoint is configured in `index.html`.

## Checks

Browser checks cover responsive layouts, particle interaction, reduced motion, navigation and history, simulation controls, calculator outputs and CSV export. There is no build step. For script syntax:

```sh
node --check assets/js/main.js
```

Project © N2 Team. All rights reserved unless stated otherwise.

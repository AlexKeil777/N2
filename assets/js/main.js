/* ============================================================
   N2 Team — site script
   - mobile nav toggle
   - active link highlighting
   - animated H2O2 molecule background
   ============================================================ */

(() => {
  // ---------- Mobile nav ----------
  const toggle = document.querySelector('[data-nav-toggle]');
  const links  = document.querySelector('[data-nav-links]');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.getAttribute('data-open') === 'true';
      links.setAttribute('data-open', String(!open));
      links.classList.toggle('open', !open);
      toggle.setAttribute('aria-expanded', String(!open));
    });
  }

  // ---------- Active link ----------
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === path) a.classList.add('active');
  });

  // ---------- Year stamps ----------
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();

/* ============================================================
   Animated H2O2 molecule background
   Generates a fixed layer of drifting molecules behind page content.
   ============================================================ */
(() => {
  // Don't double-inject
  if (document.querySelector('.molecule-bg')) return;

  // Inline SVG markup for one H2O2 molecule (H–O–O–H, simplified)
  const moleculeSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100" aria-hidden="true">
  <defs>
    <radialGradient id="oxyG" cx="35%" cy="35%">
      <stop offset="0%" stop-color="#a5d8ff"/>
      <stop offset="60%" stop-color="#4a9eff"/>
      <stop offset="100%" stop-color="#1f4f9e"/>
    </radialGradient>
    <radialGradient id="hydG" cx="35%" cy="35%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="80%" stop-color="#dbe4f0"/>
      <stop offset="100%" stop-color="#8ea0bc"/>
    </radialGradient>
  </defs>
  <g stroke="#8aa0bd" stroke-width="2.5" stroke-linecap="round" opacity="0.85">
    <line x1="22" y1="22" x2="55" y2="46"/>
    <line x1="55" y1="46" x2="85" y2="46"/>
    <line x1="85" y1="46" x2="118" y2="78"/>
  </g>
  <circle cx="22"  cy="22" r="10" fill="url(#hydG)" stroke="#7e8da5" stroke-width="0.8"/>
  <circle cx="55"  cy="46" r="16" fill="url(#oxyG)" stroke="#1d4d96" stroke-width="0.8"/>
  <circle cx="85"  cy="46" r="16" fill="url(#oxyG)" stroke="#1d4d96" stroke-width="0.8"/>
  <circle cx="118" cy="78" r="10" fill="url(#hydG)" stroke="#7e8da5" stroke-width="0.8"/>
</svg>`;

  function build() {
    // Inject style block in case the page doesn't load styles.css
    // (keeps the simulation page self-sufficient).
    if (!document.getElementById('molecule-bg-style')) {
      const css = `
        .molecule-bg{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
        .molecule{position:absolute;opacity:0;will-change:transform;
          animation:molDrift var(--dur,40s) ease-in-out var(--delay,0s) infinite,
                    molFadeIn 1.2s ease-out var(--fadeDelay,0s) forwards}
        .molecule svg{width:100%;height:auto;display:block;
          filter:drop-shadow(0 0 14px rgba(95,168,255,.18))}
        @keyframes molFadeIn{to{opacity:var(--targetOpacity,.14)}}
        @keyframes molDrift{
          0%,100%{transform:translate(0,0) rotate(var(--rot,0deg))}
          25%{transform:translate(34px,-42px) rotate(calc(var(--rot,0deg) + 90deg))}
          50%{transform:translate(-22px,-66px) rotate(calc(var(--rot,0deg) + 180deg))}
          75%{transform:translate(-44px,-18px) rotate(calc(var(--rot,0deg) + 270deg))}
        }
        @media (prefers-reduced-motion: reduce){
          .molecule{animation:molFadeIn 1s ease-out forwards}
        }
      `;
      const style = document.createElement('style');
      style.id = 'molecule-bg-style';
      style.textContent = css;
      document.head.appendChild(style);
    }

    const bg = document.createElement('div');
    bg.className = 'molecule-bg';
    bg.setAttribute('aria-hidden', 'true');

    // Tune molecule density to viewport (smaller screens get fewer)
    const w = window.innerWidth || 1200;
    const count = w < 640 ? 7 : w < 1100 ? 11 : 15;

    const rand = (min, max) => Math.random() * (max - min) + min;

    for (let i = 0; i < count; i++) {
      const m = document.createElement('div');
      m.className = 'molecule';
      m.innerHTML = moleculeSVG;

      const size = rand(70, 170);                 // px
      const x    = rand(-5, 100);                 // %
      const y    = rand(-5, 100);                 // %
      const dur  = rand(28, 58);                  // s
      const delay= -rand(0, dur);                 // negative -> staggered start
      const rot  = rand(0, 360);                  // deg
      const fade = rand(0, 1.2);                  // s
      const op   = rand(0.08, 0.18);              // peak opacity

      m.style.width  = size + 'px';
      m.style.left   = x + '%';
      m.style.top    = y + '%';
      m.style.setProperty('--dur',   dur + 's');
      m.style.setProperty('--delay', delay + 's');
      m.style.setProperty('--rot',   rot + 'deg');
      m.style.setProperty('--fadeDelay',     fade + 's');
      m.style.setProperty('--targetOpacity', op.toFixed(3));

      bg.appendChild(m);
    }

    document.body.insertBefore(bg, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
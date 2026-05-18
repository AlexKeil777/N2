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
   Page transitions — evaporate-out before navigating
   Pairs with the CSS condense-in animation that runs on load.
   ============================================================ */
(() => {
  let transitioning = false;

  function isInternalNav(a, e) {
    // Skip modifier/middle clicks, target=_blank, etc.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (e.button !== undefined && e.button !== 0) return false;
    if (a.target && a.target !== '' && a.target !== '_self') return false;
    if (a.hasAttribute('download')) return false;

    const href = a.getAttribute('href');
    if (!href) return false;
    if (href.startsWith('#'))      return false;
    if (href.startsWith('mailto:'))return false;
    if (href.startsWith('tel:'))   return false;

    let url;
    try { url = new URL(href, location.href); } catch { return false; }
    if (url.origin !== location.origin) return false;

    // Same-page link — don't animate, let browser handle
    if (url.pathname === location.pathname) return false;

    // Skip non-HTML assets (mp4 video link on mission page, etc.)
    if (!/\.html?$/.test(url.pathname) && url.pathname !== '/' && !url.pathname.endsWith('/')) {
      return false;
    }

    return true;
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    if (transitioning) { e.preventDefault(); return; }
    if (!isInternalNav(a, e)) return;

    e.preventDefault();
    transitioning = true;
    document.body.classList.add('page-leave');

    // Match CSS leave duration (.46s) — give a tiny buffer
    setTimeout(() => { window.location.href = a.href; }, 460);
  });

  // Reset state when returning via back/forward (bfcache restore)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      document.body.classList.remove('page-leave');
      transitioning = false;
    }
  });
})();

 
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

        /* Page transition leave-state (entry animation lives in styles.css
           and applies when present; this fallback ensures every page that
           loads main.js can play the leave animation). */
        body.page-leave main,
        body.page-leave footer,
        body.page-leave .wrap{
          animation:none !important;
          opacity:0;
          filter:blur(20px);
          transform:translateY(-32px) scale(1.05);
          transition:opacity .46s cubic-bezier(.55,.06,.68,.19),
                     filter .46s cubic-bezier(.55,.06,.68,.19),
                     transform .46s cubic-bezier(.55,.06,.68,.19);
        }
        body.page-leave .molecule svg{
          filter:drop-shadow(0 0 22px rgba(95,168,255,.42));
          transition:filter .4s ease;
        }
        @media (prefers-reduced-motion: reduce){
          body.page-leave main,
          body.page-leave footer,
          body.page-leave .wrap{
            filter:none;transform:none;transition:opacity .25s ease;
          }
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

/* ============================================================
   N2 brand watermark field — several faded self-drawing N2 marks
   scattered across the viewport, each drawing in at its own size,
   place and time so they fill the space. Injected only on pages
   that carry the shared header (the self-contained simulation
   page has no .site-header and is intentionally left untouched).
   Styling + the draw animation live in styles.css.
   ============================================================ */
(() => {
  const markSVG = `
<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path pathLength="1000"
        d="M 50 200 L 50 50 L 175 200 L 175 50 C 175 15 320 15 320 85 L 190 200 L 345 200"
        fill="none" stroke-width="36"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  function build() {
    if (!document.querySelector('.site-header')) return;   // shared-header pages only
    if (document.querySelector('.brand-watermark')) return; // don't double-inject

    const layer = document.createElement('div');
    layer.className = 'brand-watermark';
    layer.setAttribute('aria-hidden', 'true');

    const w = window.innerWidth || 1200;
    const count = w < 1100 ? 4 : 6;            // CSS hides the layer < 760px anyway
    const rand = (min, max) => Math.random() * (max - min) + min;

    for (let i = 0; i < count; i++) {
      const mark = document.createElement('div');
      mark.className = 'n2-mark';
      mark.innerHTML = markSVG;

      const size = rand(220, 520);             // px
      const x    = rand(-6, 86);               // %  (some bleed off-edge)
      const y    = rand(-4, 78);               // %
      const dur  = rand(6.5, 11);              // s
      const delay= -rand(0, dur);              // negative -> staggered, space filled at load
      const peak = rand(0.05, 0.13);           // faint, varied

      mark.style.left = x + '%';
      mark.style.top  = y + '%';
      mark.style.setProperty('--size',  size + 'px');
      mark.style.setProperty('--dur',   dur + 's');
      mark.style.setProperty('--delay', delay + 's');
      mark.style.setProperty('--peak',  peak.toFixed(3));

      layer.appendChild(mark);
    }

    // Sits behind page content (z-index handled in CSS); placed first
    // so it renders behind the drifting molecule layer too.
    document.body.insertBefore(layer, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
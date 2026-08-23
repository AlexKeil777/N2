/* ============================================================
   N2 Team — site script
   ------------------------------------------------------------
   1. nav (toggle, current page)
   2. year stamp
   3. the drifting N2 mark layer
   4. the vapour transition between pages
   ============================================================ */

(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ==========================================================
     1. Nav
     ========================================================== */
  const toggle = document.querySelector('[data-nav-toggle]');
  const links  = document.querySelector('[data-nav-links]');

  if (toggle && links) {
    const setOpen = (open) => {
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a, .pick-row').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === here) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
  });

  /* ==========================================================
     2. Year
     ========================================================== */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  /* ==========================================================
     3. Drifting N2 marks
     ----------------------------------------------------------
     Three or four large, very faint copies of the brand mark
     that draw themselves in, hold, fade and repeat. Sparse and
     slow on purpose: texture, not an animation competing with
     the content. Hidden below 760px and under reduced motion
     (both handled in styles.css).
     ========================================================== */
  const MARK = `
<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path pathLength="1000"
        d="M 50 200 L 50 50 L 175 200 L 175 50 C 175 15 320 15 320 85 L 190 200 L 345 200"
        fill="none" stroke-width="10"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  function buildMarks() {
    // The mark styles live in styles.css. On a page that doesn't load it
    // (the self-contained simulation) these would drop into the flow as
    // raw SVGs, so gate on the stylesheet, not on the header.
    if (!document.querySelector('link[href*="styles.css"]')) return;
    if (document.querySelector('.brand-watermark')) return; // don't double-inject

    const layer = document.createElement('div');
    layer.className = 'brand-watermark';
    layer.setAttribute('aria-hidden', 'true');

    const w     = window.innerWidth || 1200;
    const count = w < 1100 ? 3 : 4;
    const rand  = (min, max) => Math.random() * (max - min) + min;

    for (let i = 0; i < count; i++) {
      const mark = document.createElement('div');
      mark.className = 'n2-mark';
      mark.innerHTML = MARK;
      mark.style.left = rand(-6, 82) + '%';
      mark.style.top  = rand(-4, 74) + '%';
      mark.style.setProperty('--size', rand(210, 360) + 'px');

      // Long cycles, negative delays so the field is already
      // populated at load instead of starting from empty.
      const dur = rand(14, 22);
      mark.style.setProperty('--dur',   dur + 's');
      mark.style.setProperty('--delay', -rand(0, dur) + 's');
      mark.style.setProperty('--peak',  rand(0.075, 0.125).toFixed(3));

      layer.appendChild(mark);
    }
    document.body.insertBefore(layer, document.body.firstChild);
  }

  /* ==========================================================
     4. The vapour transition
     ----------------------------------------------------------
     Leaving a page, everything printed on the black boils off:

       - headings are split into per-character spans, and each
         letter rises, spreads, spins a little and blurs out on
         its own delay, so the script comes apart rather than
         sliding away as one piece
       - every other atom (paragraphs, list rows, buttons, nav
         entries, the mark, footer text) lifts and thins out on
         its own randomised delay and horizontal drift
       - the whole thing is spread over a fixed window, so a long
         page does not take longer to evaporate than a short one

     The character split happens at click time, not on load: it
     costs nothing until it is needed and never reaches assistive
     tech, since the page is on its way out by then.
     ========================================================== */

  const OUT_MS    = 560;   // must match --vapor-out in styles.css
  const SPREAD    = 220;   // window across which atom delays are spread
  const JITTER    = 70;
  const NAV_AT    = 720;   // navigate once the page is essentially gone

  // Atoms and split headings are disjoint: a heading is removed from
  // the atom list before it is split, so the two never compound.
  const ATOM_SELECTOR = [
    '.site-header .brand',
    '.site-header .nav-links a',
    '.site-header .nav-toggle',
    'main h1', 'main h2', 'main h3',
    'main p',
    'main .hero-mark',
    'main .list li',
    'main .pick-row',
    'main .roster-row',
    'main .docref tr',
    'main .btn',
    'main .contact-form',
    'main .card',
    'footer .tiny', '.footer .tiny'
  ].join(',');

  const SPLIT_SELECTOR = 'main h1, main h2';

  const rand = (min, max) => Math.random() * (max - min) + min;

  /* Wrap every character in its own span, preserving inline
     elements (the hero headline contains a <span class="fig">)
     and word boundaries, so lines still wrap normally. */
  function splitChars(el) {
    if (el.dataset.split === '1') return;
    el.dataset.split = '1';

    const walk = (node) => {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const value = child.nodeValue;
          if (!value.trim()) return;

          const frag = document.createDocumentFragment();
          value.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            const word = document.createElement('span');
            word.className = 'word';
            // spread iterates code points, so ₂ and × survive intact
            Array.from(part).forEach(chr => {
              const s = document.createElement('span');
              s.className = 'ch';
              s.textContent = chr;
              word.appendChild(s);
            });
            frag.appendChild(word);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(el);
  }

  let leaving = false;

  function evaporate(done) {
    if (leaving) return;
    leaving = true;

    const split = Array.from(document.querySelectorAll(SPLIT_SELECTOR));
    const atoms = Array.from(document.querySelectorAll(ATOM_SELECTOR))
      .filter(el => !split.includes(el));

    // Blocks: lift, drift sideways, tip fractionally, blur out.
    const lastAtom = Math.max(atoms.length - 1, 1);
    atoms.forEach((el, i) => {
      el.setAttribute('data-vapor-atom', '');
      el.style.setProperty('--vd', Math.round((i / lastAtom) * SPREAD + rand(0, JITTER)) + 'ms');
      el.style.setProperty('--vx', rand(-13, 13).toFixed(1) + 'px');
      el.style.setProperty('--vr', rand(-1.3, 1.3).toFixed(2) + 'deg');
    });

    // Headings: each letter goes on its own, rippling left to right.
    split.forEach(el => {
      splitChars(el);
      const chars = el.querySelectorAll('.ch');
      const last  = Math.max(chars.length - 1, 1);
      chars.forEach((c, i) => {
        c.style.setProperty('--cd', Math.round((i / last) * 240 + rand(0, 130)) + 'ms');
        c.style.setProperty('--cx', rand(-17, 17).toFixed(1) + 'px');
        c.style.setProperty('--cy', Math.round(rand(-96, -42)) + 'px');
        c.style.setProperty('--cr', rand(-9, 9).toFixed(1) + 'deg');
      });
    });

    // Force layout so the animations start from the state above.
    void document.body.offsetHeight;
    document.documentElement.classList.add('is-leaving');

    setTimeout(done, NAV_AT);
  }

  /* ---------- which clicks get the transition ---------- */
  function isInternalNav(a, e) {
    if (e.defaultPrevented) return false;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (e.button !== undefined && e.button !== 0) return false;
    if (a.target && a.target !== '' && a.target !== '_self') return false;
    if (a.hasAttribute('download')) return false;

    const href = a.getAttribute('href');
    if (!href) return false;
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;

    let url;
    try { url = new URL(href, location.href); } catch { return false; }
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname) return false;      // same page, let the hash work

    // only real pages evaporate — not the mp4, not other assets
    const last = url.pathname.split('/').pop();
    if (last && last.indexOf('.') !== -1 && !/\.html?$/i.test(last)) return false;

    return true;
  }

  function wireTransitions() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      if (leaving) { e.preventDefault(); return; }
      if (!isInternalNav(a, e)) return;

      e.preventDefault();
      const dest = a.href;

      if (reduced.matches) { location.href = dest; return; }
      evaporate(() => { location.href = dest; });
    });

    // Warm the next page on hover so the swap lands the moment
    // the animation ends rather than after a round trip.
    const prefetched = new Set();
    document.addEventListener('mouseover', (e) => {
      const a = e.target.closest('a');
      if (!a || !isInternalNav(a, { button: 0 })) return;
      if (prefetched.has(a.href)) return;
      prefetched.add(a.href);
      const link = document.createElement('link');
      link.rel  = 'prefetch';
      link.href = a.href;
      document.head.appendChild(link);
    }, { passive: true });

    // Coming back through history, the page is restored mid-fade.
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        document.documentElement.classList.remove('is-leaving');
        document.querySelectorAll('[data-vapor-atom]').forEach(el => {
          el.removeAttribute('data-vapor-atom');
          el.style.removeProperty('--vd');
          el.style.removeProperty('--vx');
          el.style.removeProperty('--vr');
        });
        leaving = false;
      }
    });
  }

  /* ==========================================================
     Go
     ========================================================== */
  function init() {
    buildMarks();
    wireTransitions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

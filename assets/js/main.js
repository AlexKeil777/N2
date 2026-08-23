/* ============================================================
   N2 Team — site script
   ------------------------------------------------------------
   Nav, current section, year stamp, and the drifting N2 mark
   layer. Nothing else: no page-transition animation, no
   molecule field.
   ============================================================ */

(() => {
  // ---------- Mobile nav ----------
  const toggle = document.querySelector('[data-nav-toggle]');
  const links  = document.querySelector('[data-nav-links]');

  if (toggle && links) {
    const setOpen = (open) => {
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
    };

    toggle.addEventListener('click', () => {
      setOpen(!links.classList.contains('open'));
    });

    // Escape closes the panel and returns focus to the control.
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  // ---------- Current page ----------
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === path) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
  });

  // ---------- Year ----------
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();

/* ============================================================
   Drifting N2 marks
   ------------------------------------------------------------
   A few large, very faint copies of the brand mark that draw
   themselves in, hold, fade, and repeat. Kept sparse and slow
   on purpose: it should read as texture, not as an animation
   competing with the content.

   The layer is injected only on pages carrying the shared
   header, sits at z-index 0 behind everything, and is hidden
   below 760px and under prefers-reduced-motion (both in CSS).
   ============================================================ */
(() => {
  const MARK = `
<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path pathLength="1000"
        d="M 50 200 L 50 50 L 175 200 L 175 50 C 175 15 320 15 320 85 L 190 200 L 345 200"
        fill="none" stroke-width="30"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  function build() {
    if (!document.querySelector('.site-header')) return;    // shared-header pages only
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

      mark.style.left = rand(-8, 84) + '%';
      mark.style.top  = rand(-6, 76) + '%';
      mark.style.setProperty('--size', rand(260, 560) + 'px');

      // Long cycles, negative delays so the field is already
      // populated at load instead of starting from empty.
      const dur = rand(13, 21);
      mark.style.setProperty('--dur',   dur + 's');
      mark.style.setProperty('--delay', -rand(0, dur) + 's');
      mark.style.setProperty('--peak',  rand(0.04, 0.085).toFixed(3));

      layer.appendChild(mark);
    }

    document.body.insertBefore(layer, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();

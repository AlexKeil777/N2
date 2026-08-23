/* ============================================================
   N2 Team — site script
   ------------------------------------------------------------
   Deliberately small. Everything this file does is either a
   state change the user asked for (opening the nav) or a fact
   the page needs (which section is current, what year it is).

   Removed on purpose, and worth not re-adding:
     - the drifting H2O2 molecule layer
     - the scattered self-drawing N2 watermark field
     - the blur/scale page-transition, which delayed every
       internal navigation by 460ms to play an animation
   ============================================================ */

(() => {
  // ---------- Mobile nav ----------
  const toggle = document.querySelector('[data-nav-toggle]');
  const links  = document.querySelector('[data-nav-links]');

  if (toggle && links) {
    const setOpen = (open) => {
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Index';
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

  // ---------- Current section ----------
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === path) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
  });

  // ---------- Revision stamp ----------
  const now = new Date();
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = now.getFullYear();
  });
  // Document-control revision, e.g. 2026.08 — never hand-written, so it
  // cannot go stale in the rail while the year stamp stays correct.
  const rev = now.getFullYear() + '.' + String(now.getMonth() + 1).padStart(2, '0');
  document.querySelectorAll('[data-rev]').forEach(el => {
    el.textContent = rev;
  });
})();

/* N2 — a mark made of vapor. Native controls stay native. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)');
  const random = (a, b) => a + Math.random() * (b - a);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const motionListeners = [];
  const animations = [];
  const clones = [];
  let leaving = false, timer = 0, departure = null;

  function navigation() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const links = document.querySelector('[data-nav-links]');
    if (toggle && links) {
      const setOpen = open => {
        links.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.textContent = open ? 'Close' : 'Menu';
      };
      toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && links.classList.contains('open')) {
          setOpen(false); toggle.focus();
        }
      });
      document.addEventListener('click', event => {
        if (!event.target.closest('.nav') || event.target.closest('[data-nav-links] a')) setOpen(false);
      });
      const desktop = matchMedia('(min-width: 761px)');
      desktop.addEventListener('change', () => { if (desktop.matches) setOpen(false); });
    }
    const normalize = path => decodeURIComponent(path).replace(/\/index\.html$/i, '/');
    document.querySelectorAll('.nav-links a, .pick-row[href]').forEach(link => {
      if (normalize(new URL(link.href, location.href).pathname) === normalize(location.pathname)) {
        link.classList.add('active'); link.setAttribute('aria-current', 'page');
      }
    });
    document.querySelectorAll('[data-year]').forEach(element => { element.textContent = new Date().getFullYear(); });
  }

  function particleLogo(host) {
    const path = host.querySelector('svg path');
    if (!path || typeof Path2D === 'undefined') return;
    const canvas = document.createElement('canvas');
    canvas.className = 'particle-canvas'; canvas.setAttribute('aria-hidden', 'true');
    const context = canvas.getContext('2d');
    const mask = document.createElement('canvas');
    mask.width = 400; mask.height = 240;
    const ink = mask.getContext('2d', { willReadFrequently: true });
    if (!context || !ink) return;
    try {
      ink.strokeStyle = '#fff'; ink.lineWidth = 28;
      ink.lineCap = ink.lineJoin = 'round';
      ink.stroke(new Path2D(path.getAttribute('d')));
    } catch (_) { return; }
    const pixels = ink.getImageData(0, 0, 400, 240).data;
    host.appendChild(canvas);
    let width = 0, height = 0, frame = 0, previous = 0, time = 0, visible = true;
    let points = [], dust = [];
    const pointer = { x: -1000, y: -1000, active: false };
    const stop = () => { cancelAnimationFrame(frame); frame = previous = 0; };
    const fallback = () => {
      stop(); canvas.hidden = true; host.classList.remove('particle-ready');
    };
    const resume = () => {
      if (!frame && visible && !document.hidden && !reduced.matches && width) {
        canvas.hidden = false; host.classList.add('particle-ready'); frame = requestAnimationFrame(draw);
      }
    };
    function resize() {
      const bounds = host.getBoundingClientRect();
      const w = Math.round(bounds.width), h = Math.round(bounds.height);
      if (!w || !h || (w === width && h === height && points.length)) return;
      width = w; height = h;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const scale = Math.min(w / 400, h / 240) * 0.92;
      const ox = (w - 400 * scale) / 2, oy = (h - 240 * scale) / 2;
      const step = w < 480 ? 5.4 : 3.8;
      points = [];
      for (let y = 6; y < 236; y += step) {
        for (let x = 6; x < 396; x += step) {
          const mx = clamp(Math.round(x + random(-1.2, 1.2)), 0, 399);
          const my = clamp(Math.round(y + random(-1.2, 1.2)), 0, 239);
          if (pixels[(my * 400 + mx) * 4 + 3] < 100) continue;
          const hx = mx * scale + ox, hy = my * scale + oy;
          points.push({ hx, hy, x: hx + random(-55, 55), y: hy + random(-65, 65), vx: 0, vy: 0,
            phase: random(0, 6.28), radius: random(0.55, 1.35) * clamp(scale, 0.85, 1.3), alpha: random(0.35, 0.97) });
        }
      }
      dust = Array.from({ length: w < 480 ? 40 : 85 }, () => ({ x: random(0, w), y: random(0, h),
        radius: random(0.4, 1.1), speed: random(0.08, 0.3), phase: random(0, 6.28), alpha: random(0.07, 0.3) }));
      if (!reduced.matches) {
        canvas.hidden = false; paint(1); host.classList.add('particle-ready'); resume();
      }
    }
    function paint(delta) {
      context.clearRect(0, 0, width, height); context.fillStyle = '#eff0f2';
      const radius = clamp(width * 0.18, 65, 140);
      for (const p of points) {
        const dx = p.x - pointer.x, dy = p.y - pointer.y, distanceSquared = dx * dx + dy * dy;
        if (pointer.active && distanceSquared < radius * radius) {
          const distance = Math.sqrt(distanceSquared) || 1, force = (1 - distance / radius) * 1.8;
          p.vx += dx / distance * force * delta; p.vy += dy / distance * force * delta;
        }
        const drift = Math.sin(time * 0.0007 + p.phase);
        p.vx += (p.hx + drift * 1.3 - p.x) * 0.021 * delta;
        p.vy += (p.hy + Math.cos(time * 0.0005 + p.phase) * 1.3 - p.y) * 0.021 * delta;
        p.vx *= Math.pow(0.86, delta); p.vy *= Math.pow(0.86, delta);
        p.x += p.vx * delta; p.y += p.vy * delta;
        context.globalAlpha = p.alpha * (0.86 + drift * 0.14);
        context.beginPath(); context.arc(p.x, p.y, p.radius, 0, Math.PI * 2); context.fill();
      }
      for (const p of dust) {
        p.y -= p.speed * delta; p.x += Math.sin(time * 0.0003 + p.phase) * 0.12 * delta;
        if (p.y < 0) p.y = height;
        context.globalAlpha = p.alpha;
        context.beginPath(); context.arc(p.x, p.y, p.radius, 0, Math.PI * 2); context.fill();
      }
      context.globalAlpha = 1;
    }
    function draw(timestamp) {
      frame = 0;
      if (reduced.matches) { fallback(); return; }
      if (!visible || document.hidden) return;
      const delta = previous ? clamp((timestamp - previous) / 16.67, 0.3, 2) : 1;
      previous = timestamp; time += delta * 16.67; paint(delta); frame = requestAnimationFrame(draw);
    }
    function pointAt(event) {
      if (reduced.matches) { fallback(); return; }
      const bounds = host.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left; pointer.y = event.clientY - bounds.top; pointer.active = true;
      resume();
    }
    host.addEventListener('pointermove', pointAt, { passive: true });
    host.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });
    host.addEventListener('pointerdown', event => {
      if (reduced.matches) return;
      pointAt(event);
      for (const p of points) {
        const dx = p.x - pointer.x, dy = p.y - pointer.y, distance = Math.hypot(dx, dy) || 1;
        const force = Math.max(0, 1 - distance / Math.max(200, width * 0.65)) * 15;
        p.vx += dx / distance * force; p.vy += dy / distance * force;
      }
    }, { passive: true });
    host.addEventListener('pointerup', event => { if (event.pointerType !== 'mouse') pointer.active = false; }, { passive: true });
    host.addEventListener('pointercancel', () => { pointer.active = false; }, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
    else addEventListener('resize', resize, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; if (visible) resume(); else stop();
    }, { rootMargin: '60px' }).observe(host);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else resume(); });
    addEventListener('pagehide', stop); addEventListener('pageshow', resume);
    motionListeners.push(() => {
      if (reduced.matches) fallback();
      else {
        canvas.hidden = false;
        if (points.length) { paint(1); host.classList.add('particle-ready'); resume(); }
        else resize();
      }
    });
    resize(); if (reduced.matches) canvas.hidden = true;
  }

  // A transient canvas: no idle render loop, and a capped budget on touch devices.
  function vapor() {
    const canvas = document.createElement('canvas'); canvas.className = 'vapor-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const context = canvas.getContext('2d');
    if (!context) return { burst() {} };
    document.body.appendChild(canvas);
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 64;
    const ink = sprite.getContext('2d'), gradient = ink.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(240,243,248,.65)');
    gradient.addColorStop(0.25, 'rgba(224,230,239,.23)'); gradient.addColorStop(1, 'rgba(220,227,237,0)');
    ink.fillStyle = gradient; ink.fillRect(0, 0, 64, 64);
    let particles = [], frame = 0, previous = 0, width = 0, height = 0, lastX = -1000, lastY = -1000, lastTrail = 0;
    function resize() {
      width = innerWidth; height = innerHeight;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    function clear() {
      cancelAnimationFrame(frame); frame = previous = 0; particles = []; context.clearRect(0, 0, width, height);
    }
    function draw(timestamp) {
      frame = 0;
      if (document.hidden || reduced.matches) { clear(); return; }
      const delta = previous ? clamp((timestamp - previous) / 16.67, 0.3, 2.5) : 1;
      previous = timestamp; context.clearRect(0, 0, width, height);
      particles = particles.filter(p => p.life > 0);
      for (const p of particles) {
        p.life -= delta; p.x += p.vx * delta; p.y += p.vy * delta;
        p.vx += Math.sin(p.life * 0.08 + p.phase) * 0.014 * delta; p.vy -= 0.009 * delta;
        const progress = Math.max(0, p.life / p.total), size = p.size * (2 - progress);
        context.globalAlpha = progress * p.alpha;
        if (p.spark) { context.fillStyle = '#e9edf2'; context.fillRect(p.x, p.y, 1.2, 1.2); }
        else context.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
      }
      context.globalAlpha = 1;
      if (particles.length) frame = requestAnimationFrame(draw); else previous = 0;
    }
    function burst(x, y, count = 30, spread = 24) {
      if (reduced.matches || document.hidden) return;
      const budget = fine.matches ? 180 : 90;
      for (let i = 0; i < count; i++) {
        const life = random(28, 62);
        particles.push({ x: x + random(-spread, spread), y: y + random(-spread * 0.3, spread * 0.3),
          vx: random(-0.65, 0.65), vy: random(-1.8, -0.3), size: random(14, 45), alpha: random(0.2, 0.65),
          life, total: life, phase: random(0, 6.28), spark: i % 4 === 0 });
      }
      if (particles.length > budget) particles.splice(0, particles.length - budget);
      if (!frame) frame = requestAnimationFrame(draw);
    }
    document.addEventListener('pointermove', event => {
      if (!fine.matches || reduced.matches || leaving || event.pointerType === 'touch') return;
      if (event.timeStamp - lastTrail < 35 || Math.hypot(event.clientX - lastX, event.clientY - lastY) < 9) return;
      lastTrail = event.timeStamp; lastX = event.clientX; lastY = event.clientY; burst(lastX, lastY, 2, 4);
    }, { passive: true });
    addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
    addEventListener('pagehide', clear); motionListeners.push(() => { if (reduced.matches) clear(); });
    resize(); return { burst };
  }

  function visible(element) {
    const r = element.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth &&
      getComputedStyle(element).visibility !== 'hidden';
  }
  function animate(element, keyframes, options) {
    const animation = element.animate(keyframes, options); animations.push(animation); return animation;
  }
  // Animate disposable visual copies: document text, focus, IDs, and form state are untouched.
  function dissolveHeading(element) {
    const rect = element.getBoundingClientRect(), computed = getComputedStyle(element), clone = element.cloneNode(true);
    clone.removeAttribute('id'); clone.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'));
    clone.setAttribute('aria-hidden', 'true'); clone.classList.add('vapor-heading');
    for (const property of ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontStretch', 'lineHeight',
      'letterSpacing', 'wordSpacing', 'textAlign', 'textTransform', 'color', 'padding']) clone.style[property] = computed[property];
    Object.assign(clone.style, { position: 'fixed', left: rect.left + 'px', top: rect.top + 'px',
      width: rect.width + 'px', height: rect.height + 'px', margin: '0', maxWidth: 'none', zIndex: '95',
      pointerEvents: 'none', animation: 'none' });
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT), textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    for (const node of textNodes) {
      if (!node.nodeValue.trim()) continue;
      const fragment = document.createDocumentFragment();
      for (const part of node.nodeValue.split(/(\s+)/)) {
        if (!part || /^\s+$/.test(part)) { fragment.appendChild(document.createTextNode(part)); continue; }
        const word = document.createElement('span'); word.style.cssText = 'display:inline-block;white-space:nowrap';
        for (const letter of part) {
          const character = document.createElement('span'); character.className = 'vapor-letter';
          character.style.display = 'inline-block'; character.textContent = letter; word.appendChild(character);
        }
        fragment.appendChild(word);
      }
      node.replaceWith(fragment);
    }
    document.body.appendChild(clone); clones.push(clone);
    animate(element, [{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: 'forwards' });
    const characters = clone.querySelectorAll('.vapor-letter');
    characters.forEach((character, index) => animate(character, [
      { opacity: 1, transform: 'translate3d(0,0,0)', filter: 'blur(0px)' }, { opacity: 0.55, offset: 0.35 },
      { opacity: 0, transform: `translate3d(${random(-22, 22)}px,${random(-110, -45)}px,0) rotate(${random(-9, 9)}deg) scale(1.2)`, filter: 'blur(7px)' }
    ], { duration: random(430, 550), delay: index / Math.max(1, characters.length) * 150 + random(0, 45),
      easing: 'cubic-bezier(.3,0,.65,1)', fill: 'forwards' }));
  }
  function restore() {
    clearTimeout(timer); animations.splice(0).forEach(animation => animation.cancel());
    clones.splice(0).forEach(clone => clone.remove()); document.documentElement.classList.remove('is-leaving');
    leaving = false; departure = null;
  }
  function evaporate(destination, atmosphere) {
    if (leaving) return;
    leaving = true; departure = () => { location.href = destination; };
    // A visual failure cannot leave navigation waiting for an animation event.
    timer = setTimeout(() => { if (departure) departure(); }, 740);
    try {
      const selector = ['.site-header .brand', '.site-header .nav-links', '.site-header .nav-toggle',
        '.hero-mark', 'main p', 'main h3', 'main ul', 'main ol', 'main table', 'main form', 'main .cta-row',
        'main .roster', 'main .calc-panel', 'main .card', 'main details', '.scene', '.doc-head', '.hud', '.scoreboard',
        '.wrap p', '.wrap table', '.wrap details', '.wrap .panel', '.wrap .card', '.portal-strip', '.landing-links',
        '.hero-meta', '.destination-strip', '.research-nav', 'footer', '.footer'].join(',');
      const candidates = Array.from(document.querySelectorAll(selector)).filter(visible);
      const atoms = candidates.filter(element => !candidates.some(other => other !== element && other.contains(element))).slice(0, 75);
      Array.from(document.querySelectorAll('h1, h2')).filter(element => visible(element) && !atoms.some(atom => atom.contains(element)))
        .slice(0, 6).forEach(dissolveHeading);
      atoms.forEach((element, index) => {
        const live = element.matches('.scene, .hero-mark') || element.querySelector('canvas, svg');
        const frames = [{ opacity: 1, transform: 'translate3d(0,0,0)' },
          { opacity: 0, transform: `translate3d(${random(-14, 14)}px,${random(-48, -24)}px,0)` }];
        if (!live) { frames[0].filter = 'blur(0px)'; frames[1].filter = 'blur(9px)'; }
        animate(element, frames, { duration: 510, delay: index / Math.max(atoms.length, 1) * 150,
          easing: 'cubic-bezier(.35,0,.7,1)', fill: 'forwards' });
        const rect = element.getBoundingClientRect();
        if (index < 10) atmosphere.burst(rect.left + rect.width * 0.5, clamp(rect.top + rect.height * 0.45, 0, innerHeight),
          10, Math.min(130, rect.width * 0.4));
      });
      const roots = Array.from(document.querySelectorAll('main, .wrap, .site-header, footer, .footer'));
      roots.filter(element => !roots.some(other => other !== element && other.contains(element)))
        .forEach(element => animate(element, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, delay: 500, fill: 'forwards' }));
      document.documentElement.classList.add('is-leaving');
    } catch (_) { restore(); location.href = destination; }
  }
  function internalNavigation(link, event) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
      (event.button !== undefined && event.button !== 0) || link.hasAttribute('download')) return false;
    const target = link.getAttribute('target') || document.querySelector('base[target]')?.target;
    if (target && target !== '_self') return false;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return false;
    let url; try { url = new URL(href, location.href); } catch (_) { return false; }
    if (!['http:', 'https:', 'file:'].includes(url.protocol) || url.origin !== location.origin) return false;
    if (url.pathname === location.pathname && url.search === location.search) return false;
    const name = url.pathname.split('/').pop(); return !name || !name.includes('.') || /\.html?$/i.test(name);
  }
  function wireInteractions(atmosphere) {
    document.addEventListener('click', event => {
      const control = event.target.closest('a, button, summary, input[type="checkbox"], input[type="radio"]');
      if (!control || control.disabled || event.defaultPrevented) return;
      if (!reduced.matches) {
        const bounds = control.getBoundingClientRect();
        atmosphere.burst(event.detail ? event.clientX : bounds.left + bounds.width / 2,
          event.detail ? event.clientY : bounds.top + bounds.height / 2, fine.matches ? 36 : 20, Math.min(bounds.width * 0.4, 65));
        if (control.matches('button, summary') && !control.matches('.film-play') && typeof control.animate === 'function') control.animate([
          { opacity: 1, filter: 'blur(0px)' }, { opacity: 0.35, filter: 'blur(3px)', offset: 0.35 },
          { opacity: 1, filter: 'blur(0px)' }
        ], { duration: 500, easing: 'ease-out' });
      }
      if (!control.matches('a') || !internalNavigation(control, event) || reduced.matches || typeof control.animate !== 'function') return;
      event.preventDefault(); if (!leaving) evaporate(control.href, atmosphere);
    });
    const prefetched = new Set();
    document.addEventListener('pointerover', event => {
      const link = event.target.closest('a');
      if (!link || !internalNavigation(link, {}) || prefetched.has(link.href) || prefetched.size >= 10) return;
      prefetched.add(link.href);
      const hint = document.createElement('link'); hint.rel = 'prefetch'; hint.href = link.href; document.head.appendChild(hint);
    }, { passive: true });
    addEventListener('pageshow', restore); addEventListener('pagehide', restore);
  }
  function init() {
    document.documentElement.classList.add('js');
    navigation(); document.querySelectorAll('[data-particle-logo]').forEach(particleLogo); wireInteractions(vapor());
    reduced.addEventListener('change', () => {
      motionListeners.forEach(listener => listener());
      if (reduced.matches && departure) { const navigate = departure; restore(); navigate(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

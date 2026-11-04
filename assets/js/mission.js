/* Size the same-origin simulation to its contents, without a nested scroll area. */
(() => {
  'use strict';
  const frame = document.querySelector('[data-simulation-frame]');
  if (!frame) return;
  let observer;
  let animationFrame = 0;

  function connect() {
    if (observer) observer.disconnect();
    const content = frame.contentDocument?.querySelector('.simulation-wrap');
    if (!content) return;
    const resize = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        // Observe content rather than the iframe's viewport, which follows this height.
        const height = Math.ceil(content.getBoundingClientRect().height);
        if (height > 0 && Math.abs(frame.clientHeight - height) > 1) frame.style.height = height + 'px';
      });
    };
    if ('ResizeObserver' in window) {
      observer = new ResizeObserver(resize);
      observer.observe(content);
    } else {
      window.addEventListener('resize', resize, { passive: true });
    }
    frame.contentDocument.fonts?.ready.then(resize);
    resize();
  }

  frame.addEventListener('load', connect);
  if (frame.contentDocument?.readyState === 'complete') connect();
})();

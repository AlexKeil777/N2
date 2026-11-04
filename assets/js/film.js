/* Enhance native video controls with a poster and a single play action. */
(() => {
  'use strict';
  const preview = document.querySelector('[data-film-preview]');
  if (!preview) return;
  const video = preview.querySelector('video');
  const play = preview.querySelector('.film-play');
  const status = preview.parentElement.querySelector('[data-film-status]');
  if (!video || !play || !video.canPlayType('video/mp4')) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let dissolving = false;
  let hideTimer = 0;

  const hideOverlay = () => {
    clearTimeout(hideTimer);
    play.hidden = true;
    dissolving = false;
    play.removeAttribute('aria-disabled');
    preview.classList.remove('is-evaporating');
  };
  const showPlayer = () => {
    preview.classList.add('is-playing');
    video.controls = true;
    if (play.hidden || dissolving) return;
    if (reduced.matches) { hideOverlay(); return; }
    dissolving = true;
    play.setAttribute('aria-disabled', 'true');
    preview.classList.add('is-evaporating');
    hideTimer = setTimeout(hideOverlay, 600);
  };
  const showPreview = () => {
    clearTimeout(hideTimer);
    dissolving = false;
    video.controls = false;
    play.hidden = false;
    play.removeAttribute('aria-disabled');
    preview.classList.remove('is-playing', 'is-evaporating');
  };

  play.addEventListener('click', async event => {
    if (dissolving) return;
    if (status) status.textContent = '';
    showPlayer();
    if (event.detail === 0) video.focus({ preventScroll: true });
    try {
      // Keep playback inside the user gesture while the overlaid control evaporates.
      await video.play();
    } catch {
      hideOverlay();
      if (status) status.textContent = 'Use the video controls to start the film.';
      video.focus({ preventScroll: true });
    }
  });
  video.addEventListener('play', showPlayer);
  video.addEventListener('ended', () => {
    const hadFocus = document.activeElement === video;
    video.load();
    showPreview();
    if (hadFocus) play.focus({ preventScroll: true });
  });
  video.addEventListener('error', () => {
    showPlayer();
    hideOverlay();
    if (status) status.textContent = 'The film could not load. Reload the page to try again.';
  });
  preview.classList.add('is-ready');
  showPreview();
})();

/* Enhance native video controls with a poster and a single play action. */
(() => {
  'use strict';
  const preview = document.querySelector('[data-film-preview]');
  if (!preview) return;
  const video = preview.querySelector('video');
  const play = preview.querySelector('.film-play');
  const status = preview.parentElement.querySelector('[data-film-status]');
  if (!video || !play || !video.canPlayType('video/mp4')) return;

  const showPlayer = () => {
    preview.classList.add('is-playing');
    play.hidden = true;
    video.controls = true;
  };
  const showPreview = () => {
    video.controls = false;
    play.hidden = false;
    preview.classList.remove('is-playing');
  };

  play.addEventListener('click', async event => {
    // The shared click handler can keep its vapor burst; media starts immediately.
    if (status) status.textContent = '';
    showPlayer();
    if (event.detail === 0) video.focus({ preventScroll: true });
    try {
      await video.play();
    } catch {
      showPlayer();
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
    if (status) status.textContent = 'The film could not load. Reload the page to try again.';
  });
  preview.classList.add('is-ready');
  showPreview();
})();

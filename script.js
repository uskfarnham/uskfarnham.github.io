// ---------------------------------------------------------------------------
// Contact form submission.
//
// Submits via a hidden <iframe> target rather than fetch(): a plain HTML
// form-to-anywhere submission is not subject to CORS the way a script-
// initiated fetch() is, so this avoids needing any CORS configuration on
// the Apps Script side (which doPost doesn't support cleanly anyway).
// The trade-off: we can't read the response body, so success/failure is
// shown optimistically once the iframe finishes loading. Good enough for a
// simple contact form.
//
// REQUIRED SETUP: paste the URL of your deployed Apps Script "contact form
// handler" web app (see apps-script-contact-handler.js in this folder) into
// FORM_ENDPOINT below before this will actually send anything.
// ---------------------------------------------------------------------------

const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzGRO792eo61mWtVpo-DvU6bbE7RrTHnthPYYZDjG7cgbhNjGO-eOStyoLix7y2GHEPsw/exec';

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contact-form');
  const iframe = document.getElementById('hidden-form-target');
  const statusEl = document.getElementById('form-status');
  const submitBtn = form.querySelector('.submit-btn');

  let awaitingResponse = false;

  form.addEventListener('submit', function (e) {
    if (FORM_ENDPOINT.indexOf('PASTE_YOUR') === 0) {
      e.preventDefault();
      statusEl.textContent = 'Contact form is not connected yet — see script.js.';
      statusEl.className = 'error';
      return;
    }

    // Point the form at the Apps Script endpoint and the hidden iframe,
    // then let the browser submit it natively (no preventDefault here).
    form.action = FORM_ENDPOINT;
    form.target = 'hidden-form-target';

    awaitingResponse = true;
    submitBtn.disabled = true;
    statusEl.textContent = 'Sending…';
    statusEl.className = '';
  });

  iframe.addEventListener('load', function () {
    if (!awaitingResponse) return; // ignore the iframe's initial blank load
    awaitingResponse = false;
    submitBtn.disabled = false;
    statusEl.textContent = "Thanks — your message has been sent. We'll get back to you soon.";
    statusEl.className = 'success';
    form.reset();
  });
});

// ---------------------------------------------------------------------------
// Subtle scroll-linked parallax for the decorative .parallax-bg layers on
// the About/Visit/Contact sections. Pure vanilla JS, no dependency: reads
// each layer's position on scroll (throttled via requestAnimationFrame) and
// nudges it vertically at a fraction of scroll speed via translate3d (GPU-
// composited, so it stays smooth on mobile). Skipped entirely if the visitor
// has requested reduced motion - the layers just sit still in that case.
// ---------------------------------------------------------------------------

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const layers = Array.from(document.querySelectorAll('.parallax-bg'));
  if (layers.length === 0) return;

  const DRIFT_SPEED = 0.15; // fraction of scroll distance the layer drifts - deliberately subtle
  let ticking = false;

  function updateLayers() {
    const viewportHeight = window.innerHeight;
    layers.forEach(function (layer) {
      const host = layer.parentElement;
      const rect = host.getBoundingClientRect();
      // Skip layers nowhere near the viewport - no point computing their offset
      if (rect.bottom < -200 || rect.top > viewportHeight + 200) return;
      const offset = (rect.top - viewportHeight / 2) * DRIFT_SPEED;
      layer.style.transform = 'translate3d(0, ' + offset.toFixed(1) + 'px, 0)';
    });
    ticking = false;
  }

  function onScrollOrResize() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateLayers);
  }

  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize);
  updateLayers();
})();

// ---------------------------------------------------------------------------
// Artist directory cards, pulled from the Exhibition Portal. Loaded via
// JSONP (a <script> tag, not fetch()) since the Apps Script endpoint sends
// no CORS headers — same constraint the contact form works around with a
// hidden iframe, just the GET-side equivalent.
//
// REQUIRED SETUP: this should match the portal's deployed /exec URL — reuse
// the same one already embedded in the ArtistInfoPage links.
// ---------------------------------------------------------------------------

const PORTAL_URL = 'https://script.google.com/macros/s/AKfycbyztaNJ308WkL6jSx8-slbSje2i9Imb61RdU5rvfSVbrYobyAFL-f1xdfwP4n0OCshH4Q/exec';

(function () {
  const container = document.getElementById('artist-cards');
  const emptyNote = document.getElementById('artists-empty-note');
  if (!container) return;

  const callbackName = 'usk_artistlist_cb_' + Date.now();

  window[callbackName] = function (artists) {
    delete window[callbackName];
    script.remove();

    if (!artists || artists.length === 0) return; // leave the "check back nearer" note as-is

    emptyNote.style.display = 'none';
    container.innerHTML = artists.map(renderArtistCard).join('');
  };

  function renderArtistCard(artist) {
    const href = PORTAL_URL + '?view=artistinfo&id=' + encodeURIComponent(artist.id);
    const img = artist.imageUrl
      ? `<img class="artist-card-photo" src="${sizedPortalImage(artist.imageUrl, 240)}" alt="" loading="lazy">`
      : `<div class="artist-card-photo artist-card-photo-placeholder" aria-hidden="true"></div>`;

    return `<a class="artist-card" href="${href}" target="_blank" rel="noopener">
      ${img}
      <span class="artist-card-name">${escapeHtml(artist.displayName)}</span>
    </a>`;
  }

  // Portal images are served via the lh3 proxy (see _driveUrlToProxyUrl in
  // ArtistInfo.js) which accepts an =sNNN size suffix - request a small
  // thumbnail rather than the full-size image for the card grid.
  function sizedPortalImage(url, size) {
    if (!url || url.indexOf('lh3.googleusercontent.com') === -1) return url;
    return url.replace(/=s\d+$/, '') + '=s' + size;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  const script = document.createElement('script');
  script.src = PORTAL_URL + '?view=artistlist&callback=' + callbackName;
  script.onerror = function () { /* fail quietly - empty note stays visible */ };
  document.body.appendChild(script);
})();

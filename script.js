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

const FORM_ENDPOINT = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

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
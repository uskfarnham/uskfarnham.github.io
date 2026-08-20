/**
 * USK Farnham Exhibition — Contact Form Handler
 * -----------------------------------------------------------------------
 * SETUP (one-time):
 * 1. Go to script.google.com → New Project.
 * 2. Delete the default empty Code.gs content and paste this whole file in.
 * 3. Update CONTACT_EMAIL below if needed (currently your testing address).
 * 4. Deploy → New deployment → type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. Copy the resulting /exec URL and paste it into FORM_ENDPOINT in the
 *    site's script.js.
 *
 * This is a genuinely separate, standalone Apps Script project — deliberately
 * not part of the exhibition-management app. It has no data-sheet access, no
 * admin auth, nothing beyond "receive a form POST, email it, done."
 * -----------------------------------------------------------------------
 */

const CONTACT_EMAIL = 'williams.gail.m@gmail.com';

function doPost(e) {
  try {
    const params = e.parameter;

    // Honeypot check: a real visitor never fills this in (it's hidden via
    // CSS). Any non-empty value here means a bot filled every visible field
    // it could find. Silently accept-and-discard rather than erroring, so
    // the bot gets no signal that it was caught.
    if (params.website && params.website.toString().trim() !== '') {
      return _respond({ ok: true });
    }

    const name = (params.name || '').toString().trim();
    const email = (params.email || '').toString().trim();
    const message = (params.message || '').toString().trim();

    if (!name || !email || !message) {
      return _respond({ ok: false, error: 'Missing required field.' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return _respond({ ok: false, error: 'Invalid email address.' });
    }

    MailApp.sendEmail({
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: 'Exhibition website enquiry from ' + name,
      body: 'From: ' + name + ' <' + email + '>\n\n' + message
    });

    return _respond({ ok: true });

  } catch (err) {
    return _respond({ ok: false, error: err.toString() });
  }
}

// The response body is never actually read by the site (see script.js's
// hidden-iframe explanation), but returning something sensible keeps this
// testable directly and future-proofs against a fetch()-based approach later.
function _respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

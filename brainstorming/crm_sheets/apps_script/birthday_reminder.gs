/**
 * birthday_reminder.gs — weekly digest of upcoming occasions
 *
 * INSTALL
 *   1. Extensions → Apps Script → new script file "birthday_reminder"
 *   2. Triggers → Add Trigger:
 *        - Function: sendOccasionsDigest
 *        - Event source: Time-driven
 *        - Type: Week timer → Monday 9-10am
 *
 * WHAT IT DOES
 *   Reads the Occasions Calendar (derived view, already DPDP-filtered).
 *   Emails Sh + S a digest of every occasion in the next 14 days, each row
 *   with a pre-drafted WhatsApp click-to-chat URL so Sh can tap and send.
 *
 * CONFIG — edit RECIPIENTS, OUTREACH_TEMPLATE, BAKERY_BRAND below.
 */

const RECIPIENTS = ['shreya@example.com', 'swetha@example.com'];   // EDIT
const BAKERY_BRAND = 'Tiered Cake Company';                         // EDIT
const OCCASIONS_CAL = 'Occasions Calendar';
const CUSTOMERS = 'Customers';
const HORIZON_DAYS = 14;

const OUTREACH_TEMPLATE = (firstName, occasionType, relationLabel, daysOut) =>
  `Hi ${firstName}! ${BAKERY_BRAND} here ✨ ` +
  `${relationLabel}'s ${occasionType.toLowerCase()} is coming up in ${daysOut} days — ` +
  `would you like us to bake something this year too? ` +
  `Just reply with what you have in mind and we'll send options.`;

function sendOccasionsDigest() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cal = ss.getSheetByName(OCCASIONS_CAL);
  const customers = ss.getSheetByName(CUSTOMERS);

  // Read the derived calendar (skip header)
  const lastRow = cal.getLastRow();
  if (lastRow < 2) {
    Logger.log('No occasions in calendar');
    return;
  }

  // The calendar's A2 is a QUERY result — read what it computed
  const data = cal.getRange(2, 1, lastRow - 1, 6).getValues()
    .filter(r => r[0]);  // non-empty customer_name

  // Build a phone lookup from Customers
  const custRows = customers.getRange(2, 1, customers.getLastRow() - 1, 3).getValues();
  const phoneByName = {};
  custRows.forEach(r => { if (r[1]) phoneByName[r[1]] = r[2]; });

  const today = new Date(); today.setHours(0,0,0,0);
  const horizon = new Date(today); horizon.setDate(horizon.getDate() + HORIZON_DAYS);

  const rows = data.filter(r => {
    const d = r[3] instanceof Date ? r[3] : new Date(r[3]);
    return d >= today && d <= horizon;
  });

  if (!rows.length) {
    MailApp.sendEmail({
      to: RECIPIENTS.join(','),
      subject: `[${BAKERY_BRAND}] No occasions in next ${HORIZON_DAYS} days`,
      htmlBody: '<p>Quiet week. Nothing on the occasions calendar.</p>',
    });
    return;
  }

  let html = `<h2>${BAKERY_BRAND} — occasions in next ${HORIZON_DAYS} days</h2>`;
  html += '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:13px;">';
  html += '<tr style="background:#1F2937;color:#fff;"><th>Customer</th><th>Occasion</th><th>For</th><th>Date</th><th>Days out</th><th>Tap to message</th></tr>';

  rows.forEach(r => {
    const [name, type, relation, dateVal, notes, yearFirst] = r;
    const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
    const daysOut = Math.round((d - today) / 86400000);
    const phone = (phoneByName[name] || '').replace(/[^0-9]/g, '');
    const firstName = String(name).split(' ')[0];
    const msg = OUTREACH_TEMPLATE(firstName, type, relation || 'their', daysOut);
    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : '';
    const link = waUrl
      ? `<a href="${waUrl}">Open WhatsApp →</a>`
      : '<i>no phone on file</i>';
    html += `<tr>
      <td>${escapeHtml(name)}</td>
      <td>${escapeHtml(type)}</td>
      <td>${escapeHtml(relation || '')}</td>
      <td>${d.toDateString()}</td>
      <td style="text-align:center;">${daysOut}</td>
      <td>${link}</td>
    </tr>`;
  });
  html += '</table>';
  html += `<p style="color:#6B7280;font-size:12px;">Sent by Apps Script · ${new Date().toString()}</p>`;

  MailApp.sendEmail({
    to: RECIPIENTS.join(','),
    subject: `[${BAKERY_BRAND}] ${rows.length} occasion${rows.length > 1 ? 's' : ''} in next ${HORIZON_DAYS} days`,
    htmlBody: html,
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

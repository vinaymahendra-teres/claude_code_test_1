/**
 * compliance_reminder.gs — weekly compliance digest
 *
 * INSTALL
 *   1. In 03_Finance.xlsx: Extensions → Apps Script → new file "compliance_reminder"
 *   2. Edit RECIPIENTS + BAKERY_BRAND below.
 *   3. Triggers → Add Trigger:
 *        - Function: sendComplianceReminder
 *        - Event source: Time-driven
 *        - Type: Week timer → Monday 09:00–10:00 IST
 *
 * WHAT IT DOES
 *   Reads the Compliance tab. Filters rows where Status ∈ {EXPIRED, Renew NOW,
 *   Renew this month, Renew this quarter}. Emails Sh + S an HTML digest grouped
 *   by urgency. Silent if nothing urgent.
 */

const RECIPIENTS_CR = ['shreya@example.com', 'swetha@example.com'];
const BAKERY_BRAND_CR = 'Tiered Cake Company';
const COMP_SHEET = 'Compliance';

const URGENT_STATUSES = ['EXPIRED', 'Renew NOW', 'Renew this month', 'Renew this quarter'];

function sendComplianceReminder() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(COMP_SHEET);
  if (!sh) {
    Logger.log('Compliance sheet not found — abort');
    return;
  }

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return;

  const data = sh.getRange(2, 1, lastRow - 1, 9).getValues();
  const urgent = data.filter(r => r[0] && URGENT_STATUSES.indexOf(r[6]) >= 0);
  if (!urgent.length) {
    Logger.log('No urgent compliance items');
    return;
  }

  // Group by status
  const byStatus = {};
  URGENT_STATUSES.forEach(s => { byStatus[s] = []; });
  urgent.forEach(r => byStatus[r[6]].push(r));

  let html = `<h2>${esc(BAKERY_BRAND_CR)} — compliance status</h2>`;
  html += `<p>${urgent.length} item(s) need attention.</p>`;
  URGENT_STATUSES.forEach(status => {
    const rows = byStatus[status];
    if (!rows.length) return;
    const color = status === 'EXPIRED' || status === 'Renew NOW' ? '#DC2626'
                : status === 'Renew this month' ? '#D97706' : '#CA8A04';
    html += `<h3 style="color:${color};">${esc(status)} (${rows.length})</h3>`;
    html += '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:13px;">';
    html += '<tr style="background:#1F2937;color:#fff;"><th>License</th><th>Number</th><th>Authority</th><th>Valid until</th><th>Days</th><th>Notes</th></tr>';
    rows.forEach(r => {
      html += `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[4])}</td><td style="text-align:center;">${esc(r[5])}</td><td>${esc(r[8])}</td></tr>`;
    });
    html += '</table>';
  });
  html += '<p style="color:#6B7280;font-size:12px;">Open the Compliance tab in 03_Finance to update or set renewal dates.</p>';

  MailApp.sendEmail({
    to: RECIPIENTS_CR.join(','),
    subject: `[${BAKERY_BRAND_CR}] Compliance — ${urgent.length} item(s) need attention`,
    htmlBody: html,
  });
}

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

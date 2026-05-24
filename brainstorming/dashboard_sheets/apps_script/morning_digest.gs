/**
 * morning_digest.gs — daily 07:00 IST morning email to both operators
 *
 * INSTALL
 *   1. In 00_Dashboard.xlsx: Extensions → Apps Script → new file "morning_digest"
 *   2. Edit RECIPIENTS_MD + the four spreadsheet IDs below.
 *   3. Triggers → Add Trigger:
 *        - Function: sendMorningDigest
 *        - Event source: Time-driven
 *        - Type: Day timer → 07:00–08:00 IST
 *   4. Authorise SpreadsheetApp + DriveApp + MailApp scopes when prompted.
 *
 * WHAT IT DOES
 *   Pulls top-of-mind from all 4 source modules (CRM, Finance, Operations,
 *   Marketing) and sends one HTML email summarising what needs attention today.
 *   Designed to replace opening 5 spreadsheets — glance at phone, done.
 *
 * CONFIG — edit the constants below.
 */

const RECIPIENTS_MD = ['shreya@example.com', 'swetha@example.com'];
const BAKERY_BRAND_MD = 'Tiered Cake Company';
const CRM_ID_MD = 'PASTE_CRM_FILE_ID_HERE';
const FINANCE_ID_MD = 'PASTE_FINANCE_FILE_ID_HERE';
const OPS_ID_MD = 'PASTE_OPERATIONS_FILE_ID_HERE';
const MKT_ID_MD = 'PASTE_MARKETING_FILE_ID_HERE';

// CRM Orders columns (post-Phase-1a)
const CRM_ORDER_ID = 1, CRM_CUSTOMER = 3, CRM_DELIVERY = 5, CRM_PRODUCT = 6;
const CRM_FINAL = 11, CRM_DEPOSIT = 12, CRM_BAL_RECVD = 13, CRM_BAL_DUE = 14;
const CRM_PROD_STATUS = 20, CRM_DELIV_STATUS = 21;

function sendMorningDigest() {
  const crm = SpreadsheetApp.openById(CRM_ID_MD);
  const fin = SpreadsheetApp.openById(FINANCE_ID_MD);
  const ops = SpreadsheetApp.openById(OPS_ID_MD);
  const mkt = SpreadsheetApp.openById(MKT_ID_MD);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const weekAhead = new Date(today); weekAhead.setDate(weekAhead.getDate() + 7);

  // --- Panel 1: This week's orders ---
  const ordersSh = crm.getSheetByName('Orders');
  let upcomingOrders = [];
  if (ordersSh && ordersSh.getLastRow() >= 2) {
    upcomingOrders = ordersSh
      .getRange(2, 1, ordersSh.getLastRow() - 1, CRM_DELIV_STATUS)
      .getValues()
      .filter(r => {
        const d = r[CRM_DELIVERY - 1];
        if (!(d instanceof Date)) return false;
        const dn = new Date(d); dn.setHours(0, 0, 0, 0);
        return dn >= today && dn <= weekAhead;
      })
      .sort((a, b) => a[CRM_DELIVERY - 1] - b[CRM_DELIVERY - 1]);
  }

  // Deposits outstanding (Confirmed with deposit_received = 0 OR balance_due > 0 after delivery)
  const depositsOutstanding = upcomingOrders.filter(r =>
    (Number(r[CRM_DEPOSIT - 1]) || 0) === 0 && (Number(r[CRM_FINAL - 1]) || 0) > 0
  );

  // --- Panel 2: Cash position ---
  const accSh = fin.getSheetByName('Bank vs UPI Float');
  let accounts = [];
  if (accSh && accSh.getLastRow() >= 2) {
    accounts = accSh.getRange(2, 1, accSh.getLastRow() - 1, 6).getValues()
      .filter(r => r[0]);
  }

  const upiRecon = fin.getSheetByName('UPI Reconciliation');
  let upiUnmatchedCount = 0, upiUnmatchedSum = 0;
  if (upiRecon) {
    upiUnmatchedCount = Number(upiRecon.getRange('B46').getValue()) || 0;
    upiUnmatchedSum = Number(upiRecon.getRange('B48').getValue()) || 0;
  }

  // --- Panel 3: Production load (today + tomorrow) ---
  const capSh = crm.getSheetByName('Capacity Calendar');
  let capRows = [];
  if (capSh && capSh.getLastRow() >= 2) {
    const todayKey = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const tomorrowKey = Utilities.formatDate(tomorrow, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    capRows = capSh.getRange(2, 1, capSh.getLastRow() - 1, 12).getValues()
      .filter(r => {
        if (!(r[0] instanceof Date)) return false;
        const k = Utilities.formatDate(r[0], Session.getScriptTimeZone(), 'yyyy-MM-dd');
        return k === todayKey || k === tomorrowKey;
      });
  }

  // --- Panel 4: Today's bake plan ---
  const bakePlanSh = ops.getSheetByName('Bake Plan');
  let bakingToday = [];
  if (bakePlanSh && bakePlanSh.getLastRow() >= 2) {
    bakingToday = bakePlanSh.getRange(2, 1, bakePlanSh.getLastRow() - 1, 10).getValues()
      .filter(r => {
        const d = r[7];  // Bake date (col H)
        if (!(d instanceof Date)) return false;
        const dn = new Date(d); dn.setHours(0, 0, 0, 0);
        return dn.getTime() === today.getTime();
      });
  }

  // --- Panel 5: PAR breaches ---
  const ingSh = ops.getSheetByName('Ingredients');
  let parBreaches = [];
  if (ingSh && ingSh.getLastRow() >= 2) {
    parBreaches = ingSh.getRange(2, 1, ingSh.getLastRow() - 1, 13).getValues()
      .filter(r => r[1] && Number(r[4]) < Number(r[5]));  // current < PAR
  }

  // --- Panel 6: Compliance urgent ---
  const compSh = fin.getSheetByName('Compliance');
  let complianceUrgent = [];
  if (compSh && compSh.getLastRow() >= 2) {
    const URGENT = ['EXPIRED', 'Renew NOW', 'Renew this month'];
    complianceUrgent = compSh.getRange(2, 1, compSh.getLastRow() - 1, 9).getValues()
      .filter(r => r[0] && URGENT.indexOf(r[6]) >= 0);
  }

  // --- Panel 7: Marketing — posts scheduled today/tomorrow ---
  const ccSh = mkt.getSheetByName('Content Calendar');
  let scheduledPosts = [];
  if (ccSh && ccSh.getLastRow() >= 2) {
    scheduledPosts = ccSh.getRange(2, 1, ccSh.getLastRow() - 1, 11).getValues()
      .filter(r => {
        const d = r[1];
        if (!(d instanceof Date)) return false;
        const dn = new Date(d); dn.setHours(0, 0, 0, 0);
        return (dn.getTime() === today.getTime() || dn.getTime() === tomorrow.getTime())
               && String(r[3]) === 'Scheduled';
      });
  }

  // --- Build HTML email ---
  let html = `<h2>${esc(BAKERY_BRAND_MD)} — morning brief, ${Utilities.formatDate(today, Session.getScriptTimeZone(), 'EEE d MMM yyyy')}</h2>`;

  // Panel 1
  html += sectionHeader('This week — orders due');
  if (upcomingOrders.length) {
    html += tableOpen(['Order', 'Customer', 'Delivery', 'Product', 'Final (₹)', 'Status']);
    upcomingOrders.slice(0, 10).forEach(r => {
      html += `<tr><td>${esc(r[CRM_ORDER_ID - 1])}</td><td>${esc(r[CRM_CUSTOMER - 1])}</td><td>${esc(r[CRM_DELIVERY - 1])}</td><td>${esc(r[CRM_PRODUCT - 1])}</td><td>₹${esc(r[CRM_FINAL - 1])}</td><td>${esc(r[CRM_PROD_STATUS - 1])} / ${esc(r[CRM_DELIV_STATUS - 1])}</td></tr>`;
    });
    html += '</table>';
    if (upcomingOrders.length > 10) html += `<p>+${upcomingOrders.length - 10} more.</p>`;
  } else {
    html += '<p style="color:#6B7280;font-style:italic;">No orders in next 7 days.</p>';
  }

  // Panel 2
  html += sectionHeader('Cash position');
  html += tableOpen(['Account', 'Current balance (₹)']);
  accounts.forEach(r => {
    html += `<tr><td>${esc(r[0])}</td><td>₹${esc(r[5])}</td></tr>`;
  });
  html += '</table>';
  if (upiUnmatchedCount > 0) {
    html += `<p style="color:#DC2626;"><strong>⚠ UPI unmatched:</strong> ${upiUnmatchedCount} inflow(s), ₹${upiUnmatchedSum}. Resolve in UPI Reconciliation tab.</p>`;
  }

  // Panel 3
  if (capRows.length) {
    html += sectionHeader('Production capacity (today / tomorrow)');
    html += tableOpen(['Date', 'Cake (used/total)', 'Cupcakes (used/total)', 'Bomboloni (used/total)', 'Utilisation', 'Blocked?']);
    capRows.forEach(r => {
      html += `<tr><td>${esc(r[0])}</td><td>${esc(r[3])}/${esc(r[2])}</td><td>${esc(r[5])}/${esc(r[4])}</td><td>${esc(r[7])}/${esc(r[6])}</td><td>${(Number(r[10]) * 100).toFixed(0)}%</td><td>${esc(r[8])}</td></tr>`;
    });
    html += '</table>';
  }

  // Panel 4
  if (bakingToday.length) {
    html += sectionHeader('Today’s bake plan');
    html += tableOpen(['Order', 'Customer', 'Product', 'Qty', 'Customisation', 'Status']);
    bakingToday.forEach(r => {
      html += `<tr><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td><td>${esc(r[5])}</td><td>${esc(r[6])}</td></tr>`;
    });
    html += '</table>';
  }

  // Panel 5 — Action queue items
  let actionItems = [];
  if (depositsOutstanding.length) actionItems.push(`<strong>${depositsOutstanding.length}</strong> order(s) with deposit not yet received — chase customers.`);
  if (parBreaches.length) actionItems.push(`<strong>${parBreaches.length}</strong> ingredient(s) below PAR — check par_breach_alerter email for drafted POs.`);
  if (complianceUrgent.length) actionItems.push(`<strong>${complianceUrgent.length}</strong> compliance item(s) urgent — see Compliance tab.`);
  if (upiUnmatchedCount > 0) actionItems.push(`<strong>${upiUnmatchedCount}</strong> UPI inflow(s) unmatched — see UPI Reconciliation tab.`);
  if (scheduledPosts.length) actionItems.push(`<strong>${scheduledPosts.length}</strong> post(s) scheduled today/tomorrow — confirm Meta Business Suite has them queued.`);

  if (actionItems.length) {
    html += sectionHeader('Action queue');
    html += '<ul>';
    actionItems.forEach(item => { html += `<li>${item}</li>`; });
    html += '</ul>';
  }

  // PAR breach detail
  if (parBreaches.length) {
    html += '<h4 style="margin-top:18px;">PAR breaches in detail</h4>';
    html += tableOpen(['Ingredient', 'Stock', 'PAR', 'Reorder qty', 'Vendor']);
    parBreaches.forEach(r => {
      html += `<tr><td>${esc(r[1])}</td><td>${esc(r[4])}</td><td>${esc(r[5])}</td><td>${esc(r[6])} ${esc(r[3])}</td><td>${esc(r[7])}</td></tr>`;
    });
    html += '</table>';
  }

  html += `<p style="color:#6B7280;font-size:12px;margin-top:24px;">Sent by morning_digest.gs at ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm zzz')}. Open the Dashboard sheet for the full view.</p>`;

  MailApp.sendEmail({
    to: RECIPIENTS_MD.join(','),
    subject: `[${BAKERY_BRAND_MD}] Morning brief — ${Utilities.formatDate(today, Session.getScriptTimeZone(), 'EEE d MMM')}`,
    htmlBody: html,
  });
}

function sectionHeader(text) {
  return `<h3 style="background:#1F2937;color:#fff;padding:8px 12px;margin-top:24px;font-family:sans-serif;">${esc(text)}</h3>`;
}

function tableOpen(headers) {
  let html = '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:13px;">';
  html += '<tr style="background:#374151;color:#fff;">';
  headers.forEach(h => { html += `<th>${esc(h)}</th>`; });
  html += '</tr>';
  return html;
}

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

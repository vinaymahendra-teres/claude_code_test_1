/**
 * par_breach_alerter.gs — daily PAR breach detection + PO drafting
 *
 * INSTALL
 *   1. In 02_Operations.xlsx: Extensions → Apps Script → new file "par_breach_alerter"
 *   2. Edit RECIPIENTS_PAR + BAKERY_BRAND_PAR below.
 *   3. Triggers → Add Trigger:
 *        - Function: checkParBreaches
 *        - Event source: Time-driven
 *        - Type: Day timer → 09:00–10:00 IST
 *
 * WHAT IT DOES
 *   1. Reads Ingredients tab; finds rows where Current stock < PAR.
 *   2. Groups breaches by Preferred vendor.
 *   3. For each vendor with breaches, drafts ONE Purchase Order row in the
 *      Purchase Orders tab (Status = Drafted) summarising the breached
 *      ingredients + reorder quantities + estimated cost.
 *      Skips if a Drafted PO for that vendor already exists today.
 *   4. Emails Sh (and S as cc) the breach list with the drafted PO IDs.
 */

const RECIPIENTS_PAR = ['swetha@example.com'];   // edit
const CC_PAR = ['shreya@example.com'];           // edit
const BAKERY_BRAND_PAR = 'Tiered Cake Company';

// Ingredients column indices (1-based)
const ING_NAME_COL = 2;
const ING_UNIT_COL = 4;
const ING_STOCK_COL = 5;
const ING_PAR_COL = 6;
const ING_REORDER_QTY_COL = 7;
const ING_VENDOR_COL = 8;
const ING_AVG_COST_COL = 9;

// Purchase Orders column indices (1-based)
const PO_VENDOR_COL = 2;
const PO_RAISED_COL = 3;
const PO_EXPECTED_COL = 4;
const PO_ITEMS_COL = 5;
const PO_TOTAL_COL = 6;
const PO_STATUS_COL = 7;
const PO_NOTES_COL = 9;

const OPS_SHEET_PAR = SpreadsheetApp.getActiveSpreadsheet();

function checkParBreaches() {
  const ing = OPS_SHEET_PAR.getSheetByName('Ingredients');
  const pos = OPS_SHEET_PAR.getSheetByName('Purchase Orders');
  if (!ing || !pos) {
    Logger.log('Missing required sheet — abort');
    return;
  }

  const ingLast = ing.getLastRow();
  if (ingLast < 2) return;

  const ingData = ing.getRange(2, 1, ingLast - 1, ING_AVG_COST_COL).getValues();

  // Find breaches (current stock < PAR)
  const breaches = ingData.filter(r => {
    const stock = Number(r[ING_STOCK_COL - 1]);
    const par = Number(r[ING_PAR_COL - 1]);
    return r[ING_NAME_COL - 1] && !isNaN(stock) && !isNaN(par) && stock < par;
  });

  if (!breaches.length) {
    Logger.log('No PAR breaches');
    return;
  }

  // Group by vendor
  const byVendor = {};
  breaches.forEach(r => {
    const v = r[ING_VENDOR_COL - 1] || '(unspecified vendor)';
    if (!byVendor[v]) byVendor[v] = [];
    byVendor[v].push(r);
  });

  // Read existing Drafted POs to skip duplicates
  const posLast = pos.getLastRow();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayKey = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const existingDraftToday = {};
  if (posLast >= 2) {
    const posData = pos.getRange(2, 1, posLast - 1, PO_STATUS_COL).getValues();
    posData.forEach(r => {
      if (r[PO_STATUS_COL - 1] === 'Drafted'
          && r[PO_RAISED_COL - 1] instanceof Date
          && Utilities.formatDate(r[PO_RAISED_COL - 1], Session.getScriptTimeZone(), 'yyyy-MM-dd') === todayKey) {
        existingDraftToday[r[PO_VENDOR_COL - 1]] = true;
      }
    });
  }

  // Draft new POs
  const draftedSummary = [];
  Object.keys(byVendor).forEach(vendor => {
    if (existingDraftToday[vendor]) {
      draftedSummary.push({ vendor, status: 'skipped (already drafted today)', items: byVendor[vendor] });
      return;
    }
    const items = byVendor[vendor];
    const itemsSummary = items.map(r =>
      `${r[ING_NAME_COL - 1]} ${r[ING_REORDER_QTY_COL - 1]}${r[ING_UNIT_COL - 1]}`
    ).join(' + ');
    const totalCost = items.reduce((s, r) =>
      s + (Number(r[ING_REORDER_QTY_COL - 1]) * Number(r[ING_AVG_COST_COL - 1])), 0
    );
    const expected = new Date(today); expected.setDate(expected.getDate() + 2);

    // Append row at last+1
    const newRow = [
      '',  // PO ID — auto-formula in build_xlsx will fill if column has the formula; otherwise blank
      vendor,
      today,
      expected,
      itemsSummary,
      Math.round(totalCost),
      'Drafted',
      '',  // Linked Money Out ID
      `Auto-drafted by par_breach_alerter.gs — ${items.length} ingredient(s) below PAR`,
    ];
    const targetRow = pos.getLastRow() + 1;
    pos.getRange(targetRow, 1, 1, PO_NOTES_COL).setValues([newRow]);
    draftedSummary.push({ vendor, status: 'drafted', items, total: totalCost, row: targetRow });
  });

  // Email digest
  let html = `<h2>${escPar(BAKERY_BRAND_PAR)} — PAR breaches (${breaches.length} ingredient(s))</h2>`;
  draftedSummary.forEach(entry => {
    html += `<h3>${escPar(entry.vendor)} — ${escPar(entry.status)}</h3>`;
    html += '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:13px;">';
    html += '<tr style="background:#1F2937;color:#fff;"><th>Ingredient</th><th>Stock</th><th>PAR</th><th>Reorder qty</th></tr>';
    entry.items.forEach(r => {
      html += `<tr><td>${escPar(r[ING_NAME_COL - 1])}</td><td>${escPar(r[ING_STOCK_COL - 1])}</td><td>${escPar(r[ING_PAR_COL - 1])}</td><td>${escPar(r[ING_REORDER_QTY_COL - 1])} ${escPar(r[ING_UNIT_COL - 1])}</td></tr>`;
    });
    html += '</table>';
    if (entry.total != null) {
      html += `<p>Estimated PO total: ₹${Math.round(entry.total)}</p>`;
    }
  });
  html += '<p style="color:#6B7280;font-size:12px;">Open the Purchase Orders tab in 02_Operations to send and mark POs as Sent.</p>';

  MailApp.sendEmail({
    to: RECIPIENTS_PAR.join(','),
    cc: CC_PAR.join(','),
    subject: `[${BAKERY_BRAND_PAR}] PAR breach — ${breaches.length} ingredient(s); ${Object.keys(byVendor).length} PO(s) drafted`,
    htmlBody: html,
  });
}

function escPar(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

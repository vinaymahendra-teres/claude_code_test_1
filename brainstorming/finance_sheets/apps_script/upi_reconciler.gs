/**
 * upi_reconciler.gs — daily cross-file UPI reconciliation
 *
 * INSTALL
 *   1. In 03_Finance.xlsx: Extensions → Apps Script → new file "upi_reconciler"
 *   2. Set CRM_SPREADSHEET_ID below to the CRM file's ID (long string in URL)
 *   3. Triggers (clock icon) → Add Trigger:
 *        - Function: reconcileUpi
 *        - Event source: Time-driven
 *        - Type: Day timer → 09:00–10:00 IST
 *   4. Authorise SpreadsheetApp + DriveApp + MailApp scopes when prompted
 *
 * WHAT IT DOES
 *   1. Reads Orders from the CRM spreadsheet (column R = UPI reference (UTR), Q = Cold-chain notes
 *      — wait, after Task 1 the schema is: R = UTR, S = Payer VPA. Column letter is R.)
 *   2. For each Money In row in Finance, looks up UTR in CRM Orders.
 *      If found, writes Order ID into Money In.Matched Order ID (column J).
 *   3. Computes two exception lists:
 *        Section A: Money In rows with no match AND Channel starts with "UPI"
 *        Section B: CRM Orders rows with declared paid amount > 0 AND payment_mode = UPI
 *                   AND Orders.UTR not found in any Money In row
 *   4. Overwrites Sections A and B in the UPI Reconciliation tab.
 *   5. Emails Sh if either section has rows.
 *
 * CONFIG — edit the three lines below.
 */

const CRM_SPREADSHEET_ID = 'PASTE_CRM_FILE_ID_HERE';
const RECIPIENT = 'shreya@example.com';
const BAKERY_BRAND = 'Tiered Cake Company';

// CRM Orders column indices (1-based) — after the Task 1 schema additions
const CRM_ORDER_ID_COL = 1;        // A
const CRM_CUSTOMER_ID_COL = 2;     // B
const CRM_NAME_COL = 3;            // C
const CRM_DELIVERY_DATE_COL = 5;   // E
const CRM_FINAL_PRICE_COL = 11;    // K
const CRM_DEPOSIT_COL = 12;        // L
const CRM_BALANCE_RECVD_COL = 13;  // M
const CRM_PAYMENT_MODE_COL = 15;   // O
const CRM_UTR_COL = 18;            // R  (after Task 1)

// Finance Money In column indices (1-based)
const MI_ENTRY_ID_COL = 1;
const MI_DATE_COL = 2;
const MI_CHANNEL_COL = 4;
const MI_AMOUNT_COL = 6;
const MI_UTR_COL = 7;
const MI_VPA_COL = 8;
const MI_COUNTERPARTY_COL = 9;
const MI_MATCHED_ORDER_COL = 10;

const FIN_SHEET = SpreadsheetApp.getActiveSpreadsheet();

function reconcileUpi() {
  const crm = SpreadsheetApp.openById(CRM_SPREADSHEET_ID);
  const orders = crm.getSheetByName('Orders');
  const moneyIn = FIN_SHEET.getSheetByName('Money In');
  const recon = FIN_SHEET.getSheetByName('UPI Reconciliation');

  if (!orders || !moneyIn || !recon) {
    Logger.log('Missing required sheet — abort');
    return;
  }

  // Read all Orders rows (skip header)
  const ordersLast = orders.getLastRow();
  const ordersData = ordersLast >= 2
    ? orders.getRange(2, 1, ordersLast - 1, CRM_UTR_COL).getValues()
    : [];

  // Read all Money In rows (skip header)
  const miLast = moneyIn.getLastRow();
  const miData = miLast >= 2
    ? moneyIn.getRange(2, 1, miLast - 1, MI_MATCHED_ORDER_COL).getValues()
    : [];

  // Build UTR → Order lookup from CRM
  const orderByUtr = {};
  ordersData.forEach(r => {
    const utr = String(r[CRM_UTR_COL - 1] || '').trim();
    if (utr) orderByUtr[utr] = r;
  });

  // Build UTR → MoneyIn lookup
  const miByUtr = {};
  miData.forEach((r, idx) => {
    const utr = String(r[MI_UTR_COL - 1] || '').trim();
    if (utr) miByUtr[utr] = { rowIdx: idx + 2, row: r };
  });

  // Pass 1: write Matched Order ID back into Money In for any rows that have a UTR matching a CRM order.
  // Also update the in-memory miData row so downstream Section A filter sees the freshly-matched state.
  miData.forEach((r, idx) => {
    const utr = String(r[MI_UTR_COL - 1] || '').trim();
    const currentMatch = String(r[MI_MATCHED_ORDER_COL - 1] || '').trim();
    if (utr && orderByUtr[utr]) {
      const orderId = orderByUtr[utr][CRM_ORDER_ID_COL - 1];
      if (currentMatch !== orderId) {
        moneyIn.getRange(idx + 2, MI_MATCHED_ORDER_COL).setValue(orderId);
        r[MI_MATCHED_ORDER_COL - 1] = orderId;  // keep in-memory snapshot consistent
      }
    }
  });

  // Section A: UPI inflows with no matched order
  const sectionA = miData
    .map((r, idx) => ({ idx: idx + 2, row: r }))
    .filter(({ row }) => {
      const channel = String(row[MI_CHANNEL_COL - 1] || '');
      const utr = String(row[MI_UTR_COL - 1] || '').trim();
      const matched = String(row[MI_MATCHED_ORDER_COL - 1] || '').trim();
      return channel.indexOf('UPI') === 0 && !matched;
    })
    .map(({ row }) => [
      row[MI_ENTRY_ID_COL - 1],
      row[MI_DATE_COL - 1],
      row[MI_AMOUNT_COL - 1],
      row[MI_UTR_COL - 1],
      row[MI_VPA_COL - 1],
      row[MI_COUNTERPARTY_COL - 1],
      row[MI_CHANNEL_COL - 1],
      'Find matching order OR confirm refund/error',
    ]);

  // Section B: Orders that declared UPI payment but no Money In row matches UTR
  const sectionB = ordersData
    .filter(r => {
      const paymentMode = String(r[CRM_PAYMENT_MODE_COL - 1] || '');
      const declaredPaid = (Number(r[CRM_DEPOSIT_COL - 1]) || 0) + (Number(r[CRM_BALANCE_RECVD_COL - 1]) || 0);
      const utr = String(r[CRM_UTR_COL - 1] || '').trim();
      if (paymentMode !== 'UPI' || declaredPaid <= 0) return false;
      // If no UTR yet, flag it
      if (!utr) return true;
      // If UTR exists but no Money In row references it
      return !miByUtr[utr];
    })
    .map(r => [
      r[CRM_ORDER_ID_COL - 1],
      r[CRM_NAME_COL - 1],
      r[CRM_DELIVERY_DATE_COL - 1],
      r[CRM_FINAL_PRICE_COL - 1],
      (Number(r[CRM_DEPOSIT_COL - 1]) || 0) + (Number(r[CRM_BALANCE_RECVD_COL - 1]) || 0),
      r[CRM_UTR_COL - 1] || '(missing UTR)',
      'UPI',
      'Chase customer OR log missing inflow',
    ]);

  // Clear and rewrite Section A (rows 6–24; max 19 rows displayed)
  const SECTION_A_CAP = 19;
  recon.getRange(6, 1, SECTION_A_CAP, 8).clearContent();
  if (sectionA.length) {
    const aDisplay = sectionA.slice(0, SECTION_A_CAP - 1);  // reserve last row for overflow note if needed
    const aRowsToWrite = sectionA.length > SECTION_A_CAP ? aDisplay : sectionA;
    recon.getRange(6, 1, aRowsToWrite.length, 8).setValues(aRowsToWrite);
    if (sectionA.length > SECTION_A_CAP) {
      recon.getRange(6 + SECTION_A_CAP - 1, 1).setValue(
        `+${sectionA.length - (SECTION_A_CAP - 1)} more — see Money In tab for unmatched UPI rows`
      ).setFontStyle('italic');
    }
  } else {
    recon.getRange(6, 1).setValue('(no exceptions — all UPI inflows matched)').setFontStyle('italic');
  }

  // Clear and rewrite Section B (rows 28–44; max 17 rows displayed)
  const SECTION_B_CAP = 17;
  recon.getRange(28, 1, SECTION_B_CAP, 8).clearContent();
  if (sectionB.length) {
    const bDisplay = sectionB.slice(0, SECTION_B_CAP - 1);
    const bRowsToWrite = sectionB.length > SECTION_B_CAP ? bDisplay : sectionB;
    recon.getRange(28, 1, bRowsToWrite.length, 8).setValues(bRowsToWrite);
    if (sectionB.length > SECTION_B_CAP) {
      recon.getRange(28 + SECTION_B_CAP - 1, 1).setValue(
        `+${sectionB.length - (SECTION_B_CAP - 1)} more — see Orders tab for unmatched UPI-paid orders`
      ).setFontStyle('italic');
    }
  } else {
    recon.getRange(28, 1).setValue('(no exceptions — all UPI-paid orders reconciled)').setFontStyle('italic');
  }

  // Section C: summary
  const sumA = sectionA.reduce((s, r) => s + (Number(r[2]) || 0), 0);
  const sumB = sectionB.reduce((s, r) => s + (Number(r[4]) || 0), 0);
  recon.getRange('B46').setValue(sectionA.length);
  recon.getRange('B47').setValue(sectionB.length);
  recon.getRange('B48').setValue(sumA);
  recon.getRange('B49').setValue(sumB);
  recon.getRange('B50').setValue(new Date());

  // Email if any exceptions
  if (sectionA.length + sectionB.length > 0) {
    const html = buildEmailHtml(sectionA, sectionB, sumA, sumB);
    MailApp.sendEmail({
      to: RECIPIENT,
      subject: `[${BAKERY_BRAND}] UPI reconciliation — ${sectionA.length + sectionB.length} exception(s)`,
      htmlBody: html,
    });
  }
}

function buildEmailHtml(sectionA, sectionB, sumA, sumB) {
  const esc = v => String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  let html = `<h2>${esc(BAKERY_BRAND)} — UPI reconciliation exceptions</h2>`;
  html += `<p>Today's run found <strong>${sectionA.length}</strong> unmatched inflows (₹${sumA}) and <strong>${sectionB.length}</strong> orders without a matched inflow (₹${sumB} declared).</p>`;
  if (sectionA.length) {
    html += '<h3>Inflows without a matched order</h3>';
    html += '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:13px;">';
    html += '<tr style="background:#1F2937;color:#fff;"><th>Entry</th><th>Date</th><th>Amount</th><th>UTR</th><th>VPA</th><th>Counter-party</th></tr>';
    sectionA.forEach(r => {
      html += `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>₹${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td><td>${esc(r[5])}</td></tr>`;
    });
    html += '</table>';
  }
  if (sectionB.length) {
    html += '<h3>Orders without a matched inflow</h3>';
    html += '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:13px;">';
    html += '<tr style="background:#1F2937;color:#fff;"><th>Order</th><th>Customer</th><th>Delivery</th><th>Final</th><th>Declared paid</th><th>UTR</th></tr>';
    sectionB.forEach(r => {
      html += `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>₹${esc(r[3])}</td><td>₹${esc(r[4])}</td><td>${esc(r[5])}</td></tr>`;
    });
    html += '</table>';
  }
  html += '<p style="color:#6B7280;font-size:12px;">Open the UPI Reconciliation tab in 03_Finance to resolve.</p>';
  return html;
}

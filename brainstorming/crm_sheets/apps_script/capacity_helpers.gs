/**
 * capacity_helpers.gs — capacity guardrail on Orders entry
 *
 * INSTALL
 *   1. Extensions → Apps Script → new script file "capacity_helpers"
 *   2. Triggers → Add Trigger:
 *        - Function: onOrderEdit
 *        - Event source: From spreadsheet
 *        - Event type: On edit
 *
 * WHAT IT DOES
 *   When you edit the delivery_date (col E) or product (col F) in Orders:
 *     - Looks up the corresponding row in Capacity Calendar
 *     - If the slot count would now exceed the total, sets a note on the cell
 *       saying so. (Does not block — operator decides whether to push back.)
 *     - Toasts the warning in the bottom-right so it's visible immediately.
 *
 *   Also: a menu item "CRM → Reseed capacity calendar to next 60 days" that
 *   prunes past dates and appends new ones at the end.
 */

const ORDERS_SHEET = 'Orders';
const ORDERS_DELIVERY_COL = 5;   // E
const ORDERS_PRODUCT_COL = 6;    // F
const CAP_SHEET = 'Capacity Calendar';

function onOrderEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== ORDERS_SHEET) return;
  const col = e.range.getColumn();
  if (col !== ORDERS_DELIVERY_COL && col !== ORDERS_PRODUCT_COL) return;

  const row = e.range.getRow();
  if (row === 1) return;

  const delivery = sheet.getRange(row, ORDERS_DELIVERY_COL).getValue();
  const product = sheet.getRange(row, ORDERS_PRODUCT_COL).getValue();
  if (!(delivery instanceof Date) || !product) return;

  const cap = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CAP_SHEET);
  const data = cap.getRange(2, 1, cap.getLastRow() - 1, 11).getValues();
  const dateKey = Utilities.formatDate(delivery, Session.getScriptTimeZone(), 'yyyy-MM-dd');

  const match = data.find(r => r[0] instanceof Date &&
    Utilities.formatDate(r[0], Session.getScriptTimeZone(), 'yyyy-MM-dd') === dateKey);
  if (!match) return;

  const productConfig = {
    'Cake':       { totalIdx: 2, usedIdx: 3, label: 'cake slots' },
    'Cupcakes':   { totalIdx: 4, usedIdx: 5, label: 'cupcake dozens' },
    'Bomboloni':  { totalIdx: 6, usedIdx: 7, label: 'bomboloni batches' },
  }[product];
  if (!productConfig) return;

  const total = match[productConfig.totalIdx];
  const used = match[productConfig.usedIdx];   // already includes this row via COUNTIFS
  const isBlocked = match[8] === 'Y';

  let msg = '';
  if (isBlocked) {
    msg = `⚠ ${dateKey} is blocked: ${match[9] || 'no reason set'}`;
  } else if (used > total) {
    msg = `⚠ Over capacity: ${used}/${total} ${productConfig.label} on ${dateKey}`;
  } else if (used === total) {
    msg = `⚠ At capacity: ${used}/${total} ${productConfig.label} on ${dateKey}`;
  }

  if (msg) {
    sheet.getRange(row, ORDERS_DELIVERY_COL).setNote(msg);
    SpreadsheetApp.getActiveSpreadsheet().toast(msg, 'Capacity check', 8);
  } else {
    sheet.getRange(row, ORDERS_DELIVERY_COL).clearNote();
  }
}

function reseedCapacityCalendar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cap = ss.getSheetByName(CAP_SHEET);
  const today = new Date(); today.setHours(0,0,0,0);

  // Read existing dates → drop past ones
  const last = cap.getLastRow();
  const values = cap.getRange(2, 1, last - 1, 12).getValues();
  const future = values.filter(r => r[0] instanceof Date && r[0] >= today);

  // Find last future date
  let maxDate = future.length ? future[future.length - 1][0] : new Date(today);
  if (!(maxDate instanceof Date)) maxDate = new Date(today);
  const target = new Date(today); target.setDate(target.getDate() + 60);

  const toAppend = [];
  const cursor = new Date(maxDate);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= target) {
    const dow = cursor.getDay(); // 0=Sun, 6=Sat
    const isWeekend = (dow === 0 || dow === 6);
    toAppend.push([
      new Date(cursor),
      `=TEXT(A${future.length + 2 + toAppend.length},"ddd")`,
      isWeekend ? 5 : 3,
      `=COUNTIFS(Orders!E:E,A${future.length + 2 + toAppend.length},Orders!F:F,"Cake")`,
      4,
      `=COUNTIFS(Orders!E:E,A${future.length + 2 + toAppend.length},Orders!F:F,"Cupcakes")`,
      1,
      `=COUNTIFS(Orders!E:E,A${future.length + 2 + toAppend.length},Orders!F:F,"Bomboloni")`,
      'N',
      '',
      `=IFERROR((D${future.length + 2 + toAppend.length}/C${future.length + 2 + toAppend.length}+F${future.length + 2 + toAppend.length}/E${future.length + 2 + toAppend.length}+H${future.length + 2 + toAppend.length}/G${future.length + 2 + toAppend.length})/3,0)`,
      '',
    ]);
    cursor.setDate(cursor.getDate() + 1);
  }

  // Rewrite the future + new rows starting at row 2
  cap.getRange(2, 1, Math.max(last - 1, 1), 12).clearContent();
  const out = future.concat(toAppend);
  if (out.length) {
    cap.getRange(2, 1, out.length, 12).setValues(out);
  }
  ss.toast(`Capacity calendar reseeded — ${out.length} rows`, 'Done', 5);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('CRM')
    .addItem('Reseed capacity calendar (60 days)', 'reseedCapacityCalendar')
    .addItem('Email weekly occasions digest', 'sendOccasionsDigest')
    .addItem('Queue today\'s feedback requests', 'queueFeedbackRequests')
    .addToUi();
}

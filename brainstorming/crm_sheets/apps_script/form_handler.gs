/**
 * form_handler.gs — onFormSubmit hook for the Inquiries tab
 *
 * INSTALL
 *   1. Open the spreadsheet → Extensions → Apps Script
 *   2. Paste this file into a new script file named "form_handler"
 *   3. Triggers (clock icon) → Add Trigger:
 *        - Function: onInquiryFormSubmit
 *        - Event source: From spreadsheet
 *        - Event type: On form submit
 *   4. Authorise Gmail + Sheets scopes when prompted
 *
 * WHAT IT DOES
 *   When a Google Form response lands in the Inquiries tab, this:
 *     - Stamps inquiry_id (column A)
 *     - Freezes created_at (column P) as a static timestamp (no more recompute)
 *     - Defaults status = "New" (column J)
 *     - Defaults assigned_to = "Shreya" (column K)
 *     - Copies the consent checkbox into consent_captured (column O)
 *
 * The form field "I'm OK with Tiered Cake Company saving my contact…"
 * is the consent checkbox; this script reads it by header label.
 */

const SHEET_NAME = 'Inquiries';
const CONSENT_HEADER_FRAGMENT = "OK with A Moment";  // matches the consent question
const STATUS_COL = 10;          // J
const ASSIGNED_COL = 11;        // K
const CONSENT_COL = 15;         // O
const CREATED_AT_COL = 16;      // P
const ID_COL = 1;               // A
const DEFAULT_ASSIGNEE = 'Shreya';

function onInquiryFormSubmit(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return;

  const row = e.range.getRow();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // inquiry_id — formula already self-computes from ROW(); force-write as text
  // so sorting doesn't break it.
  const id = 'INQ-' + String(row - 1).padStart(4, '0');
  sheet.getRange(row, ID_COL).setValue(id);

  // status default
  if (!sheet.getRange(row, STATUS_COL).getValue()) {
    sheet.getRange(row, STATUS_COL).setValue('New');
  }

  // assigned_to default
  if (!sheet.getRange(row, ASSIGNED_COL).getValue()) {
    sheet.getRange(row, ASSIGNED_COL).setValue(DEFAULT_ASSIGNEE);
  }

  // consent — Google Form checkboxes arrive as the checked label text or empty
  // Find the consent column in the form-mapped headers (form columns may shift
  // if you reorder; matching by header fragment is robust).
  const consentColIdx = headers.findIndex(h => String(h).indexOf(CONSENT_HEADER_FRAGMENT) >= 0);
  if (consentColIdx >= 0) {
    const consentRaw = sheet.getRange(row, consentColIdx + 1).getValue();
    sheet.getRange(row, CONSENT_COL).setValue(consentRaw ? 'Y' : 'N');
  } else {
    sheet.getRange(row, CONSENT_COL).setValue('N');
  }

  // created_at — freeze as static timestamp
  sheet.getRange(row, CREATED_AT_COL).setValue(new Date());
}

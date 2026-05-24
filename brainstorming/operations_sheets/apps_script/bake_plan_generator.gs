/**
 * bake_plan_generator.gs — nightly Bake Plan refresh from CRM Orders
 *
 * INSTALL
 *   1. In 02_Operations.xlsx: Extensions → Apps Script → new file "bake_plan_generator"
 *   2. Set CRM_SPREADSHEET_ID below to the CRM file's ID (long string in URL)
 *   3. Triggers (clock icon) → Add Trigger:
 *        - Function: regenerateBakePlan
 *        - Event source: Time-driven
 *        - Type: Day timer → 23:00–00:00 IST (nightly)
 *   4. Authorise SpreadsheetApp + DriveApp scopes when prompted
 *
 * WHAT IT DOES
 *   Reads CRM Orders for next 7 days (delivery_date between TODAY and TODAY+7).
 *   For each order, writes a Bake Plan row.
 *   Preserves existing Production status + Notes if a Bake Plan row already
 *   exists for that Order ID (operator may have updated it during the day).
 *   New rows default Production status = "Queued", Bake date = delivery_date - 1 day.
 *   Linked Recipe ID is looked up from Recipes by Product (first match).
 *
 * CONFIG — edit the constant below.
 */

const CRM_SPREADSHEET_ID_BP = 'PASTE_CRM_FILE_ID_HERE';

// CRM Orders column indices (1-based)
const CRM_ORDER_ID_COL_BP = 1;        // A
const CRM_NAME_COL_BP = 3;            // C
const CRM_DELIVERY_DATE_COL_BP = 5;   // E
const CRM_PRODUCT_COL_BP = 6;         // F
const CRM_SIZE_COL_BP = 8;            // H
const CRM_CUSTOM_COL_BP = 9;          // I

// Operations Bake Plan column indices (1-based)
const BP_DELIVERY_COL = 1;
const BP_ORDER_ID_COL = 2;
const BP_CUSTOMER_COL = 3;
const BP_PRODUCT_COL = 4;
const BP_QTY_COL = 5;
const BP_CUSTOM_COL = 6;
const BP_PROD_STATUS_COL = 7;
const BP_BAKE_DATE_COL = 8;
const BP_RECIPE_ID_COL = 9;
const BP_NOTES_COL = 10;

// Recipes column indices (1-based)
const REC_ID_COL = 1;
const REC_PRODUCT_COL = 2;

const OPS_SHEET = SpreadsheetApp.getActiveSpreadsheet();
const HORIZON_DAYS = 7;

function regenerateBakePlan() {
  const crm = SpreadsheetApp.openById(CRM_SPREADSHEET_ID_BP);
  const orders = crm.getSheetByName('Orders');
  const bakePlan = OPS_SHEET.getSheetByName('Bake Plan');
  const recipes = OPS_SHEET.getSheetByName('Recipes');

  if (!orders || !bakePlan || !recipes) {
    Logger.log('Missing required sheet — abort');
    return;
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const horizon = new Date(today); horizon.setDate(horizon.getDate() + HORIZON_DAYS);

  // Read CRM Orders
  const ordersLast = orders.getLastRow();
  const ordersData = ordersLast >= 2
    ? orders.getRange(2, 1, ordersLast - 1, CRM_CUSTOM_COL_BP).getValues()
    : [];

  // Filter to next 7 days
  const upcoming = ordersData.filter(r => {
    const d = r[CRM_DELIVERY_DATE_COL_BP - 1];
    if (!(d instanceof Date)) return false;
    const dn = new Date(d); dn.setHours(0, 0, 0, 0);
    return dn >= today && dn <= horizon;
  });

  // Read existing Bake Plan rows to preserve operator-updated fields
  const bpLast = bakePlan.getLastRow();
  const existingByOrderId = {};
  if (bpLast >= 2) {
    const bpData = bakePlan.getRange(2, 1, bpLast - 1, BP_NOTES_COL).getValues();
    bpData.forEach(r => {
      const oid = r[BP_ORDER_ID_COL - 1];
      if (oid) existingByOrderId[oid] = {
        prod_status: r[BP_PROD_STATUS_COL - 1],
        notes: r[BP_NOTES_COL - 1],
      };
    });
  }

  // Build Recipe lookup: Product → first Recipe ID
  const recipesLast = recipes.getLastRow();
  const recipeByProduct = {};
  if (recipesLast >= 2) {
    const recData = recipes.getRange(2, 1, recipesLast - 1, REC_PRODUCT_COL).getValues();
    recData.forEach(r => {
      const product = r[REC_PRODUCT_COL - 1];
      const recId = r[REC_ID_COL - 1];
      if (product && recId && !recipeByProduct[product]) {
        recipeByProduct[product] = recId;
      }
    });
  }

  // Build new Bake Plan rows
  const newRows = upcoming.map(r => {
    const orderId = r[CRM_ORDER_ID_COL_BP - 1];
    const deliveryDate = r[CRM_DELIVERY_DATE_COL_BP - 1];
    const bakeDate = new Date(deliveryDate); bakeDate.setDate(bakeDate.getDate() - 1);
    const existing = existingByOrderId[orderId] || {};
    const product = r[CRM_PRODUCT_COL_BP - 1];
    return [
      deliveryDate,
      orderId,
      r[CRM_NAME_COL_BP - 1],
      product,
      r[CRM_SIZE_COL_BP - 1],
      r[CRM_CUSTOM_COL_BP - 1],
      existing.prod_status || 'Queued',
      bakeDate,
      recipeByProduct[product] || '',
      existing.notes || '',
    ];
  });

  // Clear and rewrite Bake Plan (rows 2 onward)
  if (bpLast >= 2) {
    bakePlan.getRange(2, 1, bpLast - 1, BP_NOTES_COL).clearContent();
  }
  if (newRows.length) {
    // Sort by delivery date asc, then by Product
    newRows.sort((a, b) => {
      const da = a[BP_DELIVERY_COL - 1].getTime();
      const db = b[BP_DELIVERY_COL - 1].getTime();
      if (da !== db) return da - db;
      return String(a[BP_PRODUCT_COL - 1]).localeCompare(String(b[BP_PRODUCT_COL - 1]));
    });
    bakePlan.getRange(2, 1, newRows.length, BP_NOTES_COL).setValues(newRows);
  } else {
    bakePlan.getRange(2, 1).setValue('(no orders in next 7 days)').setFontStyle('italic');
  }
}

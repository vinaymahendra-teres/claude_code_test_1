# Finance Sheets — Phase 1a Install Guide

> Read [finance_strategy.md](../finance_strategy.md) for the design rationale. This file is the **operator-facing install path** — get from zero to a working sheet in ~20 minutes.

## What's in this folder

| File | What it does |
|---|---|
| `TieredCakeCompany_Finance.xlsx` | Starter spreadsheet. Import to Google Sheets. |
| `build_xlsx.py` | Regenerator. Re-run after any schema change. |
| `apps_script/upi_reconciler.gs` | Daily cross-file reconciliation job |

---

## Phase 1a scope

Three tabs: **Money In**, **Bank vs UPI Float**, **UPI Reconciliation**. Plus the in-workbook README.

What this gives you on day 1:
- A clean place to log every UPI / cash / bank inflow
- Three running balances (Bank, UPI float, Cash drawer) updating automatically
- A daily auto-cross-check between your inflows and CRM orders, surfacing both "money received but no order" and "order paid but no money logged"

Later sub-phases (1b–1e) add Compliance, Money Out, P&L, Capex, and Founder Draws to the same file by extending `build_xlsx.py`.

---

## Phase 0 — Import the spreadsheet (5 min)

1. Open https://sheets.google.com → blank spreadsheet.
2. `File` → `Import` → `Upload` → drop `TieredCakeCompany_Finance.xlsx`.
3. Import location: **Replace spreadsheet**.
4. Click `Import data`.
5. Rename the spreadsheet (top-left) to `03_Finance`.
6. Verify all 4 tabs landed: `README`, `Money In`, `Bank vs UPI Float`, `UPI Reconciliation`.
7. Open `Bank vs UPI Float` — current balance cells should resolve (not `#REF!`).
8. Delete the yellow-highlighted EXAMPLE rows once you've eyeballed them.

---

## Phase 1 — Set opening balances (5 min, one-time)

On the `Bank vs UPI Float` tab:

1. For each account row, enter:
   - The actual balance today (check your bank app, GPay/PhonePe balance, and cash drawer).
   - Today's date in `Opening date`.
2. Don't ever edit these once set. From here on, the formula keeps them current by summing Money In entries after the opening date.

---

## Phase 2 — Install upi_reconciler.gs (10 min)

1. `Extensions` → `Apps Script` (this opens an editor for `03_Finance`'s script).
2. Click `+` next to `Files` → `Script`. Name it `upi_reconciler`.
3. Paste the contents of `apps_script/upi_reconciler.gs`.
4. **Edit three lines** at the top of the script:
   - `CRM_SPREADSHEET_ID` — open `01_CRM_Sales`, copy the long string from its URL (between `/d/` and `/edit`), paste here.
   - `RECIPIENT` — your email (Shreya's, since she resolves the exceptions).
   - `BAKERY_BRAND` — your operating name.
5. Save (Cmd-S).
6. Top toolbar → `Run` → select `reconcileUpi`. Authorise SpreadsheetApp + DriveApp + MailApp scopes when prompted. The first run will operate on the sample data shipped in the xlsx.
7. Open the `UPI Reconciliation` tab and confirm Section A and B are now populated.
8. Triggers (clock icon, left sidebar) → `+ Add Trigger`:
   - Function: `reconcileUpi`
   - Event source: Time-driven
   - Type: Day timer → 09:00–10:00 IST.

---

## Phase 3 — Daily workflow (steady state)

**End of day, Sh:**
1. Open GPay (or PhonePe) app. Scroll through today's transactions.
2. For each customer payment, add a row to `Money In`:
   - Date, Time (HH:MM as shown in app)
   - Channel (UPI-GPay / UPI-PhonePe / etc.)
   - Account credited (UPI float for UPI / Bank for NEFT / Cash drawer for cash)
   - Amount
   - UTR (12-digit from the GPay "Transaction details" screen — long-press the entry to copy)
   - Payer VPA (`name@oksbi` style)
   - Counter-party name (whatever GPay shows as sender)
3. Leave `Matched Order ID` blank — the reconciler fills it overnight.

**Next morning, both:**
1. Glance at the email digest from `upi_reconciler.gs` (only sent if exceptions exist).
2. Open `UPI Reconciliation` tab and resolve:
   - **Section A row?** Find which order the inflow belongs to; type the Order ID into the matching Money In row's `Matched Order ID` column. (Or correct the UTR if it was mistyped.)
   - **Section B row?** Either chase the customer ("Just checking — did the ₹2000 transfer go through?") or log the missing Money In row now.

Typical day at cottage volumes: 0–2 of each. The exceptions are the entire point of the system.

---

## Regenerating the .xlsx

If you change the schema (add a column, change a validation list, etc.):

```bash
cd brainstorming/finance_sheets
python3 build_xlsx.py
```

Requires Python 3 + openpyxl (`pip install openpyxl`).

The generator is the **single source of truth** for headers, formulas, validations, and seeded sample data. Don't edit the xlsx by hand and expect the regenerator to honour it.

---

## Troubleshooting

### `upi_reconciler.gs` fails with "Cannot read property 'getSheetByName' of null"
- `CRM_SPREADSHEET_ID` is wrong. Open the CRM sheet, copy the ID from the URL (the long string between `/d/` and `/edit`), paste exactly.

### Reconciler runs but nothing populates in Section A or B
- Sample data is fully matched in the demo (12 of 14 UPI inflows match orders; 2 don't). After Sh starts using it for real, exceptions appear.
- If you've deleted the sample data and your real data is fully clean, that's the goal.

### `Bank vs UPI Float` Current balance shows `#NAME?` or wrong value
- The `Inflows since opening` formula uses `'Money In'!E:E` — verify the Money In tab is exactly named "Money In" (with the space, no underscores).
- The formula maps Account column A: any name starting with "Bank" → Bank inflows; "UPI" → UPI float inflows; anything else → Cash drawer. If you rename accounts, keep the first 3-4 characters consistent.

### A customer paid me directly to my bank (NEFT) but it's logged as UPI
- Change `Channel` to "Bank Transfer" and `Account credited` to "Bank". Leave UTR blank (NEFT doesn't have UPI UTRs; the bank reference number can go in Notes).
- The reconciler ignores non-UPI channels for Section A (it only flags UPI inflows without matches).

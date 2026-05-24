# Operations Sheets — Phase 2a Install Guide

> Read [operations_strategy.md](../operations_strategy.md) for the design rationale. This file is the **operator-facing install path** — get from zero to a working Operations sheet in ~30 minutes.

## What's in this folder

| File | What it does |
|---|---|
| `TieredCakeCompany_Operations.xlsx` | Starter spreadsheet. Import to Google Sheets. |
| `build_xlsx.py` | Regenerator. Re-run after any schema change. |
| `apps_script/bake_plan_generator.gs` | Nightly production queue builder (Phase 2b — not yet delivered) |
| `apps_script/par_breach_alerter.gs` | Daily PAR breach emailer + PO drafter (Phase 2b — not yet delivered) |

---

## Phase 0 — Import the spreadsheet (5 min)

1. Open https://sheets.google.com → blank spreadsheet.
2. `File` → `Import` → `Upload` → drop `TieredCakeCompany_Operations.xlsx`.
3. Import location: **Replace spreadsheet**.
4. Click `Import data`.
5. Rename the spreadsheet (top-left) to `02_Operations`.
6. Verify all 7 tabs landed: `README`, `Recipes`, `Ingredients`, `Bake Plan`, `Equipment Maintenance`, `Vendors`, `Purchase Orders`.
7. Open `Ingredients` — the `Reorder due?` column (L) should show "YES" for Atta and Butter (both are in PAR breach in the sample data).
8. Delete the yellow-highlighted EXAMPLE rows once you've eyeballed them, then enter your own data.

---

## Phase 1 — Seed Recipes, Ingredients, and Vendors (one-time setup, ~25 min)

### Recipes tab

One row per ingredient per product. Work through your full product list:

1. For each product (Cake 1kg, Cake 2kg, Cupcakes 1 dozen, Brownies 12, Cake Tub 6, Bomboloni 6):
   - Add one row per ingredient used in that product.
   - Fill in Quantity (how much per batch), Unit, and Unit cost (₹ per gram/ml/each — divide the packet price by total grams/ml in the packet).
   - The `Line cost (₹)` column (G) computes automatically.
2. The `Recipe ID` column (A) auto-generates as you fill column B.

**Tip:** Start with the two or three products you make most often. You can add more recipes later without disrupting existing rows.

### Ingredients tab

One row per ingredient SKU (not one per batch — this is a master list):

1. Clear the sample data. Add each ingredient you actually stock.
2. For each ingredient:
   - Set **Current stock** to what you have in the pantry right now (count or estimate).
   - Set **PAR** to the minimum working stock below which you'd run out before your next shopping trip. If you buy flour weekly, PAR = 1 week of usage. If you buy chocolate monthly, PAR = 2–3 weeks.
   - Set **Reorder qty** to what you'd typically order in one go.
3. The `Reorder due?` column (L) auto-flags any row where current stock < PAR.

**Review PAR levels quarterly** — as your order volume changes, so does your weekly ingredient burn rate.

### Vendors tab

One row per supplier you use regularly:

1. Clear the sample data. Add each vendor (ingredient suppliers, box suppliers, utility providers).
2. Fill in contact phone (WhatsApp number if that's how you order), lead time, and MOQ.
3. **Vendor name must match exactly** what you'll type in Ingredients → Preferred vendor and in Purchase Orders → Vendor. Consistency enables future automation.

---

## Phase 2 — Install Apps Scripts (Phase 2b — defer for now)

Apps Scripts are the next delivery (Phase 2b). For now, note what's coming:

### `bake_plan_generator.gs`
- Runs nightly at 23:00 IST.
- Reads Confirmed + In Production orders from `01_CRM_Sales`.
- Writes tomorrow's production queue to the Bake Plan tab, sorted by bake start time.
- Swetha reads the Bake Plan each morning without having to manually cross-reference the CRM.

### `par_breach_alerter.gs`
- Runs daily at 09:00 IST.
- Reads `Reorder due?` column in the Ingredients tab.
- Emails Shreya with a list of breached ingredients and suggested PO lines.
- Auto-drafts PO rows in the Purchase Orders tab for breaches not already covered by an open PO.

**To install (when Phase 2b is delivered):**
1. Open `02_Operations` in Google Sheets.
2. `Extensions` → `Apps Script`.
3. For each script file:
   - Click `+` next to `Files` → `Script`.
   - Name it (e.g. `bake_plan_generator`).
   - Paste the contents of the corresponding `.gs` file from the `apps_script/` folder.
4. Edit the configuration constants at the top of each script:
   - `CRM_SPREADSHEET_ID` — open `01_CRM_Sales`, copy the ID from its URL (the long string between `/d/` and `/edit`).
   - `OPS_SPREADSHEET_ID` — same process for `02_Operations`.
   - `RECIPIENT` — Shreya's email address for PAR breach alerts.
5. Run each script once manually to authorise scopes.
6. Add triggers (clock icon in the Apps Script sidebar):
   - `bake_plan_generator`: Time-driven → Day timer → 23:00–00:00 IST.
   - `par_breach_alerter`: Time-driven → Day timer → 09:00–10:00 IST.

---

## Phase 3 — Daily workflow (steady state)

### Swetha — every morning

1. Open `Bake Plan` tab. The script ran overnight — today's production queue is ready.
2. Work through the queue top-to-bottom (sorted by bake start date).
3. As each stage completes, update `Production status`: Queued → Prep → Bake → Decorate → Done.
4. Check `Equipment Maintenance` tab. If any row shows "Schedule now" or "OVERDUE", book the service before starting the day's bake.

### Swetha — after each bake session

1. Update `Current stock` in the Ingredients tab for each ingredient used. Subtract what you used.
   - This doesn't need to be exact to the gram — a reasonable approximation is fine. The purpose is to keep PAR breach detection honest.

### Shreya — every morning

1. Check the PAR breach email from `par_breach_alerter.gs` (once installed).
2. For each breach: open `Purchase Orders` tab, find the auto-drafted PO, review it, and send the order to the vendor (WhatsApp / phone / email).
3. Update `Status` to "Sent".

### When a delivery arrives

1. Update `Purchase Orders.Status` → "Received".
2. Update `Ingredients.Current stock` with the new quantity (add the received amount to existing stock).
3. Update `Ingredients.Last reorder date` to today.

### When payment is made to a vendor

1. Log the outflow in `03_Finance` → `Money Out` tab. Fill in `Linked PO ID`.
2. Come back to `Purchase Orders` → update `Status` to "Paid" and fill in `Linked Money Out ID`.

---

## Regenerating the .xlsx

If you change the schema (add a column, change a validation list, add sample data):

```bash
cd brainstorming/operations_sheets
python3 build_xlsx.py
```

Requires Python 3 + openpyxl (`pip install openpyxl`).

The generator is the **single source of truth** for headers, formulas, validations, and sample data. Make your changes in `build_xlsx.py`, regenerate, re-import to Google Sheets. Do not edit the xlsx by hand and expect the regenerator to honour it.

---

## Troubleshooting

### `Reorder due?` column shows blank even though stock looks low
- The formula is `=IF(E2<F2,"YES","")`. Check that `Current stock` (col E) and `PAR` (col F) are numbers, not text. If you typed "2 kg" instead of just "2", the comparison will fail silently.

### Bake Plan is empty / not populating
- `bake_plan_generator.gs` has not been installed yet (Phase 2b) — that's expected in Phase 2a.
- Once installed: if the Bake Plan is still empty after the first overnight run, check the Apps Script execution log (`Extensions` → `Apps Script` → `Executions` tab) for errors. The most common cause is a wrong `CRM_SPREADSHEET_ID`.

### `Next service due` in Equipment Maintenance shows `#VALUE!`
- `Last service date` (col B) is a text string, not a date. Click the cell and re-enter the date using the date picker (or type `2026-05-24` format and confirm Google Sheets treats it as a date — it turns right-aligned).

### PAR breach email not arriving
- Check that `par_breach_alerter.gs` has MailApp scope authorised. In Apps Script, `Run` → select `alertParBreaches` → if it prompts for authorisation, grant it. Then check spam.

### A PO was auto-drafted but the vendor name looks wrong
- `par_breach_alerter.gs` copies the vendor name from `Ingredients.Preferred vendor`. If the name doesn't exactly match a row in the `Vendors` tab, it's likely a typo in one of the two tabs. Fix the discrepancy and re-run the script.

### Purchase Orders `PO ID` column shows `#REF!` after inserting a row
- The auto-ID formula (`=IF(B2="","","PO-"&TEXT(ROW()-1,"0000"))`) uses `ROW()` and is sensitive to row insertion in the middle of the table. Always add new POs at the bottom of the existing data, not by inserting rows. Delete the `PO ID` formula from any `#REF!` cells and re-enter it manually for the affected rows.

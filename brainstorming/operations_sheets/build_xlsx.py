#!/usr/bin/env python3
"""
Regenerate TieredCakeCompany_Operations.xlsx from scratch (Phase 2a scope).

Re-run after any schema change. Headers, formulas, validation lists, and
sample data are all defined here — single source of truth.

    python3 build_xlsx.py

Phase 2 tabs: README, Recipes, Ingredients, Bake Plan, Equipment Maintenance,
Vendors, Purchase Orders.

Sample data covers 3 recipes (21 BOM rows), 15 ingredients, 5 equipment rows,
7 vendors, and 5 POs — including PO-0001 through PO-0004 cross-references
already present in the Finance Money Out sample data.
"""
from datetime import date
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

OUT = Path(__file__).parent / "TieredCakeCompany_Operations.xlsx"
TODAY = date(2026, 5, 24)

HEADER_FILL = PatternFill("solid", fgColor="1F2937")
HEADER_FONT = Font(bold=True, color="FFFFFF")
EXAMPLE_FILL = PatternFill("solid", fgColor="FEF3C7")
DERIVED_FILL = PatternFill("solid", fgColor="EFF6FF")
SECTION_FILL = PatternFill("solid", fgColor="E5E7EB")


def style_header(ws, n_cols: int) -> None:
    for c in range(1, n_cols + 1):
        cell = ws.cell(row=1, column=c)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    ws.row_dimensions[1].height = 36
    ws.freeze_panes = "A2"


def set_widths(ws, widths: dict) -> None:
    for col, w in widths.items():
        ws.column_dimensions[get_column_letter(col)].width = w


def add_list_validation(ws, options, col_letter: str, last_row: int = 1000) -> None:
    formula = '"' + ",".join(options) + '"'
    dv = DataValidation(type="list", formula1=formula, allow_blank=True, showDropDown=False)
    dv.add(f"{col_letter}2:{col_letter}{last_row}")
    ws.add_data_validation(dv)


# ----------------------------------------------------------------------------
# Sample data
# ----------------------------------------------------------------------------

# Tab 1: Recipes — BOM rows
# Each tuple: (product, ingredient, quantity, unit, unit_cost, notes)
RECIPES_SAMPLE = [
    # Eggless dark chocolate cake — 2kg (10-row BOM)
    ("Cake (2kg)", "Maida (refined flour)", 500, "g", 0.06, "Metro Cash & Carry — Sunfeast"),
    ("Cake (2kg)", "Cocoa powder (Dutch process)", 100, "g", 1.20, "Vanhouten — Metro"),
    ("Cake (2kg)", "Castor sugar", 450, "g", 0.08, "Local"),
    ("Cake (2kg)", "Baking powder", 12, "g", 0.50, "Weikfield"),
    ("Cake (2kg)", "Baking soda", 6, "g", 0.40, ""),
    ("Cake (2kg)", "Curd (yoghurt) — substitute for eggs", 300, "ml", 0.08, "Heritage"),
    ("Cake (2kg)", "Refined oil", 250, "ml", 0.15, ""),
    ("Cake (2kg)", "Whipping cream (dairy)", 800, "ml", 0.45, "Amul + Rich's mix"),
    ("Cake (2kg)", "Dark chocolate (couverture 55%)", 400, "g", 0.85, "Callebaut"),
    ("Cake (2kg)", "Cocoa for dusting + decoration", 30, "g", 1.20, ""),
    # Vanilla cupcakes — 1 dozen (6-row BOM)
    ("Cupcakes (1 dozen)", "Maida", 240, "g", 0.06, ""),
    ("Cupcakes (1 dozen)", "Castor sugar", 180, "g", 0.08, ""),
    ("Cupcakes (1 dozen)", "Butter (Amul salted)", 180, "g", 0.55, "Amul"),
    ("Cupcakes (1 dozen)", "Eggs", 3, "each", 8.00, "Country chicken"),
    ("Cupcakes (1 dozen)", "Vanilla extract (Sprig)", 5, "ml", 5.00, "Sprig"),
    ("Cupcakes (1 dozen)", "Buttercream icing (pre-made base)", 200, "g", 0.35, ""),
    # Plain bomboloni — 6 pieces (5-row BOM)
    ("Bomboloni (6)", "Maida", 250, "g", 0.06, ""),
    ("Bomboloni (6)", "Castor sugar", 30, "g", 0.08, ""),
    ("Bomboloni (6)", "Active dry yeast", 5, "g", 4.00, "Mauri / SAF"),
    ("Bomboloni (6)", "Whole milk", 150, "ml", 0.06, "Heritage"),
    ("Bomboloni (6)", "Refined oil for frying", 500, "ml", 0.15, "Sunflower — counts as opex if discarded"),
]

# Tab 2: Ingredients — stock + PAR levels
# Each tuple: (name, category, unit, current_stock, par, reorder_qty, vendor,
#              avg_cost, days_cover, last_reorder, notes)
INGREDIENTS_SAMPLE = [
    ("Maida (refined flour)", "Flour", "kg", 12, 8, 25, "Metro Cash & Carry", 60, 14, date(2026, 5, 4), ""),
    ("Atta (whole wheat)", "Flour", "kg", 3, 5, 10, "Metro Cash & Carry", 55, 21, date(2026, 4, 28), "PAR breach"),
    ("Castor sugar", "Sugar", "kg", 8, 5, 15, "Metro Cash & Carry", 80, 14, date(2026, 5, 4), ""),
    ("Icing sugar", "Sugar", "kg", 2, 2, 5, "Metro Cash & Carry", 110, 14, date(2026, 5, 11), "At PAR — watch"),
    ("Cocoa powder (Dutch)", "Flour", "g", 800, 500, 1000, "Metro Cash & Carry", 1.20, 30, date(2026, 5, 4), "Vanhouten"),
    ("Couverture chocolate 55%", "Specialty", "kg", 4, 3, 5, "Callebaut Distributor — Hyd", 850, 21, date(2026, 5, 14), "Callebaut block"),
    ("Butter (Amul salted)", "Fat", "kg", 1.5, 2, 4, "Vijetha Supermarket", 550, 7, date(2026, 5, 11), "PAR breach"),
    ("Refined oil (sunflower)", "Fat", "L", 5, 3, 5, "Vijetha Supermarket", 150, 14, date(2026, 5, 7), ""),
    ("Whipping cream (dairy)", "Dairy", "L", 2, 1.5, 3, "Amul (Vijetha)", 450, 4, date(2026, 5, 18), ""),
    ("Curd (yoghurt)", "Dairy", "L", 2, 2, 3, "Heritage Dairy", 80, 3, date(2026, 5, 22), "Refresh every 3 days"),
    ("Whole milk", "Dairy", "L", 4, 3, 5, "Heritage Dairy", 60, 3, date(2026, 5, 22), ""),
    ("Eggs (country chicken)", "Egg", "each", 30, 24, 60, "Local poultry vendor", 8, 10, date(2026, 5, 14), ""),
    ("Vanilla extract (Sprig)", "Flavour", "ml", 80, 50, 100, "Sprig direct", 5.00, 60, date(2026, 4, 12), ""),
    ("Gel food colour set", "Colour", "each", 8, 6, 12, "Hobby Ideas", 280, 90, date(2026, 3, 10), "12-shade Wilton set"),
    ("Active dry yeast (SAF)", "Specialty", "g", 200, 100, 500, "Metro Cash & Carry", 4.00, 30, date(2026, 5, 4), "Bomboloni-critical"),
]

# Tab 4: Equipment Maintenance
# Each tuple: (equipment, last_service, interval_days, vendor, cost, notes)
MAINTENANCE_SAMPLE = [
    ("OTG", date(2026, 1, 15), 180, "Morphy Richards service centre — Banjara Hills", 850,
     "Element check + thermostat calibration"),
    ("Gas Hob", date(2026, 3, 1), 365, "Prestige authorised service", 0,
     "Annual safety check; gratis under warranty"),
    ("Chimney", date(2026, 2, 10), 90, "Local technician", 1200,
     "Filter clean + ducting inspection every 3 months"),
    ("Stand Mixer", None, 365, "(KitchenAid — under warranty)", 0,
     "New unit; first service due May 2027"),
    ("Microwave-Convection", date(2025, 11, 20), 365, "Samsung authorised service", 0,
     "Door seal + magnetron"),
]

# Tab 5: Vendors (procurement-side)
# Each tuple: (name, category, phone, lead_time_days, moq, payment_mode, vpa_account, notes)
VENDORS_SAMPLE = [
    ("Metro Cash & Carry", "Ingredient supplier", "1800-102-6272", 1, "No strict MOQ",
     "UPI-PhonePe", "metrocc@hdfcbank",
     "HoReCa section; bulk; visit weekly. Maida, sugar, cocoa, butter."),
    ("Vijetha Supermarket", "Ingredient supplier", "040-XXXXXXXX", 0, "No MOQ",
     "UPI-GPay", "vijetha@oksbi",
     "Walk-in top-up. Within walking distance. Butter, eggs, dairy."),
    ("Heritage Dairy", "Ingredient supplier", "040-XXXXXXXX", 0, "2L minimum",
     "UPI-GPay", "heritage@okhdfc",
     "Fresh delivery 2x/week. Curd, milk, cream."),
    ("Amul (via Vijetha)", "Ingredient supplier", "", 0, "No MOQ",
     "UPI-GPay", "vijetha@oksbi",
     "Amul butter + whipping cream sourced through Vijetha."),
    ("Callebaut Distributor — Hyd", "Ingredient supplier", "9XXXXXXXXX", 2, "1kg block",
     "UPI-PhonePe", "callebaut@okicici",
     "Couverture chocolate; 5kg blocks; 2-day lead time. Hyderabad distributor."),
    ("Wholesale Box Supplier — Madhapur", "Packaging", "9XXXXXXXXX", 3, "50 units/SKU",
     "Bank Transfer", "9876543210@upi",
     "Cake boxes, cupcake clamshells, ribbons, stickers. 2-3 day lead."),
    ("Sprig direct", "Ingredient supplier", "", 7, "No strict MOQ",
     "Bank Transfer", "",
     "Vanilla extract + other Sprig flavours. Ships via courier from Goa; 5-7 day lead."),
]

# Tab 6: Purchase Orders
# Each tuple: (vendor, raised_on, expected, items, total, status, linked_money_out_id, notes)
POS_SAMPLE = [
    ("Metro Cash & Carry", date(2026, 5, 3), date(2026, 5, 4),
     "Maida 25kg + Castor sugar 15kg + Butter 4kg + Cocoa 1kg", 2840, "Paid", "MOUT-0001",
     "Weekly restock"),
    ("Callebaut Distributor — Hyd", date(2026, 5, 12), date(2026, 5, 14),
     "Couverture dark 55% — 5kg block", 3200, "Paid", "MOUT-0004",
     "Standard reorder; 21-day stock"),
    ("Wholesale Box Supplier — Madhapur", date(2026, 5, 8), date(2026, 5, 9),
     "100 × 1kg cake boxes + 50 × cupcake clamshells + 200 ribbons", 4500, "Paid", "MOUT-0005",
     "Stock cover ~6 weeks"),
    ("KitchenAid India (Amazon)", date(2026, 5, 10), date(2026, 5, 12),
     "5KSM150 stand mixer — empire red", 38000, "Paid", "MOUT-0010",
     "Capex"),
    ("Vijetha Supermarket", date(2026, 5, 24), date(2026, 5, 25),
     "Atta 10kg + Butter 4kg (PAR breaches)", 2790, "Drafted", "",
     "Auto-drafted by par_breach_alerter.gs (will be on first script run)"),
]


# ----------------------------------------------------------------------------
# Workbook
# ----------------------------------------------------------------------------
wb = Workbook()
wb.remove(wb.active)


# ----------------------------------------------------------------------------
# 1. Recipes
# ----------------------------------------------------------------------------
rec = wb.create_sheet("Recipes")
rec_headers = [
    "Recipe ID", "Product", "Ingredient", "Quantity", "Unit",
    "Unit cost (₹)", "Line cost (₹)", "Notes",
]
rec.append(rec_headers)
style_header(rec, len(rec_headers))
set_widths(rec, {1: 14, 2: 20, 3: 32, 4: 10, 5: 8, 6: 14, 7: 14, 8: 36})

# Formula rows: Recipe ID (col A) and Line cost (col G)
for r in range(2, 502):
    rec.cell(row=r, column=1,
             value=f'=IF(B{r}="","","REC-"&TEXT(ROW()-1,"0000"))').fill = DERIVED_FILL
    rec.cell(row=r, column=7,
             value=f'=IFERROR(D{r}*F{r},"")').fill = DERIVED_FILL

# Sample data
for offset, row in enumerate(RECIPES_SAMPLE):
    r = 2 + offset
    product, ingredient, qty, unit, unit_cost, notes = row
    rec.cell(row=r, column=2, value=product).fill = EXAMPLE_FILL
    rec.cell(row=r, column=3, value=ingredient).fill = EXAMPLE_FILL
    rec.cell(row=r, column=4, value=qty).fill = EXAMPLE_FILL
    rec.cell(row=r, column=5, value=unit).fill = EXAMPLE_FILL
    rec.cell(row=r, column=6, value=unit_cost).fill = EXAMPLE_FILL
    if notes:
        rec.cell(row=r, column=8, value=notes).fill = EXAMPLE_FILL

add_list_validation(rec, [
    "Cake (1kg)", "Cake (2kg)", "Cupcakes (1 dozen)", "Brownies (12)",
    "Cake Tub (6)", "Bomboloni (6)",
], "B")
add_list_validation(rec, ["g", "kg", "ml", "L", "each"], "E")


# ----------------------------------------------------------------------------
# 2. Ingredients
# ----------------------------------------------------------------------------
ing = wb.create_sheet("Ingredients")
ing_headers = [
    "Ingredient ID", "Ingredient name", "Category", "Unit",
    "Current stock", "PAR (reorder when below)", "Reorder qty",
    "Preferred vendor", "Avg cost per unit (₹)", "Days cover at typical use",
    "Last reorder date", "Reorder due?", "Notes",
]
ing.append(ing_headers)
style_header(ing, len(ing_headers))
set_widths(ing, {1: 14, 2: 30, 3: 14, 4: 8, 5: 13, 6: 20, 7: 12,
                 8: 28, 9: 16, 10: 16, 11: 14, 12: 12, 13: 36})

# Formula rows: Ingredient ID (col A) and Reorder due? (col L)
for r in range(2, 502):
    ing.cell(row=r, column=1,
             value=f'=IF(B{r}="","","ING-"&TEXT(ROW()-1,"0000"))').fill = DERIVED_FILL
    ing.cell(row=r, column=12,
             value=f'=IF(E{r}<F{r},"YES","")').fill = DERIVED_FILL

# Sample data
for offset, row in enumerate(INGREDIENTS_SAMPLE):
    r = 2 + offset
    name, category, unit, current_stock, par, reorder_qty, vendor, avg_cost, days_cover, last_reorder, notes = row
    ing.cell(row=r, column=2, value=name).fill = EXAMPLE_FILL
    ing.cell(row=r, column=3, value=category).fill = EXAMPLE_FILL
    ing.cell(row=r, column=4, value=unit).fill = EXAMPLE_FILL
    ing.cell(row=r, column=5, value=current_stock).fill = EXAMPLE_FILL
    ing.cell(row=r, column=6, value=par).fill = EXAMPLE_FILL
    ing.cell(row=r, column=7, value=reorder_qty).fill = EXAMPLE_FILL
    ing.cell(row=r, column=8, value=vendor).fill = EXAMPLE_FILL
    ing.cell(row=r, column=9, value=avg_cost).fill = EXAMPLE_FILL
    ing.cell(row=r, column=10, value=days_cover).fill = EXAMPLE_FILL
    ing.cell(row=r, column=11, value=last_reorder).fill = EXAMPLE_FILL
    if notes:
        ing.cell(row=r, column=13, value=notes).fill = EXAMPLE_FILL

add_list_validation(ing, [
    "Flour", "Sugar", "Dairy", "Fat", "Egg", "Flavour", "Colour", "Specialty", "Packaging",
], "C")
add_list_validation(ing, ["g", "kg", "ml", "L", "each"], "D")


# ----------------------------------------------------------------------------
# 3. Bake Plan  (empty — Apps Script fills this; headers + placeholder only)
# ----------------------------------------------------------------------------
bp = wb.create_sheet("Bake Plan")
bp_headers = [
    "Delivery date", "Order ID", "Customer", "Product", "Quantity",
    "Customisation", "Production status", "Bake date (when to start)",
    "Linked Recipe ID", "Notes",
]
bp.append(bp_headers)
style_header(bp, len(bp_headers))
set_widths(bp, {1: 13, 2: 12, 3: 22, 4: 20, 5: 10, 6: 32, 7: 16,
                8: 16, 9: 16, 10: 36})

# Placeholder row
placeholder = bp.cell(row=2, column=1,
                      value="(populated by bake_plan_generator.gs — nightly 23:00 IST)")
placeholder.font = Font(italic=True, color="6B7280")
bp.merge_cells("A2:J2")

add_list_validation(bp, [
    "Queued", "Prep", "Bake", "Decorate", "Done",
], "G")


# ----------------------------------------------------------------------------
# 4. Equipment Maintenance
# ----------------------------------------------------------------------------
maint = wb.create_sheet("Equipment Maintenance")
maint_headers = [
    "Equipment", "Last service date", "Service interval (days)", "Next service due",
    "Days until due", "Status", "Service vendor", "Cost last service (₹)", "Notes",
]
maint.append(maint_headers)
style_header(maint, len(maint_headers))
set_widths(maint, {1: 20, 2: 16, 3: 16, 4: 16, 5: 12, 6: 16, 7: 36, 8: 16, 9: 40})

# Formula rows: Next service due (D), Days until due (E), Status (F)
for r in range(2, 102):
    maint.cell(row=r, column=4,
               value=f'=IFERROR(B{r}+C{r},"")').fill = DERIVED_FILL
    maint.cell(row=r, column=5,
               value=f'=IFERROR(D{r}-TODAY(),"")').fill = DERIVED_FILL
    maint.cell(row=r, column=6,
               value=(f'=IF(E{r}="","",IF(E{r}<0,"OVERDUE",'
                      f'IF(E{r}<=14,"Schedule now","OK")))')).fill = DERIVED_FILL

# Sample data
for offset, row in enumerate(MAINTENANCE_SAMPLE):
    r = 2 + offset
    equipment, last_service, interval_days, vendor, cost, notes = row
    maint.cell(row=r, column=1, value=equipment).fill = EXAMPLE_FILL
    if last_service:
        maint.cell(row=r, column=2, value=last_service).fill = EXAMPLE_FILL
    maint.cell(row=r, column=3, value=interval_days).fill = EXAMPLE_FILL
    maint.cell(row=r, column=7, value=vendor).fill = EXAMPLE_FILL
    maint.cell(row=r, column=8, value=cost).fill = EXAMPLE_FILL
    maint.cell(row=r, column=9, value=notes).fill = EXAMPLE_FILL

add_list_validation(maint, [
    "OTG", "Stand Mixer", "Microwave-Convection", "Food Processor",
    "Gas Hob", "Chimney", "Kettle", "Other",
], "A")


# ----------------------------------------------------------------------------
# 5. Vendors
# ----------------------------------------------------------------------------
vend = wb.create_sheet("Vendors")
vend_headers = [
    "Vendor name", "Category", "Contact phone", "Lead time (days)", "MOQ",
    "Preferred payment mode", "VPA / Account", "Notes",
]
vend.append(vend_headers)
style_header(vend, len(vend_headers))
set_widths(vend, {1: 32, 2: 20, 3: 16, 4: 14, 5: 16, 6: 18, 7: 22, 8: 44})

for offset, row in enumerate(VENDORS_SAMPLE):
    r = 2 + offset
    name, category, phone, lead_time, moq, payment_mode, vpa, notes = row
    vend.cell(row=r, column=1, value=name).fill = EXAMPLE_FILL
    vend.cell(row=r, column=2, value=category).fill = EXAMPLE_FILL
    if phone:
        vend.cell(row=r, column=3, value=phone).fill = EXAMPLE_FILL
    vend.cell(row=r, column=4, value=lead_time).fill = EXAMPLE_FILL
    vend.cell(row=r, column=5, value=moq).fill = EXAMPLE_FILL
    vend.cell(row=r, column=6, value=payment_mode).fill = EXAMPLE_FILL
    if vpa:
        vend.cell(row=r, column=7, value=vpa).fill = EXAMPLE_FILL
    vend.cell(row=r, column=8, value=notes).fill = EXAMPLE_FILL

add_list_validation(vend, [
    "Ingredient supplier", "Packaging", "Utility", "Service",
    "Capex supplier", "Delivery partner", "Other",
], "B")
add_list_validation(vend, ["UPI-GPay", "UPI-PhonePe", "Bank Transfer", "Cash"], "F")


# ----------------------------------------------------------------------------
# 6. Purchase Orders
# ----------------------------------------------------------------------------
po = wb.create_sheet("Purchase Orders")
po_headers = [
    "PO ID", "Vendor", "Raised on", "Expected delivery", "Items (summary)",
    "Total amount (₹)", "Status", "Linked Money Out ID", "Notes",
]
po.append(po_headers)
style_header(po, len(po_headers))
set_widths(po, {1: 12, 2: 32, 3: 12, 4: 16, 5: 44, 6: 14, 7: 14, 8: 18, 9: 36})

# Formula rows: PO ID (col A)
for r in range(2, 202):
    po.cell(row=r, column=1,
            value=f'=IF(B{r}="","","PO-"&TEXT(ROW()-1,"0000"))').fill = DERIVED_FILL

# Sample data
for offset, row in enumerate(POS_SAMPLE):
    r = 2 + offset
    vendor, raised_on, expected, items, total, status, linked_money_out_id, notes = row
    po.cell(row=r, column=2, value=vendor).fill = EXAMPLE_FILL
    po.cell(row=r, column=3, value=raised_on).fill = EXAMPLE_FILL
    po.cell(row=r, column=4, value=expected).fill = EXAMPLE_FILL
    po.cell(row=r, column=5, value=items).fill = EXAMPLE_FILL
    po.cell(row=r, column=6, value=total).fill = EXAMPLE_FILL
    po.cell(row=r, column=7, value=status).fill = EXAMPLE_FILL
    if linked_money_out_id:
        po.cell(row=r, column=8, value=linked_money_out_id).fill = EXAMPLE_FILL
    po.cell(row=r, column=9, value=notes).fill = EXAMPLE_FILL

add_list_validation(po, [
    "Drafted", "Sent", "Acknowledged", "Received", "Paid", "Cancelled",
], "G")


# ----------------------------------------------------------------------------
# 7. README sheet (first tab)
# ----------------------------------------------------------------------------
readme = wb.create_sheet("README", 0)
readme["A1"] = "Tiered Cake Company — Operations (Phase 2)"
readme["A1"].font = Font(bold=True, size=18, color="1F2937")
readme["A3"] = "Owners: Swetha (S) — production · Shreya (Sh) — visibility"
readme["A4"] = (
    "Tabs: Recipes · Ingredients · Bake Plan · Equipment Maintenance · Vendors · Purchase Orders"
)
readme["A5"] = "Generated: " + TODAY.isoformat()
readme["A5"].font = Font(italic=True, color="6B7280")

instructions = [
    "",
    "1. IMPORT INTO GOOGLE SHEETS",
    "   - sheets.google.com → File → Import → Upload → select this .xlsx → 'Replace spreadsheet'",
    "   - Rename the spreadsheet to '02_Operations' (or similar)",
    "",
    "2. DELETE THE EXAMPLE ROWS (highlighted yellow) once you've eyeballed them",
    "   - Recipes: re-enter your own BOM rows",
    "   - Ingredients: update with your actual current stock levels",
    "   - Vendors: add/remove vendors to match your real procurement list",
    "",
    "3. SEED RECIPES + INGREDIENTS + VENDORS (one-time, ~30 min)",
    "   - Enter your full recipe BOMs in the Recipes tab (one row per ingredient per product)",
    "   - Enter your initial stock levels in the Ingredients tab",
    "   - Confirm vendor details (phone, VPA, lead times) in the Vendors tab",
    "",
    "4. INSTALL APPS SCRIPTS (Phase 2b — next step)",
    "   - bake_plan_generator.gs: nightly 23:00 IST — pulls CRM orders, writes to Bake Plan tab",
    "   - par_breach_alerter.gs: daily 09:00 IST — emails PAR breaches from Ingredients tab",
    "   - Full source in apps_script/ folder (Phase 2b delivery)",
    "",
    "5. DAILY WORKFLOW",
    "   - Morning: S reviews Bake Plan tab, confirms production queue for the day",
    "   - Morning: Sh checks email digest for PAR breach alerts; raises POs for breached items",
    "   - As production progresses: S updates Production status in Bake Plan (Queued → Done)",
    "   - When PO is received: update PO Status in Purchase Orders tab; link Money Out ID",
    "",
    "FORMULA CELLS are shaded blue. EXAMPLE rows are shaded yellow.",
    "Header rows are dark; freeze panes set on row 1 of every tab.",
    "Bake Plan is intentionally empty — bake_plan_generator.gs writes to it nightly.",
]
for i, line in enumerate(instructions, start=7):
    readme.cell(row=i, column=1, value=line)
    if line and line[0].isdigit() and len(line) > 1 and line[1] == ".":
        readme.cell(row=i, column=1).font = Font(bold=True, size=12)
set_widths(readme, {1: 110})

wb.active = 0
wb.save(OUT)
print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes)")
print(
    f"Sample data: {len(RECIPES_SAMPLE)} recipe rows ({len(set(r[0] for r in RECIPES_SAMPLE))} recipes), "
    f"{len(INGREDIENTS_SAMPLE)} ingredients, {len(MAINTENANCE_SAMPLE)} equipment, "
    f"{len(VENDORS_SAMPLE)} vendors, {len(POS_SAMPLE)} POs"
)

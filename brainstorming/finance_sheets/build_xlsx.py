#!/usr/bin/env python3
"""
Regenerate TieredCakeCompany_Finance.xlsx from scratch (Phase 1e scope).

Re-run after any schema change. Headers, formulas, validation lists, and
sample data are all defined here — single source of truth.

    python3 build_xlsx.py

Phase 1 tabs: README, Money In, Bank vs UPI Float, UPI Reconciliation,
Compliance, Money Out, Vendor Ledger, P&L (monthly), Cash Runway,
Capex Register, Founder Draws.

Sample data deliberately includes inflows that match CRM sample orders
(so the reconciler has positive matches to demonstrate) and a few that
don't (so the exception detector has something to flag).
"""
from datetime import date, datetime, time, timedelta
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

OUT = Path(__file__).parent / "TieredCakeCompany_Finance.xlsx"
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
# Sample inflows
# ----------------------------------------------------------------------------
# Each tuple: (date, time, channel, account, amount, utr, payer_vpa, counter_party,
#              matched_order_id_or_None, notes)
# UTRs match the CRM sample orders' UTRs (set in crm_sheets/build_xlsx.py
# UTR_VPA_BACKFILL) where applicable.
MONEY_IN_SAMPLE = [
    # Fully matched: Arjun deposit + balance (CUS-0001, ORD-0001)
    (date(2026, 1, 18), time(11, 32), "UPI-GPay", "UPI float", 1400,
     "422118203341", "arjun.mehta@oksbi", "Arjun Mehta",
     "ORD-0001", "Deposit for Veer's bday cake"),
    (date(2026, 1, 22), time(9, 15), "UPI-GPay", "UPI float", 1400,
     "422199876541", "arjun.mehta@oksbi", "Arjun Mehta",
     "ORD-0001", "Balance on delivery"),
    # Priya: deposit + balance (CUS-0002, ORD-0002)
    (date(2026, 2, 14), time(14, 22), "UPI-PhonePe", "UPI float", 500,
     "431229104852", "priya.r@okhdfcbank", "Priya Reddy",
     "ORD-0002", "Valentine cupcakes deposit"),
    (date(2026, 2, 16), time(9, 40), "UPI-PhonePe", "UPI float", 1000,
     "431288773322", "priya.r@okhdfcbank", "Priya Reddy",
     "ORD-0002", "Balance on pickup"),
    # Karthik: bank transfer, no UTR (CUS-0003, ORD-0003)
    (date(2025, 12, 2), time(16, 5), "Bank Transfer", "Bank", 2000,
     "", "", "Cordant Software India Pvt Ltd",
     "ORD-0003", "NEFT for office anniversary cake — invoice ref CRD-1130"),
    # Anjali: deposit + balance (CUS-0004, ORD-0004)
    (date(2026, 3, 5), time(20, 18), "UPI-GPay", "UPI float", 2000,
     "445533781290", "anjali.a@okaxis", "Anjali Agarwal",
     "ORD-0004", "Myra's bday cake deposit"),
    (date(2026, 3, 9), time(10, 5), "UPI-GPay", "UPI float", 2500,
     "445599883344", "anjali.a@okaxis", "Anjali Agarwal",
     "ORD-0004", "Balance on delivery"),
    # Rohan: single payment (CUS-0005, ORD-0005)
    (date(2025, 12, 29), time(15, 28), "UPI-GPay", "UPI float", 1800,
     "449988102345", "rohan.k@okicici", "Rohan Kapoor",
     "ORD-0005", "Anniversary cake — full payment on pickup"),
    # Sandeep: deposit + balance (CUS-0007, ORD-0006 — Diwali trial)
    (date(2026, 5, 14), time(11, 50), "UPI-PhonePe", "UPI float", 1500,
     "520011445566", "sandeep.g@okhdfcbank", "Sandeep Goyal",
     "ORD-0006", "Diwali trial deposit"),
    (date(2026, 5, 18), time(10, 30), "UPI-PhonePe", "UPI float", 1500,
     "520055667788", "sandeep.g@okhdfcbank", "Sandeep Goyal",
     "ORD-0006", "Balance on delivery"),
    # Sneha: deposit + balance (CUS-0008, ORD-0007)
    (date(2026, 5, 18), time(22, 10), "UPI-GPay", "UPI float", 1100,
     "521122876543", "sneha.i@oksbi", "Sneha Iyer",
     "ORD-0007", "Bday cake deposit"),
    (date(2026, 5, 22), time(9, 20), "UPI-GPay", "UPI float", 1100,
     "521166998877", "sneha.i@oksbi", "Sneha Iyer",
     "ORD-0007", "Balance on delivery"),
    # Vikram: deposit only (CUS-0009, ORD-0008 — anniversary upcoming)
    (date(2026, 5, 22), time(14, 8), "UPI-PhonePe", "UPI float", 1500,
     "522233998877", "vikram.b@okhdfcbank", "Vikram Bhatia",
     "ORD-0008", "Anniversary cake deposit; balance on 27 May"),
    # Priya: deposit for repeat order (CUS-0002, ORD-0009)
    (date(2026, 5, 23), time(19, 45), "UPI-PhonePe", "UPI float", 1500,
     "522288554433", "priya.r@okhdfcbank", "Priya Reddy",
     "ORD-0009", "Aarav's bday cake deposit"),
    # Aditi: deposit for bomboloni order (CUS-0010, ORD-0010)
    (date(2026, 5, 22), time(20, 30), "UPI-GPay", "UPI float", 700,
     "523344112266", "aditi.s@oksbi", "Aditi Saxena",
     "ORD-0010", "Bomboloni box deposit"),
    # --- Unmatched: inflow with no corresponding order (refund-back / wrong customer) ---
    (date(2026, 5, 20), time(11, 0), "UPI-GPay", "UPI float", 50,
     "519988774422", "unknown.payer@oksbi", "Karthik (mistype?)",
     None, "₹50 — possibly a tip or mistaken send; investigate"),
    # --- Unmatched: cash sale not linked to a CRM order ---
    (date(2026, 5, 21), time(17, 15), "Cash", "Cash drawer", 300,
     "", "", "Walk-in customer (neighbour)",
     None, "Sold 6 leftover brownies; not a CRM order"),
]

COMPLIANCE_SAMPLE = [
    # (license_type, license_number, authority, issued_on, valid_until, last_renewed, notes)
    ("FSSAI Cottage Food", "21024010000001", "Telangana FSSAI",
     date(2026, 2, 15), date(2027, 2, 14), date(2026, 2, 15),
     "Annual renewal — calendar reminder 30 days ahead. Cottage food licence covers ≤₹12L annual turnover."),
    ("Trade Licence", "TL-2026-CFB-44521", "GHMC (Greater Hyderabad)",
     date(2026, 3, 1), date(2029, 2, 28), date(2026, 3, 1),
     "3-year cycle. Applies because operating from residential premises with commercial intent."),
    ("GST Registration", "", "GSTN",
     None, None, None,
     "Voluntary registration deferred. Activate when annual turnover crosses ₹40L (goods threshold in Telangana). Tracked here for forward compat."),
]

ACCOUNTS_SAMPLE = [
    # (account_name, opening_balance, opening_date, last_reconciled, variance, notes)
    ("Bank — HDFC Current", 25000, date(2025, 11, 1), date(2026, 5, 20), 0,
     "Personal current account; bakery uses it provisionally"),
    ("UPI — GPay (Swetha phone)", 5000, date(2025, 11, 1), date(2026, 5, 23), 0,
     "Primary inflow channel"),
    ("UPI — PhonePe (Shreya phone)", 1000, date(2025, 11, 1), date(2026, 5, 23), 0,
     "Secondary; some customers default here"),
    ("Cash drawer", 500, date(2025, 11, 1), date(2026, 5, 20), 0,
     "Float for change-making"),
]

MONEY_OUT_SAMPLE = [
    # (date, time, channel, account, amount, category, utr, payee_vpa, payee_name, linked_po_id, notes)
    # Ingredients
    (date(2026, 5, 4), time(11, 15), "UPI-PhonePe", "UPI float", 2840,
     "Ingredients", "510044112233", "metrocc@hdfcbank", "Metro Cash & Carry",
     "PO-0001", "Weekly flour + sugar + butter restock"),
    (date(2026, 5, 7), time(18, 30), "UPI-GPay", "UPI float", 1450,
     "Ingredients", "510077665544", "vijetha@oksbi", "Vijetha Supermarket",
     "", "Milk, cream, eggs — top-up"),
    (date(2026, 5, 11), time(10, 0), "UPI-GPay", "UPI float", 920,
     "Ingredients", "510099887766", "heritage@okhdfc", "Heritage Dairy",
     "", "Fresh paneer + cream for week's cakes"),
    (date(2026, 5, 14), time(15, 45), "UPI-PhonePe", "UPI float", 3200,
     "Ingredients", "511122334455", "callebaut@okicici", "Callebaut Distributor — Hyd",
     "PO-0002", "Couverture chocolate 5kg block"),
    # Packaging
    (date(2026, 5, 9), time(13, 20), "Bank Transfer", "Bank", 4500,
     "Packaging", "", "wholesale-box-supplier", "Wholesale Box Supplier — Madhapur",
     "PO-0003", "100 × 1kg cake boxes + 50 × cupcake clamshells"),
    # Utilities
    (date(2026, 5, 2), time(9, 0), "UPI-GPay", "Bank", 1850,
     "Utilities", "", "ghmc@billdesk", "GHMC (electricity)",
     "", "April electricity bill"),
    (date(2026, 5, 6), time(8, 30), "Cash", "Cash drawer", 1180,
     "Utilities", "", "", "Bharat Gas (cylinder delivery boy)",
     "", "1 × 14.2kg LPG refill"),
    # Delivery
    (date(2026, 5, 22), time(9, 25), "UPI-GPay", "UPI float", 95,
     "Delivery (Porter/Dunzo)", "521144556677", "porter@axis", "Porter (Vikram's anniversary cake delivery)",
     "", "Same-day; 6.4 km"),
    (date(2026, 5, 18), time(10, 45), "UPI-GPay", "UPI float", 70,
     "Delivery (Porter/Dunzo)", "521133445566", "porter@axis", "Porter (Sneha's bday cake delivery)",
     "", "Eterna pickup → Eterna drop, 1.2 km"),
    # Capex
    (date(2026, 5, 12), time(14, 0), "Bank Transfer", "Bank", 38000,
     "Equipment (capex)", "", "kitchenaid-india", "KitchenAid India (Amazon)",
     "PO-0004", "5KSM150 stand mixer — Phase 1 capex"),
    # Founder Draw
    (date(2026, 5, 15), time(20, 0), "UPI-GPay", "Bank", 15000,
     "Founder Draw", "", "swetha@oksbi", "Swetha (founder draw)",
     "", "Salary equivalent — May"),
    (date(2026, 5, 15), time(20, 5), "UPI-GPay", "Bank", 15000,
     "Founder Draw", "", "shreya@okhdfc", "Shreya (founder draw)",
     "", "Salary equivalent — May"),
]

VENDORS_SAMPLE = [
    ("Metro Cash & Carry", "Ingredient supplier", "UPI-PhonePe", "metrocc@hdfcbank",
     "HoReCa account; bulk buys; visit weekly"),
    ("Vijetha Supermarket", "Ingredient supplier", "UPI-GPay", "vijetha@oksbi",
     "Top-up shop within walking distance"),
    ("Heritage Dairy", "Ingredient supplier", "UPI-GPay", "heritage@okhdfc",
     "Fresh dairy 2x/week"),
    ("Callebaut Distributor — Hyd", "Ingredient supplier", "UPI-PhonePe", "callebaut@okicici",
     "Couverture chocolate; 5kg blocks; lead time 2 days"),
    ("Wholesale Box Supplier — Madhapur", "Packaging", "Bank Transfer", "9876543210@upi",
     "Cake boxes, cupcake clamshells, ribbons; MOQ 50"),
    ("GHMC (electricity)", "Utility", "UPI-GPay", "ghmc@billdesk",
     "Auto-debit option pending"),
    ("Bharat Gas", "Utility", "Cash", "",
     "Cylinder delivery; cash to delivery boy"),
    ("Porter", "Delivery partner", "UPI-GPay", "porter@axis",
     "Same-day local deliveries; pay per ride"),
    ("KitchenAid India (Amazon)", "Capex supplier", "Bank Transfer", "",
     "One-off; stand mixer; warranty 2 years"),
]

CAPEX_SAMPLE = [
    # (asset, category, purchased_on, price, supplier, linked_money_out_id, useful_life_months, notes)
    ("Morphy Richards Besta Black 52 OTG", "Oven",
     date(2024, 8, 1), 0, "(pre-existing equipment)", "",
     60, "Already owned. Zero capex but tracked for depreciation/replacement clock."),
    ("KitchenAid 5KSM150 Stand Mixer", "Mixer",
     date(2026, 5, 12), 38000, "KitchenAid India (Amazon)", "MOUT-0010",
     36, "Replaces Philips hand mixer. 2-year warranty."),
    ("Convection Oven (TBD — Borosil / Whirlpool)", "Oven",
     None, 25000, "(planned)", "",
     60, "Stream 1 evaluation pending. Phase 2 spend."),
    ("Digital weighing scale 5kg", "Tools",
     date(2026, 5, 12), 1200, "Amazon", "",
     36, "Precision needed for premium eggless. Bundled with mixer purchase."),
    ("Cake turntables (×2) + offset spatulas (×3)", "Tools",
     date(2026, 5, 12), 1500, "Amazon", "",
     24, "Standard decorating kit upgrade."),
]

DRAWS_SAMPLE = [
    # (date, to, amount, purpose, linked_money_out_id, notes)
    (date(2026, 5, 15), "Swetha", 15000, "Salary", "MOUT-0011",
     "May salary equivalent"),
    (date(2026, 5, 15), "Shreya", 15000, "Salary", "MOUT-0012",
     "May salary equivalent"),
    (date(2026, 4, 30), "Joint", 8000, "Profit Distribution", "",
     "April surplus distribution; ₹4K each (logged jointly)"),
]


# ----------------------------------------------------------------------------
# Workbook
# ----------------------------------------------------------------------------
wb = Workbook()
wb.remove(wb.active)


# ----------------------------------------------------------------------------
# 1. Money In
# ----------------------------------------------------------------------------
mi = wb.create_sheet("Money In")
mi_headers = [
    "Entry ID", "Date", "Time", "Channel", "Account credited", "Amount (₹)",
    "UPI reference (UTR)", "Payer VPA", "Counter-party name",
    "Matched Order ID", "Notes", "Logged at",
]
mi.append(mi_headers)
style_header(mi, len(mi_headers))
set_widths(mi, {1: 12, 2: 11, 3: 8, 4: 13, 5: 18, 6: 12, 7: 18, 8: 22,
                9: 22, 10: 14, 11: 32, 12: 18})

for r in range(2, 502):
    mi.cell(row=r, column=1, value=f'=IF(B{r}="","","MIN-"&TEXT(ROW()-1,"0000"))').fill = DERIVED_FILL
    mi.cell(row=r, column=12, value=f'=IF(B{r}="","",NOW())').fill = DERIVED_FILL

for offset, row in enumerate(MONEY_IN_SAMPLE):
    r = 2 + offset
    mi.cell(row=r, column=2, value=row[0]).fill = EXAMPLE_FILL
    mi.cell(row=r, column=3, value=row[1]).fill = EXAMPLE_FILL
    mi.cell(row=r, column=4, value=row[2]).fill = EXAMPLE_FILL
    mi.cell(row=r, column=5, value=row[3]).fill = EXAMPLE_FILL
    mi.cell(row=r, column=6, value=row[4]).fill = EXAMPLE_FILL
    if row[5]:
        mi.cell(row=r, column=7, value=row[5]).fill = EXAMPLE_FILL
    if row[6]:
        mi.cell(row=r, column=8, value=row[6]).fill = EXAMPLE_FILL
    mi.cell(row=r, column=9, value=row[7]).fill = EXAMPLE_FILL
    if row[8]:
        mi.cell(row=r, column=10, value=row[8]).fill = EXAMPLE_FILL
    mi.cell(row=r, column=11, value=row[9]).fill = EXAMPLE_FILL

add_list_validation(mi, ["UPI-GPay", "UPI-PhonePe", "UPI-Other",
                         "Bank Transfer", "Cash", "Refund-In"], "D")
add_list_validation(mi, ["Bank", "UPI float", "Cash drawer"], "E")


# ----------------------------------------------------------------------------
# 2. Bank vs UPI Float
# ----------------------------------------------------------------------------
acc = wb.create_sheet("Bank vs UPI Float")
acc_headers = [
    "Account", "Opening balance (₹)", "Opening date",
    "Inflows since opening (₹)", "Outflows since opening (₹)",
    "Current balance (₹)", "Last reconciled (date)",
    "Variance vs actual (₹)", "Notes",
]
acc.append(acc_headers)
style_header(acc, len(acc_headers))
set_widths(acc, {1: 28, 2: 16, 3: 13, 4: 18, 5: 18, 6: 16, 7: 16,
                 8: 16, 9: 36})

for r in range(2, 12):
    # Map account name → which "Account credited" enum it sums against in Money In:
    # "Bank — HDFC Current" → "Bank" inflows
    # "UPI — GPay …" → "UPI float" inflows (both UPI accounts roll into UPI float pool)
    # Cash drawer → "Cash drawer"
    acc.cell(row=r, column=4,
             value=f'=IFERROR(SUMIFS(\'Money In\'!F:F,\'Money In\'!E:E,'
                   f'IF(LEFT(A{r},4)="Bank","Bank",'
                   f'IF(LEFT(A{r},3)="UPI","UPI float","Cash drawer")),'
                   f'\'Money In\'!B:B,">="&C{r}),0)').fill = DERIVED_FILL
    acc.cell(row=r, column=5,
             value=f'=IFERROR(SUMIFS(\'Money Out\'!F:F,\'Money Out\'!E:E,'
                   f'IF(LEFT(A{r},4)="Bank","Bank",'
                   f'IF(LEFT(A{r},3)="UPI","UPI float","Cash drawer")),'
                   f'\'Money Out\'!B:B,">="&C{r}),0)').fill = DERIVED_FILL
    acc.cell(row=r, column=6,
             value=f'=IF(A{r}="","",B{r}+D{r}-E{r})').fill = DERIVED_FILL

for offset, row in enumerate(ACCOUNTS_SAMPLE):
    r = 2 + offset
    acc.cell(row=r, column=1, value=row[0]).fill = EXAMPLE_FILL
    acc.cell(row=r, column=2, value=row[1]).fill = EXAMPLE_FILL
    acc.cell(row=r, column=3, value=row[2]).fill = EXAMPLE_FILL
    acc.cell(row=r, column=7, value=row[3]).fill = EXAMPLE_FILL
    acc.cell(row=r, column=8, value=row[4]).fill = EXAMPLE_FILL
    acc.cell(row=r, column=9, value=row[5]).fill = EXAMPLE_FILL


# ----------------------------------------------------------------------------
# 3. UPI Reconciliation
# ----------------------------------------------------------------------------
ur = wb.create_sheet("UPI Reconciliation")
set_widths(ur, {1: 14, 2: 12, 3: 12, 4: 14, 5: 16, 6: 24, 7: 16, 8: 32})

# Header banner
ur["A1"] = "UPI Reconciliation — last run: (pending first run of upi_reconciler.gs)"
ur["A1"].font = Font(bold=True, size=14, color="1F2937")
ur.merge_cells("A1:H1")

# Section A heading
ur["A3"] = "SECTION A — Inflows without a matched Order"
ur["A3"].font = Font(bold=True, size=12)
ur["A3"].fill = SECTION_FILL
ur.merge_cells("A3:H3")

ur.append([])  # row 4 spacer
section_a_headers = ["Entry ID", "Date", "Amount (₹)", "UTR", "Payer VPA",
                     "Counter-party", "Channel", "Action"]
for col, h in enumerate(section_a_headers, start=1):
    cell = ur.cell(row=5, column=col, value=h)
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT

# Placeholder row indicating Apps Script writes here
ur.cell(row=6, column=1,
        value="(populated by upi_reconciler.gs — run daily 09:00 IST)").font = Font(italic=True, color="6B7280")
ur.merge_cells("A6:H6")

# Section B heading at row 25
ur["A25"] = "SECTION B — Orders claiming UPI payment but no matching inflow"
ur["A25"].font = Font(bold=True, size=12)
ur["A25"].fill = SECTION_FILL
ur.merge_cells("A25:H25")

section_b_headers = ["Order ID", "Customer", "Delivery date",
                     "Final (₹)", "Declared paid (₹)", "Orders.UTR",
                     "Payment mode", "Action"]
for col, h in enumerate(section_b_headers, start=1):
    cell = ur.cell(row=27, column=col, value=h)
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT

ur.cell(row=28, column=1,
        value="(populated by upi_reconciler.gs)").font = Font(italic=True, color="6B7280")
ur.merge_cells("A28:H28")

# Section C: summary at row 45
ur["A45"] = "SECTION C — Summary"
ur["A45"].font = Font(bold=True, size=12)
ur["A45"].fill = SECTION_FILL
ur.merge_cells("A45:H45")

ur["A46"] = "Inflows without a match:"
ur["B46"] = "(pending)"
ur["A47"] = "Orders without a match:"
ur["B47"] = "(pending)"
ur["A48"] = "₹ unmatched (inflow side):"
ur["B48"] = "(pending)"
ur["A49"] = "₹ unmatched (order side):"
ur["B49"] = "(pending)"
ur["A50"] = "Last run:"
ur["B50"] = "(never)"

ur.freeze_panes = "A2"


# ----------------------------------------------------------------------------
# 4. Compliance (Phase 1b)
# ----------------------------------------------------------------------------
comp = wb.create_sheet("Compliance")
comp_headers = [
    "License type", "License number", "Issuing authority",
    "Issued on", "Valid until", "Days to expiry", "Status",
    "Last renewed", "Notes",
]
comp.append(comp_headers)
style_header(comp, len(comp_headers))
set_widths(comp, {1: 22, 2: 22, 3: 24, 4: 12, 5: 12, 6: 12, 7: 18,
                  8: 12, 9: 40})

for r in range(2, 52):
    comp.cell(row=r, column=6, value=f'=IFERROR(E{r}-TODAY(),"")').fill = DERIVED_FILL
    comp.cell(row=r, column=7, value=(
        f'=IF(F{r}="","",IF(F{r}<0,"EXPIRED",IF(F{r}<=7,"Renew NOW",'
        f'IF(F{r}<=30,"Renew this month",IF(F{r}<=90,"Renew this quarter","Current")))))'
    )).fill = DERIVED_FILL

for offset, row in enumerate(COMPLIANCE_SAMPLE):
    r = 2 + offset
    comp.cell(row=r, column=1, value=row[0]).fill = EXAMPLE_FILL
    comp.cell(row=r, column=2, value=row[1]).fill = EXAMPLE_FILL
    comp.cell(row=r, column=3, value=row[2]).fill = EXAMPLE_FILL
    if row[3]:
        comp.cell(row=r, column=4, value=row[3]).fill = EXAMPLE_FILL
    if row[4]:
        comp.cell(row=r, column=5, value=row[4]).fill = EXAMPLE_FILL
    if row[5]:
        comp.cell(row=r, column=8, value=row[5]).fill = EXAMPLE_FILL
    comp.cell(row=r, column=9, value=row[6]).fill = EXAMPLE_FILL

add_list_validation(comp, ["FSSAI Cottage Food", "Trade Licence", "GST Registration",
                           "Professional Tax", "Shops & Establishment", "Other"], "A")


# ----------------------------------------------------------------------------
# 5. Money Out (Phase 1c)
# ----------------------------------------------------------------------------
mo = wb.create_sheet("Money Out")
mo_headers = [
    "Entry ID", "Date", "Time", "Channel", "Account debited", "Amount (₹)",
    "Category", "UPI reference (UTR)", "Payee VPA / Account", "Payee name",
    "Linked PO ID", "Notes", "Logged at",
]
mo.append(mo_headers)
style_header(mo, len(mo_headers))
set_widths(mo, {1: 12, 2: 11, 3: 8, 4: 13, 5: 18, 6: 12, 7: 22, 8: 18, 9: 22,
                10: 28, 11: 12, 12: 32, 13: 18})

for r in range(2, 502):
    mo.cell(row=r, column=1, value=f'=IF(B{r}="","","MOUT-"&TEXT(ROW()-1,"0000"))').fill = DERIVED_FILL
    mo.cell(row=r, column=13, value=f'=IF(B{r}="","",NOW())').fill = DERIVED_FILL

for offset, row in enumerate(MONEY_OUT_SAMPLE):
    r = 2 + offset
    mo.cell(row=r, column=2, value=row[0]).fill = EXAMPLE_FILL
    mo.cell(row=r, column=3, value=row[1]).fill = EXAMPLE_FILL
    mo.cell(row=r, column=4, value=row[2]).fill = EXAMPLE_FILL
    mo.cell(row=r, column=5, value=row[3]).fill = EXAMPLE_FILL
    mo.cell(row=r, column=6, value=row[4]).fill = EXAMPLE_FILL
    mo.cell(row=r, column=7, value=row[5]).fill = EXAMPLE_FILL
    if row[6]:
        mo.cell(row=r, column=8, value=row[6]).fill = EXAMPLE_FILL
    if row[7]:
        mo.cell(row=r, column=9, value=row[7]).fill = EXAMPLE_FILL
    mo.cell(row=r, column=10, value=row[8]).fill = EXAMPLE_FILL
    if row[9]:
        mo.cell(row=r, column=11, value=row[9]).fill = EXAMPLE_FILL
    mo.cell(row=r, column=12, value=row[10]).fill = EXAMPLE_FILL

add_list_validation(mo, ["UPI-GPay", "UPI-PhonePe", "UPI-Other", "Bank Transfer",
                         "Cash", "NACH", "Refund-Out"], "D")
add_list_validation(mo, ["Bank", "UPI float", "Cash drawer"], "E")
add_list_validation(mo, ["Ingredients", "Packaging", "Utilities", "Rent",
                         "Equipment (capex)", "Maintenance", "Marketing",
                         "Delivery (Porter/Dunzo)", "Founder Draw",
                         "Transfer (Account-to-Account)", "Other"], "G")


# ----------------------------------------------------------------------------
# 6. Vendor Ledger (Phase 1c)
# ----------------------------------------------------------------------------
vl = wb.create_sheet("Vendor Ledger")
vl_headers = [
    "Vendor name", "Category", "Preferred channel", "VPA / Account",
    "Total paid to date (₹)", "Last payment date", "Payment count", "Notes",
]
vl.append(vl_headers)
style_header(vl, len(vl_headers))
set_widths(vl, {1: 32, 2: 18, 3: 14, 4: 22, 5: 18, 6: 14, 7: 14, 8: 40})

for r in range(2, 102):
    vl.cell(row=r, column=5,
            value=f'=IFERROR(SUMIFS(\'Money Out\'!F:F,\'Money Out\'!J:J,A{r}),0)').fill = DERIVED_FILL
    vl.cell(row=r, column=6,
            value=f'=IFERROR(IF(MAXIFS(\'Money Out\'!B:B,\'Money Out\'!J:J,A{r})=0,"",MAXIFS(\'Money Out\'!B:B,\'Money Out\'!J:J,A{r})),"")').fill = DERIVED_FILL
    vl.cell(row=r, column=7,
            value=f'=IF(A{r}="","",COUNTIF(\'Money Out\'!J:J,A{r}))').fill = DERIVED_FILL

for offset, row in enumerate(VENDORS_SAMPLE):
    r = 2 + offset
    vl.cell(row=r, column=1, value=row[0]).fill = EXAMPLE_FILL
    vl.cell(row=r, column=2, value=row[1]).fill = EXAMPLE_FILL
    vl.cell(row=r, column=3, value=row[2]).fill = EXAMPLE_FILL
    vl.cell(row=r, column=4, value=row[3]).fill = EXAMPLE_FILL
    vl.cell(row=r, column=8, value=row[4]).fill = EXAMPLE_FILL

add_list_validation(vl, ["Ingredient supplier", "Packaging", "Utility", "Service",
                         "Capex supplier", "Delivery partner", "Other"], "B")
add_list_validation(vl, ["UPI-GPay", "UPI-PhonePe", "Bank Transfer", "Cash"], "C")


# ----------------------------------------------------------------------------
# 7. P&L (monthly) — Phase 1d
# ----------------------------------------------------------------------------
pnl = wb.create_sheet("P&L (monthly)")
set_widths(pnl, {1: 32, **{c: 13 for c in range(2, 14)}})

# Row 1: month headers (12 months: current month + next 11)
pnl.cell(row=1, column=1, value="Line item").fill = HEADER_FILL
pnl.cell(row=1, column=1).font = HEADER_FONT
for i in range(12):
    # Compute first-of-month for TODAY + i months
    y = TODAY.year + ((TODAY.month - 1 + i) // 12)
    m = ((TODAY.month - 1 + i) % 12) + 1
    pnl.cell(row=1, column=2 + i, value=f"{y}-{m:02d}").fill = HEADER_FILL
    pnl.cell(row=1, column=2 + i).font = HEADER_FONT
pnl.freeze_panes = "B2"
pnl.row_dimensions[1].height = 30

# Line items (with formulas referencing Money In / Money Out by Category)
# Each row index → (label, formula_template_or_None, fill, font_bold)
# Formula template uses {month_start} and {month_end} placeholders to fill in per-column.
LINE_ITEMS = [
    ("REVENUE", None, SECTION_FILL, True),
    ("Gross revenue (orders)",
     "=SUMIFS('Money In'!F:F,'Money In'!J:J,\"<>\",'Money In'!B:B,\">=\"&{month_start},'Money In'!B:B,\"<=\"&{month_end})",
     None, False),
    ("Other inflows (unmatched / refunds)",
     "=SUMIFS('Money In'!F:F,'Money In'!J:J,\"\",'Money In'!B:B,\">=\"&{month_start},'Money In'!B:B,\"<=\"&{month_end})",
     None, False),
    ("Total revenue", "=B{rev_total_row}+B{rev_other_row}", None, True),  # special — uses placeholders below
    ("", None, None, False),
    ("COGS (cost of goods sold)", None, SECTION_FILL, True),
    ("Ingredients",
     "=SUMIFS('Money Out'!F:F,'Money Out'!G:G,\"Ingredients\",'Money Out'!B:B,\">=\"&{month_start},'Money Out'!B:B,\"<=\"&{month_end})",
     None, False),
    ("Packaging",
     "=SUMIFS('Money Out'!F:F,'Money Out'!G:G,\"Packaging\",'Money Out'!B:B,\">=\"&{month_start},'Money Out'!B:B,\"<=\"&{month_end})",
     None, False),
    ("Total COGS", None, None, True),  # filled below
    ("Gross profit", None, None, True),
    ("Gross margin %", None, None, True),
    ("", None, None, False),
    ("OPERATING EXPENSES", None, SECTION_FILL, True),
    ("Utilities",
     "=SUMIFS('Money Out'!F:F,'Money Out'!G:G,\"Utilities\",'Money Out'!B:B,\">=\"&{month_start},'Money Out'!B:B,\"<=\"&{month_end})",
     None, False),
    ("Rent",
     "=SUMIFS('Money Out'!F:F,'Money Out'!G:G,\"Rent\",'Money Out'!B:B,\">=\"&{month_start},'Money Out'!B:B,\"<=\"&{month_end})",
     None, False),
    ("Maintenance",
     "=SUMIFS('Money Out'!F:F,'Money Out'!G:G,\"Maintenance\",'Money Out'!B:B,\">=\"&{month_start},'Money Out'!B:B,\"<=\"&{month_end})",
     None, False),
    ("Marketing",
     "=SUMIFS('Money Out'!F:F,'Money Out'!G:G,\"Marketing\",'Money Out'!B:B,\">=\"&{month_start},'Money Out'!B:B,\"<=\"&{month_end})",
     None, False),
    ("Delivery",
     "=SUMIFS('Money Out'!F:F,'Money Out'!G:G,\"Delivery (Porter/Dunzo)\",'Money Out'!B:B,\">=\"&{month_start},'Money Out'!B:B,\"<=\"&{month_end})",
     None, False),
    ("Total opex", None, None, True),
    ("", None, None, False),
    ("Operating profit", None, None, True),
    ("", None, None, False),
    ("BELOW THE LINE", None, SECTION_FILL, True),
    ("Capex",
     "=SUMIFS('Money Out'!F:F,'Money Out'!G:G,\"Equipment (capex)\",'Money Out'!B:B,\">=\"&{month_start},'Money Out'!B:B,\"<=\"&{month_end})",
     None, False),
    ("Founder draws",
     "=SUMIFS('Money Out'!F:F,'Money Out'!G:G,\"Founder Draw\",'Money Out'!B:B,\">=\"&{month_start},'Money Out'!B:B,\"<=\"&{month_end})",
     None, False),
    ("Net cash flow", None, None, True),
]

# Write line items and per-month formulas
for r_idx, (label, formula_template, fill, bold) in enumerate(LINE_ITEMS):
    row = 2 + r_idx
    cell = pnl.cell(row=row, column=1, value=label)
    if fill:
        cell.fill = fill
    if bold:
        cell.font = Font(bold=True)
    if formula_template:
        for i in range(12):
            col = 2 + i
            y = TODAY.year + ((TODAY.month - 1 + i) // 12)
            m = ((TODAY.month - 1 + i) % 12) + 1
            # Compute first and last day of month
            month_start = f'DATE({y},{m},1)'
            # Last day: subtract 1 from first of next month
            ny = y + (1 if m == 12 else 0)
            nm = 1 if m == 12 else m + 1
            month_end = f'DATE({ny},{nm},1)-1'
            f = formula_template.replace("{month_start}", month_start).replace("{month_end}", month_end)
            pnl.cell(row=row, column=col, value=f).fill = DERIVED_FILL

# Now fill the SUM/COMPUTED rows (the ones with formula_template = None and bold = True)
# Find row indices for line items by label
def row_for(label):
    for r_idx, (l, _, _, _) in enumerate(LINE_ITEMS):
        if l == label:
            return 2 + r_idx
    return None

REV_GROSS = row_for("Gross revenue (orders)")
REV_OTHER = row_for("Other inflows (unmatched / refunds)")
REV_TOTAL = row_for("Total revenue")
COGS_ING = row_for("Ingredients")
COGS_PKG = row_for("Packaging")
COGS_TOTAL = row_for("Total COGS")
GROSS_PROFIT = row_for("Gross profit")
GROSS_MARGIN = row_for("Gross margin %")
OPEX_UTIL = row_for("Utilities")
OPEX_DELIV = row_for("Delivery")
OPEX_TOTAL = row_for("Total opex")
OP_PROFIT = row_for("Operating profit")
CAPEX = row_for("Capex")
DRAWS = row_for("Founder draws")
NCF = row_for("Net cash flow")

for i in range(12):
    col_letter = get_column_letter(2 + i)
    pnl.cell(row=REV_TOTAL, column=2 + i,
             value=f'={col_letter}{REV_GROSS}+{col_letter}{REV_OTHER}').fill = DERIVED_FILL
    pnl.cell(row=COGS_TOTAL, column=2 + i,
             value=f'={col_letter}{COGS_ING}+{col_letter}{COGS_PKG}').fill = DERIVED_FILL
    pnl.cell(row=GROSS_PROFIT, column=2 + i,
             value=f'={col_letter}{REV_TOTAL}-{col_letter}{COGS_TOTAL}').fill = DERIVED_FILL
    pnl.cell(row=GROSS_MARGIN, column=2 + i,
             value=f'=IFERROR({col_letter}{GROSS_PROFIT}/{col_letter}{REV_TOTAL},"")').fill = DERIVED_FILL
    pnl.cell(row=OPEX_TOTAL, column=2 + i,
             value=f'=SUM({col_letter}{OPEX_UTIL}:{col_letter}{OPEX_DELIV})').fill = DERIVED_FILL
    pnl.cell(row=OP_PROFIT, column=2 + i,
             value=f'={col_letter}{GROSS_PROFIT}-{col_letter}{OPEX_TOTAL}').fill = DERIVED_FILL
    pnl.cell(row=NCF, column=2 + i,
             value=f'={col_letter}{OP_PROFIT}-{col_letter}{CAPEX}-{col_letter}{DRAWS}').fill = DERIVED_FILL

# Format Gross margin row as percentage
for i in range(12):
    pnl.cell(row=GROSS_MARGIN, column=2 + i).number_format = "0.0%"


# ----------------------------------------------------------------------------
# 8. Cash Runway — Phase 1d
# ----------------------------------------------------------------------------
cr = wb.create_sheet("Cash Runway")
cr_headers = [
    "Month", "Opening cash (₹)", "Projected inflows (₹)",
    "Projected outflows (₹)", "Closing cash (₹)", "Runway flag", "Notes",
]
cr.append(cr_headers)
style_header(cr, len(cr_headers))
set_widths(cr, {1: 10, 2: 16, 3: 18, 4: 18, 5: 16, 6: 16, 7: 40})

# Seed 12 months from current month
for i in range(12):
    r = 2 + i
    y = TODAY.year + ((TODAY.month - 1 + i) // 12)
    m = ((TODAY.month - 1 + i) % 12) + 1
    cr.cell(row=r, column=1, value=f"{y}-{m:02d}").fill = EXAMPLE_FILL
    # Opening cash: row 2 = sum of Bank vs UPI Float Current balances; rows 3+ = previous closing
    if i == 0:
        cr.cell(row=r, column=2,
                value="=SUM('Bank vs UPI Float'!F:F)").fill = DERIVED_FILL
    else:
        cr.cell(row=r, column=2, value=f"=E{r - 1}").fill = DERIVED_FILL
    # Projected inflows + outflows: manual placeholders (operator estimates)
    cr.cell(row=r, column=3, value=0).fill = EXAMPLE_FILL
    cr.cell(row=r, column=4, value=0).fill = EXAMPLE_FILL
    # Closing
    cr.cell(row=r, column=5, value=f"=B{r}+C{r}-D{r}").fill = DERIVED_FILL
    # Runway flag
    cr.cell(row=r, column=6,
            value=f'=IF(E{r}<10000,"⚠ BELOW BUFFER",IF(E{r}<25000,"Tight","OK"))').fill = DERIVED_FILL


# ----------------------------------------------------------------------------
# 9. Capex Register — Phase 1e
# ----------------------------------------------------------------------------
cap_reg = wb.create_sheet("Capex Register")
cap_reg_headers = [
    "Asset", "Category", "Purchased on", "Purchase price (₹)", "Supplier",
    "Linked Money Out ID", "Useful life (months)",
    "Monthly depreciation (₹)", "Net book value (₹)", "Notes",
]
cap_reg.append(cap_reg_headers)
style_header(cap_reg, len(cap_reg_headers))
set_widths(cap_reg, {1: 36, 2: 14, 3: 13, 4: 16, 5: 28, 6: 16, 7: 14,
                     8: 16, 9: 16, 10: 32})

for r in range(2, 102):
    cap_reg.cell(row=r, column=8,
                 value=f'=IFERROR(D{r}/G{r},"")').fill = DERIVED_FILL
    cap_reg.cell(row=r, column=9,
                 value=f'=IFERROR(D{r}-(H{r}*MIN((TODAY()-C{r})/30.4,G{r})),"")').fill = DERIVED_FILL

for offset, row in enumerate(CAPEX_SAMPLE):
    r = 2 + offset
    cap_reg.cell(row=r, column=1, value=row[0]).fill = EXAMPLE_FILL
    cap_reg.cell(row=r, column=2, value=row[1]).fill = EXAMPLE_FILL
    if row[2]:
        cap_reg.cell(row=r, column=3, value=row[2]).fill = EXAMPLE_FILL
    cap_reg.cell(row=r, column=4, value=row[3]).fill = EXAMPLE_FILL
    cap_reg.cell(row=r, column=5, value=row[4]).fill = EXAMPLE_FILL
    if row[5]:
        cap_reg.cell(row=r, column=6, value=row[5]).fill = EXAMPLE_FILL
    cap_reg.cell(row=r, column=7, value=row[6]).fill = EXAMPLE_FILL
    cap_reg.cell(row=r, column=10, value=row[7]).fill = EXAMPLE_FILL

add_list_validation(cap_reg, ["Oven", "Mixer", "Refrigeration", "Tools",
                              "Furniture", "Other"], "B")


# ----------------------------------------------------------------------------
# 10. Founder Draws — Phase 1e
# ----------------------------------------------------------------------------
draws = wb.create_sheet("Founder Draws")
draws_headers = [
    "Date", "To", "Amount (₹)", "Purpose", "Linked Money Out ID", "Notes",
]
draws.append(draws_headers)
style_header(draws, len(draws_headers))
set_widths(draws, {1: 12, 2: 12, 3: 12, 4: 22, 5: 18, 6: 36})

for offset, row in enumerate(DRAWS_SAMPLE):
    r = 2 + offset
    draws.cell(row=r, column=1, value=row[0]).fill = EXAMPLE_FILL
    draws.cell(row=r, column=2, value=row[1]).fill = EXAMPLE_FILL
    draws.cell(row=r, column=3, value=row[2]).fill = EXAMPLE_FILL
    draws.cell(row=r, column=4, value=row[3]).fill = EXAMPLE_FILL
    if row[4]:
        draws.cell(row=r, column=5, value=row[4]).fill = EXAMPLE_FILL
    draws.cell(row=r, column=6, value=row[5]).fill = EXAMPLE_FILL

add_list_validation(draws, ["Swetha", "Shreya", "Joint"], "B")
add_list_validation(draws, ["Salary", "Reimbursement", "Profit Distribution",
                            "Loan Repayment", "Other"], "D")


# ----------------------------------------------------------------------------
# 11. README sheet
# ----------------------------------------------------------------------------
readme = wb.create_sheet("README", 0)
readme["A1"] = "Tiered Cake Company — Finance (Phase 1e)"
readme["A1"].font = Font(bold=True, size=18, color="1F2937")
readme["A3"] = "Owners: Swetha (S) · Shreya (Sh)"
readme["A4"] = "Tabs: Money In · Bank vs UPI Float · UPI Reconciliation · Compliance · Money Out · Vendor Ledger · P&L (monthly) · Cash Runway · Capex Register · Founder Draws"
readme["A5"] = "Generated: " + TODAY.isoformat()
readme["A5"].font = Font(italic=True, color="6B7280")

instructions = [
    "",
    "1. IMPORT INTO GOOGLE SHEETS",
    "   - sheets.google.com → File → Import → Upload → select this .xlsx → 'Replace spreadsheet'",
    "   - Rename the spreadsheet to '03_Finance' (or similar)",
    "",
    "2. DELETE THE EXAMPLE ROWS (highlighted yellow) once you've eyeballed them",
    "   - Money In tab: sample rows match CRM sample orders for reconciler demo",
    "",
    "3. SET OPENING BALANCES",
    "   - Bank vs UPI Float tab: set Opening balance (₹) and Opening date for each account",
    "   - These are typed once and never edited again",
    "",
    "4. INSTALL upi_reconciler.gs",
    "   - Extensions → Apps Script → paste finance_sheets/apps_script/upi_reconciler.gs",
    "   - In the script, set CRM_SPREADSHEET_ID to the file ID of 01_CRM_Sales.xlsx",
    "     (the long string in the CRM sheet's URL)",
    "   - Add a time trigger: daily 09:00 IST",
    "",
    "5. DAILY WORKFLOW",
    "   - End of day: Sh opens GPay/PhonePe app, logs every customer payment as a Money In row",
    "   - Next morning: open UPI Reconciliation tab, resolve any Section A or B rows",
    "",
    "FORMULA CELLS are shaded blue. EXAMPLE rows are shaded yellow.",
    "Header rows are dark; freeze panes set on row 1 of every tab.",
]
for i, line in enumerate(instructions, start=7):
    readme.cell(row=i, column=1, value=line)
    if line and line[0].isdigit() and len(line) > 1 and line[1] == ".":
        readme.cell(row=i, column=1).font = Font(bold=True, size=12)
set_widths(readme, {1: 110})

wb.active = 0
wb.save(OUT)
print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes)")
print(f"Sample data: {len(MONEY_IN_SAMPLE)} money-in, {len(ACCOUNTS_SAMPLE)} accounts, {len(COMPLIANCE_SAMPLE)} compliance, {len(MONEY_OUT_SAMPLE)} money-out, {len(VENDORS_SAMPLE)} vendors, {len(CAPEX_SAMPLE)} capex, {len(DRAWS_SAMPLE)} draws")

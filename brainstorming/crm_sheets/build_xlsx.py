#!/usr/bin/env python3
"""
Regenerate TieredCakeCompany_CRM.xlsx from scratch.

Re-run after any schema change. Headers, formulas, validation lists, the 60-day
capacity calendar seed, and the realistic sample data are all defined here —
single source of truth.

    python3 build_xlsx.py

Sample data is grounded in two real Hyderabad gated communities the bakery is
likely to serve:

  - Rajapushpa Eterna, Nanakramguda, Financial District (pincode 500032)
    290 units, 3 towers (G+14), premium 3/4 BHK — Rajapushpa Properties.

  - Rajapushpa Provincia, Puppalaguda, Narsingi (pincode 500075)
    24 acres, 11 towers (4B+G+39), 2/3 BHK — Rajapushpa Properties.

Names, phone numbers, and unit numbers are fictional. Tower numbers are
plausible placeholders (Rajapushpa publishes counts but tower names vary).
"""
from datetime import date, timedelta
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

OUT = Path(__file__).parent / "TieredCakeCompany_CRM.xlsx"
TODAY = date(2026, 5, 24)  # session anchor; rerun on a different day re-seeds calendar from that day

HEADER_FILL = PatternFill("solid", fgColor="1F2937")
HEADER_FONT = Font(bold=True, color="FFFFFF")
EXAMPLE_FILL = PatternFill("solid", fgColor="FEF3C7")
DERIVED_FILL = PatternFill("solid", fgColor="EFF6FF")


def style_header(ws, n_cols: int) -> None:
    for c in range(1, n_cols + 1):
        cell = ws.cell(row=1, column=c)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    ws.row_dimensions[1].height = 36
    ws.freeze_panes = "A2"


def set_widths(ws, widths: dict[int, int]) -> None:
    for col, w in widths.items():
        ws.column_dimensions[get_column_letter(col)].width = w


def add_list_validation(ws, options: list[str], col_letter: str, last_row: int = 1000) -> None:
    formula = '"' + ",".join(options) + '"'
    dv = DataValidation(type="list", formula1=formula, allow_blank=True, showDropDown=False)
    dv.add(f"{col_letter}2:{col_letter}{last_row}")
    ws.add_data_validation(dv)


# ----------------------------------------------------------------------------
# Sample data — Rajapushpa Eterna & Provincia residents
# ----------------------------------------------------------------------------
# Address conventions:
#   Eterna:    "Flat <###>, Tower <N>, Rajapushpa Eterna, Nanakramguda, Financial District, Hyderabad 500032"
#   Provincia: "Flat <####>, Tower <N>, Rajapushpa Provincia, Puppalaguda, Narsingi, Hyderabad 500075"

CUSTOMERS_SAMPLE = [
    # (id, name, phone, email, address, dietary, channel, first_order, consent, consent_on, notes)
    ("CUS-0001", "Arjun Mehta", "+919812345678", "arjun.m@example.com",
     "Flat 1204, Tower 2, Rajapushpa Eterna, Nanakramguda, Financial District, Hyderabad 500032",
     "Eggless preferred (Marwari household)", "WhatsApp", date(2026, 1, 18),
     "Y", date(2026, 1, 22), "Two kids — Aanya (eggless cake fan), Veer (just turned 5)"),
    ("CUS-0002", "Priya Reddy", "+919876543210", "priya.r@example.com",
     "Flat 0708, Tower 5, Rajapushpa Provincia, Puppalaguda, Narsingi, Hyderabad 500075",
     "Egg ok", "Instagram", date(2026, 2, 14),
     "Y", date(2026, 2, 18), "Found us via Insta reel; kid Aarav's bday is the recurring trigger"),
    ("CUS-0003", "Karthik Subramaniam", "+919900112233", "karthik.s@example.com",
     "Flat 0502, Tower 1, Rajapushpa Eterna, Nanakramguda, Financial District, Hyderabad 500032",
     "Egg ok; no nuts (wife allergy)", "Referral", date(2025, 11, 30),
     "Y", date(2025, 12, 3), "Orders ~monthly; office celebrations + family events. Referred by Arjun."),
    ("CUS-0004", "Anjali Agarwal", "+919833221100", "anjali.a@example.com",
     "Flat 2102, Tower 9, Rajapushpa Provincia, Puppalaguda, Narsingi, Hyderabad 500075",
     "Strict eggless (Jain — no onion/garlic, but cakes ok)", "Instagram", date(2026, 3, 5),
     "Y", date(2026, 3, 10), "High AOV; willing to pay for premium eggless. Two kids."),
    ("CUS-0005", "Rohan Kapoor", "+919944556677", "rohan.k@example.com",
     "Flat 0904, Tower 3, Rajapushpa Eterna, Nanakramguda, Financial District, Hyderabad 500032",
     "Egg ok", "WhatsApp", date(2025, 12, 28),
     "Y", date(2026, 1, 2), "Anniversary always end-Dec; orders 1 day notice (chronic). Tip well."),
    ("CUS-0006", "Lakshmi Nair", "+919966778899", "lakshmi.n@example.com",
     "Flat 0306, Tower 7, Rajapushpa Provincia, Puppalaguda, Narsingi, Hyderabad 500075",
     "Egg ok", "Instagram", date(2026, 4, 12),
     "N", None, "Hasn't given marketing consent yet — only operational comms"),
    ("CUS-0007", "Sandeep Goyal", "+919811223344", "sandeep.g@example.com",
     "Flat 1801, Tower 4, Rajapushpa Provincia, Puppalaguda, Narsingi, Hyderabad 500075",
     "Eggless only", "Referral", date(2026, 2, 22),
     "Y", date(2026, 2, 25), "Bulk orders — Diwali gifting (50+ boxes last year). Anchor B2C-bulk relationship."),
    ("CUS-0008", "Sneha Iyer", "+919822334455", "sneha.i@example.com",
     "Flat 0402, Tower 2, Rajapushpa Eterna, Nanakramguda, Financial District, Hyderabad 500032",
     "Eggless preferred", "Instagram", date(2026, 4, 28),
     "Y", date(2026, 5, 1), "Husband orders; she's the decision-maker. Bday is May 30."),
    ("CUS-0009", "Vikram Bhatia", "+919855667788", "vikram.b@example.com",
     "Flat 1503, Tower 6, Rajapushpa Provincia, Puppalaguda, Narsingi, Hyderabad 500075",
     "Egg ok", "WhatsApp", date(2026, 3, 18),
     "Y", date(2026, 3, 20), "Punjabi household; loves rich chocolate. Two kids + anniversary."),
    ("CUS-0010", "Aditi Saxena", "+919877889900", "aditi.s@example.com",
     "Flat 1106, Tower 8, Rajapushpa Provincia, Puppalaguda, Narsingi, Hyderabad 500075",
     "Egg ok", "Referral", date(2026, 5, 10),
     "Y", date(2026, 5, 12), "Referred Lakshmi Nair; potential repeat referrer — treat well"),
]

ORDERS_SAMPLE = [
    # (customer_id, order_date, delivery_date, product, flavour, size, customisation,
    #  quoted, final, deposit, balance_received, payment_mode, delivery_mode, cold_chain,
    #  prod_status, deliv_status, feedback_recvd, rating, feedback_text, notes)
    ("CUS-0001", date(2026, 1, 18), date(2026, 1, 22),
     "Cake", "Eggless dark chocolate", "1.5kg",
     "Dinosaur theme for Veer's 5th — green/blue fondant",
     2800, 2800, 1400, 1400, "UPI", "Own delivery",
     "Delivered 10am — Hyderabad winter, no cold-chain concern",
     "Done", "Delivered", "Y", 5, "Veer wouldn't stop talking about it. Will reorder.", "First order"),
    ("CUS-0002", date(2026, 2, 14), date(2026, 2, 16),
     "Cupcakes", "Red velvet with cream cheese", "12 (1 dozen)",
     "Heart-shape liners; gold sprinkles for Valentine's",
     1500, 1500, 500, 1000, "UPI", "Customer pickup",
     "Picked up by Priya herself at 9:30am",
     "Done", "Delivered", "Y", 5, "Beautifully done!", ""),
    ("CUS-0003", date(2025, 11, 30), date(2025, 12, 2),
     "Cake", "Pineapple sponge", "1kg",
     "Office anniversary cake — 'Cordant 11 yrs' topper",
     2000, 2000, 0, 2000, "Bank Transfer", "Porter",
     "Porter at 4pm; office address Salarpuria Sattva Knowledge City",
     "Done", "Delivered", "Y", 4, "Sponge a bit dense — feedback noted", "Office order"),
    ("CUS-0004", date(2026, 3, 5), date(2026, 3, 9),
     "Cake", "Jain eggless red velvet", "2kg",
     "Unicorn theme for daughter Myra's 6th; pastel pink/purple; no fondant figures",
     4500, 4500, 2000, 2500, "UPI", "Own delivery",
     "Insulated box + 4 ice packs; Provincia to Eterna route, ~12 min",
     "Done", "Delivered", "Y", 5, "Worth every rupee. Eggless and still rich.", "Premium order — repeat likely"),
    ("CUS-0005", date(2025, 12, 28), date(2025, 12, 29),
     "Cake", "Chocolate truffle", "1kg",
     "Anniversary — 'R & N — 8 years' message",
     1800, 1800, 0, 1800, "UPI", "Own delivery",
     "Same-day winter delivery, no issues",
     "Done", "Delivered", "N", None, None, "Rush job (1-day notice) — fine because winter"),
    # Recent orders (within last 30 days of TODAY)
    ("CUS-0007", date(2026, 5, 14), date(2026, 5, 18),
     "Cake Tub", "Tiramisu + Biscoff mix", "6 tubs (assorted)",
     "Trial run before Diwali bulk order — Sandeep evaluating quality",
     3000, 3000, 1500, 1500, "UPI", "Own delivery",
     "Tubs delivered cold; insulated bag + 2 ice packs",
     "Done", "Delivered", "Y", 5, "Tiramisu nailed it. Let's plan Diwali boxes.", "Diwali pipeline trigger"),
    # An order delivered 2 days ago — drives feedback_request.gs
    ("CUS-0008", date(2026, 5, 18), date(2026, 5, 22),
     "Cake", "Eggless butterscotch", "1kg",
     "Sneha's birthday — minimalist gold + white, no piping figures",
     2200, 2200, 1100, 1100, "UPI", "Own delivery",
     "Pickup before 11am — Hyderabad summer, 38°C forecast",
     "Done", "Delivered", "N", None, None, "T+2 feedback request due today"),
    # Upcoming orders (in production)
    ("CUS-0009", date(2026, 5, 22), date(2026, 5, 27),
     "Cake", "Chocolate hazelnut", "2kg",
     "Vikram & wife's 10th anniversary — gold drip, photo on top",
     3500, 3500, 1500, 0, "UPI", "Own delivery",
     "Will be 39°C; insulated + ice packs; AM slot booked",
     "Decorate", "Pending", "N", None, None, "Photo edible-print to source by 25 May"),
    ("CUS-0002", date(2026, 5, 23), date(2026, 5, 30),
     "Cake", "Eggless chocolate", "2kg",
     "Aarav (kid) turning 7 — Spider-Man theme; red/blue fondant",
     3200, 3200, 1500, 0, "UPI", "Own delivery",
     "Saturday morning slot — heat, insulated box mandatory",
     "Queued", "Pending", "N", None, None, ""),
    ("CUS-0010", date(2026, 5, 22), date(2026, 5, 31),
     "Bomboloni", "Pistachio + Nutella (mixed box)", "12 (1 box of 12)",
     "Dinner-party box; Saturday evening pickup",
     1400, 1400, 700, 0, "UPI", "Customer pickup",
     "Pickup at 6pm; bomboloni hold 4h boxed",
     "Queued", "Pending", "N", None, None, "Aditi's first order"),
]

# Inquiries — mix of states, some unconverted, some already promoted to Customers
INQUIRIES_SAMPLE = [
    # (date, channel, name, phone, occasion, event_date, product_interest, budget_signal,
    #  status, assigned_to, quoted_amount, notes, lost_reason, consent_captured, linked_customer_id)
    (date(2026, 5, 23), "Instagram", "Meera Joshi", "+919811001100",
     "Birthday (kid)", date(2026, 6, 8),
     "2kg cake — Frozen / Elsa theme for daughter turning 6",
     "₹3500-4000", "Quoted", "Shreya", 3800,
     "Lives in Provincia (Tower 7); referral from Lakshmi Nair", None, "Y", None),
    (date(2026, 5, 23), "WhatsApp", "Tarun Saini", "+919822002200",
     "Anniversary", date(2026, 6, 1),
     "1kg eggless chocolate cake; surprise for wife",
     "~₹2000", "Confirmed", "Shreya", 2200,
     "Eterna resident, Tower 3. Promote to Customers post-delivery.", None, "Y", None),
    (date(2026, 5, 22), "WhatsApp", "Kavya Iyer", "+919833003300",
     "Just Because", None,
     "Box of bomboloni — pistachio favourite",
     "?", "New", "Shreya", None,
     "Friend of Arjun Mehta (CUS-0001). No event date — sometime in June", None, "N", None),
    (date(2026, 5, 21), "Instagram", "Naveen Pillai", "+919844004400",
     "Corporate", date(2026, 6, 15),
     "30 brownies + 30 cupcakes for office event (Cyberabad)",
     "₹10000 ceiling", "Lost", "Shreya", 9500,
     "Wanted invoice with GST; we're not GST-registered yet. Lost on this.", "Other", "N", None),
    (date(2026, 5, 20), "WhatsApp", "Pooja Bansal", "+919855005500",
     "Birthday", date(2026, 5, 25),
     "1kg cake, eggless, any flavour",
     "<₹2000", "Lost", "Shreya", None,
     "Date already full (Sunday). Politely declined; suggested next week.", "Date unavailable", "N", None),
    (date(2026, 5, 24), "Referral", "Rajiv Khanna", "+919866006600",
     "Wedding", date(2026, 8, 14),
     "Multi-tier wedding cake — daughter's wedding in August",
     "₹15000-25000", "New", "Shreya", None,
     "BIG one. Provincia (Tower 9); referred by Anjali Agarwal. Site visit needed.", None, "Y", None),
    # Promoted inquiries — link back to customer IDs already in Customers
    (date(2026, 5, 10), "Referral", "Aditi Saxena", "+919877889900",
     "Just Because", date(2026, 5, 31),
     "Bomboloni box for dinner party",
     "~₹1400", "Confirmed", "Shreya", 1400,
     "Referred by Lakshmi Nair", None, "Y", "CUS-0010"),
    (date(2026, 5, 18), "Instagram", "Sneha Iyer", "+919822334455",
     "Birthday", date(2026, 5, 22),
     "1kg eggless butterscotch — minimalist",
     "₹2200", "Confirmed", "Shreya", 2200,
     "First-time customer; husband initiated chat, Sneha is decision-maker", None, "Y", "CUS-0008"),
]

# Occasions — recurring dates per customer
OCCASIONS_SAMPLE = [
    # (customer_id, occasion_type, MM-DD, year_first, relation_label, notes)
    ("CUS-0001", "Birthday (kid)", "08-14", 2019, "Aanya (daughter, turns 7 in 2026)",
     "Eggless mandatory; loves unicorns and pastels"),
    ("CUS-0001", "Birthday (kid)", "01-22", 2021, "Veer (son, turned 5 in 2026)",
     "Dinosaur fan; dark chocolate fine"),
    ("CUS-0001", "Anniversary", "11-12", 2017, "Arjun & Tanya", ""),
    ("CUS-0002", "Birthday (kid)", "05-30", 2019, "Aarav (son, turning 7)",
     "Theme changes yearly — confirm 2 wks before"),
    ("CUS-0002", "Birthday (self)", "10-04", 1989, "Priya", ""),
    ("CUS-0003", "Anniversary", "12-02", 2014, "Karthik & Meghna",
     "Office cake annual tradition"),
    ("CUS-0004", "Birthday (kid)", "03-09", 2020, "Myra (daughter, turned 6)",
     "Jain eggless; no fondant figures"),
    ("CUS-0004", "Birthday (kid)", "09-21", 2022, "Krish (son, turning 4)", ""),
    ("CUS-0005", "Anniversary", "12-29", 2017, "Rohan & Nisha",
     "Always last-minute (1-day notice)"),
    ("CUS-0007", "Diwali bulk", "11-01", 2025, "Sandeep — corporate gifting",
     "50+ assorted boxes; lock production calendar 3 wks ahead"),
    ("CUS-0008", "Birthday (self)", "05-30", 1988, "Sneha", "Eggless preferred"),
    ("CUS-0009", "Anniversary", "05-27", 2016, "Vikram & Ria",
     "Photo edible-print preferred"),
    ("CUS-0009", "Birthday (kid)", "07-19", 2018, "Aria (daughter, turning 8)", ""),
    ("CUS-0010", "Birthday (self)", "11-23", 1991, "Aditi", ""),
]


# ----------------------------------------------------------------------------
# Workbook
# ----------------------------------------------------------------------------
wb = Workbook()
wb.remove(wb.active)


# ----------------------------------------------------------------------------
# 1. Inquiries
# ----------------------------------------------------------------------------
inq = wb.create_sheet("Inquiries")
inq_headers = [
    "Inquiry ID", "Date received", "Channel", "Name", "Phone",
    "Occasion", "Event date", "What they want", "Budget hint",
    "Status", "Assigned to", "Quoted (₹)", "Notes",
    "Lost reason", "Consent (Y/N)", "Logged at", "Customer ID (if promoted)",
]
inq.append(inq_headers)
style_header(inq, len(inq_headers))
set_widths(inq, {1: 12, 2: 13, 3: 12, 4: 18, 5: 16, 6: 16, 7: 12, 8: 30,
                 9: 14, 10: 11, 11: 13, 12: 11, 13: 32, 14: 16,
                 15: 14, 16: 18, 17: 18})

# Seed 200 rows of formulas; first N populated with samples.
for r in range(2, 202):
    inq.cell(row=r, column=1, value=f'=IF(B{r}="","","INQ-"&TEXT(ROW()-1,"0000"))').fill = DERIVED_FILL
    inq.cell(row=r, column=16, value=f'=IF(B{r}="","",NOW())').fill = DERIVED_FILL

for offset, row in enumerate(INQUIRIES_SAMPLE):
    r = 2 + offset
    # row tuple order: date, channel, name, phone, occasion, event_date, product_interest,
    # budget_signal, status, assigned_to, quoted_amount, notes, lost_reason, consent_captured, linked_customer_id
    columns = [None, *row[:8], row[8], row[9], row[10], row[11], row[12], row[13], None, row[14]]
    # map: A=auto, B=date, C=channel, D=name, E=phone, F=occasion, G=event_date,
    # H=product_interest, I=budget_signal, J=status, K=assigned_to, L=quoted_amount,
    # M=notes, N=lost_reason, O=consent_captured, P=auto, Q=linked_customer_id
    inq.cell(row=r, column=2, value=row[0]).fill = EXAMPLE_FILL
    inq.cell(row=r, column=3, value=row[1]).fill = EXAMPLE_FILL
    inq.cell(row=r, column=4, value=row[2]).fill = EXAMPLE_FILL
    inq.cell(row=r, column=5, value=row[3]).fill = EXAMPLE_FILL
    inq.cell(row=r, column=6, value=row[4]).fill = EXAMPLE_FILL
    if row[5]:
        inq.cell(row=r, column=7, value=row[5]).fill = EXAMPLE_FILL
    inq.cell(row=r, column=8, value=row[6]).fill = EXAMPLE_FILL
    if row[7]:
        inq.cell(row=r, column=9, value=row[7]).fill = EXAMPLE_FILL
    inq.cell(row=r, column=10, value=row[8]).fill = EXAMPLE_FILL
    inq.cell(row=r, column=11, value=row[9]).fill = EXAMPLE_FILL
    if row[10] is not None:
        inq.cell(row=r, column=12, value=row[10]).fill = EXAMPLE_FILL
    if row[11]:
        inq.cell(row=r, column=13, value=row[11]).fill = EXAMPLE_FILL
    if row[12]:
        inq.cell(row=r, column=14, value=row[12]).fill = EXAMPLE_FILL
    inq.cell(row=r, column=15, value=row[13]).fill = EXAMPLE_FILL
    if row[14]:
        inq.cell(row=r, column=17, value=row[14]).fill = EXAMPLE_FILL

add_list_validation(inq, ["WhatsApp", "Instagram", "Referral", "Walk-in", "Other"], "C")
add_list_validation(inq, ["Birthday", "Birthday (kid)", "Anniversary", "Wedding",
                          "Corporate", "Just Because", "Other"], "F")
add_list_validation(inq, ["New", "Quoted", "Confirmed", "Lost"], "J")
add_list_validation(inq, ["Swetha", "Shreya"], "K")
add_list_validation(inq, ["Price", "Date unavailable", "No response",
                          "Changed mind", "Other"], "N")
add_list_validation(inq, ["Y", "N"], "O")


# ----------------------------------------------------------------------------
# 2. Customers
# ----------------------------------------------------------------------------
cust = wb.create_sheet("Customers")
cust_headers = [
    "Customer ID", "Name", "Phone", "Email", "Address",
    "Dietary", "How they found us", "First order", "Last order",
    "Orders count", "Lifetime (₹)", "Marketing consent",
    "Consent date", "Notes",
]
cust.append(cust_headers)
style_header(cust, len(cust_headers))
set_widths(cust, {1: 12, 2: 22, 3: 16, 4: 26, 5: 48, 6: 28, 7: 18,
                  8: 12, 9: 12, 10: 10, 11: 13, 12: 14, 13: 12, 14: 36})

for r in range(2, 502):
    cust.cell(row=r, column=9,
              value=f'=IFERROR(IF(MAXIFS(Orders!E:E,Orders!B:B,A{r})=0,"",MAXIFS(Orders!E:E,Orders!B:B,A{r})),"")').fill = DERIVED_FILL
    cust.cell(row=r, column=10, value=f'=IF(A{r}="","",COUNTIF(Orders!B:B,A{r}))').fill = DERIVED_FILL
    cust.cell(row=r, column=11, value=f'=IF(A{r}="","",SUMIF(Orders!B:B,A{r},Orders!K:K))').fill = DERIVED_FILL

for offset, row in enumerate(CUSTOMERS_SAMPLE):
    r = 2 + offset
    # (id, name, phone, email, address, dietary, channel, first_order, consent, consent_on, notes)
    cust.cell(row=r, column=1, value=row[0]).fill = EXAMPLE_FILL
    cust.cell(row=r, column=2, value=row[1]).fill = EXAMPLE_FILL
    cust.cell(row=r, column=3, value=row[2]).fill = EXAMPLE_FILL
    cust.cell(row=r, column=4, value=row[3]).fill = EXAMPLE_FILL
    cust.cell(row=r, column=5, value=row[4]).fill = EXAMPLE_FILL
    cust.cell(row=r, column=6, value=row[5]).fill = EXAMPLE_FILL
    cust.cell(row=r, column=7, value=row[6]).fill = EXAMPLE_FILL
    cust.cell(row=r, column=8, value=row[7]).fill = EXAMPLE_FILL
    cust.cell(row=r, column=12, value=row[8]).fill = EXAMPLE_FILL
    if row[9]:
        cust.cell(row=r, column=13, value=row[9]).fill = EXAMPLE_FILL
    cust.cell(row=r, column=14, value=row[10]).fill = EXAMPLE_FILL

add_list_validation(cust, ["Instagram", "WhatsApp", "Referral", "Walk-in", "Repeat"], "G")
add_list_validation(cust, ["Y", "N"], "L")


# ----------------------------------------------------------------------------
# 3. Orders
# ----------------------------------------------------------------------------
orders = wb.create_sheet("Orders")
orders_headers = [
    "Order ID", "Customer ID", "Name (auto)", "Order date", "Delivery date",
    "Product", "Flavour", "Size / Qty", "Customisation",
    "Quoted (₹)", "Final (₹)", "Deposit received (₹)", "Balance received (₹)",
    "Balance due (₹)", "Payment mode", "Delivery mode", "Cold-chain notes",
    "UPI reference (UTR)", "Payer VPA",
    "Production", "Delivery", "Feedback received", "Rating",
    "Feedback", "Invoice ID", "Notes",
]
orders.append(orders_headers)
style_header(orders, len(orders_headers))
set_widths(orders, {1: 12, 2: 12, 3: 22, 4: 12, 5: 13, 6: 11, 7: 22,
                    8: 16, 9: 36, 10: 12, 11: 12, 12: 12, 13: 12,
                    14: 12, 15: 14, 16: 18, 17: 36,
                    18: 18, 19: 20,
                    20: 13, 21: 13, 22: 13, 23: 8, 24: 32, 25: 14, 26: 28})

for r in range(2, 502):
    orders.cell(row=r, column=1, value=f'=IF(B{r}="","","ORD-"&TEXT(ROW()-1,"0000"))').fill = DERIVED_FILL
    orders.cell(row=r, column=3, value=f'=IFERROR(VLOOKUP(B{r},Customers!A:B,2,FALSE),"")').fill = DERIVED_FILL
    orders.cell(row=r, column=14, value=f'=IF(K{r}="","",K{r}-IFERROR(L{r},0)-IFERROR(M{r},0))').fill = DERIVED_FILL

for offset, row in enumerate(ORDERS_SAMPLE):
    r = 2 + offset
    # (customer_id, order_date, delivery_date, product, flavour, size, customisation,
    #  quoted, final, deposit, balance_received, payment_mode, delivery_mode, cold_chain,
    #  prod_status, deliv_status, feedback_recvd, rating, feedback_text, notes)
    orders.cell(row=r, column=2, value=row[0]).fill = EXAMPLE_FILL
    orders.cell(row=r, column=4, value=row[1]).fill = EXAMPLE_FILL
    orders.cell(row=r, column=5, value=row[2]).fill = EXAMPLE_FILL
    orders.cell(row=r, column=6, value=row[3]).fill = EXAMPLE_FILL
    orders.cell(row=r, column=7, value=row[4]).fill = EXAMPLE_FILL
    orders.cell(row=r, column=8, value=row[5]).fill = EXAMPLE_FILL
    orders.cell(row=r, column=9, value=row[6]).fill = EXAMPLE_FILL
    orders.cell(row=r, column=10, value=row[7]).fill = EXAMPLE_FILL
    orders.cell(row=r, column=11, value=row[8]).fill = EXAMPLE_FILL
    orders.cell(row=r, column=12, value=row[9]).fill = EXAMPLE_FILL
    orders.cell(row=r, column=13, value=row[10]).fill = EXAMPLE_FILL
    orders.cell(row=r, column=15, value=row[11]).fill = EXAMPLE_FILL
    orders.cell(row=r, column=16, value=row[12]).fill = EXAMPLE_FILL
    orders.cell(row=r, column=17, value=row[13]).fill = EXAMPLE_FILL
    orders.cell(row=r, column=20, value=row[14]).fill = EXAMPLE_FILL
    orders.cell(row=r, column=21, value=row[15]).fill = EXAMPLE_FILL
    orders.cell(row=r, column=22, value=row[16]).fill = EXAMPLE_FILL
    if row[17] is not None:
        orders.cell(row=r, column=23, value=row[17]).fill = EXAMPLE_FILL
    if row[18]:
        orders.cell(row=r, column=24, value=row[18]).fill = EXAMPLE_FILL
    if row[19]:
        orders.cell(row=r, column=26, value=row[19]).fill = EXAMPLE_FILL

# UTR + VPA backfill for delivered orders (columns 18, 19)
# Index here is offset within ORDERS_SAMPLE (0-based)
UTR_VPA_BACKFILL = {
    0: ("422118203341", "arjun.mehta@oksbi"),     # CUS-0001 deposit+balance fully paid
    1: ("431229104852", "priya.r@okhdfcbank"),    # CUS-0002 fully paid
    2: ("4321XXXX5678", "bank-transfer"),         # CUS-0003 office transfer; no UTR (bank xfer)
    3: ("445533781290", "anjali.a@okaxis"),       # CUS-0004 fully paid
    4: ("449988102345", "rohan.k@okicici"),       # CUS-0005 fully paid
    5: ("520011445566", "sandeep.g@okhdfcbank"),  # CUS-0007 fully paid
    6: ("521122876543", "sneha.i@oksbi"),         # CUS-0008 fully paid
    7: ("522233998877", "vikram.b@okhdfcbank"),   # CUS-0009 deposit only (₹1500 of ₹3500)
    8: ("522288554433", "priya.r@okhdfcbank"),    # CUS-0002 repeat deposit only
    9: ("523344112266", "aditi.s@oksbi"),         # CUS-0010 deposit only
}
for offset, (utr, vpa) in UTR_VPA_BACKFILL.items():
    r = 2 + offset
    orders.cell(row=r, column=18, value=utr).fill = EXAMPLE_FILL
    orders.cell(row=r, column=19, value=vpa).fill = EXAMPLE_FILL

add_list_validation(orders, ["Cake", "Cupcakes", "Brownies", "Cake Tub",
                             "Bomboloni", "Mixed"], "F")
add_list_validation(orders, ["UPI", "Cash", "Bank Transfer", "Mixed"], "O")
add_list_validation(orders, ["Customer pickup", "Own delivery", "Porter",
                             "Dunzo", "Other"], "P")
add_list_validation(orders, ["Queued", "Prep", "Bake", "Decorate", "Done"], "T")
add_list_validation(orders, ["Pending", "Out", "Delivered", "Issue"], "U")
add_list_validation(orders, ["Y", "N"], "V")


# ----------------------------------------------------------------------------
# 4. Occasions
# ----------------------------------------------------------------------------
occ = wb.create_sheet("Occasions")
occ_headers = [
    "Occasion ID", "Customer ID", "Name (auto)", "Type",
    "Month-Day (MM-DD)", "Year first known", "For whom", "Notes",
    "Consent (auto)",
]
occ.append(occ_headers)
style_header(occ, len(occ_headers))
set_widths(occ, {1: 12, 2: 12, 3: 22, 4: 18, 5: 16, 6: 14, 7: 32,
                 8: 36, 9: 14})

for r in range(2, 502):
    occ.cell(row=r, column=1, value=f'=IF(B{r}="","","OCC-"&TEXT(ROW()-1,"0000"))').fill = DERIVED_FILL
    occ.cell(row=r, column=3, value=f'=IFERROR(VLOOKUP(B{r},Customers!A:B,2,FALSE),"")').fill = DERIVED_FILL
    occ.cell(row=r, column=9, value=f'=IFERROR(VLOOKUP(B{r},Customers!A:L,12,FALSE),"")').fill = DERIVED_FILL

for offset, row in enumerate(OCCASIONS_SAMPLE):
    r = 2 + offset
    # (customer_id, occasion_type, MM-DD, year_first, relation_label, notes)
    occ.cell(row=r, column=2, value=row[0]).fill = EXAMPLE_FILL
    occ.cell(row=r, column=4, value=row[1]).fill = EXAMPLE_FILL
    occ.cell(row=r, column=5, value=row[2]).fill = EXAMPLE_FILL
    if row[3]:
        occ.cell(row=r, column=6, value=row[3]).fill = EXAMPLE_FILL
    occ.cell(row=r, column=7, value=row[4]).fill = EXAMPLE_FILL
    if row[5]:
        occ.cell(row=r, column=8, value=row[5]).fill = EXAMPLE_FILL

add_list_validation(occ, ["Birthday (self)", "Birthday (kid)", "Anniversary",
                          "Wedding date", "Diwali bulk", "Other"], "D")


# ----------------------------------------------------------------------------
# 5. Capacity Calendar
# ----------------------------------------------------------------------------
cap = wb.create_sheet("Capacity Calendar")
cap_headers = [
    "Date", "Day", "Cake slots (total)", "Cake slots (used)",
    "Cupcake dozens (total)", "Cupcake dozens (used)",
    "Bomboloni batches (total)", "Bomboloni batches (used)",
    "Blocked", "Block reason", "Utilisation %", "Notes",
]
cap.append(cap_headers)
style_header(cap, len(cap_headers))
set_widths(cap, {1: 12, 2: 8, 3: 10, 4: 10, 5: 12, 6: 12, 7: 12, 8: 12,
                 9: 10, 10: 22, 11: 13, 12: 32})

for i in range(60):
    d = TODAY + timedelta(days=i)
    r = 2 + i
    is_weekend = d.weekday() >= 5
    cake_total = 5 if is_weekend else 3
    cap.cell(row=r, column=1, value=d)
    cap.cell(row=r, column=2, value=f'=TEXT(A{r},"ddd")').fill = DERIVED_FILL
    cap.cell(row=r, column=3, value=cake_total)
    cap.cell(row=r, column=4, value=f'=COUNTIFS(Orders!E:E,A{r},Orders!F:F,"Cake")').fill = DERIVED_FILL
    cap.cell(row=r, column=5, value=4)
    cap.cell(row=r, column=6, value=f'=COUNTIFS(Orders!E:E,A{r},Orders!F:F,"Cupcakes")').fill = DERIVED_FILL
    cap.cell(row=r, column=7, value=1)
    cap.cell(row=r, column=8, value=f'=COUNTIFS(Orders!E:E,A{r},Orders!F:F,"Bomboloni")').fill = DERIVED_FILL
    cap.cell(row=r, column=9, value="N")
    cap.cell(row=r, column=11,
             value=f'=IFERROR((D{r}/C{r}+F{r}/E{r}+H{r}/G{r})/3,0)').fill = DERIVED_FILL

add_list_validation(cap, ["Y", "N"], "I", last_row=200)


# ----------------------------------------------------------------------------
# 6. Occasions Calendar
# ----------------------------------------------------------------------------
ocal = wb.create_sheet("Occasions Calendar")
ocal_headers = [
    "Customer", "Occasion", "For whom", "Next date", "Notes", "First known year",
]
ocal.append(ocal_headers)
style_header(ocal, len(ocal_headers))
set_widths(ocal, {1: 22, 2: 18, 3: 32, 4: 14, 5: 36, 6: 16})

query_formula = (
    '''=QUERY({Occasions!C2:I,'''
    '''ARRAYFORMULA(IF(Occasions!E2:E="",,'''
    '''DATE(YEAR(TODAY())+IF(DATE(YEAR(TODAY()),'''
    '''VALUE(LEFT(Occasions!E2:E,2)),'''
    '''VALUE(RIGHT(Occasions!E2:E,2)))<TODAY(),1,0),'''
    '''VALUE(LEFT(Occasions!E2:E,2)),'''
    '''VALUE(RIGHT(Occasions!E2:E,2)))))},'''
    '''"select Col1, Col2, Col5, Col8, Col6, Col4 '''
    '''where Col8 is not null '''
    '''and Col8 <= date '"&TEXT(TODAY()+30,"yyyy-mm-dd")&"' '''
    '''and Col7 = 'Y' '''
    '''order by Col8 asc '''
    '''label Col1 'Customer', Col2 'Occasion', Col5 'For whom', '''
    '''Col8 'Next date', Col6 'Notes', Col4 'First known year'",0)'''
)
ocal.cell(row=2, column=1, value=query_formula).fill = DERIVED_FILL


# ----------------------------------------------------------------------------
# 7. README sheet — drop-in instructions inside the workbook itself
# ----------------------------------------------------------------------------
readme = wb.create_sheet("README", 0)
readme["A1"] = "Tiered Cake Company — CRM"
readme["A1"].font = Font(bold=True, size=18, color="1F2937")
readme["A3"] = "Owners: Swetha (S) · Shreya (Sh)"
readme["A4"] = "Geography: Hyderabad (catchment: Eterna, Provincia, broader Financial District / Narsingi)"
readme["A5"] = "Generated: " + TODAY.isoformat()
readme["A5"].font = Font(italic=True, color="6B7280")

instructions = [
    "",
    "1. IMPORT INTO GOOGLE SHEETS",
    "   - Open https://sheets.google.com",
    "   - File → Import → Upload → select this .xlsx → 'Replace spreadsheet'",
    "   - All formulas, validations, and the 60-day capacity calendar carry across",
    "",
    "2. SAMPLE DATA (highlighted yellow) is realistic but fictional",
    "   - 10 customers across Rajapushpa Eterna and Rajapushpa Provincia",
    "   - 10 orders (mix of delivered, in production, queued)",
    "   - 8 inquiries (mix of New / Quoted / Confirmed / Lost)",
    "   - 14 occasions seeded for the calendar projection",
    "   - DELETE all yellow rows before you start using the sheet for real",
    "",
    "3. SET UP THE GOOGLE FORM (see crm_strategy.md §6)",
    "   - Form → link responses to this spreadsheet → choose 'Inquiries' as destination",
    "",
    "4. INSTALL APPS SCRIPT (see brainstorming/crm_sheets/apps_script/)",
    "   - Extensions → Apps Script → paste each .gs file into a new script file",
    "   - Authorise the scopes when prompted (Gmail, Sheets, Forms)",
    "   - Triggers tab → add the triggers listed in each script's header comment",
    "",
    "5. TAB OWNERS (don't drift)",
    "   - Inquiries          → Sh writes, S reads",
    "   - Customers          → Sh writes, S reads",
    "   - Orders             → S writes, Sh reads",
    "   - Occasions          → Sh writes",
    "   - Capacity Calendar  → S writes totals; usage rolls up automatically",
    "   - Occasions Calendar → derived view; read-only",
    "",
    "6. DPDP CONSENT IS A HARD GATE",
    "   - Occasions Calendar QUERY filters Marketing consent = 'Y'",
    "   - Customers default = 'N'. Flip to 'Y' only with a screenshot of the YES",
    "",
    "7. REGENERATE THIS FILE",
    "   - python3 build_xlsx.py  (in brainstorming/crm_sheets/)",
    "",
    "FORMULA CELLS are shaded blue. EXAMPLE rows are shaded yellow.",
    "Header row is dark; freeze panes set on row 1 of every tab.",
]
for i, line in enumerate(instructions, start=7):
    readme.cell(row=i, column=1, value=line)
    if line and line[0].isdigit() and len(line) > 1 and line[1] == ".":
        readme.cell(row=i, column=1).font = Font(bold=True, size=12)
set_widths(readme, {1: 110})

wb.active = 0


wb.save(OUT)
print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes)")
print(f"Sample data: {len(CUSTOMERS_SAMPLE)} customers, "
      f"{len(ORDERS_SAMPLE)} orders, {len(INQUIRIES_SAMPLE)} inquiries, "
      f"{len(OCCASIONS_SAMPLE)} occasions")

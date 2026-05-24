"""
build_xlsx.py — Phase 4a
Generates TieredCakeCompany_Dashboard.xlsx for "Tiered Cake Company" home bakery (Hyderabad).

The Dashboard is READ-ONLY. It pulls live data from 4 other Google Sheets modules
via IMPORTRANGE. Formulas show #REF! in openpyxl/Excel because the IDs are
placeholders — they resolve after the operator replaces the IDs in Google Sheets.

Usage:
    cd brainstorming/dashboard_sheets
    python3 build_xlsx.py
"""

from datetime import date
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import (
    Alignment,
    Font,
    PatternFill,
    Border,
    Side,
)
from openpyxl.utils import get_column_letter

# ---------------------------------------------------------------------------
# IMPORTRANGE source IDs — OPERATOR REPLACES THESE after Google Sheets import.
# Find each ID in the sheet URL: docs.google.com/spreadsheets/d/<ID>/edit
# ---------------------------------------------------------------------------
CRM_ID = "CRM_SPREADSHEET_ID_PLACEHOLDER"
OPS_ID = "OPS_SPREADSHEET_ID_PLACEHOLDER"
FIN_ID = "FIN_SPREADSHEET_ID_PLACEHOLDER"
MKT_ID = "MKT_SPREADSHEET_ID_PLACEHOLDER"

# Open-module URLs — operator also replaces with real tab URLs after import.
# Format: https://docs.google.com/spreadsheets/d/<FILE_ID>/edit#gid=<TAB_GID>
URL_CRM_ORDERS = "https://docs.google.com/spreadsheets/d/CRM_ID/edit#gid=ORDERS_TAB_GID"
URL_FIN_MONEY_IN = "https://docs.google.com/spreadsheets/d/FIN_ID/edit#gid=MI_TAB_GID"
URL_FIN_RECON = "https://docs.google.com/spreadsheets/d/FIN_ID/edit#gid=RECON_TAB_GID"
URL_FIN_BANK = "https://docs.google.com/spreadsheets/d/FIN_ID/edit#gid=BANK_TAB_GID"
URL_FIN_COMPLIANCE = "https://docs.google.com/spreadsheets/d/FIN_ID/edit#gid=COMP_TAB_GID"
URL_OPS_BAKE = "https://docs.google.com/spreadsheets/d/OPS_ID/edit#gid=BAKE_TAB_GID"
URL_OPS_INGREDIENTS = "https://docs.google.com/spreadsheets/d/OPS_ID/edit#gid=ING_TAB_GID"
URL_MKT_CALENDAR = "https://docs.google.com/spreadsheets/d/MKT_ID/edit#gid=CC_TAB_GID"
URL_MKT_REVIEWS = "https://docs.google.com/spreadsheets/d/MKT_ID/edit#gid=REV_TAB_GID"
URL_CRM_CUSTOMERS = "https://docs.google.com/spreadsheets/d/CRM_ID/edit#gid=CUS_TAB_GID"
URL_CRM_CAPACITY = "https://docs.google.com/spreadsheets/d/CRM_ID/edit#gid=CAP_TAB_GID"

# ---------------------------------------------------------------------------
# FESTIVALS — local static table, embedded in Panel 7.
# Sorted by date ascending. Update each year for upcoming Hyderabad dates.
# ---------------------------------------------------------------------------
FESTIVALS = [
    # (name, date, notes)
    ("Eid al-Adha (Bakrid)", date(2026, 6, 16), "Premium dessert boxes for family meals"),
    ("Ganesh Chaturthi", date(2026, 9, 6), "Modak-shaped fondant; family celebrations"),
    ("Bathukamma", date(2026, 9, 30), "Telugu festival, ladies-only events; floral cake themes"),
    ("Karva Chauth", date(2026, 10, 30), "Custom heart-shaped cakes; eggless preferred"),
    ("Diwali (Lakshmi Puja)", date(2026, 11, 1), "Sweets demand peak; lock production calendar 3 wks ahead"),
    ("Christmas", date(2026, 12, 25), "Fruit cakes, plum cakes; corporate gifting"),
    ("Holi", date(2027, 3, 13), "Colour-themed cakes; brunch parties"),
]

# ---------------------------------------------------------------------------
# Style constants
# ---------------------------------------------------------------------------
HEADER_FILL = PatternFill(fill_type="solid", fgColor="2D4A3E")   # dark forest green
SUBHEADER_FILL = PatternFill(fill_type="solid", fgColor="4A7C6F")  # medium green
TITLE_FILL = PatternFill(fill_type="solid", fgColor="1A2E26")    # very dark green
ALT_FILL = PatternFill(fill_type="solid", fgColor="F0F5F3")      # light mint
NOTE_FILL = PatternFill(fill_type="solid", fgColor="FFF8E7")     # pale amber
ACTION_FILL = PatternFill(fill_type="solid", fgColor="FFF3E0")   # pale orange for action queue

THIN_BORDER = Border(
    left=Side(style="thin", color="CCCCCC"),
    right=Side(style="thin", color="CCCCCC"),
    top=Side(style="thin", color="CCCCCC"),
    bottom=Side(style="thin", color="CCCCCC"),
)

OUT = Path("TieredCakeCompany_Dashboard.xlsx")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _cell(ws, row, col, value=None, bold=False, italic=False, size=10,
          color="000000", fill=None, align_h="left", align_v="center",
          wrap=False, number_format=None):
    """Write a cell with common formatting."""
    c = ws.cell(row=row, column=col, value=value)
    c.font = Font(bold=bold, italic=italic, size=size, color=color)
    c.alignment = Alignment(horizontal=align_h, vertical=align_v, wrap_text=wrap)
    if fill:
        c.fill = fill
    if number_format:
        c.number_format = number_format
    return c


def write_section_header(ws, row, title, open_link_url, open_link_text, n_cols=8):
    """
    Write a dark-filled section header row:
      - cols 1..(n_cols-1): merged, bold white title
      - col n_cols: HYPERLINK formula for "Open <module> →"
    """
    # Write title in col 1
    _cell(ws, row, 1, value=title, bold=True, size=12, color="FFFFFF", fill=HEADER_FILL,
          align_v="center")

    # Fill remaining header columns
    for c in range(2, n_cols + 1):
        _cell(ws, row, c, fill=HEADER_FILL)

    # Hyperlink in last column
    link_cell = ws.cell(row=row, column=n_cols,
                        value=f'=HYPERLINK("{open_link_url}","{open_link_text}")')
    link_cell.font = Font(bold=True, color="FFFF99", size=10)
    link_cell.alignment = Alignment(horizontal="right", vertical="center")
    link_cell.fill = HEADER_FILL

    # Merge cols 1..(n_cols-1) for the title
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=n_cols - 1)
    ws.row_dimensions[row].height = 20


def _label_value(ws, row, label, formula, label_fill=None, value_fill=None,
                 number_format=None, bold_value=False):
    """Write a label in col A and a formula in col B."""
    _cell(ws, row, 1, value=label, bold=True, size=10, color="2D4A3E",
          fill=label_fill or ALT_FILL, align_h="left")
    c = ws.cell(row=row, column=2, value=formula)
    c.font = Font(bold=bold_value, size=10, color="000000")
    c.alignment = Alignment(horizontal="left", vertical="center")
    if value_fill:
        c.fill = value_fill
    if number_format:
        c.number_format = number_format
    return c


def _col_header_row(ws, row, headers, fill=None):
    """Write a row of column headers (for table panels)."""
    f = fill or SUBHEADER_FILL
    for i, h in enumerate(headers, start=1):
        _cell(ws, row, i, value=h, bold=True, size=9, color="FFFFFF", fill=f,
              align_h="center")


def _freeze_and_col_widths(ws, widths):
    """Set column widths dict: {col_letter: width}."""
    for col_letter, width in widths.items():
        ws.column_dimensions[col_letter].width = width


# ---------------------------------------------------------------------------
# Build Dashboard sheet
# ---------------------------------------------------------------------------

def build_dashboard(wb):
    ws = wb.create_sheet("Dashboard")
    ws.sheet_view.showGridLines = False

    # Set column widths
    _freeze_and_col_widths(ws, {
        "A": 32, "B": 18, "C": 18, "D": 18,
        "E": 14, "F": 14, "G": 14, "H": 28,
    })

    # Freeze panes below title + note rows
    ws.freeze_panes = "A3"

    # -----------------------------------------------------------------------
    # ROW 1: Title
    # -----------------------------------------------------------------------
    title_cell = ws.cell(row=1, column=1,
                         value="Tiered Cake Company — Dashboard")
    title_cell.font = Font(bold=True, size=18, color="FFFFFF")
    title_cell.fill = TITLE_FILL
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.merge_cells("A1:H1")
    ws.row_dimensions[1].height = 36

    # Fill all header columns for row 1
    for c in range(2, 9):
        ws.cell(row=1, column=c).fill = TITLE_FILL

    # -----------------------------------------------------------------------
    # ROW 2: Generated note + NOW()
    # -----------------------------------------------------------------------
    _cell(ws, 2, 1,
          value='READ-ONLY  —  Data pulls live from CRM, Finance, Operations, Marketing via IMPORTRANGE. '
                'Last refreshed:',
          italic=True, size=9, color="666666", fill=NOTE_FILL, align_h="left")
    ws.merge_cells("A2:F2")
    for c in range(2, 7):
        _cell(ws, 2, c, fill=NOTE_FILL)

    now_cell = ws.cell(row=2, column=7, value="=NOW()")
    now_cell.font = Font(italic=True, size=9, color="666666")
    now_cell.number_format = "dd-mmm-yyyy hh:mm"
    now_cell.fill = NOTE_FILL
    ws.merge_cells("G2:H2")
    ws.cell(row=2, column=8).fill = NOTE_FILL
    ws.row_dimensions[2].height = 16

    # -----------------------------------------------------------------------
    # ROW 3: Spacer
    # -----------------------------------------------------------------------
    ws.row_dimensions[3].height = 6

    # -----------------------------------------------------------------------
    # PANEL 1 — This week: orders due (next 7 days)  [rows 4-14]
    # -----------------------------------------------------------------------
    write_section_header(ws, 4,
                         "Panel 1 — This week: orders due (next 7 days)",
                         URL_CRM_ORDERS, "Open Orders →")

    # Column headers for the orders table
    _col_header_row(ws, 5,
                    ["Order ID", "Customer Name", "Cake Type", "Delivery Date",
                     "Qty", "Amount (₹)", "Deposit Paid?", "Status"])

    # Data: QUERY of IMPORTRANGE CRM Orders for delivery_date in [TODAY, TODAY+7]
    # Row 6 gets the QUERY formula; rows 7-14 are overflow rows (Sheets will spill).
    # Note: \' and & below are Google Sheets formula characters inside a Python string.
    # \& is not a Python escape — use the explicit concatenation form instead.
    p1_formula = (
        '=IFERROR(QUERY(IMPORTRANGE("' + CRM_ID + '","Orders!A:J"),'
        '"select Col1,Col2,Col3,Col4,Col5,Col6,Col7,Col8 '
        "where Col4 >= date '\"" + '&TEXT(TODAY(),"yyyy-mm-dd")&' + "\"' "
        "and Col4 <= date '\"" + '&TEXT(TODAY()+7,"yyyy-mm-dd")&' + "\"' "
        "and Col1 <> 'Order ID' "
        'order by Col4 asc '
        'label Col1 \'\',Col2 \'\',Col3 \'\',Col4 \'\',Col5 \'\',Col6 \'\',Col7 \'\',Col8 \'\'"'
        ',1),"(no orders this week)")'
    )
    ws.cell(row=6, column=1, value=p1_formula).font = Font(size=9, color="1A2E26")
    ws.cell(row=6, column=1).alignment = Alignment(wrap_text=False)

    # Placeholder / spill rows 7-14 (light fill so the table area is visible)
    for r in range(7, 15):
        for c in range(1, 9):
            ws.cell(row=r, column=c).fill = ALT_FILL if r % 2 == 1 else PatternFill()

    ws.row_dimensions[15].height = 6  # spacer

    # -----------------------------------------------------------------------
    # PANEL 2 — Cash position  [rows 16-22]
    # -----------------------------------------------------------------------
    write_section_header(ws, 16,
                         "Panel 2 — Cash position",
                         URL_FIN_BANK, "Open Finance → Bank vs UPI Float →")

    _label_value(ws, 17, "Bank balance (₹)",
                 f'=IFERROR(INDEX(IMPORTRANGE("{FIN_ID}","Bank vs UPI Float!F:F"),2),0)',
                 number_format="₹#,##0.00")

    _label_value(ws, 18, "UPI float (₹)",
                 f'=IFERROR(INDEX(IMPORTRANGE("{FIN_ID}","Bank vs UPI Float!G:G"),2),0)',
                 number_format="₹#,##0.00")

    _label_value(ws, 19, "Cash drawer (₹)",
                 f'=IFERROR(INDEX(IMPORTRANGE("{FIN_ID}","Bank vs UPI Float!H:H"),2),0)',
                 number_format="₹#,##0.00")

    # Total row (bold)
    _cell(ws, 20, 1, value="TOTAL CASH (₹)", bold=True, size=10, color="FFFFFF",
          fill=SUBHEADER_FILL)
    total_cell = ws.cell(row=20, column=2, value="=SUM(B17:B19)")
    total_cell.font = Font(bold=True, size=11, color="1A2E26")
    total_cell.number_format = "₹#,##0.00"
    total_cell.fill = SUBHEADER_FILL

    _label_value(ws, 21, "UPI unmatched (₹) ⚠️",
                 f'=IFERROR(IMPORTRANGE("{FIN_ID}","UPI Reconciliation!B48"),0)',
                 number_format="₹#,##0.00")

    ws.row_dimensions[22].height = 6  # spacer

    # -----------------------------------------------------------------------
    # PANEL 3 — Top customers by lifetime value  [rows 23-29]
    # -----------------------------------------------------------------------
    write_section_header(ws, 23,
                         "Panel 3 — Top customers (by lifetime value)",
                         URL_CRM_CUSTOMERS, "Open Customers →")

    _col_header_row(ws, 24,
                    ["Customer Name", "Phone", "Total Orders", "Lifetime Value (₹)",
                     "Last Order", "Preferred Type", "Notes", ""])

    p3_formula = (
        '=IFERROR(QUERY(IMPORTRANGE("' + CRM_ID + '","Customers!A:G"),'
        '"select Col1,Col2,Col3,Col4,Col5,Col6,Col7 '
        'where Col1 <> \'Customer Name\' '
        'order by Col4 desc '
        'limit 5 '
        'label Col1 \'\',Col2 \'\',Col3 \'\',Col4 \'\',Col5 \'\',Col6 \'\',Col7 \'\'"'
        ',1),"(no customer data)")'
    )
    ws.cell(row=25, column=1, value=p3_formula).font = Font(size=9, color="1A2E26")

    for r in range(25, 30):
        for c in range(1, 9):
            ws.cell(row=r, column=c).fill = ALT_FILL if r % 2 == 1 else PatternFill()

    ws.row_dimensions[29].height = 6  # spacer (after panel 3 ends at row 29)

    # -----------------------------------------------------------------------
    # PANEL 4 — Production load next 14 days  [rows 30-45]
    # -----------------------------------------------------------------------
    write_section_header(ws, 30,
                         "Panel 4 — Production load — next 14 days",
                         URL_CRM_CAPACITY, "Open Capacity Calendar →")

    _col_header_row(ws, 31,
                    ["Date", "Cakes Booked", "Cake Capacity", "Cupcakes Booked",
                     "Cup. Capacity", "Bomboloni Booked", "Bomb. Capacity", "% Load"])

    p4_formula = (
        '=IFERROR(QUERY(IMPORTRANGE("' + CRM_ID + '","Capacity Calendar!A:H"),'
        '"select Col1,Col2,Col3,Col4,Col5,Col6,Col7,Col8 '
        'where Col1 >= date \'"\&TEXT(TODAY(),"yyyy-mm-dd")&"\' '
        'and Col1 <= date \'"\&TEXT(TODAY()+14,"yyyy-mm-dd")&"\' '
        'and Col1 <> \'Date\' '
        'order by Col1 asc '
        'label Col1 \'\',Col2 \'\',Col3 \'\',Col4 \'\',Col5 \'\',Col6 \'\',Col7 \'\',Col8 \'\'"'
        ',1),"(no production data)")'
    )
    ws.cell(row=32, column=1, value=p4_formula).font = Font(size=9, color="1A2E26")

    for r in range(32, 45):
        for c in range(1, 9):
            ws.cell(row=r, column=c).fill = ALT_FILL if r % 2 == 1 else PatternFill()

    ws.row_dimensions[45].height = 6  # spacer

    # -----------------------------------------------------------------------
    # PANEL 5 — Marketing health  [rows 46-50]
    # -----------------------------------------------------------------------
    write_section_header(ws, 46,
                         "Panel 5 — Marketing health",
                         URL_MKT_CALENDAR, "Open Content Calendar →")

    _label_value(ws, 47, "Posts this week (±7 days)",
                 '=IFERROR(QUERY(IMPORTRANGE("' + MKT_ID + '","Content Calendar!A:D"),'
                 '"select count(Col1) '
                 'where Col2 >= date \'"\&TEXT(TODAY()-7,"yyyy-mm-dd")&"\' '
                 'and Col2 <= date \'"\&TEXT(TODAY()+7,"yyyy-mm-dd")&"\' '
                 'label count(Col1) \'\'"'
                 ',1),0)')

    _label_value(ws, 48, "New reviews this month",
                 '=IFERROR(QUERY(IMPORTRANGE("' + MKT_ID + '","Reviews Tracker!A:E"),'
                 '"select count(Col1) '
                 'where Col2 >= date \'"\&TEXT(EOMONTH(TODAY(),-1)+1,"yyyy-mm-dd")&"\' '
                 'label count(Col1) \'\'"'
                 ',1),0)')

    _label_value(ws, 49, "Average rating (this month)",
                 '=IFERROR(QUERY(IMPORTRANGE("' + MKT_ID + '","Reviews Tracker!A:E"),'
                 '"select avg(Col3) '
                 'where Col2 >= date \'"\&TEXT(EOMONTH(TODAY(),-1)+1,"yyyy-mm-dd")&"\' '
                 'label avg(Col3) \'\'"'
                 ',1),0)',
                 number_format="0.0")

    ws.row_dimensions[50].height = 6  # spacer

    # -----------------------------------------------------------------------
    # PANEL 6 — Action queue  [rows 51-67]
    # -----------------------------------------------------------------------
    write_section_header(ws, 51,
                         "Panel 6 — Action queue (items needing attention)",
                         URL_FIN_COMPLIANCE, "Open Finance → Compliance →")

    # Column headers
    _col_header_row(ws, 52,
                    ["Action item", "Count", "Source", "", "", "", "", ""])

    action_items = [
        (
            "Compliance items due for renewal",
            f'=IFERROR(QUERY(IMPORTRANGE("{FIN_ID}","Compliance Tracker!A:F"),'
            '"select count(Col1) '
            'where Col5 <= date \'"\&TEXT(TODAY()+30,"yyyy-mm-dd")&"\' '
            'and Col6 <> \'Renewed\' '
            'label count(Col1) \'\'"'
            ',1),0)',
            "Finance → Compliance Tracker",
        ),
        (
            "Confirmed orders with no deposit",
            f'=IFERROR(QUERY(IMPORTRANGE("{CRM_ID}","Orders!A:J"),'
            '"select count(Col1) '
            'where Col7 = 0 '
            'and Col8 = \'Confirmed\' '
            'label count(Col1) \'\'"'
            ',1),0)',
            "CRM → Orders",
        ),
        (
            "Orders delivered T+2 without feedback",
            f'=IFERROR(QUERY(IMPORTRANGE("{CRM_ID}","Orders!A:J"),'
            '"select count(Col1) '
            'where Col8 = \'Delivered\' '
            'and Col4 <= date \'"\&TEXT(TODAY()-2,"yyyy-mm-dd")&"\' '
            'and Col9 = \'\' '
            'label count(Col1) \'\'"'
            ',1),0)',
            "CRM → Orders (feedback col)",
        ),
        (
            "Ingredients below PAR level",
            f'=IFERROR(QUERY(IMPORTRANGE("{OPS_ID}","Ingredients!A:G"),'
            '"select count(Col1) '
            'where Col3 < Col4 '
            'and Col1 <> \'Ingredient\' '
            'label count(Col1) \'\'"'
            ',1),0)',
            "Operations → Ingredients",
        ),
        (
            "Posts scheduled next 24 h still in Draft",
            f'=IFERROR(QUERY(IMPORTRANGE("{MKT_ID}","Content Calendar!A:D"),'
            '"select count(Col1) '
            'where Col2 >= date \'"\&TEXT(TODAY(),"yyyy-mm-dd")&"\' '
            'and Col2 <= date \'"\&TEXT(TODAY()+1,"yyyy-mm-dd")&"\' '
            'and Col4 = \'Draft\' '
            'label count(Col1) \'\'"'
            ',1),0)',
            "Marketing → Content Calendar",
        ),
    ]

    for i, (label, formula, source) in enumerate(action_items, start=53):
        fill = ACTION_FILL if i % 2 == 1 else ALT_FILL
        _cell(ws, i, 1, value=label, size=9, color="2D4A3E", fill=fill, align_h="left")
        c = ws.cell(row=i, column=2, value=formula)
        c.font = Font(bold=True, size=11, color="1A2E26")
        c.alignment = Alignment(horizontal="center", vertical="center")
        c.fill = fill
        _cell(ws, i, 3, value=source, italic=True, size=8, color="666666",
              fill=fill, align_h="left")
        ws.merge_cells(start_row=i, start_column=3, end_row=i, end_column=8)

    ws.row_dimensions[58].height = 6  # spacer after action queue items

    # Note row below action queue
    note_r = 59
    _cell(ws, note_r, 1,
          value="If any count above is > 0, investigate before end-of-day.",
          italic=True, size=9, color="CC5500", fill=NOTE_FILL, align_h="left")
    ws.merge_cells(f"A{note_r}:H{note_r}")
    for c in range(2, 9):
        ws.cell(row=note_r, column=c).fill = NOTE_FILL

    ws.row_dimensions[60].height = 6  # spacer before panel 7

    # -----------------------------------------------------------------------
    # PANEL 7 — Festival cash cycle  [rows 61-80]
    # -----------------------------------------------------------------------
    write_section_header(ws, 61,
                         "Panel 7 — Festival cash cycle (Hyderabad calendar)",
                         "https://docs.google.com/spreadsheets/d/CRM_ID/edit",
                         "Open CRM →")

    # --- Upcoming festivals smart view ---
    _cell(ws, 62, 1, value="Upcoming festivals (from today)", bold=True, size=9,
          color="2D4A3E", fill=SUBHEADER_FILL, align_h="left")
    _cell(ws, 62, 1).font = Font(bold=True, size=9, color="FFFFFF")
    ws.merge_cells("A62:H62")
    for c in range(2, 9):
        ws.cell(row=62, column=c).fill = SUBHEADER_FILL

    # FILTER formula — lists upcoming festivals from the embedded table (D72:F78)
    filter_formula = "=IFERROR(FILTER(D72:F78, E72:E78>TODAY()), \"(all festivals past — update FESTIVALS table)\")"
    filter_cell = ws.cell(row=63, column=4, value=filter_formula)
    filter_cell.font = Font(size=9, color="1A2E26")
    filter_cell.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)

    # Key rows: Next festival + days until
    _label_value(ws, 64, "Next festival",
                 "=IFERROR(INDEX(D72:D78, MATCH(TRUE, E72:E78>TODAY(), 0)), \"(update table)\")")
    _label_value(ws, 65, "Days until next festival",
                 "=IFERROR(INDEX(E72:E78, MATCH(TRUE, E72:E78>TODAY(), 0)) - TODAY(), \"—\")",
                 number_format="0")
    _label_value(ws, 66, "Suggested pre-buy date (21 days prior)",
                 "=IFERROR(INDEX(E72:E78, MATCH(TRUE, E72:E78>TODAY(), 0)) - 21, \"—\")",
                 number_format="dd-mmm-yyyy")

    # Note about array formula
    _cell(ws, 67, 1,
          value="NOTE: If panel 7 rows 64-66 show #VALUE, select each formula cell and press Ctrl+Shift+Enter to enable array formula in Google Sheets.",
          italic=True, size=8, color="888888", fill=NOTE_FILL, align_h="left", wrap=True)
    ws.merge_cells("A67:H67")
    for c in range(2, 9):
        ws.cell(row=67, column=c).fill = NOTE_FILL
    ws.row_dimensions[67].height = 28

    # --- Static FESTIVALS reference table at rows 72-78, cols D-F ---
    ws.row_dimensions[68].height = 6  # spacer
    ws.row_dimensions[69].height = 6
    ws.row_dimensions[70].height = 6

    # Table header at row 71
    _cell(ws, 71, 4, value="Festival Name", bold=True, size=9, color="FFFFFF",
          fill=SUBHEADER_FILL, align_h="center")
    _cell(ws, 71, 5, value="Date", bold=True, size=9, color="FFFFFF",
          fill=SUBHEADER_FILL, align_h="center")
    _cell(ws, 71, 6, value="Notes", bold=True, size=9, color="FFFFFF",
          fill=SUBHEADER_FILL, align_h="left")
    ws.merge_cells("F71:H71")
    for c in range(7, 9):
        ws.cell(row=71, column=c).fill = SUBHEADER_FILL

    _cell(ws, 70, 4,
          value="FESTIVALS TABLE (cols D-F, rows 72-78) — update dates each year",
          italic=True, size=8, color="666666", align_h="left")
    ws.merge_cells("D70:H70")

    # Write festival data rows 72-78
    for i, (name, festival_date, notes) in enumerate(FESTIVALS):
        row = 72 + i
        fill = ALT_FILL if i % 2 == 0 else PatternFill()
        _cell(ws, row, 4, value=name, bold=False, size=9, fill=fill, align_h="left")
        date_cell = ws.cell(row=row, column=5, value=festival_date)
        date_cell.number_format = "dd-mmm-yyyy"
        date_cell.font = Font(size=9)
        date_cell.fill = fill
        date_cell.alignment = Alignment(horizontal="center")
        _cell(ws, row, 6, value=notes, size=8, color="444444", fill=fill,
              align_h="left", wrap=True)
        ws.merge_cells(start_row=row, start_column=6, end_row=row, end_column=8)
        ws.row_dimensions[row].height = 18

    # Final note row
    final_row = 80
    _cell(ws, final_row, 1,
          value="Dashboard v1.0 — Phase 4a  |  Built with openpyxl  |  "
                "Designed for Google Sheets. All IMPORTRANGE formulas require operator setup (see README).",
          italic=True, size=8, color="AAAAAA", align_h="center")
    ws.merge_cells(f"A{final_row}:H{final_row}")

    return ws


# ---------------------------------------------------------------------------
# Build README sheet (in-workbook)
# ---------------------------------------------------------------------------

def build_readme(wb):
    ws = wb.create_sheet("README")
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 100

    lines = [
        ("Tiered Cake Company — Dashboard (Phase 4)", True, 16, "FFFFFF", TITLE_FILL),
        ("READ-ONLY. Open every morning. The morning_digest.gs email is the phone-equivalent.", False, 11, "FFFFFF", TITLE_FILL),
        ("", False, 10, "000000", None),
        ("CRITICAL SETUP (do once after importing to Google Sheets)", True, 13, "FFFFFF", HEADER_FILL),
        ("", False, 10, "000000", None),
        ("Step 0: Import the xlsx file to Google Drive > Google Sheets. Rename the file to '00_Dashboard'.", False, 10, "1A2E26", ALT_FILL),
        ("", False, 10, "000000", None),
        ("Step 1 (CRITICAL): Replace placeholder IDs in the Dashboard tab.", True, 11, "CC2200", NOTE_FILL),
        ("  Each IMPORTRANGE formula uses a file ID like 'CRM_SPREADSHEET_ID_PLACEHOLDER'.", False, 10, "333333", NOTE_FILL),
        ("  To find a sheet's ID: open the sheet in browser, copy the long string between /d/ and /edit in the URL.", False, 10, "333333", NOTE_FILL),
        ("  Replace ALL occurrences of each placeholder:", False, 10, "333333", NOTE_FILL),
        ("    CRM_SPREADSHEET_ID_PLACEHOLDER  →  ID of your CRM Google Sheet", False, 10, "006600", NOTE_FILL),
        ("    OPS_SPREADSHEET_ID_PLACEHOLDER  →  ID of your Operations Google Sheet", False, 10, "006600", NOTE_FILL),
        ("    FIN_SPREADSHEET_ID_PLACEHOLDER  →  ID of your Finance Google Sheet", False, 10, "006600", NOTE_FILL),
        ("    MKT_SPREADSHEET_ID_PLACEHOLDER  →  ID of your Marketing Google Sheet", False, 10, "006600", NOTE_FILL),
        ("  Also replace the Open-link URLs at the top of each panel (gid= values = tab IDs).", False, 10, "333333", NOTE_FILL),
        ("  To find a tab's gid: click the tab in Google Sheets; copy gid=XXXX from the URL bar.", False, 10, "333333", NOTE_FILL),
        ("  WITHOUT this step, every panel shows #REF!  Do NOT skip.", True, 10, "CC2200", NOTE_FILL),
        ("", False, 10, "000000", None),
        ("Step 2: Authorise IMPORTRANGE (4 pairs).", True, 11, "1A2E26", ALT_FILL),
        ("  Click the first #REF! cell in each panel. A pop-up 'Allow access' appears. Click it.", False, 10, "333333", ALT_FILL),
        ("  Repeat for CRM, Finance, Operations, Marketing (4 separate authorisations).", False, 10, "333333", ALT_FILL),
        ("  You only need to authorise once per source-sheet pair. After that, all IMPORTRANGE from that sheet resolve.", False, 10, "333333", ALT_FILL),
        ("", False, 10, "000000", None),
        ("Step 3: Install Apps Scripts (Phase 4b, separate step).", True, 11, "1A2E26", ALT_FILL),
        ("  morning_digest.gs  —  daily email summary sent at 7 AM (Extensions > Apps Script).", False, 10, "333333", ALT_FILL),
        ("  festival_pre_block.gs  —  runs from CRM sheet; auto-blocks capacity 21 days before each festival.", False, 10, "333333", ALT_FILL),
        ("  See apps_script/ folder for source files (Phase 4b).", False, 10, "333333", ALT_FILL),
        ("", False, 10, "000000", None),
        ("Step 4: Daily use.", True, 11, "1A2E26", ALT_FILL),
        ("  Bookmark the Dashboard URL. Open every morning.", False, 10, "333333", ALT_FILL),
        ("  Check Panel 6 (Action queue) first — non-zero counts need same-day attention.", False, 10, "333333", ALT_FILL),
        ("  OR: read the morning digest email (Phase 4b) on your phone.", False, 10, "333333", ALT_FILL),
        ("", False, 10, "000000", None),
        ("THE 7 PANELS", True, 13, "FFFFFF", HEADER_FILL),
        ("", False, 10, "000000", None),
        ("Panel 1 — This week: orders due (next 7 days)", True, 10, "1A2E26", ALT_FILL),
        ("  QUERY+IMPORTRANGE from CRM → Orders. Shows all deliveries in the next 7 days.", False, 9, "444444", ALT_FILL),
        ("Panel 2 — Cash position", True, 10, "1A2E26", PatternFill()),
        ("  Bank balance, UPI float, cash drawer (from Finance → Bank vs UPI Float). TOTAL + UPI unmatched alert.", False, 9, "444444", PatternFill()),
        ("Panel 3 — Top customers by lifetime value", True, 10, "1A2E26", ALT_FILL),
        ("  Top 5 customers from CRM → Customers, ordered by lifetime spend.", False, 9, "444444", ALT_FILL),
        ("Panel 4 — Production load next 14 days", True, 10, "1A2E26", PatternFill()),
        ("  Cake / cupcake / bomboloni booked vs capacity from CRM → Capacity Calendar.", False, 9, "444444", PatternFill()),
        ("Panel 5 — Marketing health", True, 10, "1A2E26", ALT_FILL),
        ("  Posts this week, new reviews, average rating from Marketing → Content Calendar + Reviews Tracker.", False, 9, "444444", ALT_FILL),
        ("Panel 6 — Action queue", True, 10, "1A2E26", PatternFill()),
        ("  Five auto-counted alerts: compliance renewals, missing deposits, unacknowledged deliveries,", False, 9, "444444", PatternFill()),
        ("  ingredients below PAR, draft posts due in 24 h.", False, 9, "444444", PatternFill()),
        ("Panel 7 — Festival cash cycle", True, 10, "1A2E26", ALT_FILL),
        ("  Static Hyderabad festival table (rows 72-78, cols D-F) + smart FILTER/MATCH formulas for", False, 9, "444444", ALT_FILL),
        ("  next upcoming festival, days until, suggested pre-buy date (21 days prior).", False, 9, "444444", ALT_FILL),
        ("  Update dates annually. MATCH/FILTER formulas may need Ctrl+Shift+Enter in legacy Sheets.", False, 9, "888888", ALT_FILL),
        ("", False, 10, "000000", None),
        ("Generated by build_xlsx.py (Phase 4a) — openpyxl 3.1.5  |  Tiered Cake Company, Hyderabad", False, 8, "AAAAAA", None),
    ]

    for i, (text, bold, size, color, fill) in enumerate(lines, start=1):
        c = ws.cell(row=i, column=1, value=text)
        c.font = Font(bold=bold, size=size, color=color)
        c.alignment = Alignment(wrap_text=True, vertical="top")
        if fill:
            c.fill = fill
        ws.row_dimensions[i].height = max(15, size + 6)

    return ws


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    wb = Workbook()
    # Remove default sheet
    default = wb.active
    wb.remove(default)

    build_readme(wb)
    build_dashboard(wb)

    wb.save(OUT)
    print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes)")
    print(f"Festivals seeded: {len(FESTIVALS)}")
    print("NOTE: IMPORTRANGE placeholders must be replaced after Google Sheets import (see README §Phase 1).")


if __name__ == "__main__":
    main()

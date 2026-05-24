#!/usr/bin/env python3
"""
Regenerate TieredCakeCompany_Marketing.xlsx from scratch (Phase 3 scope).

Re-run after any schema change. Headers, formulas, validation lists, and
sample data are all defined here — single source of truth.

    python3 build_xlsx.py

Phase 3 tabs: README, Content Calendar, Asset Library, Performance,
Hashtag Library, Reviews Tracker.

No Apps Scripts for Phase 3. Scheduling is handled via Meta Business Suite
(MBS). Reviews and performance metrics are logged manually.
"""
from datetime import date
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

OUT = Path(__file__).parent / "TieredCakeCompany_Marketing.xlsx"
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

# Tab 1: Content Calendar
# Each tuple: (planned_date, channel, status, caption, asset_link, mbs_url,
#              theme, hashtag_set, posted_on, notes)
CONTENT_SAMPLE = [
    (date(2026, 5, 18), "Instagram Feed", "Posted",
     "Sneha's birthday eggless butterscotch — minimalist gold & white. Made with love in Eterna. \U0001f90d #aMomentWithACake",
     "https://drive.google.com/drive/folders/xxx/sneha-bday.jpg", "",
     "Customer Story", "SET-002", date(2026, 5, 22),
     "Reach 1.2K, 84 likes, 12 saves; 3 DM inquiries"),
    (date(2026, 5, 22), "Instagram Reel", "Posted",
     "Behind the scenes — making Vikram & Ria's 10th anniversary cake. Hazelnut crunch, gold drip, edible photo. \U0001f382",
     "https://drive.google.com/drive/folders/xxx/vikram-anniversary-reel.mp4", "",
     "Behind the Scenes", "SET-001", date(2026, 5, 27),
     ""),
    (date(2026, 5, 28), "Instagram Feed", "Scheduled",
     "Aarav turns 7! Spider-Man cake for our Provincia regular \U0001f577️\U0001f382",
     "https://drive.google.com/drive/folders/xxx/aarav-spiderman.jpg",
     "https://business.facebook.com/business_suite/yyy",
     "Customer Story", "SET-001", None,
     "Reveal post day-of delivery (30 May AM)"),
    (date(2026, 6, 5), "Instagram Story", "Draft",
     "Custom bomboloni boxes for dinner parties — pistachio, Nutella, custard, dulce de leche",
     "https://drive.google.com/drive/folders/xxx/bomboloni-flat-lay.jpg", "",
     "Product Showcase", "SET-003", None,
     ""),
    (date(2026, 6, 12), "Instagram Reel", "Idea",
     "1-min reel: how we keep cake structure intact in Hyderabad's 40°C summer",
     "", "", "Educational", "SET-004", None,
     "Tie to monsoon arrival; shoot in next 2 weeks"),
    (date(2026, 7, 15), "Instagram Feed", "Idea",
     "Eid al-Adha — eggless dates-and-walnut loaf",
     "", "", "Festival", "SET-005", None,
     ""),
    (date(2026, 8, 7), "Instagram Feed", "Idea",
     "Raksha Bandhan — pre-order custom mithai-style brownies (heart shape, gold leaf)",
     "", "", "Festival", "SET-005", None,
     ""),
    (date(2026, 5, 30), "WhatsApp Status", "Scheduled",
     "Open orders for June anniversary cakes — DM to book",
     "", "", "Promotion", "SET-006", None,
     ""),
    (date(2026, 5, 10), "Instagram Feed", "Posted",
     "Lakshmi & family loved their bomboloni box. Repeat customer alert \U0001f49b",
     "https://drive.google.com/drive/folders/xxx/lakshmi-review-screenshot.jpg", "",
     "Customer Story", "SET-002", date(2026, 5, 10),
     "Permission obtained via WhatsApp"),
    (date(2026, 4, 28), "Instagram Reel", "Posted",
     "Anjali's Jain eggless red velvet for Myra's 6th — unicorn theme, pastel everything",
     "https://drive.google.com/drive/folders/xxx/myra-unicorn-reel.mp4", "",
     "Customer Story", "SET-002", date(2026, 5, 1),
     "Reach 3.2K — viral-ish for our scale"),
]

# Tab 2: Asset Library
# Each tuple: (type, title, drive_url, tag_product, tag_occasion, date_created, notes)
ASSETS_SAMPLE = [
    ("Photo", "Sneha eggless butterscotch — minimalist",
     "https://drive.google.com/drive/folders/xxx/sneha-bday.jpg",
     "Cake", "Birthday (adult)", date(2026, 5, 22), ""),
    ("Reel clip", "Vikram anniversary cake — making-of",
     "https://drive.google.com/drive/folders/xxx/vikram-anniversary-reel.mp4",
     "Cake", "Anniversary", date(2026, 5, 26), "Permission obtained"),
    ("Photo", "Spider-Man cake — Aarav prep",
     "https://drive.google.com/drive/folders/xxx/aarav-spiderman.jpg",
     "Cake", "Birthday (kid)", date(2026, 5, 28), ""),
    ("Photo", "Bomboloni flat-lay — 4 flavours",
     "https://drive.google.com/drive/folders/xxx/bomboloni-flat-lay.jpg",
     "Bomboloni", "Dinner party", date(2026, 5, 20), "Hero shot for product showcase"),
    ("Reel clip", "Myra unicorn cake — making-of",
     "https://drive.google.com/drive/folders/xxx/myra-unicorn-reel.mp4",
     "Cake", "Birthday (kid)", date(2026, 4, 30), "3.2K reach"),
    ("Photo", "Lakshmi customer-review screenshot",
     "https://drive.google.com/drive/folders/xxx/lakshmi-review-screenshot.jpg",
     "Bomboloni", "Customer review", date(2026, 5, 10), "Used with permission"),
    ("Logo", "Tiered Cake Company — primary logo (transparent)",
     "https://drive.google.com/drive/folders/xxx/logo-primary.png",
     "Brand", "Brand asset", date(2026, 1, 5), "Watermark on all posts"),
    ("Graphic", "Festival lineup 2026 — calendar graphic",
     "https://drive.google.com/drive/folders/xxx/festival-calendar.png",
     "Brand", "Festival", date(2026, 4, 1), "Pinned to bio"),
    ("Photo", "Studio shot — Bedroom 2 setup",
     "https://drive.google.com/drive/folders/xxx/studio.jpg",
     "Brand", "Behind the Scenes", date(2026, 5, 12), ""),
    ("Photo", "Eggless red velvet (signature)",
     "https://drive.google.com/drive/folders/xxx/eggless-rv-hero.jpg",
     "Cake", "Hero / catalogue", date(2026, 3, 18), ""),
    ("Photo", "Cupcake assortment — 12 in a clamshell",
     "https://drive.google.com/drive/folders/xxx/cupcakes-12-mixed.jpg",
     "Cupcakes", "Hero / catalogue", date(2026, 2, 16), ""),
    ("Photo", "Cake tubs — tiramisu + Biscoff",
     "https://drive.google.com/drive/folders/xxx/cake-tubs-trio.jpg",
     "Cake Tub", "Product Showcase", date(2026, 5, 14), ""),
]

# Tab 3: Performance (weekly roll-up)
# Each tuple: (post_id, reach, likes, saves, dms, inquiries, notes)
PERFORMANCE_SAMPLE = [
    ("POST-0001", 1200, 84, 12, 3, 1, "Sneha bday post — 3 DMs, 1 converted to inquiry"),
    ("POST-0002", 850, 62, 7, 1, 0, "Vikram anniversary reel — solid but no new inquiries"),
    ("POST-0008", 240, 18, 2, 0, 0, "WhatsApp Status — open orders promo"),
    ("POST-0009", 720, 51, 6, 2, 1, "Lakshmi repeat-customer post — 2 DMs, 1 converted"),
    ("POST-0010", 3200, 245, 38, 11, 4, "Myra unicorn reel — viral-ish; 4 new inquiries"),
]

# Tab 4: Hashtag Library
# Each tuple: (set_id, theme, tag_list, last_used, performance_note)
HASHTAGS_SAMPLE = [
    ("SET-001", "Kid birthday cakes",
     "#hyderabadbakery; #kidsbirthdaycake; #customcakehyderabad; #financialdistrictcakes; #provinciakidsparty; #eternahyderabad; #cakesforkids; #birthdaycakehyderabad; #premiumbakery",
     date(2026, 5, 22), "Strong reach for kid bday content"),
    ("SET-002", "Customer stories",
     "#hyderabadbakery; #customerlove; #handmadewithlove; #financialdistrict; #aMomentWithACake; #cakesofhyderabad; #premiumcakes",
     date(2026, 5, 22), "Use sparingly to avoid spammy feel"),
    ("SET-003", "Bomboloni / dinner party",
     "#bomboloni; #hyderabaddessert; #dinnerparty; #italiandessert; #premiumdessert; #hyderabadbakery; #customdesserts",
     None, "New set — pilot July"),
    ("SET-004", "Educational / behind-the-scenes",
     "#bakery; #handmade; #hyderabadbakery; #behindthescenes; #cakemaking; #cottagebakery; #foodlove",
     None, "Educational reels — reach is weaker but engagement is higher"),
    ("SET-005", "Festivals — generic",
     "#festivalcake; #hyderabadbakery; #celebrate; #aMomentWithACake; #festivalmood; #premiumbakery; #handmade",
     None, "Adapt per festival — swap last 2 tags"),
    ("SET-006", "Promotions / open for orders",
     "#openfororders; #hyderabadbakery; #premiumbakery; #cakesofhyderabad; #orderyourcake; #financialdistrict; #aMomentWithACake",
     date(2026, 5, 30), "Light use — over-promotional posts hurt algorithm"),
]

# Tab 5: Reviews Tracker
# Each tuple: (date, platform, reviewer, stars, excerpt, replied, linked_order, notes)
REVIEWS_SAMPLE = [
    (date(2026, 1, 23), "WhatsApp", "Arjun Mehta", 5,
     "Veer wouldn't stop talking about it. Will reorder.", "Y", "ORD-0001",
     "First customer review — captured via feedback_request.gs"),
    (date(2026, 2, 16), "WhatsApp", "Priya Reddy", 5,
     "Beautifully done!", "Y", "ORD-0002", ""),
    (date(2026, 3, 9), "Google Business", "Anjali Agarwal", 5,
     "Worth every rupee. Eggless and still rich. Will reorder for Krish's bday in Sept.",
     "Y", "ORD-0004", "First 5★ Google review — pin to bio"),
    (date(2026, 5, 18), "WhatsApp", "Sandeep Goyal", 5,
     "Tiramisu nailed it. Let's plan Diwali boxes.", "Y", "ORD-0006",
     "Diwali pipeline trigger"),
    (date(2026, 5, 12), "Instagram comment", "@meera.joshi_hyd", 5,
     "Frozen theme cake for daughter — can you do June 8?",
     "Y", "(no order yet)",
     "Converted into INQ-0001 (Meera Joshi); now in pipeline"),
]


# ----------------------------------------------------------------------------
# Workbook
# ----------------------------------------------------------------------------
wb = Workbook()
wb.remove(wb.active)


# ----------------------------------------------------------------------------
# 1. Content Calendar
# ----------------------------------------------------------------------------
cc = wb.create_sheet("Content Calendar")
cc_headers = [
    "Post ID", "Planned date", "Channel", "Status", "Caption",
    "Asset link", "MBS scheduled URL", "Theme / Tag", "Hashtag set ID",
    "Posted on (actual)", "Notes",
]
cc.append(cc_headers)
style_header(cc, len(cc_headers))
set_widths(cc, {1: 12, 2: 13, 3: 18, 4: 12, 5: 48,
               6: 38, 7: 38, 8: 20, 9: 14, 10: 15, 11: 36})

# Formula rows: Post ID (col A)
for r in range(2, 502):
    cc.cell(row=r, column=1,
            value=f'=IF(B{r}="","","POST-"&TEXT(ROW()-1,"0000"))').fill = DERIVED_FILL

# Sample data
for offset, row in enumerate(CONTENT_SAMPLE):
    r = 2 + offset
    planned_date, channel, status, caption, asset_link, mbs_url, theme, hashtag_set, posted_on, notes = row
    cc.cell(row=r, column=2, value=planned_date).fill = EXAMPLE_FILL
    cc.cell(row=r, column=3, value=channel).fill = EXAMPLE_FILL
    cc.cell(row=r, column=4, value=status).fill = EXAMPLE_FILL
    cc.cell(row=r, column=5, value=caption).fill = EXAMPLE_FILL
    if asset_link:
        cc.cell(row=r, column=6, value=asset_link).fill = EXAMPLE_FILL
    if mbs_url:
        cc.cell(row=r, column=7, value=mbs_url).fill = EXAMPLE_FILL
    cc.cell(row=r, column=8, value=theme).fill = EXAMPLE_FILL
    cc.cell(row=r, column=9, value=hashtag_set).fill = EXAMPLE_FILL
    if posted_on:
        cc.cell(row=r, column=10, value=posted_on).fill = EXAMPLE_FILL
    if notes:
        cc.cell(row=r, column=11, value=notes).fill = EXAMPLE_FILL

add_list_validation(cc, [
    "Instagram Feed", "Instagram Reel", "Instagram Story",
    "WhatsApp Status", "Facebook Page",
], "C")
add_list_validation(cc, ["Idea", "Draft", "Scheduled", "Posted", "Archived"], "D")
add_list_validation(cc, [
    "Product Showcase", "Behind the Scenes", "Customer Story",
    "Festival", "Educational", "Promotion",
], "H")


# ----------------------------------------------------------------------------
# 2. Asset Library
# ----------------------------------------------------------------------------
al = wb.create_sheet("Asset Library")
al_headers = [
    "Asset ID", "Type", "Title", "Drive URL",
    "Tags (Product)", "Tags (Occasion/Theme)",
    "Date created", "Used in posts (count)", "Notes",
]
al.append(al_headers)
style_header(al, len(al_headers))
set_widths(al, {1: 12, 2: 12, 3: 36, 4: 44,
               5: 16, 6: 22, 7: 14, 8: 16, 9: 36})

# Formula rows: Asset ID (col A) and Used in posts (col H — COUNTIF against Content Calendar asset links)
for r in range(2, 202):
    al.cell(row=r, column=1,
            value=f'=IF(B{r}="","","AST-"&TEXT(ROW()-1,"0000"))').fill = DERIVED_FILL
    al.cell(row=r, column=8,
            value=f"=COUNTIF('Content Calendar'!F:F,D{r})").fill = DERIVED_FILL

# Sample data
for offset, row in enumerate(ASSETS_SAMPLE):
    r = 2 + offset
    asset_type, title, drive_url, tag_product, tag_occasion, date_created, notes = row
    al.cell(row=r, column=2, value=asset_type).fill = EXAMPLE_FILL
    al.cell(row=r, column=3, value=title).fill = EXAMPLE_FILL
    al.cell(row=r, column=4, value=drive_url).fill = EXAMPLE_FILL
    al.cell(row=r, column=5, value=tag_product).fill = EXAMPLE_FILL
    al.cell(row=r, column=6, value=tag_occasion).fill = EXAMPLE_FILL
    al.cell(row=r, column=7, value=date_created).fill = EXAMPLE_FILL
    if notes:
        al.cell(row=r, column=9, value=notes).fill = EXAMPLE_FILL

add_list_validation(al, ["Photo", "Video", "Reel clip", "Graphic", "Logo"], "B")


# ----------------------------------------------------------------------------
# 3. Performance (weekly roll-up)
# ----------------------------------------------------------------------------
perf = wb.create_sheet("Performance")
perf_headers = [
    "Post ID", "Posted on", "Channel",
    "Reach", "Likes", "Saves",
    "DMs received", "Inquiries triggered", "Notes",
]
perf.append(perf_headers)
style_header(perf, len(perf_headers))
set_widths(perf, {1: 12, 2: 13, 3: 18, 4: 10, 5: 10,
                  6: 10, 7: 14, 8: 16, 9: 44})

# Formula rows: Posted on (col B) and Channel (col C) via VLOOKUP from Content Calendar
for r in range(2, 202):
    # VLOOKUP col 10 of Content Calendar = Posted on (actual)
    perf.cell(row=r, column=2,
              value=f"=IFERROR(VLOOKUP(A{r},'Content Calendar'!A:J,10,FALSE),\"\")").fill = DERIVED_FILL
    # VLOOKUP col 3 of Content Calendar = Channel
    perf.cell(row=r, column=3,
              value=f"=IFERROR(VLOOKUP(A{r},'Content Calendar'!A:C,3,FALSE),\"\")").fill = DERIVED_FILL

# Sample data
for offset, row in enumerate(PERFORMANCE_SAMPLE):
    r = 2 + offset
    post_id, reach, likes, saves, dms, inquiries, notes = row
    perf.cell(row=r, column=1, value=post_id).fill = EXAMPLE_FILL
    perf.cell(row=r, column=4, value=reach).fill = EXAMPLE_FILL
    perf.cell(row=r, column=5, value=likes).fill = EXAMPLE_FILL
    perf.cell(row=r, column=6, value=saves).fill = EXAMPLE_FILL
    perf.cell(row=r, column=7, value=dms).fill = EXAMPLE_FILL
    perf.cell(row=r, column=8, value=inquiries).fill = EXAMPLE_FILL
    if notes:
        perf.cell(row=r, column=9, value=notes).fill = EXAMPLE_FILL


# ----------------------------------------------------------------------------
# 4. Hashtag Library
# ----------------------------------------------------------------------------
hl = wb.create_sheet("Hashtag Library")
hl_headers = [
    "Set ID", "Theme", "Tag list (semicolon-separated)", "Last used", "Performance note",
]
hl.append(hl_headers)
style_header(hl, len(hl_headers))
set_widths(hl, {1: 10, 2: 28, 3: 80, 4: 13, 5: 48})

# Sample data (all manual entry — no auto-formula columns)
for offset, row in enumerate(HASHTAGS_SAMPLE):
    r = 2 + offset
    set_id, theme, tag_list, last_used, performance_note = row
    hl.cell(row=r, column=1, value=set_id).fill = EXAMPLE_FILL
    hl.cell(row=r, column=2, value=theme).fill = EXAMPLE_FILL
    hl.cell(row=r, column=3, value=tag_list).fill = EXAMPLE_FILL
    if last_used:
        hl.cell(row=r, column=4, value=last_used).fill = EXAMPLE_FILL
    hl.cell(row=r, column=5, value=performance_note).fill = EXAMPLE_FILL

hl.freeze_panes = "A2"


# ----------------------------------------------------------------------------
# 5. Reviews Tracker
# ----------------------------------------------------------------------------
rev = wb.create_sheet("Reviews Tracker")
rev_headers = [
    "Review ID", "Date received", "Platform", "Reviewer",
    "Star rating", "Excerpt", "Replied?", "Linked Order ID", "Notes",
]
rev.append(rev_headers)
style_header(rev, len(rev_headers))
set_widths(rev, {1: 12, 2: 14, 3: 20, 4: 22,
                 5: 10, 6: 52, 7: 10, 8: 16, 9: 40})

# Formula rows: Review ID (col A)
for r in range(2, 202):
    rev.cell(row=r, column=1,
             value=f'=IF(B{r}="","","REV-"&TEXT(ROW()-1,"0000"))').fill = DERIVED_FILL

# Sample data
for offset, row in enumerate(REVIEWS_SAMPLE):
    r = 2 + offset
    date_received, platform, reviewer, stars, excerpt, replied, linked_order, notes = row
    rev.cell(row=r, column=2, value=date_received).fill = EXAMPLE_FILL
    rev.cell(row=r, column=3, value=platform).fill = EXAMPLE_FILL
    rev.cell(row=r, column=4, value=reviewer).fill = EXAMPLE_FILL
    rev.cell(row=r, column=5, value=stars).fill = EXAMPLE_FILL
    rev.cell(row=r, column=6, value=excerpt).fill = EXAMPLE_FILL
    rev.cell(row=r, column=7, value=replied).fill = EXAMPLE_FILL
    rev.cell(row=r, column=8, value=linked_order).fill = EXAMPLE_FILL
    if notes:
        rev.cell(row=r, column=9, value=notes).fill = EXAMPLE_FILL

add_list_validation(rev, [
    "Google Business", "Instagram comment", "WhatsApp", "Word-of-mouth",
], "C")
add_list_validation(rev, ["Y", "N", "N/A"], "G")


# ----------------------------------------------------------------------------
# 6. README sheet (first tab)
# ----------------------------------------------------------------------------
readme = wb.create_sheet("README", 0)
readme["A1"] = "Tiered Cake Company — Marketing (Phase 3)"
readme["A1"].font = Font(bold=True, size=18, color="1F2937")
readme["A3"] = "Owner: Shreya (Sh) — weekly planning cadence"
readme["A4"] = (
    "Tabs: Content Calendar · Asset Library · Performance · Hashtag Library · Reviews Tracker"
)
readme["A5"] = "Generated: " + TODAY.isoformat()
readme["A5"].font = Font(italic=True, color="6B7280")

instructions = [
    "",
    "1. IMPORT INTO GOOGLE SHEETS",
    "   - sheets.google.com → File → Import → Upload → select this .xlsx → 'Replace spreadsheet'",
    "   - Rename the spreadsheet to '04_Marketing' (or similar)",
    "",
    "2. DELETE THE EXAMPLE ROWS (highlighted yellow) once you've eyeballed them",
    "   - Content Calendar: replace with your live post schedule",
    "   - Asset Library: seed with your actual Drive folder URLs",
    "   - Hashtag Library: review and tune sets before first live use",
    "",
    "3. META BUSINESS SUITE (MBS) INTEGRATION",
    "   - Phase 3 uses MBS (business.facebook.com) for scheduling posts to Instagram/Facebook.",
    "   - No Apps Scripts required. Scheduling is done manually in MBS.",
    "   - After scheduling a post in MBS, paste the MBS confirmation URL back into",
    "     Content Calendar column G ('MBS scheduled URL') to close the planning loop.",
    "   - When the post goes live, fill in column J ('Posted on (actual)') and update",
    "     Status to 'Posted'.",
    "",
    "4. WEEKLY CONTENT PLANNING CADENCE (Sh, Saturday afternoon)",
    "   - Review Content Calendar for next 2 weeks.",
    "   - Move 'Idea' rows to 'Draft' once caption + asset are ready.",
    "   - Schedule 'Draft' rows in MBS; paste schedule URL back to col G; set Status = 'Scheduled'.",
    "   - Pull Insta Insights for last week's posted content; add rows to Performance tab.",
    "",
    "5. MONTHLY PERFORMANCE ROLL-UP",
    "   - Open Instagram Insights (professional account view).",
    "   - For each post in the past month, paste Post ID, Reach, Likes, Saves, DMs into Performance.",
    "   - Columns B (Posted on) and C (Channel) auto-populate via VLOOKUP from Content Calendar.",
    "",
    "6. REVIEWS TRACKER WORKFLOW",
    "   - When a customer sends a WhatsApp review or posts on Google / Instagram:",
    "     (a) Add a row to Reviews Tracker immediately.",
    "     (b) Reply (on the platform) and mark Replied? = Y.",
    "     (c) If it triggers a future order (e.g., Diwali boxes), note in Linked Order ID once created.",
    "   - Source for Google reviews: enable email notifications in Google Business Profile.",
    "",
    "NOTE: No Apps Scripts in Phase 3. Manual logging is sufficient at cottage volumes",
    "      (typically ≤4 posts/week, ≤2 reviews/week). Revisit if posts exceed 5/week.",
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
print(f"Sample data: {len(CONTENT_SAMPLE)} content rows, {len(ASSETS_SAMPLE)} assets, "
      f"{len(PERFORMANCE_SAMPLE)} performance rows, {len(HASHTAGS_SAMPLE)} hashtag sets, {len(REVIEWS_SAMPLE)} reviews")

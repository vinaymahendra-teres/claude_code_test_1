# Dashboard Strategy — Tiered Cake Company

Phase 4a: static skeleton + IMPORTRANGE formula layer.
Phase 4b (separate): Apps Script automation (morning digest email + festival pre-block).

---

## 1. Why the Dashboard is read-only

The four module sheets (CRM, Finance, Operations, Marketing) are the **systems of record**. Each module owns its own data, validation, and append logic. The Dashboard is the **central nervous system** — it reads from all four and presents a single morning view without owning or writing any data of its own.

Practical consequences:
- One URL to bookmark. Swetha opens one sheet every morning, not four.
- No risk of accidentally editing source data while glancing at the dashboard.
- When the Dashboard formula breaks, you know it is a lookup issue, not a data-entry issue.
- The Dashboard can be shared with a silent investor or delivery partner without exposing edit access to any module.

The philosophy is: **the Dashboard is the home screen; the modules are the apps**.

---

## 2. The IMPORTRANGE pattern

Google Sheets' `IMPORTRANGE(spreadsheet_id, range_string)` pulls a rectangular range from another file into the current sheet, refreshing every 1–5 minutes.

**Architecture for this stack:**

| Source sheet | Placeholder ID constant | Data panels it feeds |
|---|---|---|
| CRM (01_CRM) | `CRM_SPREADSHEET_ID_PLACEHOLDER` | Panels 1, 3, 4 (orders, customers, capacity) |
| Finance (02_Finance) | `FIN_SPREADSHEET_ID_PLACEHOLDER` | Panel 2 (cash), Panel 6 (compliance) |
| Operations (03_Operations) | `OPS_SPREADSHEET_ID_PLACEHOLDER` | Panel 6 (ingredients below PAR) |
| Marketing (04_Marketing) | `MKT_SPREADSHEET_ID_PLACEHOLDER` | Panels 5, 6 (posts, reviews, draft alert) |

**One-time setup:** The first time IMPORTRANGE is used for a source file, Google Sheets shows a pop-up "Allow access". The operator must click Allow for each of the four source files. After that, the connection persists until the file is moved or permissions are revoked.

**Refresh lag:** IMPORTRANGE typically refreshes within 1–5 minutes of the source data changing. For a home bakery operating on daily rhythms, this is effectively real-time.

**Formula structure used throughout:**
```
=IFERROR(
  QUERY(
    IMPORTRANGE("SOURCE_FILE_ID", "SheetName!A:Z"),
    "select Col1, Col2 where Col3 >= date '...' ...",
    1
  ),
  fallback_value
)
```
The `QUERY` filters, sorts, and limits rows. The `IFERROR` wrapper ensures the panel shows a clean fallback string rather than a red error if the source is temporarily unavailable or the ID is still a placeholder.

---

## 3. The 7 panels

### Panel 1 — This week: orders due (next 7 days)
**Purpose:** Never miss a delivery. Shows all CRM orders with a delivery date in the next 7 calendar days, ordered by date ascending.
**Data source:** CRM → Orders tab (delivery_date, customer, cake type, deposit status, confirmation status).
**Why 7 days:** A custom cake typically needs 2–3 days of production time. Seven days gives Swetha one full week of visibility to flag any production conflicts with Panel 4.

### Panel 2 — Cash position
**Purpose:** One-glance treasury. How much money is actually accessible right now.
**Data source:** Finance → Bank vs UPI Float tab (bank balance, UPI float, cash drawer). UPI Reconciliation tab (running unmatched UPI total from Section C summary cell B48).
**Key insight:** UPI float (money received on UPI but not yet swept to bank) is a common blind spot for small businesses. Surfacing it separately prevents Swetha from treating it as already-banked.
**TOTAL row:** Sum of bank + UPI float + cash drawer. This is the true liquid position.
**UPI unmatched alert:** If > 0, there are UPI transactions received that have not been matched to an order. These need same-day resolution (Panel 6 also flags the count).

### Panel 3 — Top customers by lifetime value
**Purpose:** Know your VIPs without running a report. Drives relationship maintenance decisions (WhatsApp check-ins, birthday surprises, priority booking during festivals).
**Data source:** CRM → Customers tab, ordered by lifetime value descending, top 5.
**Cadence:** This panel is relatively stable — the top 5 rarely change week-to-week. It serves as a reminder, not a live scoreboard.

### Panel 4 — Production load (next 14 days)
**Purpose:** Prevent overbooking. Shows daily cake / cupcake / bomboloni booked vs total capacity for the next 14 days.
**Data source:** CRM → Capacity Calendar tab.
**Why 14 days:** Custom orders are typically placed 7–14 days in advance. A 14-day horizon gives enough lead time to flag capacity conflicts before they become crises.
**Cross-reference with Panel 1:** If Panel 1 shows a delivery in 3 days and Panel 4 shows that day is at 100% capacity, Swetha knows she needs to renegotiate or extend hours.

### Panel 5 — Marketing health
**Purpose:** Ensure the Instagram/social presence stays active without requiring Swetha to open the Marketing sheet daily.
**Data source:** Marketing → Content Calendar tab (post counts, scheduled dates, status), Reviews Tracker tab (review dates, ratings).
**Three metrics:** Posts published in the last/next 7 days; new reviews this month; average rating this month.
**Threshold:** If "posts this week" drops to 0, engagement will drop within a week. This panel makes the gap visible immediately.

### Panel 6 — Action queue (items needing attention)
**Purpose:** Replace the mental to-do list. Five auto-counted alerts — if any count is > 0, it needs same-day action.
**Data sources:** All four modules.

| Alert | Source | Action if > 0 |
|---|---|---|
| Compliance items due for renewal (within 30 days) | Finance → Compliance Tracker | Renew licence/insurance before expiry |
| Confirmed orders with no deposit | CRM → Orders | Chase payment or flag as high-risk |
| Orders delivered T+2 without feedback | CRM → Orders | Send WhatsApp follow-up for review |
| Ingredients below PAR level | Operations → Ingredients | Reorder from vendor before production gap |
| Posts scheduled next 24 h still in Draft | Marketing → Content Calendar | Publish or reschedule before window closes |

**Design principle:** These are counts, not lists. If the count is 0, Swetha moves on in under 2 seconds. If the count is > 1, she opens the relevant module via the hyperlink for details.

### Panel 7 — Festival cash cycle
**Purpose:** Hyderabad home bakery revenue is highly festival-driven. This panel keeps the next peak event visible at all times and gives the suggested ingredient pre-buy date.
**Data source:** Static FESTIVALS table embedded in the Dashboard itself (rows 72–78, cols D–F). This is intentionally local — festival dates are known a year in advance and do not need to be sourced from another sheet.
**Smart formulas:** FILTER lists all upcoming festivals from the table in date order. INDEX/MATCH extracts the single nearest upcoming festival and computes days-until and pre-buy date (21 days prior).
**Annual maintenance:** The operator updates FESTIVALS dates once per year. The build script ships with 2026–2027 dates for the Hyderabad calendar (Eid al-Adha, Ganesh Chaturthi, Bathukamma, Karva Chauth, Diwali, Christmas, Holi).

---

## 4. The Dashboard-as-navigation pattern

Each of the 7 panel headers contains an "Open [Module] →" hyperlink in column H. These link directly to the relevant tab in the source Google Sheet (e.g., Finance → Bank vs UPI Float, CRM → Orders).

This means:
- The Dashboard is the **entry point**, not a dead end.
- Swetha's daily workflow: open Dashboard → scan 7 panels → click into the module that needs attention.
- No need to remember individual sheet URLs or tab names.

The operator must replace the placeholder gid values in the hyperlinks (see README §Phase 1) to make these links functional.

---

## 5. morning_digest.gs (Phase 4b)

Apps Script file to be installed on the Dashboard sheet. Runs on a time-driven trigger at 7:00 AM daily.

**Function:** Reads Panel 2 (cash position), Panel 1 (today's orders), Panel 6 (action queue counts) and formats a short HTML email sent to the operator's Gmail address.

**Output format:** Subject: "Dashboard digest — [date] | Cash ₹X | Orders today: N | Actions: M". Body: five bullet points mirroring the action queue + cash total.

**Why 7 AM:** Swetha can read the digest on her phone before opening the bakery. No need to open a laptop just for the morning check.

Full source in `apps_script/morning_digest.gs` (Phase 4b, not yet written).

---

## 6. festival_pre_block.gs (Phase 4b)

Apps Script file installed on the **CRM sheet** (not the Dashboard), per design spec. The FESTIVALS table lives in the Dashboard (Panel 7) but the capacity-blocking logic runs from CRM because it writes to the Capacity Calendar tab.

**Function:** Triggered weekly (Sunday night). Reads the FESTIVALS table from the Dashboard via IMPORTRANGE or a shared config range. For each festival within 28 days, it auto-blocks a configurable number of capacity slots in the CRM Capacity Calendar starting 21 days before the festival date.

**Why from CRM:** The Capacity Calendar is owned by the CRM module. Writes to it should originate there to maintain clear ownership boundaries.

Full source in `apps_script/festival_pre_block.gs` (Phase 4b, not yet written).

---

## 7. Setup is one-time but exacting

The operator must complete four precise steps before the Dashboard functions:

**Step 1 — Replace 4 file IDs:**
- `CRM_SPREADSHEET_ID_PLACEHOLDER` → ID of the CRM Google Sheet
- `OPS_SPREADSHEET_ID_PLACEHOLDER` → ID of the Operations Google Sheet
- `FIN_SPREADSHEET_ID_PLACEHOLDER` → ID of the Finance Google Sheet
- `MKT_SPREADSHEET_ID_PLACEHOLDER` → ID of the Marketing Google Sheet

Find each ID in the sheet's browser URL between `/d/` and `/edit`.

**Step 2 — Replace ~11 tab URLs (the Open-link hyperlinks in panel headers):**
Each panel header links to a specific tab. The gid= parameter in the URL is tab-specific. Find it by clicking the tab in Google Sheets and reading the `#gid=XXXX` from the address bar.

**Step 3 — Authorise 4 IMPORTRANGE pairs:**
Click the first `#REF!` cell in each panel. Accept the "Allow access" pop-up for each of the 4 source files.

**Step 4 — Optionally install Apps Scripts (Phase 4b).**

**Total setup time estimate:** 20–30 minutes for an operator comfortable with Google Sheets. Once done, the Dashboard is self-maintaining indefinitely (modulo annual FESTIVALS date updates and the occasional IMPORTRANGE re-authorisation if file permissions change).

# Phases 1b–4 — Cottage Stack Remainder (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development` with adapted ceremony — one implementer dispatch per artifact (not per micro-step), inline verification, single final review across the whole stack.
>
> **Note on git:** project is not a git repo. "Commit" steps replaced with file-verification.

**Goal:** Complete the unified cottage stack architecture defined in `specs/2026-05-24-cottage-stack-design.md`. After this plan, all 5 module files exist and are independently functional, with cross-file Apps Script glue wired up.

**Architecture:** Per the parent spec — 5 sheets in one Drive folder (CRM, Operations, Finance, Marketing, Dashboard) linked by IMPORTRANGE + Apps Script. Phase 0 (CRM) and Phase 1a (Finance Money In + UPI Recon + Bank vs UPI Float) already shipped. This plan delivers the rest.

**Tech Stack:** Same as Phase 1a — Google Sheets, Apps Script V8, Python 3 + openpyxl, Markdown.

---

## File Structure (incremental)

| Module | New / Extended | Files |
|---|---|---|
| Finance 1b-e | Extend existing | `brainstorming/finance_sheets/build_xlsx.py` (add 6 tabs); add `compliance_reminder.gs` |
| Operations | New | `brainstorming/operations_strategy.md`; `brainstorming/operations_sheets/{build_xlsx.py, README.md, TieredCakeCompany_Operations.xlsx, apps_script/bake_plan_generator.gs, apps_script/par_breach_alerter.gs}` |
| Marketing | New | `brainstorming/marketing_strategy.md`; `brainstorming/marketing_sheets/{build_xlsx.py, README.md, TieredCakeCompany_Marketing.xlsx}` (no Apps Script per spec) |
| Dashboard | New | `brainstorming/dashboard_strategy.md`; `brainstorming/dashboard_sheets/{build_xlsx.py, README.md, TieredCakeCompany_Dashboard.xlsx, apps_script/morning_digest.gs, apps_script/festival_pre_block.gs}` |
| Doc updates | Extend | `decision_log.md`, `operating_envelope.md` (Stream 2 + 5 + 7 status blocks bumped) |

---

## Task 1 — Phase 1b: Finance Compliance tab + `compliance_reminder.gs`

**Files:**
- Modify: `brainstorming/finance_sheets/build_xlsx.py` (add Compliance tab)
- Create: `brainstorming/finance_sheets/apps_script/compliance_reminder.gs`
- Modify: `brainstorming/finance_strategy.md` (add §3.4 Compliance schema + bump §6 scope)
- Regenerate: `brainstorming/finance_sheets/TieredCakeCompany_Finance.xlsx`

**Compliance tab schema** (9 columns):

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | License type | text | list: FSSAI Cottage Food, Trade Licence, GST Registration, Professional Tax, Shops & Establishment, Other |
| B | License number | text | manual |
| C | Issuing authority | text | manual |
| D | Issued on | date | manual |
| E | Valid until | date | manual |
| F | Days to expiry | number | `=IFERROR(E2-TODAY(),"")` |
| G | Status | text | `=IF(F2="","",IF(F2<0,"EXPIRED",IF(F2<=7,"Renew NOW",IF(F2<=30,"Renew this month",IF(F2<=90,"Renew this quarter","Current")))))` |
| H | Last renewed | date | manual |
| I | Notes | text | free |

**Sample data** (3 rows):
- FSSAI Cottage Food Licence (FSSAI #21024010000001), Telangana FSSAI, issued 2026-02-15, valid until 2027-02-14, last renewed 2026-02-15, notes "Annual renewal — set calendar reminder 30 days ahead"
- Trade Licence — Hyderabad GHMC (TL-2026-CFB-44521), GHMC, issued 2026-03-01, valid until 2029-02-28, notes "3-year cycle"
- GST Registration (—), GSTN, issued (blank), valid until (blank), status auto-blank, notes "Voluntary registration — defer until annual turnover crosses ₹40L for goods (₹20L for services in Telangana). Tracked here for forward compat."

**Validation lists:**
- Col A: list as above
- Conditional formatting on Col G: red for EXPIRED + Renew NOW; amber for Renew this month/quarter; green for Current

**`compliance_reminder.gs`** (weekly Mon 09:00 IST trigger):
- Reads Compliance tab
- Filters rows where `Days to expiry` ≤ 90 (i.e., Status ∈ {EXPIRED, Renew NOW, Renew this month, Renew this quarter})
- Emails Sh + S an HTML digest grouped by status
- Constants at top: RECIPIENTS array, BAKERY_BRAND

**finance_strategy.md updates:**
- Add §3.4 "Compliance" with the schema table above
- Update §6 "Out of scope" — strike "1b — Compliance" line
- Add §5.2 "Apps Script: `compliance_reminder.gs`" subsection with one-paragraph description

---

## Task 2 — Phase 1c: Money Out + Vendor Ledger + Bank-balance integration

**Files:**
- Modify: `brainstorming/finance_sheets/build_xlsx.py` (add Money Out + Vendor Ledger tabs; update Bank vs UPI Float Outflows formula)
- Modify: `brainstorming/finance_strategy.md` (add §3.5 + §3.6; update §3.2 outflows note)
- Regenerate xlsx

**Money Out schema** (mirrors Money In; 13 columns):

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | Entry ID | text | `=IF(B2="","","MOUT-"&TEXT(ROW()-1,"0000"))` |
| B | Date | date | manual |
| C | Time | time | manual |
| D | Channel | text | list: UPI-GPay, UPI-PhonePe, UPI-Other, Bank Transfer, Cash, NACH, Refund-Out |
| E | Account debited | text | list: Bank, UPI float, Cash drawer |
| F | Amount (₹) | number | manual |
| G | Category | text | list: Ingredients, Packaging, Utilities, Rent, Equipment (capex), Maintenance, Marketing, Delivery (Porter/Dunzo), Founder Draw, Transfer (Account-to-Account), Other |
| H | UPI reference (UTR) | text | manual |
| I | Payee VPA / Account | text | manual |
| J | Payee name | text | manual |
| K | Linked PO ID | text | manual (links to Operations Purchase Orders later) |
| L | Notes | text | free |
| M | Logged at | datetime | `=IF(B2="","",NOW())` |

**Sample data** (~12 rows): mix of ingredient UPI payments to local vendors (Metro Cash & Carry, Vijetha Supermarket, local dairy), packaging vendor (box supplier), electricity bill, gas cylinder refill, Canva subscription (₹0 free tier — skip), Porter/Dunzo delivery fees, one capex (KitchenAid stand mixer pending — ₹38K), one founder draw.

**Vendor Ledger schema** (8 columns):

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | Vendor name | text | manual (typed once when first PO/payment) |
| B | Category | text | list: Ingredient supplier, Packaging, Utility, Service, Capex supplier, Delivery partner, Other |
| C | Preferred channel | text | list: UPI-GPay, UPI-PhonePe, Bank Transfer, Cash |
| D | VPA / Account | text | manual |
| E | Total paid to date (₹) | number | `=SUMIFS('Money Out'!F:F,'Money Out'!J:J,A2)` |
| F | Last payment date | date | `=IFERROR(IF(MAXIFS('Money Out'!B:B,'Money Out'!J:J,A2)=0,"",MAXIFS('Money Out'!B:B,'Money Out'!J:J,A2)),"")` |
| G | Payment count | number | `=COUNTIF('Money Out'!J:J,A2)` |
| H | Notes | text | free |

**Sample data** (~8 rows): Metro Cash & Carry (HoReCa account), Vijetha Supermarket, Heritage Dairy, Amul (cream), Wholesale Box Supplier — Madhapur, Porter (delivery), GHMC (water/electricity), Bharat Gas (cylinder refills).

**Bank vs UPI Float update:**
- Change Col E (Outflows since opening) formula from `0` to:
  `=IFERROR(SUMIFS('Money Out'!F:F,'Money Out'!E:E,IF(LEFT(A2,4)="Bank","Bank",IF(LEFT(A2,3)="UPI","UPI float","Cash drawer")),'Money Out'!B:B,">="&C2),0)`

---

## Task 3 — Phase 1d: P&L (monthly) + Cash Runway tabs

**Files:**
- Modify: `brainstorming/finance_sheets/build_xlsx.py`
- Modify: `brainstorming/finance_strategy.md`
- Regenerate xlsx

**P&L (monthly) schema** — left column = line items, columns = months for the rolling 12. Use ARRAYFORMULA/SUMIFS to derive from Money In + Money Out:

```
Layout:
Row 1: Month headers (YYYY-MM for last 12 months ending current)
Col A: P&L line items:
       Revenue (gross)
         - From orders (sum of Money In where Channel starts with "UPI" or "Bank Transfer" OR "Cash" with matched order)
       Cost of Goods Sold (estimated — Manual entry for Phase 1d; auto from Operations Phase 2)
         - Ingredients (from Money Out where Category = Ingredients)
         - Packaging (Money Out Category = Packaging)
       Gross profit (formula)
       Gross margin % (formula)
       Operating expenses
         - Utilities, Rent, Maintenance, Marketing, Delivery — one row each via SUMIFS
       Operating profit (formula)
       Capex (from Money Out where Category = "Equipment (capex)")
       Founder draws (Money Out Category = "Founder Draw")
       Net cash flow (formula)
```

Sample data is purely formula-driven; no manual rows needed (rolls up from Money In + Money Out sample data already shipped).

**Cash Runway schema** — 5 columns:

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | Month | text | manual seed: 12 months going forward (YYYY-MM format) |
| B | Opening cash (₹) | number | row 1 manual, subsequent = prev row's closing |
| C | Projected inflows (₹) | number | manual (Sh estimates based on confirmed Orders + pipeline) |
| D | Projected outflows (₹) | number | manual |
| E | Closing cash (₹) | number | `=B2+C2-D2` |
| F | Runway flag | text | `=IF(E2<10000,"⚠ BELOW BUFFER",IF(E2<25000,"Tight","OK"))` |
| G | Notes | text | free |

Seed: row 1 (current month) opening = sum of Bank vs UPI Float Current balances; rows 2-12 = projections.

---

## Task 4 — Phase 1e: Capex Register + Founder Draws

**Files:**
- Modify: `brainstorming/finance_sheets/build_xlsx.py`
- Modify: `brainstorming/finance_strategy.md`
- Regenerate xlsx

**Capex Register schema** (10 columns):

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | Asset | text | manual |
| B | Category | text | list: Oven, Mixer, Refrigeration, Tools, Furniture, Other |
| C | Purchased on | date | manual |
| D | Purchase price (₹) | number | manual |
| E | Supplier | text | manual |
| F | Linked Money Out ID | text | manual reference |
| G | Useful life (months) | number | manual (e.g., 60 for oven, 36 for mixer) |
| H | Monthly depreciation (₹) | number | `=IFERROR(D2/G2,"")` |
| I | Net book value (₹) | number | `=IFERROR(D2-(H2*MIN((TODAY()-C2)/30.4, G2)),"")` |
| J | Notes | text | free |

Sample data (~5 rows): OTG oven (Morphy Richards Besta Black 52 — existing, ₹0), upcoming KitchenAid stand mixer (₹38000, 36mo life), upcoming convection oven (₹25000, 60mo life — Stream 1 pending), measuring tools (₹3000, 36mo), turntables/spatulas (₹1500, 24mo).

**Founder Draws schema** (6 columns):

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | Date | date | manual |
| B | To | text | list: Swetha, Shreya, Joint |
| C | Amount (₹) | number | manual |
| D | Purpose | text | list: Salary, Reimbursement, Profit Distribution, Loan Repayment, Other |
| E | Linked Money Out ID | text | manual |
| F | Notes | text | free |

Sample data (~3 rows): one Swetha draw, one Shreya draw, one joint distribution.

---

## Task 5 — Phase 2: Operations module (new file)

**Files (all new under `brainstorming/operations_sheets/`):**
- Create: `brainstorming/operations_strategy.md`
- Create: `brainstorming/operations_sheets/build_xlsx.py`
- Create: `brainstorming/operations_sheets/README.md`
- Create: `brainstorming/operations_sheets/apps_script/bake_plan_generator.gs`
- Create: `brainstorming/operations_sheets/apps_script/par_breach_alerter.gs`
- Generate: `brainstorming/operations_sheets/TieredCakeCompany_Operations.xlsx`

**6 tabs:**

### 5.1 Recipes (BOM per product)
| Col | Header | Type |
|---|---|---|
| A | Recipe ID | text auto `=IF(B2="","","REC-"&TEXT(ROW()-1,"0000"))` |
| B | Product | text list: Cake (1kg), Cake (2kg), Cupcakes (1 dozen), Brownies (12), Cake Tub (6), Bomboloni (6) |
| C | Ingredient | text |
| D | Quantity | number |
| E | Unit | text list: g, kg, ml, L, each |
| F | Unit cost (₹) | number — manual; later pulled from Ingredients tab via VLOOKUP |
| G | Line cost (₹) | `=IFERROR(D2*F2,"")` |
| H | Notes | text |

Sample: 1 recipe = N rows. Three sample recipes (~12-15 rows total): Cake (2kg) eggless chocolate, Cupcakes (1 dozen) vanilla, Bomboloni (6) plain.

### 5.2 Ingredients (stock + PAR)
| Col | Header | Type |
|---|---|---|
| A | Ingredient ID | text auto |
| B | Ingredient name | text |
| C | Category | text list: Flour, Sugar, Dairy, Fat, Egg, Flavour, Colour, Specialty, Packaging |
| D | Unit | text list: g, kg, ml, L, each |
| E | Current stock | number — manual; updated on receipt of PO + consumption (manual logging in Phase 2; deferred auto-deduction) |
| F | PAR (reorder when below) | number |
| G | Reorder qty | number |
| H | Preferred vendor | text VLOOKUP into Vendors tab |
| I | Avg cost per unit (₹) | number |
| J | Days cover at typical use | number — manual estimate |
| K | Last reorder date | date |
| L | Reorder due? | `=IF(E2<F2,"YES","")` |
| M | Notes | text |

Sample: 15-20 ingredients reflecting realistic cottage bakery stock.

### 5.3 Bake Plan (auto-rolled from Orders for next 7 days)
| Col | Header | Type |
|---|---|---|
| A | Delivery date | date |
| B | Order ID | text |
| C | Customer | text |
| D | Product | text |
| E | Quantity | text |
| F | Customisation | text |
| G | Production status | list: Queued, Prep, Bake, Decorate, Done |
| H | Bake date (when to start) | date — derived: Delivery date - lead time |
| I | Linked Recipe ID | text |
| J | Notes | text |

**Bake Plan is auto-populated by `bake_plan_generator.gs`** — nightly trigger reads CRM `01_CRM_Sales.xlsx Orders` for next 7 days, expands each into Bake Plan rows. Operator's job: update Production status, add Notes.

### 5.4 Equipment Maintenance
| Col | Header | Type |
|---|---|---|
| A | Equipment | text list: OTG, Stand Mixer, Microwave-Convection, Food Processor, Gas Hob, Chimney, Kettle, Other |
| B | Last service date | date |
| C | Service interval (days) | number |
| D | Next service due | `=B2+C2` |
| E | Days until due | `=D2-TODAY()` |
| F | Status | `=IF(E2<0,"OVERDUE",IF(E2<=14,"Schedule now","OK"))` |
| G | Service vendor | text |
| H | Cost last service | number |
| I | Notes | text |

Sample: 5-6 rows for existing + planned equipment.

### 5.5 Vendors (suppliers)
Already in Phase 2 — same structure as Finance Vendor Ledger but FYI from procurement side. Lighter schema:

| Col | Header | Type |
|---|---|---|
| A | Vendor name | text |
| B | Category | text |
| C | Contact phone | text |
| D | Lead time (days) | number |
| E | MOQ | text |
| F | Preferred payment mode | text |
| G | VPA / Account | text |
| H | Notes | text |

### 5.6 Purchase Orders
| Col | Header | Type |
|---|---|---|
| A | PO ID | text auto `=IF(B2="","","PO-"&TEXT(ROW()-1,"0000"))` |
| B | Vendor | text |
| C | Raised on | date |
| D | Expected delivery | date |
| E | Items (summary) | text |
| F | Total amount (₹) | number |
| G | Status | list: Drafted, Sent, Acknowledged, Received, Paid, Cancelled |
| H | Linked Money Out ID | text |
| I | Notes | text |

**`bake_plan_generator.gs`** (nightly 23:00 IST trigger): Reads CRM Orders next-7-day window, writes/refreshes Bake Plan tab. Cross-file: uses `openById(CRM_SPREADSHEET_ID)`.

**`par_breach_alerter.gs`** (daily 09:00 IST trigger): Reads Ingredients tab; for rows where Current stock < PAR, drafts a PO row in Purchase Orders (Status = Drafted) and emails S.

**operations_strategy.md** — canonical doc analogous to crm_strategy.md / finance_strategy.md. Sections: Why operations belongs in its own file; ownership; the 6 tabs; the 2 Apps Scripts; open dependencies on Streams 1 + 3.

**operations_sheets/README.md** — operator install guide. Phase 0: import. Phase 1: seed Recipes + Ingredients + Vendors. Phase 2: install both Apps Scripts. Phase 3: daily workflow.

---

## Task 6 — Phase 3: Marketing module (new file)

**Files (all new under `brainstorming/marketing_sheets/`):**
- Create: `brainstorming/marketing_strategy.md`
- Create: `brainstorming/marketing_sheets/build_xlsx.py`
- Create: `brainstorming/marketing_sheets/README.md`
- Generate: `brainstorming/marketing_sheets/TieredCakeCompany_Marketing.xlsx`

**5 tabs (no Apps Scripts per spec):**

### 6.1 Content Calendar
| Col | Header | Type |
|---|---|---|
| A | Post ID | text auto `=IF(B2="","","POST-"&TEXT(ROW()-1,"0000"))` |
| B | Planned date | date |
| C | Channel | text list: Instagram Feed, Instagram Reel, Instagram Story, WhatsApp Status, Facebook Page |
| D | Status | list: Idea, Draft, Scheduled, Posted, Archived |
| E | Caption | text (long) |
| F | Asset link | text (URL to Drive asset) |
| G | MBS scheduled URL | text — paste from Meta Business Suite after scheduling |
| H | Theme / Tag | text list: Product Showcase, Behind the Scenes, Customer Story, Festival, Educational, Promotion |
| I | Hashtag set ID | text VLOOKUP into Hashtag Library |
| J | Posted on (actual) | date |
| K | Notes | text |

Sample: 8-10 rows mixing past Posted + upcoming Scheduled posts (Diwali campaign, Aanya bday cake reveal, behind-the-scenes baking, customer review repost).

### 6.2 Asset Library
| Col | Header | Type |
|---|---|---|
| A | Asset ID | text auto |
| B | Type | text list: Photo, Video, Reel clip, Graphic, Logo |
| C | Title | text |
| D | Drive URL | text |
| E | Tags (Product) | text list (multi typed) |
| F | Tags (Occasion/Theme) | text |
| G | Date created | date |
| H | Used in posts (count) | number — manual or formula |
| I | Notes | text |

Sample: 10-12 assets.

### 6.3 Performance (weekly roll-up)
| Col | Header | Type |
|---|---|---|
| A | Post ID | text |
| B | Posted on | date VLOOKUP from Content Calendar |
| C | Channel | text VLOOKUP |
| D | Reach | number — manual weekly |
| E | Likes | number |
| F | Saves | number |
| G | DMs received | number |
| H | Inquiries triggered | number — manual cross-ref to CRM |
| I | Notes | text |

Sample: 4-5 rows of past Posted with reach/engagement data.

### 6.4 Hashtag Library
| Col | Header | Type |
|---|---|---|
| A | Set ID | text |
| B | Theme | text |
| C | Tag list (semicolon-separated) | text |
| D | Last used | date |
| E | Performance note | text |

Sample: 6 sets — kid birthday cakes (#hyderabadbakery #kidsbirthdaycake #customcake etc.), eggless premium, Diwali special, behind-the-scenes, weekend special, festival generic.

### 6.5 Reviews Tracker
| Col | Header | Type |
|---|---|---|
| A | Review ID | text auto |
| B | Date received | date |
| C | Platform | list: Google Business, Instagram comment, WhatsApp, Word-of-mouth |
| D | Reviewer | text |
| E | Star rating | number 1-5 |
| F | Excerpt | text |
| G | Replied? | list: Y, N, N/A |
| H | Linked Order ID | text |
| I | Notes | text |

Sample: 4-5 reviews (Google + Instagram comments) tied to existing CRM orders.

**marketing_strategy.md** — sections: ownership (Sh); the 5 tabs; integration with Content Calendar → MBS → Insta; the Reviews Tracker as the closed loop with CRM's `feedback_request.gs`; what's deliberately NOT included (no Apps Scripts for Phase 3 — manual logging suffices at cottage volumes).

**marketing_sheets/README.md** — Phase 0: import. Phase 1: seed Hashtag Library + Asset Library. Phase 2: weekly Content Calendar planning cadence (Sh, Sat afternoon).

---

## Task 7 — Phase 4: Dashboard module (new file + 2 Apps Scripts)

**Files (all new under `brainstorming/dashboard_sheets/`):**
- Create: `brainstorming/dashboard_strategy.md`
- Create: `brainstorming/dashboard_sheets/build_xlsx.py`
- Create: `brainstorming/dashboard_sheets/README.md`
- Create: `brainstorming/dashboard_sheets/apps_script/morning_digest.gs`
- Create: `brainstorming/dashboard_sheets/apps_script/festival_pre_block.gs` (note: per spec this lives in CRM but for organization is co-located with Dashboard since it serves the Dashboard's festival panel — final placement = drop it in CRM's apps_script folder via copy)
- Generate: `brainstorming/dashboard_sheets/TieredCakeCompany_Dashboard.xlsx`

**1 user-facing tab: `Dashboard`** with 6 panels arranged vertically:

### Panel 1 — This week (rows 3-12)
- Orders due (next 7 days) — IMPORTRANGE Orders, filter delivery_date
- Deposits outstanding (Balance due > 0 OR Deposit received = 0 on confirmed)
- Capacity used today / this week
- Posts scheduled

Use IMPORTRANGE + QUERY:
```
=QUERY(
  IMPORTRANGE("<CRM_ID>", "Orders!A:V"),
  "select Col1, Col3, Col5, Col6, Col7, Col11 where Col5 >= date '"&TEXT(TODAY(),"yyyy-mm-dd")&"' and Col5 <= date '"&TEXT(TODAY()+7,"yyyy-mm-dd")&"' order by Col5 asc label Col1 'Order', Col3 'Customer', Col5 'Delivery', Col6 'Product', Col7 'Flavour', Col11 'Final (₹)'", 1
)
```

### Panel 2 — Cash position (rows 15-22)
Three lines: Bank · UPI float · Cash drawer · subtotal. Plus 4th line: UPI unmatched (orders marked paid with no UTR — from UPI Reconciliation Section C summary).

### Panel 3 — Top customers (rows 25-32)
QUERY from CRM Customers ordered by Lifetime (₹) desc, limit 5.

### Panel 4 — Production load (rows 35-44)
14-day forward view: cake/cupcake/bomboloni slots used vs total. IMPORTRANGE Capacity Calendar.

### Panel 5 — Marketing health (rows 47-54)
Posts this week (Content Calendar), top-performer last week (Performance), new reviews count (Reviews Tracker).

### Panel 6 — Action queue (rows 57-66)
Computed exceptions:
- Orders marked Confirmed with no deposit received (chase)
- Orders Delivered T+2 without feedback received
- Ingredients below PAR
- Compliance items with Status = Renew NOW / Renew this month
- Posts scheduled within 24h but Status = Draft

### Panel 7 — Festival cash cycle (rows 69-78)
Next Indian festival within 30 days + projected revenue spike + ingredient outflow trigger. Sourced from a static FESTIVALS table in the Dashboard tab (Diwali, Eid, Christmas, Ganesh Chaturthi, Bathukamma, Holi, Karva Chauth) — Apps Script `festival_pre_block.gs` keeps the dates rolling.

**morning_digest.gs** (daily 07:00 IST): Reads each panel's data, sends one HTML email to both operators summarising everything. Single email replaces opening 5 tabs.

**festival_pre_block.gs** — placed in CRM (per the design spec § 5.3). Weekly Mon trigger; 21 days before any festival in the FESTIVALS table, sets `Capacity Calendar.Blocked = Y` and writes a Block reason.

**dashboard_strategy.md** — explains the IMPORTRANGE pattern, navigation-hub philosophy, ownership (nobody writes), morning routine (open email OR open Dashboard).

**dashboard_sheets/README.md** — Phase 0: import. Phase 1: edit all 4 IMPORTRANGE source IDs (CRM, Operations, Finance, Marketing). Phase 2: authorise IMPORTRANGE permission per file pair. Phase 3: install both Apps Scripts. Phase 4: daily morning glance.

---

## Task 8 — Doc realignment

**Files:**
- Modify: `brainstorming/decision_log.md` — add 7 new rows (one per Phase 1b, 1c, 1d, 1e, 2, 3, 4)
- Modify: `brainstorming/operating_envelope.md` — bump Stream 2 status (Finance complete), add Stream 5 status block (Marketing built), bump Stream 7 status (Dashboard built)
- Modify: `brainstorming/specs/2026-05-24-cottage-stack-design.md` — change Phase numbers' status from "pending" to "shipped" in §6

Each decision_log row uses the same column structure as Phase 1a's row: Date, Stream, Decision, Rationale (short — ~1-2 sentences), Reversal cost (Low), Status (Confirmed).

---

## Task 9 — Final consolidated review

After all 7 tasks above land, dispatch a final reviewer to:
1. Verify all 5 module files exist and import-cleanly into Sheets (open each via openpyxl, confirm sheet names + headers)
2. Verify the 6 cross-file Apps Script files exist with correct constants
3. Verify cross-file consistency: e.g., Finance Money Out's Category enum should include items that Operations Vendors expect; Bake Plan generator should reference CRM Orders' correct columns (post-Phase 1a additions); Dashboard IMPORTRANGEs should reference the right sheet names
4. Scan for stale "Month 0-6" / "migrate to Odoo" leftovers
5. Confirm decision_log + operating_envelope + spec are all updated

Report: **Approved** (stack ships as designed) | **Approved with follow-ups** | **Issues blocking ship**.

---

## Execution adaptations from strict subagent-driven-development protocol

Given 7 tasks each producing 3-7 files, executing strict spec-review + code-quality-review per task = ~50+ subagent invocations. This plan adapts:

- **Implementer dispatch per Task** (single subagent creates all artifacts for that Task) — implementer self-reviews before reporting.
- **Inline verification** via Bash (run generators, grep for content, inspect xlsx via openpyxl one-liners). Replaces per-task spec-reviewer when work is mechanical schema-creation.
- **Spec-reviewer subagent** dispatched only for Apps Script tasks (logic correctness matters): Task 1 (compliance_reminder), Task 5 (bake_plan_generator + par_breach_alerter), Task 7 (morning_digest + festival_pre_block).
- **Final consolidated reviewer** (Task 9) does the cross-cutting review.

This reduces ceremony from ~50 invocations to ~12 while keeping safety nets on the logic-heavy work.

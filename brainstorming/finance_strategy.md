# Stream 2 — Finance Strategy (Google Sheets — Phase 1e)

> _Last updated: 2026-05-24_
> _Status: Phase 1 complete (1a–1e). All Finance tabs anchored: Money In · UPI Reconciliation · Bank vs UPI Float · Compliance · Money Out · Vendor Ledger · P&L · Cash Runway · Capex Register · Founder Draws. Apps Scripts: upi_reconciler.gs · compliance_reminder.gs._
> _Operators: Swetha (S) · Shreya (Sh). Geography: Hyderabad._
> _Parent spec: [unified cottage stack design](specs/2026-05-24-cottage-stack-design.md)._

This document is **canonical** for the Finance module's Phase 1a until reversed in `decision_log.md`. It defines the inflow ledger, three-balance tracking, and the UPI reconciliation loop that runs against `01_CRM_Sales.xlsx Orders`.

---

## 1. Why UPI-first

Indian cottage bakers overwhelmingly receive payments via UPI, and almost always to a **personal VPA** (GPay or PhonePe on the operator's personal phone) rather than a merchant VPA. Why personal:

- Personal VPAs charge **₹0 MDR** (merchant accounts charge ~0.4–2% MDR or require Razorpay/Cashfree etc.).
- For ≤₹50K per-transaction, personal UPI is the path of least resistance.

The trade-off: **no auto-feed**. Personal UPI accounts don't expose a CSV download or API; every inflow is reconciled by hand against the GPay/PhonePe app's transaction history. The Money In tab is where that manual log lives. The UPI Reconciliation tab is where the cross-check against CRM Orders happens.

This is the single most expensive piece of manual work in a cottage bakery's day. Phase 1a's value is **cutting that work to <5 minutes per day** by formalising the entry surface and auto-detecting both-sided gaps.

---

## 2. Three balances, not one

The Bank vs UPI Float tab tracks three balances separately:
- **Bank** (e.g., HDFC current/savings account)
- **UPI float** (the operator's primary UPI app — GPay or PhonePe)
- **Cash drawer** (physical cash on hand)

These do not interconvert automatically. UPI inflows credit the UPI float. Bank transfers credit the bank. Cash sales credit the cash drawer. When you sweep UPI float → bank account (typically weekly), that's a separate transfer entry (out of scope for Phase 1a; lands in Money Out / Phase 1c).

---

## 3. Tab schemas

### 3.1 `Money In`

One row per inbound credit.

| Col | Header (as shown in sheet) | Type | Source / formula |
|---|---|---|---|
| A | **Entry ID** | text | `=IF(B2="","","MIN-"&TEXT(ROW()-1,"0000"))` |
| B | **Date** | date | manual |
| C | **Time** | time | manual (HH:MM, useful when matching multiple inflows on same date) |
| D | **Channel** | text | list: UPI-GPay, UPI-PhonePe, UPI-Other, Bank Transfer, Cash, Refund-In |
| E | **Account credited** | text | list: Bank, UPI float, Cash drawer |
| F | **Amount (₹)** | number | manual |
| G | **UPI reference (UTR)** | text | manual — 12-digit from app notification; blank for cash / bank |
| H | **Payer VPA** | text | manual — `customer@oksbi` etc.; blank for cash / bank |
| I | **Counter-party name** | text | manual (what GPay shows as sender name) |
| J | **Matched Order ID** | text | auto-populated by `upi_reconciler.gs`; blank if no match |
| K | **Notes** | text | free |
| L | **Logged at** | datetime | `=IF(B2="","",NOW())` (frozen on first edit — Apps Script overwrites with static timestamp) |

### 3.2 `Bank vs UPI Float`

Four to six rows (one per account). Tracks running balances.

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | **Account** | text | manual (e.g., "Bank — HDFC", "UPI — GPay", "UPI — PhonePe", "Cash drawer") |
| B | **Opening balance (₹)** | number | manual; set once at sheet creation, then never touched |
| C | **Opening date** | date | manual; the date the opening balance was true |
| D | **Inflows since opening (₹)** | number | `=SUMIFS('Money In'!F:F, 'Money In'!E:E, A2, 'Money In'!B:B, ">="&C2)` |
| E | **Outflows since opening (₹)** | number | `=IFERROR(SUMIFS('Money Out'!F:F,'Money Out'!E:E,<account>,'Money Out'!B:B,">="&C2),0)` — sums from Money Out by account type (Phase 1c) |
| F | **Current balance (₹)** | number | `=B2+D2-E2` |
| G | **Last reconciled (date)** | date | manual — operator updates after physically checking GPay app / bank statement |
| H | **Variance vs actual (₹)** | number | manual — typed in when reconciliation reveals drift |
| I | **Notes** | text | free |

### 3.3 `UPI Reconciliation`

Read-mostly. Apps Script overwrites two sections daily.

```
Section A: Inflows without a matched Order
(Money In rows where Matched Order ID is blank AND Channel starts with "UPI")

| Entry ID | Date | Amount | UTR | Payer VPA | Counter-party | Channel |

Section B: Orders claiming UPI payment but no matching inflow
(Orders where Deposit received > 0 OR Balance received > 0 AND Payment mode = UPI
 AND Orders.UTR not found in Money In.UTR)

| Order ID | Customer | Delivery date | Final (₹) | Declared paid (₹) | Orders.UTR | Notes |

Section C: Summary
- Inflows without a match: N
- Orders without a match: M
- Last run: <timestamp>
- Total ₹ unmatched (inflow side): ₹X
- Total ₹ unmatched (order side): ₹Y
```

Operator workflow: every morning, open this tab. If Section A has rows, find which order each unmatched UPI inflow belongs to and write the Order ID into Money In.J manually (or correct the UTR on either side). If Section B has rows, either the customer hasn't actually paid (chase) or you forgot to log the inflow (log it now in Money In).

### 3.4 `Compliance`

Tracks statutory licenses (FSSAI cottage food, trade licence, GST registration, professional tax, etc.) with auto-computed Status flags.

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | **License type** | text | list: FSSAI Cottage Food, Trade Licence, GST Registration, Professional Tax, Shops & Establishment, Other |
| B | **License number** | text | manual |
| C | **Issuing authority** | text | manual |
| D | **Issued on** | date | manual |
| E | **Valid until** | date | manual |
| F | **Days to expiry** | number | `=IFERROR(E2-TODAY(),"")` |
| G | **Status** | text | derived: EXPIRED / Renew NOW (≤7d) / Renew this month (≤30d) / Renew this quarter (≤90d) / Current |
| H | **Last renewed** | date | manual |
| I | **Notes** | text | free |

The `compliance_reminder.gs` Apps Script (weekly Mon 09:00 IST) emails any non-Current rows. FSSAI cottage food licence renewal lapse = ₹5L penalty risk for Hyderabad cottage operators — this is the cheapest insurance in the Finance module.

### 3.5 `Money Out` (Phase 1c)

One row per outbound payment. Covers ingredients, packaging, utilities, delivery, capex, and founder draws. Mirrors the structure of Money In. Up to 500 data rows pre-seeded with formula cells.

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | **Entry ID** | text | `=IF(B2="","","MOUT-"&TEXT(ROW()-1,"0000"))` |
| B | **Date** | date | manual |
| C | **Time** | time | manual |
| D | **Channel** | text | list: UPI-GPay, UPI-PhonePe, UPI-Other, Bank Transfer, Cash, NACH, Refund-Out |
| E | **Account debited** | text | list: Bank, UPI float, Cash drawer |
| F | **Amount (₹)** | number | manual |
| G | **Category** | text | list: Ingredients, Packaging, Utilities, Rent, Equipment (capex), Maintenance, Marketing, Delivery (Porter/Dunzo), Founder Draw, Transfer (Account-to-Account), Other |
| H | **UPI reference (UTR)** | text | manual — 12-digit from app notification; blank for cash / bank transfers |
| I | **Payee VPA / Account** | text | manual — vendor VPA or account number |
| J | **Payee name** | text | manual — vendor or individual name |
| K | **Linked PO ID** | text | manual — reference PO number if applicable |
| L | **Notes** | text | free |
| M | **Logged at** | datetime | `=IF(B2="","",NOW())` |

Sample data (12 rows) in `brainstorming/finance_sheets/build_xlsx.py` (`MONEY_OUT_SAMPLE`): ingredients from Metro, Vijetha, Heritage Dairy, Callebaut; packaging from Wholesale Box Supplier; utilities (GHMC electricity, Bharat Gas LPG); Porter delivery runs; KitchenAid capex; founder draws for Swetha and Shreya.

### 3.6 `Vendor Ledger` (Phase 1c)

One row per recurring vendor. Aggregates spend from Money Out. Up to 100 rows.

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | **Vendor name** | text | manual — must match exactly `Money Out.Payee name` values for roll-up to work |
| B | **Category** | text | list: Ingredient supplier, Packaging, Utility, Service, Capex supplier, Delivery partner, Other |
| C | **Preferred channel** | text | list: UPI-GPay, UPI-PhonePe, Bank Transfer, Cash |
| D | **VPA / Account** | text | manual — vendor's VPA or bank account ref |
| E | **Total paid to date (₹)** | number | `=IFERROR(SUMIFS('Money Out'!F:F,'Money Out'!J:J,A2),0)` |
| F | **Last payment date** | date | `=IFERROR(IF(MAXIFS('Money Out'!B:B,'Money Out'!J:J,A2)=0,"",MAXIFS('Money Out'!B:B,'Money Out'!J:J,A2)),"")` |
| G | **Payment count** | number | `=IF(A2="","",COUNTIF('Money Out'!J:J,A2))` |
| H | **Notes** | text | free |

Sample data (9 vendors) in `brainstorming/finance_sheets/build_xlsx.py` (`VENDORS_SAMPLE`).

### 3.7 `P&L (monthly)` (Phase 1d)

Formula-only tab. No manual data entry rows. Rows = P&L line items; columns B–M = 12 months starting from the current month (May 2026 through Apr 2027). All values are derived from Money In and Money Out via `SUMIFS` on date ranges and category/match fields.

Structure:

| Row group | Line items |
|---|---|
| **REVENUE** | Gross revenue (orders) · Other inflows (unmatched / refunds) · **Total revenue** |
| **COGS** | Ingredients · Packaging · **Total COGS** · **Gross profit** · **Gross margin %** |
| **OPERATING EXPENSES** | Utilities · Rent · Maintenance · Marketing · Delivery · **Total opex** · **Operating profit** |
| **BELOW THE LINE** | Capex · Founder draws · **Net cash flow** |

Formula patterns:
- Revenue rows: `SUMIFS('Money In'!F:F, 'Money In'!J:J, "<>", ...)` (matched orders) and `"="` (unmatched inflows), filtered by `DATE(y,m,1)` ≤ date ≤ `DATE(y,m+1,1)-1`.
- COGS / opex rows: `SUMIFS('Money Out'!F:F, 'Money Out'!G:G, "<Category>", ...)` filtered by same date range.
- Aggregate rows (Total, Gross profit, Operating profit, Net cash flow): simple cell arithmetic.
- Gross margin %: `=IFERROR(GrossProfit/TotalRevenue,"")`, formatted `0.0%`.
- Freeze panes at B2 so the line-item column stays visible while scrolling months.

### 3.8 `Cash Runway` (Phase 1d)

13 rows: 1 header + 12 data rows (one per month, current month + next 11). 7 columns:

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | **Month** | text | `YYYY-MM` label, e.g. `2026-05` |
| B | **Opening cash (₹)** | number | Row 2: `=SUM('Bank vs UPI Float'!F:F)` (live sum of all current balances). Rows 3–13: `=E{prev_row}` (previous month's closing). |
| C | **Projected inflows (₹)** | number | Manual — operator estimate for the month |
| D | **Projected outflows (₹)** | number | Manual — operator estimate for the month |
| E | **Closing cash (₹)** | number | `=B+C-D` |
| F | **Runway flag** | text | `=IF(E<10000,"⚠ BELOW BUFFER",IF(E<25000,"Tight","OK"))` |
| G | **Notes** | text | free |

Runway flag thresholds (Hyderabad cottage bakery context):
- **< ₹10,000** → `⚠ BELOW BUFFER` — less than ~1 week of ingredient + utility burn; immediate action needed.
- **< ₹25,000** → `Tight` — below one month's typical variable cost; review discretionary outflows.
- **≥ ₹25,000** → `OK`.

### 3.9 `Capex Register` (Phase 1e)

Tracks fixed assets, depreciation, and net book value. One row per asset (owned or planned). Up to 100 rows.

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | **Asset** | text | manual — equipment name and model |
| B | **Category** | text | list: Oven, Mixer, Refrigeration, Tools, Furniture, Other |
| C | **Purchased on** | date | manual — acquisition date; blank for planned assets |
| D | **Purchase price (₹)** | number | manual — capex amount; zero for pre-existing equipment tracked for replacement clock |
| E | **Supplier** | text | manual — vendor name (e.g., "KitchenAid India (Amazon)", "(pre-existing equipment)") |
| F | **Linked Money Out ID** | text | manual — cross-reference to the Money Out entry (e.g., "MOUT-0010"); blank if not yet purchased or payment not logged |
| G | **Useful life (months)** | number | manual — depreciation period (e.g., 36 months for mixer, 60 months for oven) |
| H | **Monthly depreciation (₹)** | number | `=IFERROR(D{r}/G{r},"")` — straight-line: purchase price ÷ useful life |
| I | **Net book value (₹)** | number | `=IFERROR(D{r}-(H{r}*MIN((TODAY()-C{r})/30.4,G{r})),"")` — cost minus accumulated depreciation (capped at useful life) |
| J | **Notes** | text | free |

Sample data (5 assets) in `brainstorming/finance_sheets/build_xlsx.py` (`CAPEX_SAMPLE`): OTG (pre-existing), stand mixer (2026-05-12, ₹38K), planned convection oven, weighing scale, cake turntables + spatulas.

### 3.10 `Founder Draws` (Phase 1e)

Logs distributions to founders (salary equivalents, reimbursements, profit distributions). One row per draw. Up to unlimited rows.

| Col | Header | Type | Source / formula |
|---|---|---|---|
| A | **Date** | date | manual — when the draw was made |
| B | **To** | text | list: Swetha, Shreya, Joint |
| C | **Amount (₹)** | number | manual — draw amount |
| D | **Purpose** | text | list: Salary, Reimbursement, Profit Distribution, Loan Repayment, Other |
| E | **Linked Money Out ID** | text | manual — cross-reference to Money Out entry (e.g., "MOUT-0011"); blank if not yet logged in Money Out |
| F | **Notes** | text | free — e.g., "May salary equivalent", "April surplus" |

Sample data (3 draws) in `brainstorming/finance_sheets/build_xlsx.py` (`DRAWS_SAMPLE`): Swetha May salary (₹15K, MOUT-0011), Shreya May salary (₹15K, MOUT-0012), Joint April profit distribution (₹8K).

---

## 4. Operator workflow (steady state)

**End of each day (or batch at end of week)** — Sh:
1. Open GPay / PhonePe app, scroll through today's transactions.
2. For each customer payment, add a row in Money In (Date, Time, Channel, Account, Amount, UTR, Payer VPA, Counter-party).
3. Don't worry about matching to orders manually — `upi_reconciler.gs` does that overnight.

**Each morning** — both:
1. Open UPI Reconciliation tab.
2. Resolve Section A and Section B rows (typically <2 of each per day at cottage volumes).
3. Glance at Bank vs UPI Float — Current balance vs your phone's GPay balance. If variance > ₹100, dig in.

**Weekly** — both:
1. Sweep UPI float → bank account (out of app to your bank). Logged in Money Out once Phase 1c lands; manually noted in `Bank vs UPI Float.Notes` for now.

---

## 5. Apps Script: `upi_reconciler.gs`

Daily 09:00 IST. Reads CRM Orders via Drive API (cross-file), writes back matches into Money In, writes exception lists into UPI Reconciliation. Full source in `finance_sheets/apps_script/upi_reconciler.gs`.

---

## 6. Out of scope for Phase 1a

These belong in later sub-phases. Listed for the reader's mental model:

| Belongs in | What |
|---|---|
| ~~1b — Compliance~~ | ~~FSSAI / trade licence / GST register; renewal reminders~~ — **delivered Phase 1b** |
| ~~1c — Money Out + Vendor Ledger~~ | ~~Outflows (ingredient UPI, capex, utilities, founder draws); vendor payables~~ — **delivered Phase 1c** |
| ~~1d — P&L + Cash Runway~~ | ~~Monthly P&L derived from Money In/Out by category; 12-month cash runway~~ — **delivered Phase 1d** |
| ~~1e — Capex + Founder Draws~~ | ~~Asset register + depreciation; founder distribution log~~ — **delivered Phase 1e** |

---

## 7. Open dependencies on other Streams

| From Stream | What it sharpens |
|---|---|
| 2 — Budgeting / Entity / GST | Entity form drives Founder Draws structure; GST status activates Compliance.GST register |
| 6 — Order intake / payment | Per-order UPI link generation; deposit-trigger automation (UPI link sent on Quoted → Confirmed) |

Phase 1a does **not** block on either. The schema absorbs them as they land.

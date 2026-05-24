# Stream 7 — CRM Strategy (Google Sheets — steady state)

> _Last updated: 2026-05-24_
> _Status: Anchored. Sheets is the destination, not a stepping stone. See [unified stack design spec](specs/2026-05-24-cottage-stack-design.md)._
> _Operators: Swetha (S), Shreya (Sh). Geography: Hyderabad._

This document is **canonical** for Stream 7 until reversed in `decision_log.md`. It defines the order pipeline, customer ledger, capacity calendar, and outreach automations that run entirely on Google Sheets + a single Google Form + Google Apps Script — no Odoo, no Notion, no third-party CRM.

---

## 1. Why Sheets only

The three tools on the shelf are Odoo (in production for NTPL), Notion (connected), and Google Sheets. For a two-person home bakery in Hyderabad, the binding constraint is **Shreya's friction**, not feature parity.

- **Odoo CRM** is overbuilt for cottage-scale orders and adds a second login away from where orders land (WhatsApp + Instagram). The cost of a CRM Shreya doesn't open is infinite.
- **Notion** is good for SOPs and content; weak for date-math, COUNTIFS-style capacity rollups, and Apps Script reach.
- **Sheets** is where Shreya already lives, runs free, integrates natively with Google Forms (intake) and Apps Script (outreach), and is the destination for the unified stack — not a stepping stone.

This decision is logged in [decision_log.md](decision_log.md) at Stream 7 with **Low reversal cost** (data exports cleanly if circumstances ever change).

**Revisit-the-decision trigger** — re-open *the conversation* (not necessarily the conclusion) when any of these surface:
- Confirmed orders cross 40/month sustained for two consecutive months.
- A third operator is hired (permissions model needs real auth).
- A category of workflow surfaces that Sheets genuinely cannot model.

These are signals to re-examine, not pre-committed migration triggers. Most can be absorbed by the patterns in §11 (Scale within Sheets) without leaving the platform. The `Invoice ID` column (Orders.Y; see §5.3) exists as a forward-compat hook *if* GST registration ever changes the calculus, not as an implied migration plan.

---

## 2. Two-operator ownership model

The single most common failure mode for a 2-person Sheet-based CRM is the "neither of us updated it" drift. Pre-assign:

| Tab | Owner | Backup | Rule |
|---|---|---|---|
| `Inquiries` | **Sh** (front-of-house) | S | Every inbound WA/Insta crossing "are you taking orders" → row within the day. |
| `Customers` | **Sh** | S | Updated on first **Confirmed** status in Inquiries (manual promote). |
| `Orders` | **S** (production) | Sh | Production status updated by whoever is baking, end of each stage. |
| `Occasions` | **Sh** | — | Updated when Customers row is created; reviewed monthly. |
| `Capacity Calendar` | **S** | — | Slot totals reviewed weekly; auto-rolled-up from Orders by formula. |
| `Occasions Calendar` | **Sh** | — | Derived view; weekly review for outreach triggers. |

Concurrency is not a Sheets problem — it's a humans-overwriting-each-other problem. **Rule of thumb:** the owner is the *writer*; the backup is the *reader*. If the backup needs to write, they leave a cell-comment first.

---

## 3. DPDP Act 2023 — consent-first design

Storing phone + occasion dates + dietary info crosses the threshold of "personal data" under the Digital Personal Data Protection Act 2023. The schema below treats consent as a first-class column. Operating rules:

1. **Inquiry-stage capture** is operational, not marketing — DPDP-exempt while limited to fulfilling the order the customer initiated.
2. **Customers tab** stores `Marketing consent` (Y/N) and `Consent date`. Without `Y`, the customer is **excluded** from the Occasions Calendar outreach list — enforced by the QUERY formula, not memory.
3. **Consent capture flow** — one-line WhatsApp message after first delivery:
   > "Hi <name>! Loved baking for you. Would you like a gentle reminder ~10 days before <next occasion> next year? Just reply YES or NO — both are fine."
   Screenshot the YES, log date + screenshot link in Customers.
4. **Withdrawal** — any "stop" / "unsubscribe" message flips the column to `N` immediately. Owner: Sh.
5. **Data minimisation** — do not store CC details, Aadhaar, or full addresses you don't need to deliver. Address column holds the most recent delivery address only; older addresses live in Orders rows.

Penalties under DPDP are real and disproportionate for cottage operators. This is the cheapest insurance in the schema.

---

## 4. Architecture overview

Six tabs in a single spreadsheet. Five are operator-facing; one (`Occasions`) is the normalised data layer powering the Calendar view.

```
Tiered Cake Company — CRM
├── Inquiries           ← raw inbox (Sh owns)
├── Customers           ← master record (Sh owns)
├── Orders              ← one row per order (S owns)
├── Occasions           ← one row per recurring date (Sh owns; powers calendar)
├── Capacity Calendar   ← 60-day forward view (S owns; auto-rolled)
└── Occasions Calendar  ← derived view of next-30-day outreach (Sh owns)
```

Cross-tab links (using sheet column letters since header text may vary as you tweak it):

```
Inquiries.Q (Customer ID if promoted) ──(manual on Confirmed)──→ Customers.A (Customer ID)
Customers.A (Customer ID) ──(VLOOKUP)──→ Orders.C (Name auto)
Customers.A (Customer ID) ──(parent)──→ Occasions.B (Customer ID) ──(ARRAYFORMULA)──→ Occasions Calendar
Orders.E (Delivery date) ──(COUNTIFS)──→ Capacity Calendar.D/F/H (slots used)
```

---

## 5. Tab schemas (exact column headers, formulas, validation)

### 5.1 `Inquiries`

| Col | Header (as shown in sheet) | Type | Source / formula | Validation |
|---|---|---|---|---|
| A | **Inquiry ID** | text | `=IF(B2="","","INQ-"&TEXT(ROW()-1,"0000"))` | — |
| B | **Date received** | date | manual | date |
| C | **Channel** | text | manual | list: WhatsApp, Instagram, Referral, Walk-in, Other |
| D | **Name** | text | manual | — |
| E | **Phone** | text | manual (preserve leading `+`) | regex `^\+?[0-9 -]{7,}$` |
| F | **Occasion** | text | manual | list: Birthday, Birthday (kid), Anniversary, Wedding, Corporate, Just Because, Other |
| G | **Event date** | date | manual | date |
| H | **What they want** | text | manual | — |
| I | **Budget hint** | text | manual | — |
| J | **Status** | text | manual | list: New, Quoted, Confirmed, Lost |
| K | **Assigned to** | text | manual | list: Swetha, Shreya |
| L | **Quoted (₹)** | number | manual | number ≥ 0 |
| M | **Notes** | text | manual | — |
| N | **Lost reason** | text | manual (if Status=Lost) | list: Price, Date unavailable, No response, Changed mind, Other |
| O | **Consent (Y/N)** | text | manual | list: Y, N |
| P | **Logged at** | datetime | `=IF(B2="","",NOW())` *(freeze with form_handler.gs — see note)* | — |
| Q | **Customer ID (if promoted)** | text | manual on promotion to Customers | — |

> **Note on Logged at:** `NOW()` recalculates every edit. To freeze, the `onFormSubmit` trigger in [apps_script/form_handler.gs](crm_sheets/apps_script/form_handler.gs) writes a static timestamp when a row is first created. The xlsx ships with the formula as a placeholder.

**Conditional formatting**
- `J = "New"` and `date < TODAY()-2` → red background (stale).
- `J = "Confirmed"` → green background.
- `J = "Lost"` → grey text.

---

### 5.2 `Customers`

| Col | Header (as shown in sheet) | Type | Source / formula |
|---|---|---|---|
| A | **Customer ID** | text | manual: `CUS-0001`, `CUS-0002`, … |
| B | **Name** | text | manual |
| C | **Phone** | text | manual |
| D | **Email** | text | optional |
| E | **Address** | text | most recent delivery address |
| F | **Dietary** | text | egg / eggless / nut-allergy / Jain / etc. |
| G | **How they found us** | text | list: Instagram, WhatsApp, Referral, Walk-in, Repeat |
| H | **First order** | date | manual on first order |
| I | **Last order** | date | `=IFERROR(MAXIFS(Orders!E:E,Orders!B:B,A2),"")` |
| J | **Orders count** | number | `=COUNTIF(Orders!B:B,A2)` |
| K | **Lifetime (₹)** | number | `=SUMIF(Orders!B:B,A2,Orders!K:K)` *(K = Final price)* |
| L | **Marketing consent** | text | list: Y, N. **Default N**. |
| M | **Consent date** | date | required when L=Y |
| N | **Notes** | text | free |

> **Why no occasion columns here?** Occasions are normalised to their own tab (§5.4) so one customer can hold N occasions without fixed slots.

---

### 5.3 `Orders`

| Col | Header (as shown in sheet) | Type | Source / formula |
|---|---|---|---|
| A | **Order ID** | text | `=IF(B2="","","ORD-"&TEXT(ROW()-1,"0000"))` |
| B | **Customer ID** | text | manual (paste from Customers) |
| C | **Name (auto)** | text | `=IFERROR(VLOOKUP(B2,Customers!A:B,2,FALSE),"")` |
| D | **Order date** | date | manual |
| E | **Delivery date** | date | manual |
| F | **Product** | text | list: Cake, Cupcakes, Brownies, Cake Tub, Bomboloni, Mixed |
| G | **Flavour** | text | manual |
| H | **Size / Qty** | text | manual (e.g. `2kg`, `12 cupcakes`) |
| I | **Customisation** | text | manual |
| J | **Quoted (₹)** | number | manual |
| K | **Final (₹)** | number | manual (may differ from quoted) |
| L | **Deposit received (₹)** | number | manual |
| M | **Balance received (₹)** | number | manual |
| N | **Balance due (₹)** | number | `=IF(K2="","",K2-IFERROR(L2,0)-IFERROR(M2,0))` |
| O | **Payment mode** | text | list: UPI, Cash, Bank Transfer, Mixed |
| P | **Delivery mode** | text | list: Customer pickup, Own delivery, Porter, Dunzo, Other |
| Q | **Cold-chain notes** | text | manual (critical Mar–Sep) |
| R | **UPI reference (UTR)** | text | manual — 12-digit UTR from GPay/PhonePe confirmation. Join key for Finance reconciliation. |
| S | **Payer VPA** | text | manual — fallback (e.g., `customer@oksbi`) when UTR isn't shared |
| T | **Production** | text | list: Queued, Prep, Bake, Decorate, Done |
| U | **Delivery** | text | list: Pending, Out, Delivered, Issue |
| V | **Feedback received** | text | list: Y, N |
| W | **Rating** | number | 1–5 |
| X | **Feedback** | text | manual |
| Y | **Invoice ID** | text | hook for later GST flow (not active in cottage stage) |
| Z | **Notes** | text | free |

**Conditional formatting**
- `N > 0` and `U = "Delivered"` → red (collection pending after delivery).
- `T = "Queued"` and `E - TODAY() ≤ 1` → red (production behind).
- `V = "N"` and `U = "Delivered"` and `TODAY() - E ≥ 2` → orange (chase feedback).

---

### 5.4 `Occasions`

Normalised data tab. One row per customer-occasion pair.

| Col | Header (as shown in sheet) | Type | Source / formula |
|---|---|---|---|
| A | **Occasion ID** | text | `=IF(B2="","","OCC-"&TEXT(ROW()-1,"0000"))` |
| B | **Customer ID** | text | manual |
| C | **Name (auto)** | text | `=IFERROR(VLOOKUP(B2,Customers!A:B,2,FALSE),"")` |
| D | **Type** | text | list: Birthday (self), Birthday (kid), Anniversary, Wedding date, Diwali bulk, Other |
| E | **Month-Day (MM-DD)** | text | format `MM-DD` (e.g. `06-07`) — year-agnostic so recurrence works |
| F | **Year first known** | number | optional; lets you compute "turning X" |
| G | **For whom** | text | who is it for (e.g. "Aarav (son, turning 7)", "self") |
| H | **Notes** | text | preferred flavour, allergy reminders |
| I | **Consent (auto)** | text | `=IFERROR(VLOOKUP(B2,Customers!A:L,12,FALSE),"")` *(mirrors customer's Marketing consent)* |

> Storing `MM-DD` instead of a full date is deliberate: birthdays recur. `Year first known` (optional) supports "Aarav turns 7" messaging.

---

### 5.5 `Capacity Calendar`

60-day forward window. Pre-seeded with dates and totals; usage columns are auto-rolled from `Orders` by COUNTIFS.

| Col | Header (as shown in sheet) | Type | Source / formula |
|---|---|---|---|
| A | **Date** | date | seeded |
| B | **Day** | text | `=TEXT(A2,"ddd")` |
| C | **Cake slots (total)** | number | manual (default: 3 weekday / 5 weekend — adjust once Stream 1 anchors) |
| D | **Cake slots (used)** | number | `=COUNTIFS(Orders!E:E,A2,Orders!F:F,"Cake")` |
| E | **Cupcake dozens (total)** | number | manual (default: 4) |
| F | **Cupcake dozens (used)** | number | `=COUNTIFS(Orders!E:E,A2,Orders!F:F,"Cupcakes")` *(see note)* |
| G | **Bomboloni batches (total)** | number | manual (default: 1) |
| H | **Bomboloni batches (used)** | number | `=COUNTIFS(Orders!E:E,A2,Orders!F:F,"Bomboloni")` |
| I | **Blocked** | text | list: Y, N (default N) |
| J | **Block reason** | text | manual (festival / personal / household) |
| K | **Utilisation %** | number | `=IFERROR((D2/C2+F2/E2+H2/G2)/3,0)` |
| L | **Notes** | text | free |

> **Cupcake formula note:** the formula counts **orders** with product = Cupcakes (treating each as 1 dozen). The `Size / Qty` column in Orders mixes "2kg" and "12 cupcakes" as text, so a SUMIFS won't work cleanly. For Month 0 simplicity this 1-order-per-dozen approximation is fine; refine to a dedicated numeric `qty_dozens` column if real volumes diverge.

**Conditional formatting**
- `D ≥ C` → cake column red.
- `F ≥ E` → cupcake column red.
- `H ≥ G` → bomboloni column red.
- `I = "Y"` → row greyed out.
- `K ≥ 0.8` → row amber.

---

### 5.6 `Occasions Calendar`

Read-only derived view. One row per upcoming occasion in the next 30 days.

Single-cell formula in `A2` (reads `Occasions!C2:I` — columns C/Name through I/Consent):

```
=QUERY(
  {
    Occasions!C2:I,
    ARRAYFORMULA(
      IF(Occasions!E2:E="",,
        DATE(YEAR(TODAY())+IF(
          DATE(YEAR(TODAY()),
               VALUE(LEFT(Occasions!E2:E,2)),
               VALUE(RIGHT(Occasions!E2:E,2))) < TODAY(), 1, 0),
          VALUE(LEFT(Occasions!E2:E,2)),
          VALUE(RIGHT(Occasions!E2:E,2)))
      )
    )
  },
  "select Col1, Col2, Col5, Col8, Col6, Col4
   where Col8 is not null
     and Col8 <= date '"&TEXT(TODAY()+30,"yyyy-mm-dd")&"'
     and Col7 = 'Y'
   order by Col8 asc
   label Col1 'Customer',
         Col2 'Occasion',
         Col5 'For whom',
         Col8 'Next date',
         Col6 'Notes',
         Col4 'First known year'",
  0
)
```

The QUERY range mapping is: Col1 = `Name (auto)`, Col2 = `Type`, Col3 = `Month-Day`, Col4 = `Year first known`, Col5 = `For whom`, Col6 = `Notes`, Col7 = `Consent (auto)`. Col8 is appended as the computed next-occurrence date.

**Output columns (as shown in sheet):**

| Customer | Occasion | For whom | Next date | Notes | First known year |

The QUERY filters on `Consent (auto) = 'Y'` (which itself mirrors the customer's `Marketing consent`) — no manual gatekeeping, no DPDP slip.

> **Outreach tracking** is not in this tab. The `birthday_reminder.gs` weekly digest email is the outreach instrument; whether the message was actually sent lives in Shreya's WhatsApp history, not the sheet. If you want to track outreach in-sheet later, add columns `outreach_sent_on` and `outreach_owner` to the Occasions tab itself (not the derived view).

---

## 6. Intake: one Google Form, three placements

Build **one** Google Form ("Tiered Cake Company — Order Inquiry"). Field mapping matches `Inquiries` columns A–O.

Form fields, in order:
1. Your name (short text, required)
2. Mobile number (short text, required, regex `^[0-9+ -]{7,}$`)
3. What's the occasion? (multiple choice — Birthday / Kid Birthday / Anniversary / Wedding / Corporate / Just Because / Other)
4. Event date (date)
5. What are you thinking of ordering? (long text, required)
6. Approximate budget? (short text, optional)
7. How did you find us? (multiple choice — Instagram / WhatsApp / Referral / Walk-in)
8. Anything else we should know? (long text)
9. **Consent checkbox** — "I'm OK with Tiered Cake Company saving my contact and reminding me about future occasions. (You can opt out anytime — just reply STOP.)"

Form responses route to `Inquiries` tab. Apps Script trigger ([form_handler.gs](crm_sheets/apps_script/form_handler.gs)) populates `Inquiry ID`, `Logged at`, and `Consent (Y/N)` from the checkbox, and defaults `Status = New`, `Assigned to = Shreya`.

**Placement:**
1. WhatsApp Business "About" / catalog / quick reply.
2. Instagram bio link (link-tree if multi).
3. Auto-reply template you tap-send when DMs say "are you taking orders?":
   > "Lovely! To make sure nothing's lost in chat, please drop your details here — takes 30 seconds: <form-link>. Or just type them out here, either works. ✨"

Reality check: 60–70% of customers will still freestyle on WhatsApp. For those, **Shreya** fills the form on their behalf after the conversation closes. The form is for *your* discipline, not theirs.

---

## 7. Hyderabad-specific calibrations

| Driver | Implication for the sheet |
|---|---|
| Hot semi-arid climate; peak Mar–Jun | `Cold-chain notes` (Orders Q) becomes mandatory for any delivery beyond pickup. Default insulated-box + ice-pack note loadable from a named range. |
| Monsoon Jun–Sep | Delivery delays — add buffer to `Delivery = Pending` review; flag `Out` for >3h. |
| Festival peaks (Diwali, Eid, Christmas, Ganesh Chaturthi, Bathukamma) | Pre-block `Capacity Calendar.Blocked = Y` 7 days before festival as personal/family time, then re-open selectively. |
| Hyderabad WhatsApp-first commerce | Form is fallback; primary intake is WA. WA Business catalogue link + quick-reply with form link is the right balance. |
| UPI dominance | `Payment mode` defaults to UPI; cash second. Bank transfer rare. |
| Google reviews drive home-bakery SEO in Hyderabad | The Week-8 feedback automation (§9) is the **single highest-ROI line** in this whole document. |

---

## 8. Upstream dependencies (Streams 4 & 6 unanchored)

The CRM works without these but improves once they're set:

| From Stream | What it unlocks |
|---|---|
| **4 — Pricing** | `Quoted (₹)`, `Final (₹)`, deposit %. Until anchored, ad-hoc per order. |
| **6 — Order intake / payment / delivery** | `Payment mode` and `Delivery mode` enum sets; deposit-trigger rule (UPI link auto-sent on Quoted → Confirmed). |
| **1 — Workflow / tooling** | `Cake slots (total)` and friends in Capacity Calendar. Placeholders are 3/4/1 — replace once oven capacity and bomboloni batch size are anchored. |

None of these block starting. The schema absorbs the values as they land.

---

## 9. Automation rollout — by phase

### Phase 0 (now): build the sheet, type by hand

Import [TieredCakeCompany_CRM.xlsx](crm_sheets/TieredCakeCompany_CRM.xlsx) into Google Sheets (File → Import → Upload → Replace spreadsheet). Verify all formulas and validations carried across. Delete the EXAMPLE rows.

### Week 1 — discipline before automation

No Apps Script yet. Targets:
- Every WhatsApp/Insta inquiry → row in `Inquiries` within 24h.
- Every `Confirmed` inquiry → row in `Customers`.
- Every customer with a known birthday/anniversary → row(s) in `Occasions`.

The bottleneck for the first 30 days is **habit**, not tooling. Adding scripts now hides the discipline gap.

### Week 4 — light Apps Script (3 scripts)

Install from [crm_sheets/apps_script/](crm_sheets/apps_script/):

1. **[form_handler.gs](crm_sheets/apps_script/form_handler.gs)** — `onFormSubmit` trigger. Stamps `Inquiry ID`, freezes `Logged at`, sets defaults.
2. **[capacity_helpers.gs](crm_sheets/apps_script/capacity_helpers.gs)** — `onEdit` trigger. When a new Orders row is added, validates that the `Delivery date` has capacity; surfaces a comment if not.
3. **[birthday_reminder.gs](crm_sheets/apps_script/birthday_reminder.gs)** — weekly time trigger (Mon 09:00). Emails Sh + S the next-14-day occasions list with pre-drafted WhatsApp click-to-chat URLs.

### Week 8 — review loop

4. **[feedback_request.gs](crm_sheets/apps_script/feedback_request.gs)** — daily time trigger (10:00). Finds Orders with `Delivery = Delivered`, `Feedback received = N`, and `TODAY() - Delivery date >= 2 days`. Emails Sh a list with pre-drafted WhatsApp click-to-chat URLs. Sh taps each link, message opens pre-filled, hit send.

Why not fully auto-send? WhatsApp Business API auto-send needs a verified template and a Meta Cloud API setup — overkill for ≤20 customers/week. Click-to-chat is 99% of the value at 0% of the friction.

### Periodic re-evaluation (see §1 trigger)

Re-open the conversation when the §1 signals surface — most are absorbed within Sheets via the patterns in §11 (yearly archives, narrow IMPORTRANGE queries, per-file sharing). The `Invoice ID` and `Customer ID` columns exist as forward-compat hooks if a future decision ever moves data elsewhere, but no migration is planned or assumed.

---

## 10. What this design deliberately does **not** do

- **No native WhatsApp send.** Click-to-chat URLs only. Direct sending requires Meta Cloud API + template approval — overkill at cottage volumes.
- **No payment reconciliation automation *here*.** UPI/cash deltas are reconciled by the Finance module's `upi_reconciler.gs` (Phase 1a of Stream 2). The CRM's `Orders.UPI reference (UTR)` and `Payer VPA` columns are the join keys. See [`finance_strategy.md`](finance_strategy.md).
- **No recipe costing.** Belongs in Stream 1/3. CRM only knows `Final (₹)` and `Notes`.
- **No production batching.** A daily bake plan derived from `Orders.Delivery date` is a Stream 1 artefact. CRM holds source data; the bake plan can be a derived sheet later.
- **No multi-currency, no tax fields.** Pre-GST stage. `Invoice ID` is the future hook.

---

## 11. Scale within Sheets

Sheets is the destination. The 10M-cell cap per file is real but distant — cottage volumes reach it via Orders + Operations consumption logs in roughly 4–7 years at sustained growth. Native-Sheets answers when pressure shows up:

| Pressure | Sheets-native answer |
|---|---|
| Orders > 5000 rows in one file | Year-end archive: `01_CRM_Sales_2026.xlsx` becomes read-only; new year creates a new file; Dashboard UNIONs IMPORTRANGEs across years |
| File > 50 MB or slow loads | Audit IMPORTRANGE pulls — switch from whole-sheet to narrow QUERY ranges |
| Operator wants offline access | Sheets offline mode (caches locally, syncs when online) |
| Permissions need to broaden (e.g., bring in an accountant) | Per-file sharing — Finance can go view-only to a third party without exposing CRM |
| Festival peak rush | Sheets handles 100+ concurrent edits comfortably at cottage volumes |

If "Sheets can't scale to this" ever surfaces as a claim, treat it as a signal that the *workflow* needs rethinking — not the *tool*. Almost every cottage-scale bottleneck is a process problem in disguise.

---

## 12. File index

All artifacts live under `brainstorming/crm_sheets/`:

| File | Purpose |
|---|---|
| `TieredCakeCompany_CRM.xlsx` | The starter file. Import to Google Sheets. |
| `build_xlsx.py` | Regenerator if schema changes. `python3 build_xlsx.py` rewrites the xlsx. |
| `README.md` | Step-by-step import + Apps Script install. |
| `apps_script/form_handler.gs` | Form submit hook. |
| `apps_script/capacity_helpers.gs` | Capacity guardrail on order entry. |
| `apps_script/birthday_reminder.gs` | Weekly digest of upcoming occasions. |
| `apps_script/feedback_request.gs` | T+2 review-request queue. |

---

## 13. Three reminders you didn't ask for

1. **The Inquiries tab is the rate-limiting step.** If it's not filled within the day, nothing downstream works. Build the muscle in Week 1 before opening Apps Script in Week 4.

2. **Consent is per-occasion, not per-message.** A YES to "remind me about Aarav's birthday" is not a YES to "buy our Eid hamper." Treat outreach as occasion-triggered, not broadcast.

3. **The Instagram-to-WhatsApp leak is upstream of the CRM.** Every Insta DM that mentions an order gets the same reply ("drop details on WA at <num> or here: <form>"). Otherwise your funnel has a hole and the CRM looks broken when it isn't.

# App upgrade — tier-1 batch

_2026-05-24 · Tiered Cake Company_

## Why now

BRIDGE.md enumerates the field-level gaps between the app and the cottage-stack reference. With brand/city now settled, the next move is to thread stack-aligned fields into the app additively — every screen keeps working, but the data shape converges quietly.

## The full gap list (from BRIDGE.md)

For reference, here's everything BRIDGE.md flags as "add when next iterating":

| Area | Field / capability | Source |
|------|--------------------|--------|
| Customers | `email`, `address`, `dietary`, `howFoundUs`, **`marketingConsent`**, **`consentDate`** | DPDP Act 2023 |
| Orders | **`upiReferenceUtr`**, `payerVpa`, **`coldChainNotes`**, `feedbackReceived`, `rating`, `paymentMode` | UPI matching + Mar–Sep cold chain |
| Inventory | `reorderQty`, `daysCoverAtTypicalUse`, `reorderDue` | Auto-PO drafting |
| Expenses | **`upiReferenceUtr`**, `payeeVpa`, `linkedPoId`, `accountDebited` | Three-balance tracking |
| Reports | **Cash Runway flag** (BELOW BUFFER / Tight / OK) | Cash visibility |
| New screens | Compliance card (FSSAI / GST expiry countdown) | Annual lapse = ₹5L penalty |
| New flows | Capacity guardrail on order entry; feedback request queue; Draft PO action | Mirror Apps Scripts |

Bold = tier-1 (this batch). Rest is queued for tier-2.

## Tier-1 batch — what ships now

Three high-impact, low-blast-radius additions:

### 1. DPDP marketing consent (Customers)

**Why:** Legal compliance. India's DPDP Act 2023 requires explicit consent for any push-style marketing. The cottage stack already enforces this with a formula in the CRM. The app hasn't caught up.

**Data:**
- `marketingConsent: "Y" | "N"` (default `"N"`)
- `consentDate: "YYYY-MM-DD" | null`

**UI:**
- Customer detail Overview: add a small "Consent" row with status + date if Yes.
- Customer detail: an explicit toggle action (`Grant consent` / `Revoke consent`) that timestamps the change.
- Customers list: show a tiny consent indicator on each row (a dot or a Pill — subtle).
- New campaign flow (Marketing): note in the audience selector that uncosented customers are filtered out.

**Defaults in seed data:** flip ~50% of customers to `Y` with backdated `consentDate`; leave the rest `N` so the filter is visible.

### 2. UPI UTR on orders + expenses

**Why:** UPI matching is the daily-bookkeeping reality for Indian small business. Without UTR captured on both sides, reconciliation is purely manual. The cottage stack's `upi_reconciler.gs` joins on UTR.

**Data:**
- Orders: `upiReferenceUtr: "<12-digit>" | null`, `payerVpa: "<vpa>" | null`, `paymentMode: "UPI" | "Cash" | "Bank" | "Mixed" | null`
- Expenses: `upiReferenceUtr`, `payeeVpa`, `accountDebited: "Bank" | "UPI float" | "Cash drawer" | null`

**UI:**
- Order detail Payment section: when deposit > 0 and `paymentMode === 'UPI'`, show UTR + payer VPA in monospace.
- Order detail: if UTR is missing on a paid order, show a soft amber "UTR missing" pill prompting capture.
- Add Expense form: add `Account debited` segmented control + optional UTR input (only shown when method starts with `UPI`).

### 3. Cash Runway flag in Reports → Cash Flow

**Why:** The closing cash number on Cash Flow is just a number. The stack's Cash Runway tab classifies it into BELOW BUFFER (< ₹10K) / Tight (< ₹25K) / OK. Surfacing the same in the app gives the baker a glanceable health indicator.

**UI:**
- Reports → Cash Flow → the closing-cash card gets a colored badge: red BELOW BUFFER, amber Tight, sage OK.
- Add a one-line caption explaining the thresholds.

## Deliberately deferred to tier-2

- Inventory `reorderQty`, `daysCoverAtTypicalUse`, `reorderDue` → needs more design (the Draft PO action is the real value-add).
- Cold-chain notes field → small but needs a NewOrder UI revision. Bundle with the next NewOrder pass.
- Feedback request queue → needs a new screen or sheet.
- Compliance card with FSSAI/GST countdowns → new component on Settings or Finance home.
- Capacity guardrail on order entry → biggest of the deferred; needs a capacity calendar in data.

## What this batch doesn't do

- It does **not** rename or re-shape existing fields — purely additive.
- It does **not** wire payment validation. UTR is informational; an empty UTR doesn't block a save.
- It does **not** auto-enforce DPDP. The marketing campaign flow gets a hint, not a hard filter (yet).

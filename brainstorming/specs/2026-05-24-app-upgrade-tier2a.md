# App upgrade — tier-2a batch

_2026-05-24 · Tiered Cake Company_

## What this batch ships

Three additive features that each mirror one of the cottage stack's Apps Scripts. Same shape as tier-1: new data fields are optional, new UI is added not refactored, screens that didn't change still work.

### 1. Compliance card (mirrors `compliance_reminder.gs`)

**Why:** FSSAI cottage food licence lapse = ₹5L penalty. GSTR-3B late filing = ₹50/day per return. The baker needs a glanceable countdown, not a buried calendar reminder.

**Data:** new `finance.compliance[]` array. Each entry: `{ id, item, type, dueDate, status, note }`.
- `type` enum: `licence` / `tax-return` / `advance-tax` / `insurance` / `renewal`
- `status` derived client-side from `dueDate` vs today: `overdue` (< 0 days), `urgent` (≤ 14 days), `soon` (≤ 45 days), `ok` (> 45 days).

**Seed:** FSSAI annual renewal (due 30 Sep 2026), GSTR-3B May (due 20 Jun 2026), Q1 advance tax (due 15 Jun 2026), business insurance (due 12 Aug 2026), PT (Professional tax — Telangana, due 30 Jun 2026).

**UI:** new `<ComplianceCard>` component, surfaces the top 3 items by urgency. Appears as a new Home section visible only in Finance mode. Also accessible as a full list via Accounting → Tax → "Compliance schedule" link.

### 2. Inventory Draft PO action (mirrors `par_breach_alerter.gs`)

**Why:** Inventory screen surfaces low-stock items but stops there. The baker still has to manually message each supplier. The stack's PAR breach alerter groups by supplier and drafts a PO per vendor — the app should mirror that.

**Data:** add to each inventory item:
- `reorderQty` (number, default reorder amount in the item's unit)
- `daysCoverAtTypicalUse` (manual estimate of how long current stock lasts)

**UI:** new "Draft purchase orders" action on the Inventory screen. Tap → bottom sheet showing items below PAR grouped by supplier:
- For each supplier: items list with `reorderQty × unitCost = subtotal`
- "Send via WhatsApp" action per supplier (toast for prototype)
- Total at the bottom
- Empty state: "Stock is healthy — nothing to reorder right now"

### 3. Feedback request queue (mirrors `feedback_request.gs`)

**Why:** Reviews are the most underexploited lever for a custom-cake business. The stack runs a T+2 follow-up automation. The app should surface the same queue — delivered orders 2-7 days old where `feedbackReceived` is not Y.

**Data:** add to orders:
- `feedbackReceived` (`"Y" | "N"`, default `"N"`)
- `rating` (1–5 or null)

**Seed:** for the existing delivered orders, flip a couple to feedbackReceived=Y with a rating; leave the rest N to populate the queue.

**UI:** 
- New `Reviews` screen accessible via More menu (Marketing/Operations modes have it as `morePrimary`).
- Each row: customer avatar + name, order title, days since delivery, "Ask for review" button (toast).
- "Mark received" inline action that flips feedbackReceived to Y for the session.
- Compact preview card on Home in Marketing mode showing the top 2.

## What this batch deliberately doesn't do

- **Capacity guardrail** — still deferred; needs a capacity calendar in data.
- **Festival pre-blocking** — needs festival calendar; not in this batch.
- **Cold-chain notes on NewOrder** — small UI change, will bundle with the next NewOrder pass.
- **Birthday reminder digest** — needs occasion fields on customers; tier-2b.

## Implementation order

1. Seed data on finance.json + inventory.json + orders.json (all additive).
2. Build `<ComplianceCard>` + thread into Home for Finance mode.
3. Build Draft PO sheet on Inventory.
4. Build Reviews screen + Home preview on Marketing mode.
5. Wire to modes catalog and main router.
6. Rebuild standalone + verify each.

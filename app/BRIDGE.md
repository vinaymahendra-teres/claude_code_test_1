# BRIDGE.md — Where the app meets the production cottage stack

> **For coding agents working on this app:** This file is a one-stop pointer to the production-grade business specification that lives in a sibling folder, `../brainstorming/`. Read this file before adding or modifying any data schema, screen, or business rule. It exists so you upgrade the app without diverging from the real specs.

---

## What's in `../brainstorming/`

A complete Google Sheets-based "stripped Zoho One" stack for the same home bakery this app prototypes:

| Location | Purpose |
|---|---|
| `../brainstorming/specs/2026-05-24-cottage-stack-design.md` | Master architecture spec — read this first if you want the big picture |
| `../brainstorming/<module>_strategy.md` | Per-module canonical doc (CRM, Finance, Operations, Marketing, Dashboard) — the "why" |
| `../brainstorming/<module>_sheets/build_xlsx.py` | Authoritative schema definitions — column-by-column |
| `../brainstorming/<module>_sheets/apps_script/*.gs` | Business logic implemented as Google Apps Scripts — mirror these in app UI when relevant |
| `../brainstorming/decision_log.md` | Every design decision with rationale; resolve scope disputes by reading this |

5 module files + 9 Apps Scripts, all at ₹0/month opex. The app is a **phone-first interaction layer**; the stack is a **production data + automation layer**. Both serve the same business.

---

## Identity — resolved

Brand is **Tiered Cake Company**. City is **Hyderabad** only. Resolved by the founder on 2026-05-24 and propagated everywhere: app source, brainstorming/ prose, Apps Script `BAKERY_BRAND` constants, and the regenerated `TieredCakeCompany_*.xlsx` workbooks. The workdir folder is still `AMomentWithACake/` because it's a filesystem path, not a brand. Vendor names that legitimately reference other cities (e.g., a Bangalore supplier) stay as-is — they describe real suppliers.

---

## Field-by-field mapping (app data → cottage-stack tabs)

This is the canonical mapping. When you add new fields to any `app/data/*.json` file, name them per the cottage-stack column header (snake-case-ified) so a future sync script can converge the two without manual aliasing.

### `data/customers.json` → CRM `Customers` tab

| App field | Cottage-stack column | Notes |
|---|---|---|
| `id` | Customer ID | App uses numeric/short ID; stack uses `CUS-0001` format. Both work; a sync script normalises. |
| `name` | Name | — |
| `phone` | Phone | Stack preserves leading `+91`; app should too. |
| `lifetimeValue` | Lifetime (₹) | Stack derives via `SUMIF(Orders.Final)`; app shows the pre-computed number. |
| `orderCount` | Orders count | Stack derives via `COUNTIF(Orders.Customer ID)`; app shows pre-computed. |
| `lastOrder` | Last order | Stack derives via `MAXIFS`. |
| `notes` | Notes | Free text both sides. |
| **Missing from app — add as optional when next iterating Customers screen:** | | |
| `email` | Email | Optional; stack treats as optional. |
| `address` | Address | Most-recent delivery address; older addresses live on Orders. |
| `dietary` | Dietary | Free text (e.g., `"Strict eggless (Jain — no onion/garlic)"`). |
| `howFoundUs` | How they found us | Enum: Instagram / WhatsApp / Referral / Walk-in / Repeat. |
| `marketingConsent` | Marketing consent | **Y/N. Defaults to N. Required for any push-style outreach (DPDP Act 2023).** |
| `consentDate` | Consent date | Date of explicit YES. |
| **App-only — design enrichment, no cottage equivalent:** | | |
| `instagram` | — | Handle string for UI surfacing. |
| `area` | — | Maps loosely to Address but lossier (e.g., "Jubilee Hills"). |
| `tags` | — | UI labels (VIP, Eggless preferred, etc.). |
| `since` | — | UI-friendly relative date; derive from First order. |
| `preferredFlavors` | — | Could become an "Order history" inference in stack; currently app-only. |
| `avatarTone` | — | UI colour token for avatar. |

### `data/orders.json` → CRM `Orders` tab

| App field | Cottage-stack column | Notes |
|---|---|---|
| `id` | Order ID | App: short int; stack: `ORD-0001`. |
| `customerId` | Customer ID | Same FK both sides. |
| `flavor` | Flavour | Spelling difference (US vs UK English) — stack uses `Flavour`. |
| `size` / `tiers` / `servings` | Size / Qty | Stack compresses into one free-text column. App splits for UI. |
| `eggless` / `theme` / `addOns` | Customisation | Stack compresses; app split for filtering. |
| `price` | Quoted (₹) **and** Final (₹) | Stack tracks both (revisions); app shows one. |
| `deposit` | Deposit received (₹) | — |
| `balance` | Balance due (₹) | Stack also has separate `Balance received (₹)`. |
| `deliveryDate` | Delivery date | — |
| `status` | Production **+** Delivery | Stack splits into two enums (Queued/Prep/Bake/Decorate/Done × Pending/Out/Delivered/Issue). App combines for UI. |
| `createdAt` | Order date | — |
| `channel` | — | App-only field; in stack lives on `Inquiries.Channel`. |
| `notes` | Notes | — |
| **Missing from app — add when next iterating Orders screen:** | | |
| `upiReferenceUtr` | UPI reference (UTR) | **12-digit string from GPay/PhonePe.** Join key for Finance reconciliation. Without it, payment matching is manual. |
| `payerVpa` | Payer VPA | Fallback (e.g., `customer@oksbi`). |
| `coldChainNotes` | Cold-chain notes | Mar–Sep delivery essential; e.g., `"Insulated box + 4 ice packs"`. |
| `feedbackReceived` | Feedback received | Y/N — drives the T+2 review-request automation. |
| `rating` | Rating | 1–5. |
| `paymentMode` | Payment mode | Enum: UPI / Cash / Bank Transfer / Mixed. |
| **App-only — design enrichment:** | | |
| `title` | — | UI label ("Aanya's 6th — pastel unicorn"). |
| `deliverySlot` / `deliveryArea` | — | UI segmentation; stack rolls into Delivery mode + Cold-chain notes. |
| `referenceCount` | — | UI badge (number of reference images). |

### `data/inventory.json` → Operations `Ingredients` tab

| App field | Cottage-stack column | Notes |
|---|---|---|
| `id` | Ingredient ID | — |
| `name` | Ingredient name | — |
| `category` | Category | Stack enum: Flour / Sugar / Dairy / Fat / Egg / Flavour / Colour / Specialty / Packaging. |
| `qty` | Current stock | — |
| `unit` | Unit | g / kg / ml / L / each. |
| `reorderAt` | PAR (reorder when below) | Triggers `par_breach_alerter.gs` in stack. |
| `unitCost` | Avg cost per unit (₹) | — |
| `supplier` | Preferred vendor | Joins to Operations `Vendors` tab. |
| `lastRestock` | Last reorder date | — |
| **Missing from app — add when next iterating Inventory screen:** | | |
| `reorderQty` | Reorder qty | Default reorder amount (drives auto-PO drafting). |
| `daysCoverAtTypicalUse` | Days cover at typical use | Manual estimate. |
| `reorderDue` | Reorder due? | Derived: `qty < reorderAt`. App can derive client-side. |

### `data/recipes.json` → Operations `Recipes` tab — **structural mismatch**

App: one row per recipe with nested `ingredients` array. Stack: one row per ingredient line (BOM rows). Both are valid for their purpose. Field correspondences inside a single recipe:

| App field | Cottage-stack column | Notes |
|---|---|---|
| `id` | Recipe ID | — |
| `name` | (no direct column) | App treats name as the recipe; stack uses `Product` (e.g., "Cake (2kg)"). |
| `eggless` | — | App-only flag; stack notes in the `Notes` column when relevant. |
| `costPerCake` | (derived from sum of Line cost) | Stack computes via `SUM(Line cost)` per Product; app shows pre-computed. |
| `ingredients[]` | Each = one row in Recipes tab | Per item: `name → Ingredient`, `qty → Quantity`, `unit → Unit`. |
| `method` | — | App-only; production method/steps. Stack assumes operator memory + paper. |

**Recommendation:** keep the app's nested format for UI. When syncing to/from stack, a flatten/unflatten pass converts between the two.

### `data/finance.json` → Finance `Money Out` tab (expenses array) + `P&L (monthly)` (monthlySummary)

#### `expenses[]` → Finance `Money Out` tab

| App field | Cottage-stack column | Notes |
|---|---|---|
| `id` | Entry ID | Stack: `MOUT-0001` format. |
| `date` | Date | — |
| `vendor` | Payee name | — |
| `category` | Category | **App must use the stack's enum to align:** Ingredients / Packaging / Utilities / Rent / Equipment (capex) / Maintenance / Marketing / Delivery (Porter/Dunzo) / Founder Draw / Transfer (Account-to-Account) / Other. |
| `amount` | Amount (₹) | — |
| `method` | Channel | Stack enum: UPI-GPay / UPI-PhonePe / UPI-Other / Bank Transfer / Cash / NACH / Refund-Out. |
| `note` | Notes | — |
| `receipt` | — | App-only (file URL); stack puts receipt link in Notes column. |
| **Missing from app — add when next iterating expense entry:** | | |
| `upiReferenceUtr` | UPI reference (UTR) | — |
| `payeeVpa` | Payee VPA / Account | — |
| `linkedPoId` | Linked PO ID | Joins to Operations `Purchase Orders` (`PO-0001` style). |
| `accountDebited` | Account debited | Enum: Bank / UPI float / Cash drawer. Required to keep three-balance tracking sane. |

#### `monthlySummary[]` → derived from Finance `P&L (monthly)` tab

| App field | Stack source |
|---|---|
| `month` | Column header in P&L tab (e.g., `2026-05`) |
| `income` | "Total revenue" row |
| `expense` | "Total COGS" + "Total opex" rows |
| `profit` | "Operating profit" row |

App's monthlySummary is a UI-friendly aggregate; the stack's P&L has 26 line items for full visibility. A sync script should derive the four-field summary from the full P&L.

### `data/financing.json` — **new capability not in cottage stack**

| App concept | Cottage-stack equivalent |
|---|---|
| `products[]` (active loans with EMI tracking) | **No direct equivalent.** Stack assumes no formal loans today. If you add a Loans concept to the app, also flag it as a candidate "Phase 1f" addition to Finance — would need a Loans tab tracking principal, rate, remaining, monthly EMI, next due. |
| `offers[]` (pre-approved lender offers) | **No equivalent.** This is an Indian fintech feature (Razorpay/Ola Money/PayU push these). Currently app-only. |
| `cashflow[]` | Maps to Finance `Cash Runway` tab fields: `month → Month`, `inflow → Projected inflows (₹)`, `outflow → Projected outflows (₹)`. Stack also derives `Closing cash` and a `Runway flag` (BELOW BUFFER / Tight / OK) — surface these in the app's cashflow UI when next iterating. |

### `data/marketing.json` → Marketing module + a new "Campaigns" concept

| App concept | Cottage-stack equivalent |
|---|---|
| `campaigns[]` | **No direct 1:1.** Stack has `Content Calendar` (planned posts) — a campaign is a *cluster of posts* + an audience segment. Either keep the campaign abstraction in the app and explode to multiple Content Calendar rows during sync, OR add a "Campaigns" tab to the Marketing module later. Flag for the founder before deciding. |
| `templates[]` | Closest stack analog is `Hashtag Library` (tag sets by theme). Templates are richer (caption + image template); could become a separate "Templates" tab in Marketing later. |
| Per-campaign fields (`openRate`, `clickRate`, `revenue`, `orders`, `spend`) | Roughly maps to Marketing `Performance` tab: `Reach`, `Likes`, `Saves`, `DMs received`, `Inquiries triggered`. Stack does NOT track `revenue` or `spend` per post directly — those would need a new tab or column. |

---

## Apps Script business logic — mirror or skip?

Each `<module>_sheets/apps_script/*.gs` file implements a piece of business logic. Some belong in the app's UI; others are server-side concerns the app should treat as background machinery.

| Script | Lives in stack | Mirror in app UI? |
|---|---|---|
| `crm_sheets/apps_script/form_handler.gs` | Form submission → Inquiry row | NO — app has its own intake flow |
| `crm_sheets/apps_script/capacity_helpers.gs` | Capacity guardrail on order entry | YES — when user adds an order in app, warn if `Capacity Calendar` for that delivery date is at slot capacity |
| `crm_sheets/apps_script/birthday_reminder.gs` | Weekly digest of upcoming occasions | YES — surface as a "This week" panel or notification badge |
| `crm_sheets/apps_script/feedback_request.gs` | T+2 review-request queue | YES — surface as "Send reviews" action queue post-delivery |
| `crm_sheets/apps_script/festival_pre_block.gs` | Auto-block calendar 21 days before festivals | PARTIAL — app should respect blocked dates when offering delivery slots; doesn't need to do the blocking itself |
| `finance_sheets/apps_script/upi_reconciler.gs` | Daily cross-file UPI matching | NO — server-side concern. App displays the *result* (unmatched count) but not the matching logic. |
| `finance_sheets/apps_script/compliance_reminder.gs` | Weekly FSSAI/licence digest | YES — surface as a Compliance card on Finance/Settings screen with countdown to expiry |
| `operations_sheets/apps_script/bake_plan_generator.gs` | Nightly bake plan refresh | YES — the Bake Plan screen IS this logic, computed client-side from orders + recipes |
| `operations_sheets/apps_script/par_breach_alerter.gs` | Daily PAR breach detection + PO drafting | YES — Inventory screen surfaces breaches; "Draft PO" action mirrors the Apps Script behaviour |
| `dashboard_sheets/apps_script/morning_digest.gs` | Daily 7am email summarising the stack | YES — this *is* the app's home screen, more or less. App's home/dashboard view is the live equivalent. |

---

## How to keep this file current

When you (the coding agent) make a schema change to any `app/data/*.json` file:

1. Check the cottage-stack column for that field in the relevant tab.
2. Use the stack's naming (snake-case-ify the column header) for any new optional field.
3. If you introduce a field that has no cottage-stack equivalent, document it in this file under the **App-only** section for that JSON file.
4. If you introduce a concept the cottage stack should also adopt (e.g., a Loans concept, a Campaigns abstraction), flag it as a "candidate stack addition" and surface to the user — do NOT silently add a tab to the stack.

When the cottage stack's `build_xlsx.py` adds a new column, the next coding-agent session that touches the corresponding app data file should append the field as optional (default null/empty) and document the mapping here. Existing screens never break from optional field additions.

---

## What this bridge deliberately does NOT do

- **Does not modify any existing app data file.** This is reading-only-from-the-app side, additive-only-to-the-app side. Existing screens keep working unchanged.
- **Does not introduce a runtime dependency on Google Sheets.** The app stays a standalone HTML prototype.
- **Does not resolve the brand/city identity question.** That's for the founder.
- **Does not auto-sync.** A `scripts/sync_sample_data.py` may exist later for opt-in data refreshes; until then, the mapping table above is the contract.

---

## Pointer to the source of truth

When this file disagrees with `../brainstorming/`, **the brainstorming folder wins** for business semantics. This file is a translation layer, not an alternative spec.

_Last updated: 2026-05-24. Update the date whenever the field mapping table changes._

# Decision Log — Home Bakery

Track decisions chronologically. **Reversal cost** is a quick judgment:

- **Low** — no sunk cost, can change next conversation
- **Medium** — some equipment / time / vendor committed
- **High** — significant capex or contractual lock-in

---

## Decisions made

| Date | Stream | Decision | Rationale | Reversal cost | Status |
|---|---|---|---|---|---|
| _Example_ | 1 | Frying in kitchen on gas hob, not electric fryer | Apartment power constraint; no new circuits; gas hob has chimney | Low | Confirmed |
| _Example_ | 1 | Bedroom 2 (not Bedroom 1) for studio zone | Bedroom 1 not available | Low | Confirmed pending AC verification |
| _Example_ | 1 | Two-room split: Kitchen = production, Bedroom 2 = cold finishing + storage + packaging | No single room can host both heavy electrical and clean decoration work under apartment constraints | Medium | Confirmed |
| 2026-05-23 | All | Location: Hyderabad | Confirmed by founder | High | Confirmed |
| 2026-05-24 | 7 | CRM platform: Google Sheets (steady state, not transitional) | Two-person home bakery, cottage scale. Odoo CRM is overbuilt and adds a second login away from WhatsApp/Insta where orders land. Notion is weak for date-math + capacity rollups. Sheets is where Shreya already lives, integrates natively with Google Forms (intake) and Apps Script (outreach). Scale challenges (if they appear) are absorbed within Sheets via yearly archives, not migration. See `crm_strategy.md`. | Low | Confirmed |
| 2026-05-24 | 7 | Six-tab Sheets architecture: Inquiries, Customers, Orders, Occasions (data), Capacity Calendar, Occasions Calendar (derived) | Schema balances normalisation (Occasions as separate tab so one customer can hold N recurring dates) with operator simplicity (5 user-facing tabs + 1 supporting data tab). See `crm_strategy.md` §5. | Low | Confirmed |
| 2026-05-24 | 7 | DPDP Act 2023 consent gate enforced by formula, not memory | `consent_marketing` defaults to N. Occasions Calendar QUERY filters `consent_marketing = 'Y'`. Penalties under DPDP are disproportionate for cottage operators; cheapest insurance available. | Low | Confirmed |
| 2026-05-24 | 7 | Two-operator ownership: Sh owns Inquiries/Customers/Occasions; S owns Orders/Capacity | Single most common failure mode for 2-person sheet CRMs is "neither of us updated it" drift. Pre-assigned writer + reader prevents this. See `crm_strategy.md` §2. | Low | Confirmed |
| 2026-05-24 | 7 | No native WhatsApp send; click-to-chat URLs only | WA Business API requires Meta Cloud setup + verified templates. Overkill at cottage volumes. Click-to-chat captures 99% of value at 0% friction. | Low | Confirmed |
| 2026-05-24 | All | Unified cottage stack: 5 Google Sheets files (Dashboard + CRM + Operations + Finance + Marketing) linked by IMPORTRANGE and Apps Script. Sheets is the destination, not a stepping stone. | "Stripped Zoho One" feel at ₹0/month opex. UPI-first reconciliation. FSSAI compliance reminders. Festival cash cycle aware. Two-operator ownership at module granularity. See `specs/2026-05-24-cottage-stack-design.md`. | Low | Confirmed |
| 2026-05-24 | 2 | Finance Phase 1a anchored: Money In + Bank vs UPI Float + UPI Reconciliation, with daily cross-file `upi_reconciler.gs` job. CRM Orders schema extended with `UPI reference (UTR)` and `Payer VPA` columns as the reconciliation join keys. | Personal-VPA UPI payments are the dominant inflow channel for Indian cottage bakers; no auto-feed exists, so the reconciler closes that gap by matching UTRs between the two files daily. See `finance_strategy.md` and `specs/2026-05-24-cottage-stack-design.md`. | Low | Confirmed |
| 2026-05-24 | 2 | Finance Phase 1b anchored: Compliance tab (FSSAI / trade licence / GST) + `compliance_reminder.gs` weekly digest at 90/60/30/7-day expiry windows. | FSSAI cottage food licence lapse = ₹5L penalty risk; auto-reminder eliminates the risk of forgetting renewal. See `finance_strategy.md` §3.4. | Low | Confirmed |
| 2026-05-24 | 2 | Finance Phase 1c anchored: Money Out + Vendor Ledger tabs; Bank vs UPI Float Outflows formula now sums from Money Out. | Mirrors Money In schema; closes the two-sided ledger. Vendor Ledger gives running payables visibility without a separate accounting platform. See `finance_strategy.md` §3.5–§3.6. | Low | Confirmed |
| 2026-05-24 | 2 | Finance Phase 1d anchored: P&L (monthly) + Cash Runway tabs — both formula-derived from Money In + Money Out. | P&L: 26 line items × 12 months, SUMIFS by Category. Cash Runway: 12-month rolling forecast with runway flag (₹10K = BELOW BUFFER, ₹25K = Tight). See `finance_strategy.md` §3.7–§3.8. | Low | Confirmed |
| 2026-05-24 | 2 | Finance Phase 1e anchored: Capex Register + Founder Draws tabs. Finance module complete (10 tabs). | Capex with straight-line depreciation per asset; Founder Draws tracks distributions to Sh/Swetha/Joint. See `finance_strategy.md` §3.9–§3.10. | Low | Confirmed |
| 2026-05-24 | 1, 3 | Operations module anchored (Phase 2): `02_Operations.xlsx` with 6 tabs (Recipes, Ingredients, Bake Plan, Equipment Maintenance, Vendors, Purchase Orders) + 2 Apps Scripts (`bake_plan_generator.gs` nightly, `par_breach_alerter.gs` daily). | Bake Plan auto-rolls from CRM Orders for next 7 days; PAR breach alerter drafts POs to vendors when stock falls below threshold. See `operations_strategy.md`. | Low | Confirmed |
| 2026-05-24 | 5 | Marketing module anchored (Phase 3): `04_Marketing.xlsx` with 5 tabs (Content Calendar, Asset Library, Performance, Hashtag Library, Reviews Tracker). No Apps Scripts at this volume. | Manual planning suffices ≤5 posts/week. Meta Business Suite remains the scheduling/posting tool; Marketing.Content Calendar tracks status + MBS-scheduled URLs. See `marketing_strategy.md`. | Low | Confirmed |
| 2026-05-24 | 7 | Dashboard module anchored (Phase 4): `00_Dashboard.xlsx` is the integration layer + home screen. `morning_digest.gs` (daily 07:00 IST) emails both operators a one-glance summary across all 5 modules. `festival_pre_block.gs` (weekly Mon, lives in CRM) auto-blocks Capacity Calendar 21 days before Indian festivals. | Closes out the unified cottage stack. Total: 5 module files, 9 Apps Scripts, ₹0/month opex. See `dashboard_strategy.md` and `specs/2026-05-24-cottage-stack-design.md`. | Low | Confirmed |
| 2026-05-24 | 1 | Apartment layout documented from floor plan (2335 sft 3BHK). Kitchen → Bedroom 2 carry path = via dining + drawing, ~25–30 ft, two doorway transitions. Pooja room is NOT on the carry path. No dedicated foyer for couriers. | Floor plan reviewed; constraints recorded in `operating_envelope.md` Stream 1 → Layout. See [`../Photos/floor_plan_2335sft_3bhk.webp`](../Photos/floor_plan_2335sft_3bhk.webp). | Low | Confirmed |
|  |  |  |  |  |  |

---

## Parked / pending decisions

Items raised but not yet made. Move to the table above once decided.

| Item | Blocking what | Owner | Target date |
|---|---|---|---|
| Entity form (proprietorship / partnership / LLP / private limited) | Stream 2 financial model; FSSAI category | Founder |  |
| GST registration approach | Pricing inclusive vs exclusive; FSSAI category | Founder |  |
| Bedroom 2 AC point existence | Stream 1 layout finalization; equipment placement | Founder | Quick check |
| Product mix volume split | Equipment final sizing; Stream 4 pricing | Founder |  |
| Year 1 revenue target | Capex envelope sanity check | Founder |  |
| Capex envelope | Equipment shortlist | Founder |  |
| Google Business Profile setup (Hyderabad address, home-bakery category) | Stream 7 feedback-request automation (needs GOOGLE_REVIEW_URL); Stream 5 SEO | Shreya | Week 4–6 |
| Brand email addresses for Sh + S (recipients in `birthday_reminder.gs`, `feedback_request.gs`) | Stream 7 Apps Script CONFIG values | Founder | Week 4 |
| GPay/PhonePe primary phone (which operator's device holds the bakery's primary UPI VPA) | Stream 2 Phase 1a — determines which account is "UPI float" in Bank vs UPI Float | Founder | Week 1 of using Phase 1a |
| Bedroom 2 balcony prohibition — hard (society bye-law) or soft (preference)? | Stream 1 studio ventilation strategy; AC sizing; passive cross-vent feasibility | Founder | Quick check |
| Kitchen-to-dining door — does one exist or is the kitchen genuinely open-plan? | Stream 1 frying-aerosol containment; chimney CFM target | Founder | Quick check |

---

## Explicitly reversed decisions

Document when a prior decision was revisited and why. This preserves the reasoning trail.

| Original date | New date | Original decision | New decision | Reason |
|---|---|---|---|---|
| _Example_ | _Example_ | Use Bedroom 1 as dedicated bakery room | Use Kitchen + Bedroom 2 split | Apartment constraints surfaced: no balcony use, no new electrical circuits, no HVAC additions to B1 |
|  |  |  |  |  |

---

## Constraints that cannot be relaxed

These were tested in earlier discussion. Re-litigating them requires new information.

- No new electrical circuits anywhere
- No balcony use (frying or storage)
- No facility modifications in the apartment
- No power load enhancement available
- Family kitchen must remain shared
- Bedroom 1 is not available

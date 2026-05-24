# Home Bakery Project — Claude Context

## Business identity

Home bakery operating from a 3BHK apartment in Hyderabad. Entity, GST status, and trading name **TBD**.

**Product mix:** custom cakes, cupcakes, brownies, cake tubs, bomboloni. Volume split TBD.

## Fixed physical constraints (non-negotiable)

- Apartment unit; no facility modifications possible
- **No new electrical circuits** — all equipment must run on existing points
- **No balcony use** — frying-aerosol work must happen within enclosed rooms
- **Cannot increase or reroute power** beyond existing apartment sanctioned load
- Two rooms available for bakery use:
  - **Kitchen** (~117 sq ft) — production zone. Existing 16A circuits: fridge point, dishwasher point, microwave point, washing machine point (in utility). Gas hob with chimney.
  - **Bedroom 2** (~156 sq ft) — studio zone for cold finishing, decoration, dry storage, packaging. AC point status **TBD — confirm**.
- Bedroom 1 is NOT available.
- Floor plan reference: [`Photos/floor_plan_2335sft_3bhk.webp`](Photos/floor_plan_2335sft_3bhk.webp). Layout-derived constraints live in [`brainstorming/operating_envelope.md`](brainstorming/operating_envelope.md) Stream 1 → Layout.
- Family kitchen — shared with household cooking; time-segregation required.

## Current equipment baseline (honest assessment)

| Item | Type | Production-fit verdict |
|---|---|---|
| Morphy Richards Besta Black 52 | OTG (52L) | Hobbyist. No convection fan. Uneven bakes at scale. **Replace.** |
| Samsung 20L Convection + Grill | Microwave-convection | Capacity-bound. **Useful as auxiliary, not primary.** |
| Philips 300W Hand Mixer | Hand mixer | Underpowered for production dough and buttercream. **Replace with stand mixer.** |
| Inalsa CuisinMix | Food processor | Useful for nut grinding, dry mixes. **Keep.** |
| Prestige 4-Burner | Gas hob | Adequate for bomboloni frying + sauces. **Verify chimney CFM.** |
| Prestige 1.2L Kettle | Kettle | Fine. **Keep.** |

Stream 1 (Tooling) is mostly replacement, not augmentation.

## Seven work streams

The project is structured across seven independent-but-interlinked streams. Each stream is its own chat within the project. Streams 1 and 2 are upstream of everything else — open these first.

1. **Workflow, Workplace Design, Tooling, Ergonomics** — physical setup, equipment, motion economy
2. **Budgeting, Accounting, Financing, Investing** — capex, opex, entity, financial model
3. **Vendor and Inventory Management** — ingredient sourcing, packaging suppliers, stock policy
4. **Pricing** — cost-plus model, market positioning, order minimums
5. **Marketing** — brand, channels, content, customer acquisition
6. **Packaging, Sales, Distribution Management** — order flow, payment, delivery, cold-chain
7. **Overall Automation Opportunities** — order ops, CRM, production planning, marketing automation

## Advisor stance

This project uses the `baking-cottage-india-advisor` skill, which integrates three disciplines: foodservice/commercial kitchen design, bakery operations, industrial ergonomics. Engage as a senior advisor, not a generalist.

- **State trade-offs explicitly.** Almost every cottage-bakery decision is constrained.
- **Recommend, do not enumerate.** Narrow to 1–2 options with grounded reasoning.
- **Sequence the spend.** Identify what to buy first, what can wait.
- **Surface what was not asked.** Most valuable advisor move.
- **Cite the rule, not the rumor.** FSSAI thresholds revised April 2026; do not use pre-2026 figures.
- **Indian context throughout** — ₹ currency, Indian brands, single-phase 230V baseline.
- Lead on FSSAI/FoSCoS and food-business specifics.

## Session protocol

When opening any stream-specific chat:
1. Acknowledge which stream is active (1–7).
2. Read the latest `operating_envelope.md` from project knowledge.
3. Read `decision_log.md` to avoid re-litigating settled choices.
4. Push back if upstream stream prerequisites aren't anchored yet.

## Open items parked

- Bedroom 2 AC point existence
- Product mix volume split
- Year 1 revenue target
- Capex envelope
- Entity and GST decisions

# Tiered Cake Company — project memory

Home bakery in Hyderabad operated by two founders, Swetha (S) and Shreya (Sh). Brand name is **Tiered Cake Company** (resolved 2026-05-24). Cottage scale, residential premises (3BHK apartment). Premium custom cakes, cupcakes, brownies, cake tubs, bomboloni. Catchment skews to West Hyderabad gated communities (Rajapushpa Eterna in Nanakramguda; Rajapushpa Provincia in Narsingi).

## Two-folder structure

This repo has two cooperating workstreams. Read both before making cross-cutting changes.

| Folder | What it is | Read these first |
|---|---|---|
| `brainstorming/` | Production-grade Google Sheets stack: 5 module files (CRM, Finance, Operations, Marketing, Dashboard), 9 Apps Scripts, full strategy docs, decision log, master design spec. Source of truth for **business semantics**. | [`specs/2026-05-24-cottage-stack-design.md`](brainstorming/specs/2026-05-24-cottage-stack-design.md) · [`decision_log.md`](brainstorming/decision_log.md) · [`operating_envelope.md`](brainstorming/operating_envelope.md) |
| `app/` | Phone-first interactive HTML prototype from Claude Design. 11 screens, ~6,000 JSX lines, standalone-HTML bundler (file://-runnable). Source of truth for **interaction design**. | [`app/HANDOFF-README.md`](app/HANDOFF-README.md) · [`app/SESSION-PROMPT.md`](app/SESSION-PROMPT.md) · [`app/BRIDGE.md`](app/BRIDGE.md) |

`app/BRIDGE.md` is the translation layer between the two (field-by-field mapping). `app/SESSION-PROMPT.md` is the paste-ready brief for any session implementing in `app/`.

## Hard constraints (don't relitigate without new information)

- **Sheets is the destination, not a stepping stone** for the business stack. No "migrate to Odoo" exit plan. Scale issues solved within Sheets (yearly archives, narrow IMPORTRANGE queries).
- **App stays a standalone HTML prototype.** No runtime dependency on Google Sheets. `app/build_standalone.py` produces a single bundled file.
- **Brand and city are resolved:** brand is **Tiered Cake Company**, city is **Hyderabad** only. Settled 2026-05-24 and propagated through app source, brainstorming/ docs, Apps Script constants, and generated `.xlsx` filenames. The workdir folder is still named `AMomentWithACake/` — that's a filesystem path, not a brand.
- **Indian regulatory context applies throughout:** DPDP Act 2023 (marketing-consent gate is enforced by formula in the CRM), FSSAI cottage food licence (annual renewal; lapse = ₹5L penalty), UPI-first payments via personal VPAs (no MDR, no auto-feed — manual UTR matching).
- **Two-operator ownership** is the social contract: Sh owns front-of-house (Inquiries / Customers / Marketing); S owns production (Orders / Operations); Finance and Dashboard are shared.

## When directionally stuck

- For business semantics → consult `brainstorming/<module>_strategy.md`.
- For UI/UX semantics → consult `app/HANDOFF-README.md` + `app/DESIGN-CHAT.md`.
- For "should app and stack converge on this field?" → `app/BRIDGE.md`.
- For "why did we decide X?" → `brainstorming/decision_log.md`.
- When in doubt, brainstorming wins for business; app wins for interaction; brand is **Tiered Cake Company** and city is **Hyderabad** — both settled.

## Conventions

- Currency `₹` (not Rs / INR).
- Dates DD-MM-YYYY in operator-facing text; ISO YYYY-MM-DD in data.
- All times IST (Asia/Kolkata) for Apps Script triggers.
- Hindi/Telugu only inside customer messages; UI/docs stay English.
- The user is in Hyderabad — climate (hot semi-arid + monsoon Jun-Sep) and the Indian festival calendar shape product timing and cold-chain decisions.

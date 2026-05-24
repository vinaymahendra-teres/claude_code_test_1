# CRM Sheets — Install Guide

> Read [crm_strategy.md](../crm_strategy.md) first for the design rationale. This file is the **operator-facing install path**: get from zero to a working sheet in 20 minutes.

## What's in this folder

| File | What it does |
|---|---|
| `TieredCakeCompany_CRM.xlsx` | Starter spreadsheet. Import to Google Sheets. |
| `build_xlsx.py` | Regenerator. Re-run after any schema change. |
| `apps_script/form_handler.gs` | Form-submit hook (Inquiries tab) |
| `apps_script/capacity_helpers.gs` | On-edit guardrail + CRM menu + capacity reseeder |
| `apps_script/birthday_reminder.gs` | Weekly occasions digest email |
| `apps_script/feedback_request.gs` | Daily T+2 feedback-request queue email |

---

## Phase 0 — Import the spreadsheet (5 min)

1. Open [https://sheets.google.com](https://sheets.google.com) → blank spreadsheet.
2. `File` → `Import` → `Upload` → drop `TieredCakeCompany_CRM.xlsx`.
3. Import location: **Replace spreadsheet**.
4. Click `Import data`.
5. Rename the spreadsheet (top-left) to `Tiered Cake Company — CRM`.
6. Verify all 7 tabs landed: `README`, `Inquiries`, `Customers`, `Orders`, `Occasions`, `Capacity Calendar`, `Occasions Calendar`.
7. Open `Occasions Calendar` — cell A2 should resolve to a table (initially empty). If you see `#REF!`, see Troubleshooting below.
8. Delete the yellow-highlighted EXAMPLE rows once you've eyeballed them.

---

## Phase 1 — Manual discipline (Week 1, no scripts)

Three rules:

1. **Every WhatsApp / Instagram inquiry → Inquiries row within the day.** Owner: Shreya.
2. **Every Confirmed inquiry → Customers row, plus Occasions row(s) for known dates.**
3. **Every confirmed order → Orders row, with `Delivery date` and `Product` filled.** Owner: Swetha.

Don't install scripts yet. Build the habit. If the manual flow isn't sustained, scripts won't save it.

---

## Phase 2 — Google Form intake (Week 2)

1. In the spreadsheet: `Tools` → `Create a new form`.
2. Title: `Tiered Cake Company — Order Inquiry`.
3. Add fields in this exact order:

   | # | Question | Type | Required |
   |---|---|---|---|
   | 1 | Your name | Short answer | ✓ |
   | 2 | Mobile number | Short answer | ✓ |
   | 3 | What's the occasion? | Multiple choice — Birthday / Kid Birthday / Anniversary / Wedding / Corporate / Just Because / Other | ✓ |
   | 4 | Event date | Date | — |
   | 5 | What are you thinking of ordering? | Paragraph | ✓ |
   | 6 | Approximate budget? | Short answer | — |
   | 7 | How did you find us? | Multiple choice — Instagram / WhatsApp / Referral / Walk-in | — |
   | 8 | Anything else? | Paragraph | — |
   | 9 | I'm OK with Tiered Cake Company saving my contact and reminding me about future occasions. (You can opt out anytime — just reply STOP.) | Checkboxes — single option labeled "Yes, that's fine" | — |

4. `Responses` tab → `Link to Sheets` → choose existing spreadsheet → select `Inquiries` is NOT possible directly. Workaround:
   - Let Google create a new tab (e.g. `Form Responses 1`).
   - Move responses to `Inquiries` by writing a small `onFormSubmit` that copies rows. **Or** simpler: rename the auto-created `Form Responses 1` to `Inquiries` and re-paste the headers/formulas from the original (use the `build_xlsx.py` to regenerate a sample, copy headers/formulas across).
   - Easiest first-time: keep `Form Responses 1` as raw inbox, treat `Inquiries` as the curated tab, and Shreya promotes interesting rows manually for the first 30 days.

5. Place the form link in 3 spots:
   - WhatsApp Business `About` field
   - Instagram bio (or in your link-tree)
   - Auto-reply quick-message: _"Lovely! Drop your details here so nothing's lost in chat: <link>"_

---

## Phase 3 — Apps Script (Week 4)

For each `.gs` file in this folder:

1. In the spreadsheet: `Extensions` → `Apps Script`.
2. In the Apps Script editor, click the `+` next to `Files` → `Script`.
3. Name it the same as the file (without `.gs`).
4. Paste the contents.
5. **Edit the CONFIG section at the top** (recipient emails, brand name, Google review URL).
6. Save (Cmd-S).
7. Top toolbar → click `Run` once for each entry function to authorise scopes:
   - `form_handler.gs` → run `onInquiryFormSubmit` once (it'll error on a fake `e` — that's fine, the goal is the auth prompt)
   - `capacity_helpers.gs` → run `onOpen` once
   - `birthday_reminder.gs` → run `sendOccasionsDigest` once (sends a real email — make sure RECIPIENTS is correct first)
   - `feedback_request.gs` → run `queueFeedbackRequests` once
8. Triggers (clock icon, left sidebar) — add:

   | Function | Source | Type | When |
   |---|---|---|---|
   | `onInquiryFormSubmit` | From spreadsheet | On form submit | — |
   | `onOrderEdit` | From spreadsheet | On edit | — |
   | `onOpen` | From spreadsheet | On open | — |
   | `sendOccasionsDigest` | Time-driven | Week timer | Monday 9–10am |
   | `queueFeedbackRequests` | Time-driven | Day timer | 10–11am |

9. After installing `capacity_helpers.gs` + `onOpen` trigger, reload the spreadsheet — a `CRM` menu appears in the menu bar with manual triggers for the same functions.

---

## Phase 4 — Feedback loop (Week 8)

The `feedback_request.gs` trigger above starts running once installed. To make it actually drive Google reviews you need a working `GOOGLE_REVIEW_URL`:

1. Set up your Google Business Profile (Hyderabad address, home-bakery category).
2. Once verified, go to your business profile → `Get more reviews` → copy the short URL.
3. Paste that URL into `feedback_request.gs` → `GOOGLE_REVIEW_URL`.
4. Re-save the script.

This is the **single highest-ROI automation** for Hyderabad home-bakery SEO. Don't skip it.

---

## Regenerating the .xlsx

If you change the schema (add a column, change a validation list, etc.):

```bash
cd brainstorming/crm_sheets
python3 build_xlsx.py
```

Requires Python 3 + `openpyxl` (`pip install openpyxl`).

The generator is the **single source of truth** for headers, formulas, and validations. Don't edit the xlsx by hand and expect the regenerator to honour it.

---

## Troubleshooting

### `Occasions Calendar` cell A2 shows `#REF!` or `#NAME?`
- `#NAME?` in Excel is **expected** — `QUERY` and `ARRAYFORMULA` are Sheets-only. The formula resolves on import to Google Sheets.
- `#REF!` in Sheets means a referenced column moved. Check that `Occasions` still has columns C, D, E, F, G, H, I in order.

### Capacity Calendar dates look wrong
- The generator seeds 60 days starting from the day you ran `build_xlsx.py`. If you imported weeks later, run `CRM → Reseed capacity calendar (60 days)` from the menu (installed by `capacity_helpers.gs`).

### Form-submit hook didn't fire
- Check `Triggers` in Apps Script — `onInquiryFormSubmit` must be `On form submit` from the spreadsheet, not from the form.
- Check the consent column header — `form_handler.gs` matches on the fragment `"OK with A Moment"`. If you reworded that form question, update `CONSENT_HEADER_FRAGMENT` in the script.

### Weekly digest sent an empty list
- Either there genuinely are no occasions in the next 14 days, **or** all matching customers have `Marketing consent = N`. The QUERY in `Occasions Calendar` filters consent — verify on the Customers tab.

### Capacity warning toast shows for orders that look fine
- `Cake slots (used)` is a COUNTIFS over `Orders.Product = "Cake"`. If a row has `Product = "Mixed"` or is blank, it won't count. Decide whether mixed orders should consume cake or cupcake slots and standardise.

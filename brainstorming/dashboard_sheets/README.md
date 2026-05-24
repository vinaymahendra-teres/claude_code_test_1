# Dashboard — Install Guide

**Tiered Cake Company | Phase 4a**

---

## What's in this folder

| File / folder | Purpose |
|---|---|
| `build_xlsx.py` | Python script that generates `TieredCakeCompany_Dashboard.xlsx` |
| `TieredCakeCompany_Dashboard.xlsx` | Generated output — import this to Google Sheets |
| `apps_script/` | Apps Script files (Phase 4b — not yet written) |
| `README.md` | This file |

---

## Phase 0 — Generate and import

**Generate (local):**
```bash
cd brainstorming/dashboard_sheets
python3 build_xlsx.py
```

**Import to Google Sheets:**
1. Go to [Google Drive](https://drive.google.com).
2. New → File upload → select `TieredCakeCompany_Dashboard.xlsx`.
3. Right-click the uploaded file → "Open with Google Sheets".
4. Rename the file to `00_Dashboard` (consistent naming convention with other modules).
5. Confirm you see two tabs: `README` and `Dashboard`.

---

## Phase 1 — CRITICAL: Replace placeholder IDs and URLs

**Without this step, every panel in the Dashboard shows `#REF!`. Do not skip.**

### 1a — Find each source sheet's file ID

For each of your four module Google Sheets, open it in the browser. The URL looks like:
```
https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit#gid=0
                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                       This is the file ID
```

Copy the file ID (the long alphanumeric string between `/d/` and `/edit`).

| Sheet | Placeholder to replace | Where to find it |
|---|---|---|
| CRM (01_CRM) | `CRM_SPREADSHEET_ID_PLACEHOLDER` | Open CRM sheet, copy ID from URL |
| Operations (03_Operations) | `OPS_SPREADSHEET_ID_PLACEHOLDER` | Open Operations sheet, copy ID from URL |
| Finance (02_Finance) | `FIN_SPREADSHEET_ID_PLACEHOLDER` | Open Finance sheet, copy ID from URL |
| Marketing (04_Marketing) | `MKT_SPREADSHEET_ID_PLACEHOLDER` | Open Marketing sheet, copy ID from URL |

### 1b — Replace IDs in the Dashboard

In your `00_Dashboard` Google Sheet:
1. Open the `Dashboard` tab.
2. Press `Ctrl+H` (or `Cmd+H` on Mac) to open Find & Replace.
3. Check "Search using regular expressions" OFF. Check "Match case" OFF. Check "Also search within formulas" ON.
4. For each row in the table above: Find the placeholder → Replace with the real ID → click "Replace all".
5. Repeat for all 4 placeholders.

### 1c — Find each tab's GID (for Open-link hyperlinks)

Each panel header contains an "Open [Module] →" hyperlink. These link to specific tabs within source sheets. The `gid=` value in the URL is tab-specific.

To find a tab's GID: open the source sheet → click the tab → look at the browser address bar:
```
https://docs.google.com/spreadsheets/d/<FILE_ID>/edit#gid=123456789
                                                            ^^^^^^^^^
                                                            Tab GID
```

| Hyperlink placeholder | Replace with | Tab to find GID in |
|---|---|---|
| `ORDERS_TAB_GID` | GID of Orders tab | CRM sheet |
| `MI_TAB_GID` | GID of Money In tab | Finance sheet |
| `RECON_TAB_GID` | GID of UPI Reconciliation tab | Finance sheet |
| `BANK_TAB_GID` | GID of Bank vs UPI Float tab | Finance sheet |
| `COMP_TAB_GID` | GID of Compliance Tracker tab | Finance sheet |
| `BAKE_TAB_GID` | GID of Bake Schedule tab | Operations sheet |
| `ING_TAB_GID` | GID of Ingredients tab | Operations sheet |
| `CC_TAB_GID` | GID of Content Calendar tab | Marketing sheet |
| `REV_TAB_GID` | GID of Reviews Tracker tab | Marketing sheet |
| `CUS_TAB_GID` | GID of Customers tab | CRM sheet |
| `CAP_TAB_GID` | GID of Capacity Calendar tab | CRM sheet |

Use Find & Replace (`Ctrl+H`) in the Dashboard tab, "Also search within formulas" ON, to replace each `_TAB_GID` placeholder.

Also replace `CRM_ID`, `FIN_ID`, `OPS_ID`, `MKT_ID` that appear inside the URL strings (these are separate from the IMPORTRANGE IDs in step 1b — the hyperlink formula strings contain them independently).

---

## Phase 2 — Authorise IMPORTRANGE (4 pairs)

After replacing IDs, panels will still show `#REF!` until you authorise the cross-file connections.

**For each of the 4 source sheets:**
1. Find the first cell in the Dashboard that shows `#REF!` for that source (e.g., Panel 1 row 6 for CRM, Panel 2 row 17 for Finance).
2. Click the cell.
3. A pop-up appears: "You need to connect these sheets. Allow access?"
4. Click **Allow access**.
5. Wait 10–30 seconds for the data to load.

Repeat for CRM, Finance, Operations, and Marketing (4 separate authorisations). You only need to authorise once per source-sheet pair — all IMPORTRANGE formulas pointing to that same source sheet will resolve automatically after the first authorisation.

**Tip:** If the pop-up doesn't appear, try opening the formula bar and pressing Enter on the IMPORTRANGE cell directly.

---

## Phase 3 — Install Apps Scripts (Phase 4b — next step)

The following Apps Script files will be written in Phase 4b and placed in `apps_script/`:

| Script | Installed on | Trigger | Purpose |
|---|---|---|---|
| `morning_digest.gs` | Dashboard sheet | Daily, 7 AM | Sends a short email digest with cash position, today's orders, and action queue counts |
| `festival_pre_block.gs` | CRM sheet | Weekly, Sunday night | Auto-blocks capacity in CRM Capacity Calendar 21 days before each upcoming festival |

To install an Apps Script:
1. Open the target Google Sheet.
2. Extensions → Apps Script.
3. Paste the script source.
4. Save and run once to authorise Gmail/Sheets permissions.
5. Set up a time-driven trigger (clock icon → Add Trigger).

---

## Phase 4 — Daily use

**Morning routine (2 minutes):**
1. Open the bookmarked `00_Dashboard` URL.
2. Scan Panel 6 (Action queue) — if any count > 0, that's today's first task.
3. Check Panel 1 (orders this week) — confirm today's deliveries are on track.
4. Check Panel 2 (cash position) — ensure UPI unmatched is 0.
5. Glance at Panel 7 (festival) — note how many days until the next peak.

**Alternatively (Phase 4b):** Read the morning digest email on your phone. The email summarises the same 5 action items + cash total. Open the Dashboard only if action is needed.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| All panels show `#REF!` | Placeholder IDs not replaced | Re-run Phase 1 (Find & Replace) |
| One panel shows `#REF!`, others work | That source file not yet authorised | Re-run Phase 2 for that source |
| Panel 7 rows 64–66 show `#VALUE!` | Array formula not activated | Select cell → Ctrl+Shift+Enter |
| IMPORTRANGE data is stale | Normal refresh lag (1–5 min) | Wait, then Ctrl+Shift+F5 to force refresh |
| "Open → " links don't work | Tab GID placeholders not replaced | Re-run Phase 1c |
| Panel 6 counts look wrong | Column mapping differs from expected | Verify column order in source tab; adjust QUERY Col# accordingly |

---

*Generated by `build_xlsx.py` — Phase 4a | Tiered Cake Company, Hyderabad*

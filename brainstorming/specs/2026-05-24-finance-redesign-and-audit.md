# Finance redesign + cross-mode audit

_2026-05-24 · for Tiered Cake Company app_

## What this is

A combined review pass — fix factual errors, replace the misplaced **Financing** module with proper **Financial Reports**, and clean up small inconsistencies that have crept in across modes.

## The big change: Financing → Reports

A bookkeeping app for a home baker has no business pushing credit products (working-capital loans, festival-season loans, equipment EMI ads). It's a category mismatch — that's what payment apps do, and it's the kind of "feature" that quietly puts a small business owner into debt.

What the baker actually needs from this module is the three core financial statements:

1. **Profit & Loss by product category** — which categories (Signature / Eggless / Seasonal / Classic) earn, which lose money once you net out ingredient COGS
2. **Balance Sheet** — what the business owns vs. owes on this date
3. **Cash Flow Statement** — where cash came from and went, separated by operating / investing / financing activities

Replace the existing Financing screen entirely. Keep the cashflow bar chart visual — re-home it inside the Cash Flow tab where it belongs.

## Audit — factual errors and small inconsistencies

Found while reviewing each mode:

| # | Where | Issue | Fix |
|---|------|-------|-----|
| 1 | `Accounting.jsx` TaxView | "Generate Form 26AS" — Form 26AS is the Annual Tax Statement of TDS credits the *taxpayer receives*. It's not something a baker generates or files. | Replace with "GSTR-3B (May 2026)" — the actual monthly GST return form. |
| 2 | `Accounting.jsx` TaxView | "due Jul 15" — that's the US quarterly date. Indian advance-tax dates are 15 Jun / 15 Sep / 15 Dec / 15 Mar. | Change to "due 15 Jun" (next advance-tax instalment is 15% by 15 June for Q1 FY26). |
| 3 | `finance.json` | Vendor "Bescom" for electricity. Bescom is **Bangalore** Electricity Supply. Bakery is in Hyderabad. | Change to "TSSPDCL" (Telangana State Southern Power Distribution). |
| 4 | `Home.jsx` line 91 | "1 cakes" — always pluralised | Pluralise correctly: `1 cake`, `2 cakes`. |
| 5 | `Home.jsx` line 104 | "Mon–Sat · 9 active orders" — the bakery delivers on Sundays (today, 24 May, has a Sunday delivery). | Drop the day-range claim — just "9 active orders" suffices. |
| 6 | `NewOrder.jsx` line 240 | `{c.orderCount} orders` — singular bug for first-time customers. | Pluralise: `1 order` / `n orders`. |
| 7 | `Accounting.jsx` TaxView | "Reports" subsection (P&L / Cash flow / Expense summary list) — now overlaps with the new Reports screen. | Remove that subsection from TaxView. Reports lives at More → Reports. |
| 8 | `Accounting.jsx` Overview | "Where money went" category list is hardcoded — diverges from the actual transaction categories ('Software' and 'Fees' transactions exist but aren't shown; 'Packaging' is omitted). | Compute from `finance.expenses` so the categories shown match the data. |

## What each mode's main screens should emphasise

A second sweep to ensure each mode's "primary" screens feel cohesive:

### Planning & setup
- **Home (dashboard)**: hero + quick actions + Stock running low + Tomorrow ✓
- **Recipes**: good as-is
- **Inventory**: good as-is
- **Tools**: good as-is

### Marketing & CRM
- **Home**: hero + quick actions + Inbox + Mango campaign + Tomorrow ✓
- **Customers**: good
- **Marketing**: good

### Operations
- **Home**: hero + quick actions + Today's kitchen + Tomorrow + Inbox + Stock ✓
- **Bakes**: good
- **Kitchen (timers)**: good

### Finance & accounting (rewritten)
- **Home**: hero + quick actions + Tomorrow ✓
- **Books (Accounting)**: P&L overview / Transactions / Tax — keep, but fix accuracy issues #1–2 and #7–8 above
- **Reports** (NEW): P&L by product category / Balance Sheet / Cash Flow
- **Mode quick action** "Cashflow" → "Reports" (clearer)

## The new Reports screen — structure

Three tabs. Each tab is a printable, accountant-readable view, not a fancy dashboard. The serif heading + plain rows convention matches how Indian CAs present statements.

### Tab 1 — P&L by product category
- Header: "Profit & Loss · YTD FY26"
- For each recipe category (Signature, Classic, Eggless, Seasonal):
  - Revenue, COGS (ingredient cost × units sold), Gross margin, Margin %
- Total gross margin
- Operating expenses block (Rent, Marketing, Utilities, Delivery, Packaging, Fees, Software)
- Net profit before tax
- Note explaining the assumption (units sold = orders with that flavor's category)

### Tab 2 — Balance Sheet
- Header: "Balance Sheet · as of 24 May 2026"
- **Assets**
  - Current: Cash on hand, Bank balance, Accounts receivable (sum of pending balances from active orders), Inventory at cost (sum of inventory.json qty × unit cost)
  - Fixed: Equipment (mixer, oven, chiller) at depreciated value
  - Total assets
- **Liabilities & equity**
  - Current: GST payable (output GST collected but not yet remitted), Vendor payables
  - Equity: Owner's capital + Retained earnings
  - Total liabilities + equity
- Net worth line

### Tab 3 — Cash Flow Statement
- Header: "Cash flow · last 6 months"
- Bar chart (reuse the existing one — inflow / outflow per month)
- **Operating activities**: customer receipts, payments to vendors, utilities, rent
- **Investing activities**: equipment, software
- **Financing activities**: owner withdrawals (left as ₹0 placeholder)
- Net change in cash + closing cash

## What this iteration ships

- ✅ New `src/screens/Reports.jsx` with three tabs
- ✅ Delete `src/screens/Financing.jsx`
- ✅ `modes.jsx`: replace `financing` with `reports` in Finance mode nav + morePrimary + home action3
- ✅ `main.jsx`: replace routing case + remove Financing component reference
- ✅ MoreMenu: replace Financing item with Reports
- ✅ Apply all 8 audit fixes
- ✅ Update `index.html` and `build_standalone.py` script lists

## What this iteration intentionally doesn't ship

- A working **GST return generator** (would need GSTR-3B JSON export — out of scope; the button is a placeholder).
- Real **depreciation schedules** for fixed assets (using a single placeholder figure).
- Tying **Reports** numbers back to live order data through complex joins — the P&L uses a representative category × revenue mapping; in production this should be live joined.

// Financial Reports — P&L by category, Balance Sheet, Cash Flow.
// Replaces the old Financing module. Numbers are computed from the seeded data
// where possible; a few line items (cash on hand, owner's capital, depreciation)
// are static seed figures the baker would maintain manually.

function Reports({ navigate, toast }) {
  const [view, setView] = React.useState('pl');

  return (
    <Screen>
      <div data-screen-label="Reports">
        <ScreenHeader
          title="Reports"
          subtitle="P&L · Balance Sheet · Cash Flow"
          onBack={() => navigate('home')}
          right={<IconButton onClick={() => toast && toast('Export coming soon')}><Icon.Share size={19} /></IconButton>}
        />
        <div style={{ padding: '0 18px 8px', borderBottom: '1px solid var(--line-soft)' }}>
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { value: 'pl', label: 'P & L' },
              { value: 'bs', label: 'Balance' },
              { value: 'cf', label: 'Cash flow' },
            ]}
          />
        </div>

        <ScreenBody padding="14px 18px 100px">
          {view === 'pl' && <ProfitLossByCategory />}
          {view === 'bs' && <BalanceSheet />}
          {view === 'cf' && <CashFlowStatement />}
        </ScreenBody>
      </div>
    </Screen>
  );
}

// ---------- Shared row helpers ----------

function StmtRow({ label, value, bold, indent, divider }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '8px 0',
      borderBottom: divider ? '1px solid var(--line-soft)' : 'none',
      paddingLeft: indent ? 14 : 0,
    }}>
      <span style={{ fontSize: bold ? 13.5 : 13, fontWeight: bold ? 700 : 400, color: bold ? 'var(--ink)' : 'var(--ink-soft)' }}>
        {label}
      </span>
      <span style={{
        fontSize: bold ? 14 : 13,
        fontWeight: bold ? 700 : 500,
        fontFamily: 'JetBrains Mono, monospace',
        color: typeof value === 'number' && value < 0 ? 'var(--danger)' : 'var(--ink)',
      }}>
        {typeof value === 'number' ? window.fmtMoney(value) : value}
      </span>
    </div>
  );
}

function StmtSectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      color: 'var(--caramel-deep)',
      marginTop: 14, marginBottom: 2,
    }}>{children}</div>
  );
}

// ---------- Tab 1: P&L by product category ----------

function ProfitLossByCategory() {
  const { orders, recipes, finance } = window.__data;

  // Build category → { revenue, units, cogs }
  const recipeByFlavor = (flavor) => {
    if (!flavor) return null;
    const key = flavor.toLowerCase();
    return recipes.find(r => key.includes(r.name.toLowerCase())) || null;
  };

  const cats = {};
  orders.forEach(o => {
    if (o.status === 'draft' || !o.price) return;
    const r = recipeByFlavor(o.flavor);
    const cat = r ? r.category : 'Other';
    const cogs = r ? r.costPerCake : Math.round((o.price || 0) * 0.18);
    if (!cats[cat]) cats[cat] = { units: 0, revenue: 0, cogs: 0 };
    cats[cat].units += 1;
    cats[cat].revenue += o.price;
    cats[cat].cogs += cogs;
  });

  const rows = Object.entries(cats)
    .map(([cat, v]) => ({ cat, ...v, gross: v.revenue - v.cogs, marginPct: v.revenue ? ((v.revenue - v.cogs) / v.revenue) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalCogs = rows.reduce((s, r) => s + r.cogs, 0);
  const totalGross = totalRevenue - totalCogs;

  // Operating expenses by category (from finance.expenses, excluding ingredients which is already in COGS)
  const opex = {};
  finance.expenses.forEach(e => {
    if (e.category === 'Ingredients') return; // already in COGS
    opex[e.category] = (opex[e.category] || 0) + e.amount;
  });
  const opexRows = Object.entries(opex).sort((a, b) => b[1] - a[1]);
  const totalOpex = opexRows.reduce((s, [, v]) => s + v, 0);

  const netProfit = totalGross - totalOpex;

  return (
    <div>
      <Card padding={0} style={{
        background: 'linear-gradient(135deg, oklch(0.30 0.08 50), oklch(0.22 0.04 50))',
        color: 'oklch(0.96 0.02 70)', border: 'none',
      }}>
        <div style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 11.5, opacity: 0.6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Profit & Loss · YTD FY26
          </div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 34, marginTop: 4, lineHeight: 1 }}>
            {window.fmtMoney(netProfit)}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            net profit before tax · 1 Apr – 24 May 2026
          </div>
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14 }}>
        <StmtSectionLabel>Revenue by product category</StmtSectionLabel>
        {rows.map((r, i) => (
          <div key={r.cat}>
            <StmtRow
              label={`${r.cat} (${r.units} order${r.units === 1 ? '' : 's'})`}
              value={r.revenue}
              divider={false}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', paddingLeft: 14, marginTop: -4, marginBottom: 6 }}>
              <span>less ingredient COGS</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>−{window.fmtMoney(r.cogs)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, paddingLeft: 14, paddingBottom: 8, borderBottom: i < rows.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Gross margin</span>
              <span style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                {window.fmtMoney(r.gross)} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· {r.marginPct.toFixed(0)}%</span>
              </span>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '2px solid var(--ink)' }}>
          <StmtRow label="Total gross margin" value={totalGross} bold divider={false} />
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14 }}>
        <StmtSectionLabel>Operating expenses</StmtSectionLabel>
        {opexRows.map(([cat, amt], i) => (
          <StmtRow key={cat} label={cat} value={-amt} divider={i < opexRows.length - 1} />
        ))}
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '2px solid var(--ink)' }}>
          <StmtRow label="Total operating expenses" value={-totalOpex} bold divider={false} />
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14, background: netProfit >= 0 ? 'var(--sage-soft)' : 'var(--rose-soft)', border: '1px solid ' + (netProfit >= 0 ? 'var(--sage)' : 'var(--rose)') }}>
        <StmtRow label="Net profit before tax" value={netProfit} bold divider={false} />
      </Card>

      <div style={{ fontSize: 11, color: 'var(--muted)', padding: '14px 4px 0', lineHeight: 1.5 }}>
        COGS based on each recipe's ingredient cost per cake. Operating expenses pulled from logged transactions. Tax not yet computed.
      </div>
    </div>
  );
}

// ---------- Tab 2: Balance Sheet ----------

function BalanceSheet() {
  const { orders, inventory } = window.__data;

  // Receivables: sum of balances on non-delivered, non-draft orders
  const receivables = orders
    .filter(o => o.status !== 'delivered' && o.status !== 'draft')
    .reduce((s, o) => s + (o.balance || 0), 0);

  // Inventory value (qty × unitCost)
  const inventoryValue = inventory.reduce((s, i) => s + (i.qty * i.unitCost), 0);

  // Seed figures the baker would maintain
  const cashOnHand = 8400;
  const bankBalance = 134800;
  const equipmentNet = 285000; // mixer + oven + chiller, net of depreciation
  const gstPayable = 4280; // output GST collected this month, not yet remitted
  const vendorPayables = 6240; // open vendor bills
  const ownerCapital = 200000; // seed investment

  const totalCurrentAssets = cashOnHand + bankBalance + receivables + inventoryValue;
  const totalAssets = totalCurrentAssets + equipmentNet;

  const totalLiabilities = gstPayable + vendorPayables;
  const retainedEarnings = totalAssets - totalLiabilities - ownerCapital;
  const totalEquity = ownerCapital + retainedEarnings;
  const totalLiabAndEquity = totalLiabilities + totalEquity;

  return (
    <div>
      <Card padding={0} style={{
        background: 'linear-gradient(135deg, oklch(0.30 0.08 50), oklch(0.22 0.04 50))',
        color: 'oklch(0.96 0.02 70)', border: 'none',
      }}>
        <div style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 11.5, opacity: 0.6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Balance Sheet · as of 24 May 2026
          </div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 34, marginTop: 4, lineHeight: 1 }}>
            {window.fmtMoney(totalEquity)}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            net worth · book value
          </div>
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14 }}>
        <StmtSectionLabel>Assets</StmtSectionLabel>
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 6, marginBottom: 2 }}>
          Current
        </div>
        <StmtRow label="Cash on hand" value={cashOnHand} indent divider />
        <StmtRow label="Bank balance" value={bankBalance} indent divider />
        <StmtRow label="Accounts receivable" value={receivables} indent divider />
        <StmtRow label="Inventory at cost" value={Math.round(inventoryValue)} indent divider />
        <StmtRow label="Total current assets" value={Math.round(totalCurrentAssets)} bold divider={false} />

        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 14, marginBottom: 2 }}>
          Fixed
        </div>
        <StmtRow label="Equipment (net of depreciation)" value={equipmentNet} indent divider={false} />

        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '2px solid var(--ink)' }}>
          <StmtRow label="Total assets" value={Math.round(totalAssets)} bold divider={false} />
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14 }}>
        <StmtSectionLabel>Liabilities & equity</StmtSectionLabel>
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 6, marginBottom: 2 }}>
          Liabilities
        </div>
        <StmtRow label="GST payable (output)" value={gstPayable} indent divider />
        <StmtRow label="Vendor payables" value={vendorPayables} indent divider={false} />

        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 14, marginBottom: 2 }}>
          Equity
        </div>
        <StmtRow label="Owner's capital" value={ownerCapital} indent divider />
        <StmtRow label="Retained earnings" value={Math.round(retainedEarnings)} indent divider={false} />

        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '2px solid var(--ink)' }}>
          <StmtRow label="Total liabilities & equity" value={Math.round(totalLiabAndEquity)} bold divider={false} />
        </div>
      </Card>

      <div style={{ fontSize: 11, color: 'var(--muted)', padding: '14px 4px 0', lineHeight: 1.5 }}>
        Receivables and inventory are live. Cash, bank, equipment value, and owner's capital are maintained manually under Settings.
      </div>
    </div>
  );
}

// ---------- Cash Runway badge (BELOW BUFFER / Tight / OK) ----------

function RunwayBadge({ cash }) {
  let label, bg, fg, border;
  if (cash < 10000) {
    label = 'Below buffer';
    bg = 'oklch(0.94 0.05 28)'; fg = 'var(--danger)'; border = 'var(--danger)';
  } else if (cash < 25000) {
    label = 'Tight';
    bg = 'oklch(0.95 0.07 80)'; fg = 'oklch(0.42 0.12 70)'; border = 'oklch(0.82 0.12 80)';
  } else {
    label = 'OK';
    bg = 'var(--sage-soft)'; fg = 'oklch(0.34 0.07 145)'; border = 'var(--sage)';
  }
  return (
    <div style={{
      marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line-soft)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    }}>
      <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Runway flag
      </span>
      <span style={{
        background: bg, color: fg, border: '1px solid ' + border,
        padding: '4px 10px', borderRadius: 999,
        fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );
}

// ---------- Tab 3: Cash Flow Statement ----------

function CashFlowStatement() {
  const { finance } = window.__data;

  // Last 6 months — use monthlySummary in chronological order (oldest → newest)
  const monthly = finance.monthlySummary.slice().reverse();
  const ytdInflow = monthly.filter(m => m.month >= '2026-04').reduce((s, m) => s + m.income, 0);
  const ytdOutflow = monthly.filter(m => m.month >= '2026-04').reduce((s, m) => s + m.expense, 0);

  // Decompose operating / investing / financing — simple heuristic from the data
  // Operating: most expense categories (ingredients, rent, marketing, packaging, utilities, delivery, fees)
  // Investing: software/equipment (Canva, equipment)
  // Financing: 0 (no loan repayments since we removed financing)
  const investingCategories = new Set(['Software']);
  let opOut = 0, invOut = 0;
  finance.expenses
    .filter(e => e.date >= '2026-04-01')
    .forEach(e => {
      if (investingCategories.has(e.category)) invOut += e.amount;
      else opOut += e.amount;
    });
  const opIn = ytdInflow;
  const netOp = opIn - opOut;
  const netInv = -invOut;
  const netFin = 0;
  const netChange = netOp + netInv + netFin;
  const openingCash = 137125; // cash + bank at start of FY26
  const closingCash = openingCash + netChange;

  return (
    <div>
      <Card padding={0} style={{
        background: 'linear-gradient(135deg, oklch(0.30 0.08 50), oklch(0.22 0.04 50))',
        color: 'oklch(0.96 0.02 70)', border: 'none',
      }}>
        <div style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 11.5, opacity: 0.6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Net change in cash · YTD FY26
          </div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 34, marginTop: 4, lineHeight: 1 }}>
            {netChange >= 0 ? '+' : ''}{window.fmtMoney(netChange)}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            1 Apr – 24 May 2026
          </div>
        </div>
        <div style={{ height: 90, padding: '0 18px 14px' }}>
          <Bars
            data={monthly.map(m => ({ in: m.income, out: m.expense }))}
            height={70}
            color="oklch(0.85 0.10 60)"
            secondary="oklch(0.65 0.10 25)"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, opacity: 0.6 }}>
            {monthly.map(m => <span key={m.month}>{m.month.slice(5)}</span>)}
          </div>
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14 }}>
        <StmtSectionLabel>Operating activities</StmtSectionLabel>
        <StmtRow label="Cash from customers" value={opIn} divider />
        <StmtRow label="Cash to vendors & operations" value={-opOut} divider={false} />
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '2px solid var(--ink)' }}>
          <StmtRow label="Net cash from operations" value={netOp} bold divider={false} />
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14 }}>
        <StmtSectionLabel>Investing activities</StmtSectionLabel>
        <StmtRow label="Software & subscriptions" value={-invOut} divider={false} />
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '2px solid var(--ink)' }}>
          <StmtRow label="Net cash from investing" value={netInv} bold divider={false} />
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14 }}>
        <StmtSectionLabel>Financing activities</StmtSectionLabel>
        <StmtRow label="Owner's draws / contributions" value={netFin} divider={false} />
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '2px solid var(--ink)' }}>
          <StmtRow label="Net cash from financing" value={netFin} bold divider={false} />
        </div>
      </Card>

      <Card padding={14} style={{ marginTop: 14, background: 'var(--caramel-soft)', border: '1px solid var(--caramel)' }}>
        <StmtRow label="Opening cash · 1 Apr 2026" value={openingCash} divider />
        <StmtRow label="Net change in cash" value={netChange} divider />
        <StmtRow label="Closing cash · 24 May 2026" value={closingCash} bold divider={false} />
        <RunwayBadge cash={closingCash} />
      </Card>

      <div style={{ fontSize: 11, color: 'var(--muted)', padding: '14px 4px 0', lineHeight: 1.5 }}>
        Operating / investing split applied to logged transactions. Opening cash is a manually-set baseline. Runway thresholds: under ₹10K = below buffer, under ₹25K = tight, otherwise OK.
      </div>
    </div>
  );
}

window.Reports = Reports;

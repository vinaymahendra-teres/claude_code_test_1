// Accounting — P&L overview, transactions, add expense flow.

function Accounting({ navigate, toast, addExpenseOnMount }) {
  const data = window.__data;
  const [view, setView] = React.useState('overview');
  const [addingExpense, setAddingExpense] = React.useState(!!addExpenseOnMount);

  return (
    <Screen>
      <div data-screen-label="Accounting">
        <ScreenHeader
          title="Books"
          subtitle="May 2026"
          onBack={() => navigate('home')}
          right={<IconButton onClick={() => setAddingExpense(true)} style={{ background: 'var(--caramel)', color: 'var(--surface)', width: 34, height: 34 }}><Icon.Plus size={20} /></IconButton>}
        />

        <div style={{ padding: '0 18px 8px', borderBottom: '1px solid var(--line-soft)' }}>
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { value: 'overview', label: 'Overview' },
              { value: 'transactions', label: 'Transactions' },
              { value: 'tax', label: 'Tax' },
            ]}
          />
        </div>

        <ScreenBody padding="12px 18px 100px">
          {view === 'overview' && <Overview />}
          {view === 'transactions' && <Transactions />}
          {view === 'tax' && <TaxView navigate={navigate} />}
        </ScreenBody>

        <Sheet open={addingExpense} onClose={() => setAddingExpense(false)} title="Log an expense" snap="full">
          <AddExpenseForm onClose={() => { setAddingExpense(false); toast('Expense recorded'); }} />
        </Sheet>
      </div>
    </Screen>
  );
}

function Overview() {
  const data = window.__data;
  const fin = data.finance;
  const month = fin.monthlySummary[0];

  return (
    <div>
      {/* P&L */}
      <Card padding={0} style={{
        background: 'linear-gradient(135deg, oklch(0.30 0.08 50), oklch(0.22 0.04 50))',
        color: 'oklch(0.96 0.02 70)', border: 'none',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 11.5, opacity: 0.6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Net profit · May (partial)
          </div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 36, marginTop: 4 }}>
            {window.fmtMoney(month.profit)}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
            {window.fmtMoney(month.income)} in · {window.fmtMoney(month.expense)} out
          </div>
        </div>
        <div style={{
          height: 70, padding: '0 18px 14px',
        }}>
          <Sparkline
            data={fin.monthlySummary.slice().reverse().map(m => m.profit)}
            width={350} height={50}
            color="oklch(0.95 0.05 70)"
          />
        </div>
      </Card>

      {/* Income/expense split */}
      <SectionHeader>This month</SectionHeader>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Card padding={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ok)' }} />
            Income
          </div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, marginTop: 4 }}>
            {window.fmtCompactMoney(month.income)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            from 8 orders
          </div>
        </Card>
        <Card padding={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--rose)' }} />
            Expense
          </div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, marginTop: 4 }}>
            {window.fmtCompactMoney(month.expense)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            22 transactions
          </div>
        </Card>
      </div>

      {/* Trend */}
      <SectionHeader>6-month trend</SectionHeader>
      <Card padding={14}>
        <Bars
          data={fin.monthlySummary.slice().reverse().map(m => ({ in: m.income, out: m.expense }))}
          height={80}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, color: 'var(--muted)' }}>
          {fin.monthlySummary.slice().reverse().map(m => (
            <span key={m.month}>{m.month.slice(5)}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 11.5 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--caramel)' }} /> Income
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--rose)', opacity: 0.7 }} /> Expense
          </span>
        </div>
      </Card>

      {/* Category breakdown — computed from logged expenses (this month) */}
      <SectionHeader>Where money went</SectionHeader>
      <Card padding={14}>
        {(() => {
          const byCat = {};
          data.finance.expenses
            .filter(e => e.date.startsWith('2026-05'))
            .forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
          const rows = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
          const total = rows.reduce((s, [, v]) => s + v, 0) || 1;
          const palette = ['var(--caramel)', 'var(--rose)', 'var(--sage)', 'var(--plum)', 'var(--caramel-deep)', 'oklch(0.55 0.05 60)', 'var(--muted)', 'oklch(0.45 0.05 200)'];
          return rows.map(([cat, amt], i) => {
            const pct = (amt / total) * 100;
            return (
              <div key={cat} style={{ marginBottom: i === rows.length - 1 ? 0 : 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{cat}</span>
                  <span style={{ fontWeight: 600 }}>{window.fmtMoney(amt)}</span>
                </div>
                <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: pct + '%', height: '100%', background: palette[i % palette.length], opacity: 0.85 }} />
                </div>
              </div>
            );
          });
        })()}
      </Card>
    </div>
  );
}

function Transactions() {
  const data = window.__data;
  const [filter, setFilter] = React.useState('all');
  let txns = data.finance.expenses;
  if (filter !== 'all') txns = txns.filter(t => t.category === filter);

  const groups = {};
  txns.forEach(t => (groups[t.date] = groups[t.date] || []).push(t));

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', margin: '4px -18px 10px', padding: '0 18px 4px', scrollbarWidth: 'none' }}>
        {['all', 'Ingredients', 'Rent', 'Marketing', 'Utilities', 'Packaging', 'Delivery'].map(f => (
          <span
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              fontSize: 12, fontWeight: 600,
              border: '1px solid ' + (filter === f ? 'var(--caramel)' : 'var(--line)'),
              background: filter === f ? 'var(--caramel-soft)' : 'var(--surface)',
              color: filter === f ? 'var(--caramel-deep)' : 'var(--ink-soft)',
              borderRadius: 999, cursor: 'pointer',
            }}
          >
            {f === 'all' ? 'All' : f}
          </span>
        ))}
      </div>

      {Object.entries(groups).map(([date, items]) => (
        <div key={date} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6, padding: '0 4px' }}>
            {window.fmtRelative(date)} · {window.fmtDate(date)}
          </div>
          <Card padding={0}>
            {items.map((t, i) => (
              <ListRow
                key={t.id}
                divider={i < items.length - 1}
                padding="11px 14px"
                left={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CategoryIcon cat={t.category} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.vendor}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                        {t.category} · {t.note}
                      </div>
                    </div>
                  </div>
                }
                right={
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--danger)' }}>−{window.fmtMoney(t.amount)}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>{t.method}</div>
                  </div>
                }
              />
            ))}
          </Card>
        </div>
      ))}
    </div>
  );
}

function CategoryIcon({ cat }) {
  const map = {
    'Ingredients': { icon: <Icon.Cake size={15} />, tone: 'caramel' },
    'Rent': { icon: <Icon.Home size={15} />, tone: 'rose' },
    'Marketing': { icon: <Icon.Megaphone size={15} />, tone: 'sage' },
    'Utilities': { icon: <Icon.Sparkle size={15} />, tone: 'caramel' },
    'Packaging': { icon: <Icon.Box size={15} />, tone: 'rose' },
    'Delivery': { icon: <Icon.Truck size={15} />, tone: 'sage' },
    'Fees': { icon: <Icon.Wallet size={15} />, tone: 'caramel' },
    'Software': { icon: <Icon.Grid size={15} />, tone: 'caramel' },
  };
  const c = map[cat] || { icon: <Icon.Receipt size={15} />, tone: 'caramel' };
  const tones = {
    caramel: { bg: 'var(--caramel-soft)', fg: 'var(--caramel-deep)' },
    rose: { bg: 'var(--rose-soft)', fg: 'oklch(0.38 0.10 25)' },
    sage: { bg: 'var(--sage-soft)', fg: 'oklch(0.34 0.07 145)' },
  };
  const t = tones[c.tone];
  return (
    <span style={{
      width: 34, height: 34, borderRadius: 10,
      background: t.bg, color: t.fg,
      display: 'grid', placeItems: 'center', flexShrink: 0,
    }}>{c.icon}</span>
  );
}

function TaxView({ navigate }) {
  return (
    <div>
      <Card padding={0} style={{
        background: 'linear-gradient(135deg, var(--caramel-soft), var(--rose-soft))',
      }}>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Advance tax · Q1 FY26</div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 30, marginTop: 4 }}>{window.fmtMoney(38420)}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>estimated · 15% instalment due 15 Jun 2026</div>
          <Button variant="primary" size="sm" style={{ marginTop: 12 }} icon={<Icon.Doc size={14} />}>
            Download GSTR-3B (May)
          </Button>
        </div>
      </Card>

      <SectionHeader>B2B / GST invoices</SectionHeader>
      <Card padding={0}>
        <ListRow divider left={<div><div style={{ fontSize: 13.5, fontWeight: 600 }}>Vikram Iyer · Office launch</div><div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>GST invoice ready · ₹18,500</div></div>} right={<Button size="sm" variant="secondary">PDF</Button>} />
        <ListRow divider={false} left={<div><div style={{ fontSize: 13.5, fontWeight: 600 }}>Karthik Rao · Product launch</div><div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>Mar 19 · ₹51,000</div></div>} right={<Button size="sm" variant="secondary">PDF</Button>} />
      </Card>

      <SectionHeader>Compliance schedule</SectionHeader>
      <ComplianceCard navigate={navigate} limit={10} />

      <SectionHeader action={<span onClick={() => navigate('reports')} style={{ color: 'var(--caramel-deep)', cursor: 'pointer', fontWeight: 600 }}>Open →</span>}>
        Financial statements
      </SectionHeader>
      <Card style={{ background: 'var(--surface-2)', border: '1px dashed var(--line)' }} padding={14}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
          P&L, Balance Sheet and Cash Flow have moved to the dedicated <b>Reports</b> screen.
        </div>
      </Card>
    </div>
  );
}

// ---------- Add Expense Sheet ----------

function AddExpenseForm({ onClose }) {
  const [form, setForm] = React.useState({
    amount: '',
    vendor: '',
    category: '',
    note: '',
    method: 'UPI',
    date: '2026-05-24',
    receipt: false,
    accountDebited: 'UPI float',
    upiReferenceUtr: '',
    payeeVpa: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [errors, setErrors] = React.useState({});

  const categories = [
    { v: 'Ingredients', icon: <Icon.Cake size={16} /> },
    { v: 'Packaging', icon: <Icon.Box size={16} /> },
    { v: 'Marketing', icon: <Icon.Megaphone size={16} /> },
    { v: 'Delivery', icon: <Icon.Truck size={16} /> },
    { v: 'Rent', icon: <Icon.Home size={16} /> },
    { v: 'Utilities', icon: <Icon.Sparkle size={16} /> },
    { v: 'Fees', icon: <Icon.Wallet size={16} /> },
    { v: 'Other', icon: <Icon.More size={16} /> },
  ];

  const submit = () => {
    const e = {};
    if (!form.amount || +form.amount <= 0) e.amount = 'Enter an amount';
    if (!form.vendor) e.vendor = 'Who got paid?';
    if (!form.category) e.category = 'Pick a category';
    setErrors(e);
    if (Object.keys(e).length === 0) onClose();
  };

  return (
    <div style={{ padding: '4px 0 24px' }}>
      <Field label="Amount" error={errors.amount}>
        <TextInput
          value={form.amount}
          onChange={e => set('amount', e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder="0"
          prefix="₹"
          error={!!errors.amount}
          autoFocus
          style={{ fontSize: 22, padding: '14px 12px 14px 30px', fontWeight: 600, fontFamily: 'DM Serif Display, serif' }}
        />
      </Field>

      <Field label="Vendor" error={errors.vendor}>
        <TextInput value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="DMart, Foodhall, Porter…" error={!!errors.vendor} />
      </Field>

      <Field label="Category" error={errors.category}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {categories.map(c => {
            const sel = form.category === c.v;
            return (
              <div
                key={c.v}
                onClick={() => set('category', c.v)}
                style={{
                  padding: '10px 4px',
                  border: '1.5px solid ' + (sel ? 'var(--caramel)' : 'var(--line)'),
                  background: sel ? 'var(--caramel-soft)' : 'var(--surface)',
                  color: sel ? 'var(--caramel-deep)' : 'var(--ink-soft)',
                  borderRadius: 'var(--r)',
                  textAlign: 'center', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}
              >
                {c.icon}
                <span style={{ fontSize: 10.5, fontWeight: 600 }}>{c.v}</span>
              </div>
            );
          })}
        </div>
      </Field>

      <Field label="Note" optional>
        <TextInput value={form.note} onChange={e => set('note', e.target.value)} placeholder="What was it for?" />
      </Field>

      <Field label="Payment method">
        <SegmentedControl
          value={form.method}
          onChange={v => {
            set('method', v);
            // Sync default account based on method
            if (v === 'UPI') set('accountDebited', 'UPI float');
            else if (v === 'Cash') set('accountDebited', 'Cash drawer');
            else set('accountDebited', 'Bank');
          }}
          options={['UPI', 'Card', 'Cash', 'Bank']}
        />
      </Field>

      <Field label="Account debited">
        <SegmentedControl
          value={form.accountDebited}
          onChange={v => set('accountDebited', v)}
          options={['Bank', 'UPI float', 'Cash drawer']}
        />
      </Field>

      {form.method === 'UPI' && (
        <>
          <Field label="UPI reference (UTR)" optional>
            <TextInput
              value={form.upiReferenceUtr}
              onChange={e => set('upiReferenceUtr', e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
              placeholder="12-digit number from GPay/PhonePe"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            />
          </Field>
          <Field label="Payee VPA" optional>
            <TextInput
              value={form.payeeVpa}
              onChange={e => set('payeeVpa', e.target.value)}
              placeholder="vendor@okhdfc"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            />
          </Field>
        </>
      )}

      <div style={{ marginTop: 4 }}>
        <Toggle checked={form.receipt} onChange={v => set('receipt', v)} label="Receipt attached" />
      </div>

      <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
        <Button variant="secondary" size="lg" full onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="lg" full onClick={submit} icon={<Icon.Check size={16} />}>Save expense</Button>
      </div>
    </div>
  );
}

window.Accounting = Accounting;

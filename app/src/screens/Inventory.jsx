// Inventory — stock levels with reorder alerts.

function Inventory({ navigate, openSheet, toast }) {
  const data = window.__data;
  const [tab, setTab] = React.useState('all');
  const [draftPoOpen, setDraftPoOpen] = React.useState(false);

  let list = data.inventory;
  if (tab === 'low') list = list.filter(i => i.qty < i.reorderAt);
  else if (tab === 'premium') list = list.filter(i => i.category === 'Premium');

  const byCategory = {};
  list.forEach(i => (byCategory[i.category] = byCategory[i.category] || []).push(i));

  const totalValue = data.inventory.reduce((s, i) => s + (i.qty * i.unitCost), 0);
  const lowItems = data.inventory.filter(i => i.qty < i.reorderAt);
  const lowCount = lowItems.length;

  return (
    <Screen>
      <div data-screen-label="Inventory">
        <ScreenHeader
          title="Inventory"
          subtitle={`${data.inventory.length} items · ${window.fmtCompactMoney(totalValue)} value`}
          onBack={() => navigate('home')}
          right={<IconButton style={{ background: 'var(--caramel)', color: 'var(--surface)', width: 34, height: 34 }}><Icon.Plus size={20} /></IconButton>}
        />

        <div style={{ padding: '0 18px 8px', borderBottom: '1px solid var(--line-soft)' }}>
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: 'all', label: 'All' },
              { value: 'low', label: `Low (${lowCount})` },
              { value: 'premium', label: 'Premium' },
            ]}
          />
        </div>

        <ScreenBody padding="12px 18px 100px">
          {lowCount > 0 && (
            <Card style={{ marginBottom: 14, background: 'oklch(0.95 0.07 80)', border: '1px solid oklch(0.85 0.10 80)' }} padding={12}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Icon.Bell size={18} style={{ color: 'oklch(0.42 0.12 70)', flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'oklch(0.32 0.12 70)' }}>{lowCount} {lowCount === 1 ? 'item' : 'items'} below reorder</div>
                  <div style={{ fontSize: 12, color: 'oklch(0.38 0.10 70)', marginTop: 2 }}>Group POs by vendor to send in one go.</div>
                </div>
                <Button size="sm" variant="primary" onClick={() => setDraftPoOpen(true)}>Draft POs</Button>
              </div>
            </Card>
          )}

          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 18 }}>
              <SectionHeader>{cat}</SectionHeader>
              <Card padding={0}>
                {items.map((item, i) => {
                  const low = item.qty < item.reorderAt;
                  const pct = Math.min(100, (item.qty / (item.reorderAt * 2.5)) * 100);
                  return (
                    <ListRow
                      key={item.id}
                      divider={i < items.length - 1}
                      padding="11px 14px"
                      onClick={() => openSheet('restock', item)}
                      left={
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: low ? 'var(--danger)' : 'var(--ink)' }}>
                              {item.qty}{item.unit}
                            </div>
                          </div>
                          <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{
                              width: pct + '%',
                              height: '100%',
                              background: low ? 'var(--danger)' : pct < 40 ? 'var(--warn)' : 'var(--ok)',
                              transition: 'width .3s',
                            }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
                            <span>reorder at {item.reorderAt}{item.unit}</span>
                            <span>{item.supplier}</span>
                          </div>
                        </div>
                      }
                    />
                  );
                })}
              </Card>
            </div>
          ))}
        </ScreenBody>

        <Sheet open={draftPoOpen} onClose={() => setDraftPoOpen(false)} title="Draft purchase orders" snap="full">
          <DraftPoForm
            lowItems={lowItems}
            onSend={() => { setDraftPoOpen(false); toast && toast('POs queued for WhatsApp'); }}
          />
        </Sheet>
      </div>
    </Screen>
  );
}

function DraftPoForm({ lowItems, onSend }) {
  // Group low items by supplier
  const bySupplier = {};
  lowItems.forEach(item => {
    (bySupplier[item.supplier] = bySupplier[item.supplier] || []).push(item);
  });
  const suppliers = Object.entries(bySupplier);
  if (suppliers.length === 0) {
    return (
      <div style={{ padding: '32px 12px 24px', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--sage-soft)', color: 'oklch(0.34 0.07 145)',
          display: 'inline-grid', placeItems: 'center',
          marginBottom: 12,
        }}>
          <Icon.Check size={28} />
        </div>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: 'var(--ink)' }}>Stock is healthy</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Nothing to reorder right now.</div>
      </div>
    );
  }
  const grandTotal = lowItems.reduce((s, i) => s + (i.reorderQty * i.unitCost), 0);
  return (
    <div style={{ paddingBottom: 24 }}>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 4px 14px', lineHeight: 1.5 }}>
        One PO drafted per vendor. Quantities are PAR-restoring (current stock plus reorder buffer).
      </p>
      {suppliers.map(([supplier, items]) => {
        const subtotal = items.reduce((s, i) => s + (i.reorderQty * i.unitCost), 0);
        return (
          <Card key={supplier} padding={0} style={{ marginBottom: 12 }}>
            <div style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--line-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{supplier}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                  {items.length} {items.length === 1 ? 'item' : 'items'} · {window.fmtMoney(subtotal)}
                </div>
              </div>
              <Button size="sm" variant="secondary" icon={<Icon.Whatsapp size={14} />}>Send</Button>
            </div>
            {items.map((it, i) => (
              <div key={it.id} style={{
                padding: '8px 14px',
                borderBottom: i < items.length - 1 ? '1px solid var(--line-soft)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{it.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>
                    {it.qty}{it.unit} on hand · order {it.reorderQty}{it.unit}
                  </div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: 'var(--ink-soft)' }}>
                  {window.fmtMoney(it.reorderQty * it.unitCost)}
                </div>
              </div>
            ))}
          </Card>
        );
      })}
      <Card padding={14} style={{ marginTop: 6, background: 'var(--caramel-soft)', border: '1px solid var(--caramel)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Grand total</span>
          <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: 'var(--caramel-deep)' }}>
            {window.fmtMoney(grandTotal)}
          </span>
        </div>
      </Card>
      <Button variant="primary" size="lg" full icon={<Icon.Whatsapp size={16} />} onClick={onSend} style={{ marginTop: 16 }}>
        Send all {suppliers.length} {suppliers.length === 1 ? 'PO' : 'POs'} via WhatsApp
      </Button>
    </div>
  );
}

window.Inventory = Inventory;

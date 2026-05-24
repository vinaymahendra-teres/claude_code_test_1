// Customers list + Customer Detail screens.

function Customers({ navigate, openSheet }) {
  const data = window.__data;
  const [search, setSearch] = React.useState('');
  const [sort, setSort] = React.useState('recent'); // recent, ltv, alpha

  let list = data.customers.filter(c => {
    if (!search) return true;
    return c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.instagram.toLowerCase().includes(search.toLowerCase()) ||
      c.area.toLowerCase().includes(search.toLowerCase());
  });

  if (sort === 'ltv') list = [...list].sort((a, b) => b.lifetimeValue - a.lifetimeValue);
  else if (sort === 'alpha') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  else list = [...list].sort((a, b) => b.lastOrder.localeCompare(a.lastOrder));

  // Group by tag if sorting recent
  return (
    <Screen>
      <div data-screen-label="Customers">
        <ScreenHeader
          title="Customers"
          subtitle={`${data.customers.length} contacts · ${data.customers.filter(c => c.tags.includes('VIP')).length} VIP`}
          right={
            <>
              <IconButton onClick={() => openSheet('customer-filters')}><Icon.Filter size={19} /></IconButton>
              <IconButton onClick={() => navigate('new-order')} style={{ background: 'var(--caramel)', color: 'var(--surface)', width: 34, height: 34 }}>
                <Icon.Plus size={20} />
              </IconButton>
            </>
          }
        />

        <div style={{ padding: '0 18px 8px', background: 'var(--bg)', borderBottom: '1px solid var(--line-soft)' }}>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Icon.Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, area, @handle"
              style={{
                width: '100%', fontFamily: 'inherit', fontSize: 14,
                padding: '9px 12px 9px 36px',
                borderRadius: 'var(--r)',
                border: '1px solid var(--line)',
                background: 'var(--surface-2)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <SegmentedControl
            value={sort}
            onChange={setSort}
            options={[
              { value: 'recent', label: 'Recent' },
              { value: 'ltv', label: 'Top spenders' },
              { value: 'alpha', label: 'A–Z' },
            ]}
          />
        </div>

        <ScreenBody padding="12px 18px 100px">
          {/* Quick stats strip */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <StatTile label="New this month" value="2" tone="caramel" />
            <StatTile label="Repeat rate" value="68%" tone="sage" />
            <StatTile label="Avg LTV" value="₹38k" tone="rose" />
          </div>

          <Card padding={0}>
            {list.map((c, i) => (
              <ListRow
                key={c.id}
                divider={i < list.length - 1}
                onClick={() => navigate('customer-detail', { id: c.id })}
                padding="12px 14px"
                left={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name={c.name} tone={c.avatarTone} size={42} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {c.name}
                        {c.tags.includes('VIP') && <Pill tone="caramel" size="xs">VIP</Pill>}
                        {c.tags.includes('Eggless') && <Pill tone="sage" size="xs">Eggless</Pill>}
                        {c.tags.includes('New') && <Pill tone="rose" size="xs">New</Pill>}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span>{c.area}</span>
                        <span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--line)' }} />
                        <span>{c.orderCount} {c.orderCount === 1 ? 'order' : 'orders'}</span>
                        <span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--line)' }} />
                        <span>{window.fmtCompactMoney(c.lifetimeValue)}</span>
                      </div>
                    </div>
                  </div>
                }
                right={<Icon.Chevron size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />}
              />
            ))}
          </Card>
        </ScreenBody>
      </div>
    </Screen>
  );
}

function StatTile({ label, value, tone }) {
  const tones = {
    caramel: 'var(--caramel-soft)',
    sage: 'var(--sage-soft)',
    rose: 'var(--rose-soft)',
  };
  return (
    <div style={{
      flex: 1,
      background: tones[tone],
      borderRadius: 'var(--r)',
      padding: '10px 12px',
    }}>
      <div style={{ fontSize: 10.5, color: 'var(--ink-soft)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ---------- Customer Detail ----------

function CustomerDetail({ navigate, id, toast, openSheet }) {
  const c = window.getCustomer(id);
  if (!c) return <Screen><div style={{ padding: 20 }}>Customer not found</div></Screen>;
  const orders = window.getCustomerOrders(id);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: `Orders (${orders.length})` },
    { id: 'thread', label: 'Thread' },
  ];
  const [tab, setTab] = React.useState('overview');

  return (
    <Screen>
      <div data-screen-label="Customer Detail">
        <ScreenHeader
          title=" "
          onBack={() => navigate('back')}
          right={<><IconButton onClick={() => toast('Editing customer')}><Icon.Edit size={19} /></IconButton><IconButton onClick={() => openSheet('customer-more', c)}><Icon.More size={20} /></IconButton></>}
        />
        <ScreenBody padding="0 0 100px">
          {/* Profile header */}
          <div style={{ padding: '0 22px 20px', textAlign: 'center' }}>
            <Avatar name={c.name} tone={c.avatarTone} size={84} style={{ margin: '0 auto 12px', fontSize: 28 }} />
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, margin: 0 }}>{c.name}</h2>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{c.area} · since {window.fmtDate(c.since, { showYear: true })}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
              {c.tags.map(t => (
                <Pill key={t} tone={t === 'VIP' ? 'caramel' : t === 'Eggless' ? 'sage' : t === 'New' ? 'rose' : 'neutral'}>
                  {t}
                </Pill>
              ))}
            </div>
          </div>

          {/* Quick contact actions */}
          <div style={{ padding: '0 18px' }}>
            <Card padding={0}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {[
                  { icon: <Icon.Phone size={18} />, label: 'Call' },
                  { icon: <Icon.Whatsapp size={18} />, label: 'WhatsApp' },
                  { icon: <Icon.Instagram size={18} />, label: 'DM' },
                  { icon: <Icon.Cake size={18} />, label: 'New order' },
                ].map((a, i) => (
                  <button
                    key={a.label}
                    onClick={() => {
                      if (a.label === 'New order') navigate('new-order');
                      else toast(`Opening ${a.label}…`);
                    }}
                    style={{
                      padding: '12px 0', background: 'transparent',
                      border: 'none', borderRight: i < 3 ? '1px solid var(--line-soft)' : 'none',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      fontFamily: 'inherit',
                    }}>
                    <span style={{ color: 'var(--caramel-deep)' }}>{a.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div style={{ position: 'sticky', top: 0, background: 'var(--bg)', padding: '14px 18px 8px', zIndex: 1 }}>
            <SegmentedControl value={tab} onChange={setTab} options={tabs.map(t => ({ value: t.id, label: t.label }))} />
          </div>

          <div style={{ padding: '4px 18px' }}>
            {tab === 'overview' && <CustomerOverview c={c} orders={orders} navigate={navigate} toast={toast} />}
            {tab === 'orders' && <CustomerOrders c={c} orders={orders} navigate={navigate} />}
            {tab === 'thread' && <CustomerThread c={c} toast={toast} />}
          </div>
        </ScreenBody>
      </div>
    </Screen>
  );
}

function CustomerOverview({ c, orders, navigate, toast }) {
  const inProgress = orders.filter(o => o.status === 'in-production' || o.status === 'confirmed' || o.status === 'ready');
  const [consent, setConsent] = React.useState({ status: c.marketingConsent || 'N', date: c.consentDate || null });
  const flipConsent = () => {
    if (consent.status === 'Y') {
      setConsent({ status: 'N', date: null });
      toast && toast('Marketing consent revoked');
    } else {
      const today = '2026-05-24';
      setConsent({ status: 'Y', date: today });
      toast && toast('Marketing consent recorded');
    }
  };
  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
        <Card padding={12}>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Orders</div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, marginTop: 4 }}>{c.orderCount}</div>
        </Card>
        <Card padding={12}>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Spent</div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, marginTop: 4 }}>{window.fmtCompactMoney(c.lifetimeValue)}</div>
        </Card>
        <Card padding={12}>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Last</div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, marginTop: 4 }}>{window.fmtDate(c.lastOrder)}</div>
        </Card>
      </div>

      {/* Active order */}
      {inProgress.length > 0 && (
        <>
          <SectionHeader>Active order</SectionHeader>
          <Card padding={0}>
            {inProgress.slice(0, 1).map(o => (
              <ListRow
                key={o.id}
                divider={false}
                onClick={() => navigate('order-detail', { id: o.id })}
                left={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CakeArt tone={c.avatarTone} size={48} label={o.flavor.split(' ')[0]} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{o.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                        {window.fmtRelative(o.deliveryDate)} · {o.deliverySlot}
                      </div>
                      <div style={{ marginTop: 6 }}><StatusPill status={o.status} /></div>
                    </div>
                  </div>
                }
                right={<Icon.Chevron size={16} style={{ color: 'var(--muted)' }} />}
              />
            ))}
          </Card>
        </>
      )}

      <SectionHeader>Profile</SectionHeader>
      <Card padding={0}>
        <ProfileRow label="Phone" value={c.phone} icon={<Icon.Phone size={15} />} />
        <ProfileRow label="Instagram" value={c.instagram} icon={<Icon.Instagram size={15} />} />
        <ProfileRow label="Area" value={c.area} icon={<Icon.Pin size={15} />} />
        <ProfileRow
          label="Loves"
          value={c.preferredFlavors.join(', ')}
          icon={<Icon.Heart size={15} />}
          last
        />
      </Card>

      <SectionHeader>Notes</SectionHeader>
      <Card>
        <div style={{ fontSize: 13.5, lineHeight: 1.55, fontStyle: 'italic', color: 'var(--ink-soft)' }}>
          "{c.notes}"
        </div>
      </Card>

      {/* DPDP Act 2023 — marketing consent gate */}
      <SectionHeader>Compliance</SectionHeader>
      <Card padding={14}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Marketing consent
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{
                width: 8, height: 8, borderRadius: 999,
                background: consent.status === 'Y' ? 'var(--ok)' : 'var(--line)',
              }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {consent.status === 'Y' ? 'Granted' : 'Not granted'}
              </span>
              {consent.date && (
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  · since {window.fmtDate(consent.date, { showYear: true })}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.4 }}>
              DPDP Act 2023 — explicit consent required for campaigns, broadcasts, birthday auto-reminders.
            </div>
          </div>
          <Button
            variant={consent.status === 'Y' ? 'secondary' : 'primary'}
            size="sm"
            onClick={flipConsent}
          >
            {consent.status === 'Y' ? 'Revoke' : 'Request'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ProfileRow({ label, value, icon, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 14px',
      borderBottom: last ? 'none' : '1px solid var(--line-soft)',
    }}>
      <span style={{ color: 'var(--muted)' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 13.5, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  );
}

function CustomerOrders({ c, orders, navigate }) {
  if (orders.length === 0) return <Card><div style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>No orders yet</div></Card>;
  return (
    <Card padding={0} style={{ marginTop: 4 }}>
      {orders.map((o, i) => (
        <ListRow
          key={o.id}
          divider={i < orders.length - 1}
          onClick={() => navigate('order-detail', { id: o.id })}
          padding="11px 14px"
          left={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CakeArt tone={c.avatarTone} size={44} label={o.flavor.split(' ')[0]} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{o.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>
                  {window.fmtDate(o.deliveryDate, { showYear: true })} · {window.fmtMoney(o.price)}
                </div>
                <div style={{ marginTop: 5 }}><StatusPill status={o.status} dot={false} /></div>
              </div>
            </div>
          }
        />
      ))}
    </Card>
  );
}

function CustomerThread({ c, toast }) {
  const messages = [
    { who: 'them', when: 'Mon 11:24', text: 'Hi! Aanya here. We have our anniversary on May 26 and would love your pastel floral 6"' },
    { who: 'me', when: 'Mon 11:42', text: 'Ooh that\'s lovely! Eggless again like last time?' },
    { who: 'them', when: 'Mon 11:43', text: 'Yes please! Pistachio rose is our favorite. Can we add 12 matching cupcakes?' },
    { who: 'me', when: 'Mon 12:02', text: 'Absolutely. ₹4800 total, ₹2000 to lock the slot. Sending the link.' },
    { who: 'them', when: 'Mon 14:18', text: 'Paid. Thank you ❤' },
    { who: 'them', when: 'Yesterday', text: 'Quick q — can you use real petals like last time? They were so pretty' },
  ];
  const [text, setText] = React.useState('');
  return (
    <div style={{ marginTop: 4 }}>
      <Card padding={12} style={{ marginBottom: 10, background: 'var(--surface-2)' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>Synced from Instagram & WhatsApp</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: m.who === 'me' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '78%',
                padding: '8px 12px',
                borderRadius: 14,
                background: m.who === 'me' ? 'var(--caramel)' : 'var(--surface)',
                color: m.who === 'me' ? 'var(--surface)' : 'var(--ink)',
                fontSize: 13.5, lineHeight: 1.4,
                border: m.who === 'me' ? 'none' : '1px solid var(--line-soft)',
              }}>
                {m.text}
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>{m.when}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Reply…"
          style={{
            flex: 1, fontFamily: 'inherit', fontSize: 14,
            padding: '10px 14px',
            borderRadius: 999,
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            outline: 'none',
          }}
        />
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            if (text.trim()) { toast('Reply sent'); setText(''); }
          }}
          style={{ borderRadius: 999, width: 42, padding: 0 }}
        >
          <Icon.Arrow size={16} />
        </Button>
      </div>
    </div>
  );
}

window.Customers = Customers;
window.CustomerDetail = CustomerDetail;

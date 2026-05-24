// Orders list + Order Detail screens.

function Orders({ navigate, openSheet }) {
  const data = window.__data;
  const [tab, setTab] = React.useState('active');
  const [search, setSearch] = React.useState('');

  const filtered = data.orders.filter(o => {
    const matchesTab = (
      (tab === 'active' && o.status !== 'delivered' && o.status !== 'draft') ||
      (tab === 'delivered' && o.status === 'delivered') ||
      (tab === 'drafts' && o.status === 'draft')
    );
    if (!matchesTab) return false;
    if (!search) return true;
    const c = window.getCustomer(o.customerId);
    const hay = (o.title + ' ' + c?.name + ' ' + o.flavor).toLowerCase();
    return hay.includes(search.toLowerCase());
  }).sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));

  // Group by date
  const groups = {};
  filtered.forEach(o => {
    const key = o.deliveryDate;
    (groups[key] = groups[key] || []).push(o);
  });

  return (
    <Screen>
      <div data-screen-label="Orders">
        <ScreenHeader
          title="Orders"
          subtitle={`${data.orders.filter(o => o.status !== 'delivered' && o.status !== 'draft').length} active`}
          right={
            <>
              <IconButton onClick={() => openSheet('filter-orders')}><Icon.Filter size={19} /></IconButton>
              <IconButton onClick={() => navigate('new-order')} style={{ background: 'var(--caramel)', color: 'var(--surface)', width: 34, height: 34 }}>
                <Icon.Plus size={20} />
              </IconButton>
            </>
          }
        />

        {/* Tabs + search */}
        <div style={{ padding: '0 18px 8px', background: 'var(--bg)', borderBottom: '1px solid var(--line-soft)' }}>
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'drafts', label: 'Drafts' },
            ]}
          />
          <div style={{ marginTop: 10, position: 'relative' }}>
            <Icon.Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search orders, customers, flavors"
              style={{
                width: '100%',
                fontFamily: 'inherit',
                fontSize: 14,
                padding: '9px 12px 9px 36px',
                borderRadius: 'var(--r)',
                border: '1px solid var(--line)',
                background: 'var(--surface-2)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <ScreenBody padding="12px 18px 100px">
          {Object.keys(groups).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>—</div>
              <div style={{ fontSize: 14 }}>No orders here yet.</div>
            </div>
          ) : (
            Object.entries(groups).map(([date, items]) => (
              <div key={date} style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                  padding: '0 4px',
                }}>
                  <div>
                    <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 17 }}>
                      {window.fmtRelative(date)}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>
                      {window.dayOfWeek(date)} · {window.fmtDate(date)}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {items.length} {items.length === 1 ? 'order' : 'orders'}
                  </span>
                </div>
                <Card padding={0}>
                  {items.map((o, i) => {
                    const c = window.getCustomer(o.customerId);
                    return (
                      <ListRow
                        key={o.id}
                        divider={i < items.length - 1}
                        onClick={() => navigate('order-detail', { id: o.id })}
                        padding="11px 14px"
                        left={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <CakeArt tone={c?.avatarTone || 'caramel'} size={48} label={o.flavor.split(' ')[0]} />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {o.title}
                              </div>
                              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span>{c?.name}</span>
                                <span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--line)' }} />
                                <span>{o.deliverySlot}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                                <StatusPill status={o.status} />
                                <span style={{ fontSize: 12, fontWeight: 600 }}>{window.fmtMoney(o.price)}</span>
                                {o.balance > 0 && (
                                  <span style={{ fontSize: 10.5, color: 'var(--danger)', fontWeight: 500 }}>
                                    {window.fmtMoney(o.balance)} due
                                  </span>
                                )}
                              </div>
                            </div>
                            <Icon.Chevron size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                          </div>
                        }
                      />
                    );
                  })}
                </Card>
              </div>
            ))
          )}
        </ScreenBody>
      </div>
    </Screen>
  );
}

function OrderDetail({ navigate, id, toast }) {
  const data = window.__data;
  const order = data.orders.find(o => o.id === id);
  if (!order) return <Screen><div style={{ padding: 20 }}>Not found</div></Screen>;
  const customer = window.getCustomer(order.customerId);
  const recipe = window.getRecipeByFlavor(order.flavor);
  const timers = window.useTimers && window.useTimers();

  const startBakePlan = () => {
    if (!timers || !recipe) return;
    const link = { kind: 'order', id: order.id, label: `${order.title} · ${customer?.name}` };
    timers.start({ label: `${recipe.name} — prep`, durationMs: recipe.prepMins * 60_000, color: 'rose', link });
    timers.start({ label: `${recipe.name} — bake`, durationMs: recipe.bakeMins * 60_000, color: 'caramel', link });
    timers.start({ label: `${recipe.name} — cool`, durationMs: 20 * 60_000, color: 'sage', link });
    toast && toast('3 bake timers started');
  };

  const [status, setStatus] = React.useState(order.status);
  const stages = [
    { key: 'confirmed', label: 'Confirmed', date: order.createdAt },
    { key: 'in-production', label: 'In production', date: '2026-05-23' },
    { key: 'ready', label: 'Ready', date: order.deliveryDate + ' am' },
    { key: 'delivered', label: 'Delivered', date: order.deliveryDate + ' ' + order.deliverySlot },
  ];
  const currentIndex = stages.findIndex(s => s.key === status);

  const advance = () => {
    if (currentIndex < stages.length - 1) {
      const next = stages[currentIndex + 1].key;
      setStatus(next);
      toast(`Marked ${window.statusLabel(next).toLowerCase()}`);
    }
  };

  return (
    <Screen>
      <div data-screen-label="Order Detail">
        <ScreenHeader
          title={`#${order.id.replace('o-', '')}`}
          subtitle={customer?.name}
          onBack={() => navigate('back')}
          right={
            <>
              <IconButton><Icon.Share size={19} /></IconButton>
              <IconButton><Icon.More size={20} /></IconButton>
            </>
          }
        />
        <ScreenBody>
          {/* Hero image */}
          <CakeArt
            tone={customer?.avatarTone || 'caramel'}
            label={order.flavor}
            style={{ width: '100%', height: 180, borderRadius: 16, marginBottom: 14 }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: 0, lineHeight: 1.2 }}>
                {order.title}
              </h2>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                {order.size} · {order.servings} servings · {order.eggless ? 'Eggless' : 'Regular'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22 }}>{window.fmtMoney(order.price)}</div>
              {order.balance > 0 && <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>{window.fmtMoney(order.balance)} due</div>}
            </div>
          </div>

          {/* Stage tracker */}
          <Card style={{ marginTop: 16 }} padding={14}>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>
              Progress
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {stages.map((s, i) => {
                const done = i <= currentIndex;
                return (
                  <div key={s.key} style={{ flex: 1 }}>
                    <div style={{
                      height: 5, borderRadius: 999,
                      background: done ? 'var(--caramel)' : 'var(--line)',
                      transition: 'background .25s',
                    }} />
                    <div style={{ fontSize: 10.5, marginTop: 6, fontWeight: done ? 600 : 500, color: done ? 'var(--ink)' : 'var(--muted)' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{i <= currentIndex ? window.fmtDate(s.date.split(' ')[0]) : '—'}</div>
                  </div>
                );
              })}
            </div>
            {currentIndex < stages.length - 1 && (
              <Button variant="soft" size="sm" full style={{ marginTop: 14 }} onClick={advance}>
                <Icon.Check size={16} /> Mark {stages[currentIndex + 1].label.toLowerCase()}
              </Button>
            )}
          </Card>

          {/* Customer */}
          <SectionHeader>Customer</SectionHeader>
          <Card padding={0}>
            <ListRow
              divider={false}
              onClick={() => navigate('customer-detail', { id: customer.id })}
              left={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={customer.name} tone={customer.avatarTone} size={42} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{customer.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
                      {customer.tags.map(t => <Pill key={t} tone={t === 'VIP' ? 'caramel' : t === 'Eggless' ? 'sage' : 'neutral'} size="xs">{t}</Pill>)}
                    </div>
                  </div>
                </div>
              }
              right={<Icon.Chevron size={16} style={{ color: 'var(--muted)' }} />}
            />
            <div style={{ display: 'flex', borderTop: '1px solid var(--line-soft)' }}>
              <a href={`tel:${customer.phone}`} style={{ flex: 1, padding: '11px 0', textAlign: 'center', borderRight: '1px solid var(--line-soft)', color: 'var(--ink)', textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon.Phone size={16} /> Call
              </a>
              <div onClick={() => toast('Opening WhatsApp…')} style={{ flex: 1, padding: '11px 0', textAlign: 'center', borderRight: '1px solid var(--line-soft)', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon.Whatsapp size={16} /> Chat
              </div>
              <div onClick={() => toast('Opening DM…')} style={{ flex: 1, padding: '11px 0', textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon.Instagram size={16} /> DM
              </div>
            </div>
          </Card>

          {/* Theme & references */}
          <SectionHeader>Theme</SectionHeader>
          <Card>
            <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{order.theme}</div>
            {order.addOns?.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line-soft)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Add-ons
                </div>
                {order.addOns.map((a, i) => (
                  <div key={i} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Icon.Check size={14} style={{ color: 'var(--caramel)' }} /> {a}
                  </div>
                ))}
              </div>
            )}
            {order.referenceCount > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line-soft)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  References ({order.referenceCount})
                </div>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                  {Array.from({ length: order.referenceCount }).map((_, i) => (
                    <CakeArt key={i} tone={['caramel', 'rose', 'sage', 'plum'][i % 4]} size={70} label={`ref ${i + 1}`} />
                  ))}
                </div>
              </div>
            )}
            {order.notes && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line-soft)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Notes
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5, fontStyle: 'italic', color: 'var(--ink-soft)' }}>
                  "{order.notes}"
                </div>
              </div>
            )}
          </Card>

          {/* Recipe quick link */}
          {recipe && (
            <>
              <SectionHeader>Recipe</SectionHeader>
              <Card padding={0}>
                <ListRow
                  divider
                  onClick={() => navigate('recipe-detail', { id: recipe.id })}
                  left={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <CakeArt tone="caramel" size={44} label={recipe.name.split(' ')[0]} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{recipe.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                          {recipe.prepMins}m prep · {recipe.bakeMins}m bake · cost {window.fmtMoney(recipe.costPerCake)}
                        </div>
                      </div>
                    </div>
                  }
                  right={<Icon.Chevron size={16} style={{ color: 'var(--muted)' }} />}
                />
                <div style={{ padding: '10px 14px' }}>
                  <Button variant="soft" size="md" full icon={<Icon.Clock size={16} />} onClick={startBakePlan}>
                    Start bake plan · {recipe.prepMins + recipe.bakeMins + 20}m total
                  </Button>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 6 }}>
                    Spawns prep · bake · cool timers
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Delivery */}
          <SectionHeader>Delivery</SectionHeader>
          <Card padding={0}>
            <div style={{ padding: 14, display: 'flex', gap: 12 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12,
                background: 'var(--caramel-soft)',
                color: 'var(--caramel-deep)',
                display: 'grid', placeItems: 'center',
                fontFamily: 'DM Serif Display, serif',
                lineHeight: 1,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9.5, opacity: 0.8 }}>{window.dayOfWeek(order.deliveryDate).toUpperCase()}</div>
                  <div style={{ fontSize: 18 }}>{new Date(order.deliveryDate).getDate()}</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{window.fmtDate(order.deliveryDate, { showYear: true })} · {order.deliverySlot}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon.Pin size={11} /> {order.deliveryArea}
                </div>
              </div>
              <Button variant="secondary" size="sm" icon={<Icon.Truck size={14} />}>Book</Button>
            </div>
            {order.coldChainNotes && (
              <div style={{
                margin: '0 14px 14px',
                padding: '10px 12px',
                background: 'oklch(0.95 0.04 200)',
                border: '1px solid oklch(0.82 0.07 200)',
                borderRadius: 'var(--r-sm)',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <Icon.Sparkle size={14} style={{ color: 'oklch(0.40 0.10 200)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10.5, color: 'oklch(0.32 0.10 200)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 700 }}>
                    Cold chain
                  </div>
                  <div style={{ fontSize: 12, color: 'oklch(0.30 0.07 200)', marginTop: 3, lineHeight: 1.45 }}>
                    {order.coldChainNotes}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Payment */}
          <SectionHeader>Payment</SectionHeader>
          <Card padding={0}>
            <div style={{ padding: 14, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Total</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{window.fmtMoney(order.price)}</span>
            </div>
            <div style={{ padding: '0 14px 4px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                Deposit received{order.paymentMode ? ` · ${order.paymentMode}` : ''}
              </span>
              <span style={{ fontSize: 14, color: 'var(--ok)' }}>−{window.fmtMoney(order.deposit)}</span>
            </div>
            {order.deposit > 0 && order.paymentMode === 'UPI' && (
              <div style={{ padding: '0 14px 4px' }}>
                {order.upiReferenceUtr ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 11.5, color: 'var(--muted)' }}>
                    <span>UTR · {order.payerVpa || 'VPA not captured'}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--ink-soft)' }}>{order.upiReferenceUtr}</span>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'oklch(0.95 0.07 80)',
                    border: '1px solid oklch(0.82 0.12 80)',
                    color: 'oklch(0.38 0.10 70)',
                    padding: '8px 10px',
                    borderRadius: 'var(--r-sm)',
                    fontSize: 11.5,
                  }}>
                    <Icon.Bell size={13} />
                    <span style={{ flex: 1 }}>UTR missing — reconciliation will need manual matching</span>
                    <span onClick={() => toast('Capture UTR — sheet coming soon')} style={{ fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Add</span>
                  </div>
                )}
              </div>
            )}
            <div style={{ padding: 14, paddingTop: 10, borderTop: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Balance due</span>
              <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: order.balance > 0 ? 'var(--ink)' : 'var(--ok)' }}>
                {window.fmtMoney(order.balance)}
              </span>
            </div>
            {order.balance > 0 && (
              <div style={{ padding: '0 14px 14px' }}>
                <Button variant="primary" size="md" full icon={<Icon.Wallet size={16} />} onClick={() => toast('Payment link sent via WhatsApp')}>
                  Send payment link
                </Button>
              </div>
            )}
          </Card>

          <div style={{ height: 14 }} />
        </ScreenBody>
      </div>
    </Screen>
  );
}

window.Orders = Orders;
window.OrderDetail = OrderDetail;

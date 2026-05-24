// Production — weekly bake schedule.

function Production({ navigate, toast }) {
  const data = window.__data;
  const timers = window.useTimers && window.useTimers();
  // Build a Mon-Sun week starting May 24 2026
  const weekStart = new Date('2026-05-24');
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const [view, setView] = React.useState('list'); // list, oven

  const ordersInWeek = data.orders.filter(o =>
    days.includes(o.deliveryDate) && o.status !== 'delivered' && o.status !== 'draft'
  );

  const byDay = days.map(d => ({
    date: d,
    orders: ordersInWeek.filter(o => o.deliveryDate === d).sort((a, b) => a.deliverySlot.localeCompare(b.deliverySlot)),
  }));

  // Capacity heatmap: orders > 3 = full, > 1 = busy, > 0 = light
  const totalCakes = ordersInWeek.length;
  const totalHours = ordersInWeek.reduce((s, o) => {
    const r = window.getRecipeByFlavor(o.flavor);
    return s + (r ? (r.prepMins + r.bakeMins) / 60 : 1);
  }, 0);

  return (
    <Screen>
      <div data-screen-label="Production">
        <ScreenHeader
          title="Bakes"
          subtitle={`Week of ${window.fmtDate(days[0])} – ${window.fmtDate(days[6])}`}
          onBack={() => navigate('home')}
          right={
            <IconButton onClick={() => navigate('new-order')} style={{ background: 'var(--caramel)', color: 'var(--surface)', width: 34, height: 34 }}>
              <Icon.Plus size={20} />
            </IconButton>
          }
        />

        <div style={{ padding: '0 18px 8px', borderBottom: '1px solid var(--line-soft)' }}>
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { value: 'list', label: 'Schedule' },
              { value: 'oven', label: 'Oven plan' },
            ]}
          />
        </div>

        <ScreenBody padding="12px 18px 100px">
          {timers && (timers.running.length + timers.done.length) > 0 && (
            <div style={{ marginBottom: 14 }}>
              <SectionHeader action={<span onClick={() => navigate('kitchen')} style={{ color: 'var(--caramel-deep)', cursor: 'pointer', fontWeight: 600 }}>All →</span>}>
                Now in the kitchen
              </SectionHeader>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -18px', padding: '4px 18px', scrollbarWidth: 'none' }}>
                {[...timers.done, ...timers.running.slice().sort((a, b) => a.remainingMs - b.remainingMs)].map(t => {
                  const c = window.TIMER_COLORS[t.color] || window.TIMER_COLORS.caramel;
                  const progress = t.status === 'done' ? 1 : 1 - (t.remainingMs / t.totalMs);
                  const isDone = t.status === 'done';
                  return (
                    <div
                      key={t.id}
                      onClick={() => navigate('kitchen')}
                      style={{
                        flexShrink: 0, width: 150,
                        padding: 10, borderRadius: 'var(--r-lg)',
                        background: isDone ? c.soft : 'var(--surface)',
                        border: '1px solid ' + (isDone ? c.ring : 'var(--line-soft)'),
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        animation: isDone ? 'pulse 1.4s ease-in-out infinite' : undefined,
                      }}
                    >
                      <TimerRing progress={progress} color={t.color} size={56}>
                        {isDone ? 'DONE' : window.fmtTimerTime(t.remainingMs)}
                      </TimerRing>
                      <div style={{ fontSize: 11.5, fontWeight: 600, textAlign: 'center', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                        {t.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week summary */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <StatTile label="Cakes" value={String(totalCakes)} tone="caramel" />
            <StatTile label="Oven hrs" value={totalHours.toFixed(1)} tone="rose" />
            <StatTile label="Revenue" value={window.fmtCompactMoney(ordersInWeek.reduce((s, o) => s + o.price, 0))} tone="sage" />
          </div>

          {view === 'list' ? (
            byDay.map(({ date, orders }) => {
              const isToday = date === '2026-05-24';
              const heat = orders.length === 0 ? 'rest' : orders.length <= 1 ? 'light' : orders.length <= 3 ? 'busy' : 'full';
              const heatColor = {
                rest: 'var(--line)',
                light: 'var(--sage)',
                busy: 'var(--caramel)',
                full: 'var(--rose)',
              }[heat];
              return (
                <div key={date} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '0 4px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: heatColor }} />
                    <div>
                      <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 17, marginRight: 8 }}>
                        {window.dayOfWeek(date)}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {window.fmtDate(date)} {isToday && '· today'}
                      </span>
                    </div>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                      {orders.length === 0 ? 'Rest day' : `${orders.length} ${orders.length === 1 ? 'cake' : 'cakes'}`}
                    </span>
                  </div>
                  {orders.length === 0 ? (
                    <Card style={{ background: 'var(--surface-2)' }}>
                      <div style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', padding: 4 }}>
                        Kitchen rests. Use this for prep or marketing.
                      </div>
                    </Card>
                  ) : (
                    <Card padding={0}>
                      {orders.map((o, i) => {
                        const c = window.getCustomer(o.customerId);
                        const r = window.getRecipeByFlavor(o.flavor);
                        return (
                          <ListRow
                            key={o.id}
                            divider={i < orders.length - 1}
                            onClick={() => navigate('order-detail', { id: o.id })}
                            padding="11px 14px"
                            left={
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                  width: 48, textAlign: 'center',
                                  background: 'var(--surface-3)',
                                  borderRadius: 10,
                                  padding: '6px 0',
                                }}>
                                  <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 15, lineHeight: 1 }}>{o.deliverySlot.split(' ')[0]}</div>
                                  <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>{o.deliverySlot.split(' ')[1] || ''}</div>
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {o.title}
                                  </div>
                                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3, display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <span>{o.flavor}</span>
                                    {r && <><span style={{ width: 2, height: 2, borderRadius: 999, background: 'var(--line)' }} /><span>{r.prepMins + r.bakeMins}min</span></>}
                                  </div>
                                  <div style={{ marginTop: 5 }}>
                                    <StatusPill status={o.status} dot={false} />
                                  </div>
                                </div>
                              </div>
                            }
                          />
                        );
                      })}
                    </Card>
                  )}
                </div>
              );
            })
          ) : (
            <OvenPlan ordersInWeek={ordersInWeek} byDay={byDay} navigate={navigate} toast={toast} />
          )}
        </ScreenBody>
      </div>
    </Screen>
  );
}

function OvenPlan({ ordersInWeek, byDay, navigate, toast }) {
  // Aggregate ingredients across week from recipes
  const totals = {};
  ordersInWeek.forEach(o => {
    const r = window.getRecipeByFlavor(o.flavor);
    if (!r) return;
    r.ingredients.forEach(ing => {
      const key = ing.stockKey || ing.item;
      if (!totals[key]) totals[key] = { name: ing.item, qtys: [] };
      totals[key].qtys.push(ing.qty);
    });
  });
  const lines = Object.entries(totals).slice(0, 8);

  return (
    <div>
      <SectionHeader>This week, you'll bake</SectionHeader>
      <Card padding={0}>
        {byDay.filter(d => d.orders.length > 0).map(({ date, orders }) => (
          <div key={date} style={{ padding: '10px 14px', borderBottom: '1px solid var(--line-soft)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>
              {window.dayOfWeek(date)} · {window.fmtDate(date)}
            </div>
            {orders.map(o => {
              const r = window.getRecipeByFlavor(o.flavor);
              return (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                  <span>{o.size} · {o.flavor}</span>
                  <span style={{ color: 'var(--muted)' }}>{r ? `${r.prepMins + r.bakeMins}m` : ''}</span>
                </div>
              );
            })}
          </div>
        ))}
      </Card>

      <SectionHeader action={<span onClick={() => navigate('inventory')} style={{ color: 'var(--caramel-deep)', cursor: 'pointer', fontWeight: 600 }}>Inventory →</span>}>
        Ingredient pull
      </SectionHeader>
      <Card padding={0}>
        {lines.map(([k, v], i) => (
          <ListRow
            key={k}
            divider={i < lines.length - 1}
            left={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8, background: 'var(--surface-3)',
                  display: 'grid', placeItems: 'center',
                  color: 'var(--caramel-deep)',
                }}>
                  <Icon.Egg size={16} />
                </span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{v.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{v.qtys.join(' + ')}</div>
                </div>
              </div>
            }
            right={
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)' }}>×{v.qtys.length}</span>
            }
          />
        ))}
      </Card>

      <Button
        variant="primary" size="lg" full
        style={{ marginTop: 16 }}
        onClick={() => toast('Shopping list saved to phone')}
        icon={<Icon.Doc size={16} />}
      >
        Generate shopping list
      </Button>
    </div>
  );
}

window.Production = Production;

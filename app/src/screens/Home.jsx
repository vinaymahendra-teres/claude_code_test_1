// Home dashboard — at-a-glance morning view for the bakery owner.

function Home({ navigate, openSheet, tweaks, modeDef }) {
  const data = window.__data;
  const sections = new Set(modeDef?.sections || ['hero', 'quickActions', 'today', 'tomorrow', 'inbox', 'lowStock']);
  const show = (key) => sections.has(key);
  const today = '2026-05-24';
  const todays = data.orders.filter(o => o.deliveryDate === today);
  const tomorrow = data.orders.filter(o => o.deliveryDate === '2026-05-25');
  const upcoming = data.orders
    .filter(o => o.status !== 'delivered' && o.status !== 'draft' && o.deliveryDate >= today)
    .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));

  const week = data.orders
    .filter(o => o.deliveryDate >= today && o.deliveryDate <= '2026-05-31')
    .reduce((s, o) => s + o.price, 0);
  const pendingBalance = data.orders
    .filter(o => o.status !== 'delivered' && o.status !== 'draft')
    .reduce((s, o) => s + o.balance, 0);

  const lowStock = data.inventory.filter(i => i.qty < i.reorderAt);

  return (
    <Screen>
      <div data-screen-label="Home">
        {/* Decorative warm gradient top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 220,
          background: 'radial-gradient(120% 80% at 80% 0%, oklch(0.92 0.055 70 / 0.7), transparent 70%), linear-gradient(180deg, oklch(0.96 0.022 70), transparent)',
          pointerEvents: 'none',
        }} />

        <header style={{ position: 'relative', padding: '54px 22px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Sunday, 24 May
                </div>
                <ModePill modeDef={modeDef} onClick={() => openSheet('mode')} />
              </div>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, marginTop: 4, lineHeight: 1.1 }}>
                Morning, Anita
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <IconButton onClick={() => openSheet('notifications')} style={{ position: 'relative' }}>
                <Icon.Bell size={20} />
                <span style={{
                  position: 'absolute', top: 7, right: 8,
                  width: 7, height: 7, borderRadius: 999, background: 'var(--rose)',
                  border: '1.5px solid var(--bg)',
                }} />
              </IconButton>
              <IconButton onClick={() => openSheet('tweaks')}><Icon.Gear size={20} /></IconButton>
            </div>
          </div>
        </header>

        <ScreenBody padding="6px 18px 100px" style={{ position: 'relative' }}>
          {/* Hero metric card */}
          <Card padding={0} style={{
            background: 'linear-gradient(135deg, oklch(0.30 0.08 50), oklch(0.22 0.04 50))',
            color: 'oklch(0.96 0.02 70)',
            border: 'none',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -40, right: -40, width: 180, height: 180,
              background: 'radial-gradient(circle, oklch(0.78 0.12 55 / 0.4), transparent 70%)',
            }} />
            <div style={{ padding: '18px 18px 16px', position: 'relative' }}>
              <div style={{ fontSize: 11.5, opacity: 0.6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                This week
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 34, lineHeight: 1 }}>
                  {window.fmtMoney(week)}
                </span>
                <span style={{ fontSize: 13, opacity: 0.7 }}>booked</span>
              </div>
              <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
                <div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>Pending balance</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{window.fmtMoney(pendingBalance)}</div>
                </div>
                <div style={{ width: 1, background: 'oklch(0.99 0.01 75 / 0.15)' }} />
                <div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>Today's bakes</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{todays.length} {todays.length === 1 ? 'cake' : 'cakes'}</div>
                </div>
              </div>
            </div>
            <div style={{
              borderTop: '1px solid oklch(0.99 0.01 75 / 0.12)',
              padding: '10px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12.5,
              opacity: 0.85,
            }}>
              <span>9 active orders</span>
              <span onClick={() => navigate('accounting')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                Books <Icon.Chevron size={14} />
              </span>
            </div>
          </Card>

          {/* Quick actions — mode-driven */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 16 }}>
            {(() => {
              const ha = modeDef?.home || {};
              const fallbackTones = ['caramel', 'rose', 'sage', 'caramel'];
              return ['action0', 'action1', 'action2', 'action3'].map((k, idx) => {
                const a = ha[k];
                if (!a) return null;
                const IconComp = Icon[a.icon] || Icon.Plus;
                return { ...a, key: k, idx, icon: <IconComp size={20} />, tone: fallbackTones[idx] };
              }).filter(Boolean);
            })().map(q => {
              const tones = {
                caramel: 'var(--caramel-soft)',
                rose: 'var(--rose-soft)',
                sage: 'var(--sage-soft)',
              };
              return (
                <button
                  key={q.key}
                  onClick={() => {
                    if (q.sheet) openSheet(q.id);
                    else navigate(q.id, q.params || {});
                  }}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line-soft)',
                    borderRadius: 'var(--r)',
                    padding: '12px 4px 10px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <span style={{
                    width: 36, height: 36, borderRadius: 999,
                    background: tones[q.tone],
                    color: 'var(--ink)',
                    display: 'grid', placeItems: 'center',
                  }}>{q.icon}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink)' }}>{q.label}</span>
                </button>
              );
            })}
          </div>

          {/* Compliance (finance mode) */}
          {show('compliance') && (
            <>
              <SectionHeader action={<span onClick={() => navigate('accounting')} style={{ color: 'var(--caramel-deep)', cursor: 'pointer', fontWeight: 600 }}>Books →</span>}>
                Compliance
              </SectionHeader>
              <ComplianceCard navigate={navigate} limit={3} />
            </>
          )}

          {/* Reviews queue (marketing mode) */}
          {show('reviews') && (
            <>
              <SectionHeader>Ask for reviews</SectionHeader>
              <ReviewsPreviewCard navigate={navigate} />
            </>
          )}

          {/* Upcoming occasions (marketing mode) */}
          {show('occasions') && (
            <>
              <SectionHeader>Coming up — pitch a cake</SectionHeader>
              <OccasionsCard navigate={navigate} limit={3} />
            </>
          )}

          {/* Today */}
          {show('today') && <>
          <SectionHeader action={<span onClick={() => navigate('production')} style={{ color: 'var(--caramel-deep)', cursor: 'pointer', fontWeight: 600 }}>Production →</span>}>
            Today's kitchen
          </SectionHeader>
          {todays.length === 0 ? (
            <Card><div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '10px 0' }}>No deliveries today — rest the oven.</div></Card>
          ) : (
            <Card padding={0}>
              {todays.map((o, i) => {
                const c = window.getCustomer(o.customerId);
                return (
                  <ListRow
                    key={o.id}
                    divider={i < todays.length - 1}
                    onClick={() => navigate('order-detail', { id: o.id })}
                    left={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CakeArt tone={c?.avatarTone || 'caramel'} size={44} label={o.flavor.split(' ')[0]} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {o.title}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
                            <Icon.Clock size={11} /> {o.deliverySlot} · {c?.area}
                          </div>
                        </div>
                      </div>
                    }
                    right={<StatusPill status={o.status} dot={false} />}
                  />
                );
              })}
            </Card>
          )}
          </>}

          {/* Tomorrow preview */}
          {show('tomorrow') && tomorrow.length > 0 && (
            <>
              <SectionHeader>Tomorrow</SectionHeader>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', margin: '0 -18px', padding: '0 18px 4px', scrollbarWidth: 'none' }}>
                {tomorrow.map(o => {
                  const c = window.getCustomer(o.customerId);
                  return (
                    <div
                      key={o.id}
                      onClick={() => navigate('order-detail', { id: o.id })}
                      style={{
                        flexShrink: 0, width: 200,
                        background: 'var(--surface)',
                        border: '1px solid var(--line-soft)',
                        borderRadius: 'var(--r-lg)',
                        padding: 12,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <CakeArt tone={c?.avatarTone || 'caramel'} size={140} label={o.flavor} style={{ width: '100%', height: 100, borderRadius: 12, marginBottom: 10 }} />
                      <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{c?.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{o.size} · {o.deliverySlot}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Inbox */}
          {show('inbox') && <>
          <SectionHeader action={<span onClick={() => openSheet('inbox')} style={{ color: 'var(--caramel-deep)', cursor: 'pointer', fontWeight: 600 }}>Inbox (3)</span>}>
            Needs your reply
          </SectionHeader>
          <Card padding={0}>
            <ListRow
              onClick={() => navigate('customer-detail', { id: 'c-012' })}
              left={
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Avatar name="Divya Menon" tone="caramel" size={36} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>Divya Menon <Pill tone="rose" size="xs" style={{ marginLeft: 4 }}>New</Pill></div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>"Can you do a 3-tier for engagement?"</div>
                  </div>
                </div>
              }
              right={<span style={{ fontSize: 11, color: 'var(--muted)' }}>2h</span>}
            />
            <ListRow
              onClick={() => navigate('customer-detail', { id: 'c-002' })}
              left={
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Avatar name="Vikram Iyer" tone="sage" size={36} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>Vikram Iyer</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>GST invoice for last order</div>
                  </div>
                </div>
              }
              right={<span style={{ fontSize: 11, color: 'var(--muted)' }}>5h</span>}
            />
            <ListRow
              divider={false}
              onClick={() => navigate('customer-detail', { id: 'c-007' })}
              left={
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Avatar name="Priya S" tone="rose" size={36} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>Priya Subramanian <Pill tone="caramel" size="xs" style={{ marginLeft: 4 }}>VIP</Pill></div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Confirming pickup time tomorrow</div>
                  </div>
                </div>
              }
              right={<span style={{ fontSize: 11, color: 'var(--muted)' }}>1d</span>}
            />
          </Card>
          </>}

          {/* Inventory alerts */}
          {show('lowStock') && lowStock.length > 0 && (
            <>
              <SectionHeader action={<span onClick={() => navigate('inventory')} style={{ color: 'var(--caramel-deep)', cursor: 'pointer', fontWeight: 600 }}>All →</span>}>
                Stock running low
              </SectionHeader>
              <Card padding={0}>
                {lowStock.slice(0, 3).map((item, i) => (
                  <ListRow
                    key={item.id}
                    divider={i < Math.min(lowStock.length, 3) - 1}
                    left={
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                          {item.qty}{item.unit} left · reorder at {item.reorderAt}{item.unit}
                        </div>
                      </div>
                    }
                    right={<Pill tone="warn" size="xs">Low</Pill>}
                  />
                ))}
              </Card>
            </>
          )}

          {/* Marketing pulse */}
          {show('campaign') && <>
          <SectionHeader action={<span onClick={() => navigate('marketing')} style={{ color: 'var(--caramel-deep)', cursor: 'pointer', fontWeight: 600 }}>Campaigns →</span>}>
            Mango campaign
          </SectionHeader>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CakeArt tone="caramel" size={56} label="Mango" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Mango Season Special
                  <Pill tone="ok" size="xs">Live</Pill>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  7 orders · {window.fmtMoney(24800)} revenue
                </div>
              </div>
              <Sparkline data={[1,2,1,3,4,3,5,7]} width={60} height={30} />
            </div>
          </Card>
          </>}

          <div style={{ height: 18 }} />
        </ScreenBody>
      </div>
    </Screen>
  );
}

window.Home = Home;

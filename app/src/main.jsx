// App shell — routing, bottom nav, more sheet, tweaks panel.
// (touched)

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "caramel",
  "density": "cozy",
  "darkMode": false,
  "showBalances": true
}/*EDITMODE-END*/;

function App() {
  // Stack-based router
  const [stack, setStack] = React.useState([{ screen: 'home', params: {} }]);
  const current = stack[stack.length - 1];

  // Mode — four hats. Default + persisted.
  const [mode, setModeState] = React.useState(() => window.loadMode());
  const modeDef = window.MODES[mode] || window.MODES.operations;
  const setMode = (id) => {
    setModeState(id);
    window.saveMode(id);
  };

  // A "tab" is any screen the active mode exposes via the bottom nav.
  const tabScreens = new Set(modeDef.nav);

  const navigate = (screen, params = {}) => {
    if (screen === 'back') {
      setStack(s => s.length > 1 ? s.slice(0, -1) : s);
      return;
    }
    // Tabs reset stack to just that screen.
    if (tabScreens.has(screen)) {
      setStack([{ screen, params }]);
    } else {
      setStack(s => [...s, { screen, params }]);
    }
  };

  const [sheet, setSheet] = React.useState(null);
  const openSheet = (id, data) => setSheet({ id, data });
  const closeSheet = () => setSheet(null);

  const [toastMsg, setToastMsg] = React.useState(null);
  const toast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 1800);
  };

  // Tweaks
  const [tweaks, setTweaks] = React.useState(() => {
    try {
      const saved = localStorage.getItem('tieredcake-tweaks');
      return saved ? { ...TWEAK_DEFAULTS, ...JSON.parse(saved) } : TWEAK_DEFAULTS;
    } catch (e) { return TWEAK_DEFAULTS; }
  });

  const setTweak = (k, v) => {
    setTweaks(t => {
      const next = { ...t, [k]: v };
      try { localStorage.setItem('tieredcake-tweaks', JSON.stringify(next)); } catch (e) {}
      try {
        window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
      } catch (e) {}
      return next;
    });
  };

  // Apply tweaks to root
  React.useEffect(() => {
    const root = document.documentElement;
    // Palette
    const palettes = {
      caramel: { primary: 'oklch(0.58 0.13 55)', deep: 'oklch(0.43 0.13 50)', soft: 'oklch(0.93 0.045 70)' },
      rose: { primary: 'oklch(0.58 0.13 25)', deep: 'oklch(0.42 0.13 22)', soft: 'oklch(0.93 0.04 25)' },
      sage: { primary: 'oklch(0.52 0.10 145)', deep: 'oklch(0.38 0.09 145)', soft: 'oklch(0.93 0.04 145)' },
      plum: { primary: 'oklch(0.50 0.12 340)', deep: 'oklch(0.35 0.10 340)', soft: 'oklch(0.93 0.04 340)' },
    };
    const p = palettes[tweaks.palette] || palettes.caramel;
    root.style.setProperty('--caramel', p.primary);
    root.style.setProperty('--caramel-deep', p.deep);
    root.style.setProperty('--caramel-soft', p.soft);

    // Dark mode
    if (tweaks.darkMode) {
      root.style.setProperty('--bg', 'oklch(0.18 0.012 50)');
      root.style.setProperty('--bg-deep', 'oklch(0.14 0.010 50)');
      root.style.setProperty('--surface', 'oklch(0.22 0.013 50)');
      root.style.setProperty('--surface-2', 'oklch(0.25 0.014 50)');
      root.style.setProperty('--surface-3', 'oklch(0.28 0.014 50)');
      root.style.setProperty('--ink', 'oklch(0.95 0.015 70)');
      root.style.setProperty('--ink-soft', 'oklch(0.80 0.015 70)');
      root.style.setProperty('--muted', 'oklch(0.62 0.014 60)');
      root.style.setProperty('--line', 'oklch(0.33 0.014 55)');
      root.style.setProperty('--line-soft', 'oklch(0.30 0.013 55)');
    } else {
      root.style.setProperty('--bg', 'oklch(0.965 0.014 75)');
      root.style.setProperty('--bg-deep', 'oklch(0.92 0.022 70)');
      root.style.setProperty('--surface', 'oklch(0.995 0.006 80)');
      root.style.setProperty('--surface-2', 'oklch(0.985 0.011 75)');
      root.style.setProperty('--surface-3', 'oklch(0.96 0.014 70)');
      root.style.setProperty('--ink', 'oklch(0.22 0.025 50)');
      root.style.setProperty('--ink-soft', 'oklch(0.40 0.022 55)');
      root.style.setProperty('--muted', 'oklch(0.55 0.018 55)');
      root.style.setProperty('--line', 'oklch(0.89 0.014 60)');
      root.style.setProperty('--line-soft', 'oklch(0.93 0.011 65)');
    }
  }, [tweaks.palette, tweaks.darkMode]);

  // Tweak host integration
  const [tweakOpen, setTweakOpen] = React.useState(false);
  React.useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweakOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweakOpen(false);
    };
    window.addEventListener('message', handler);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
    return () => window.removeEventListener('message', handler);
  }, []);

  const renderScreen = () => {
    const props = { navigate, openSheet, toast, tweaks, mode, modeDef, setMode };
    switch (current.screen) {
      case 'home': return <Home {...props} />;
      case 'orders': return <Orders {...props} />;
      case 'order-detail': return <OrderDetail {...props} id={current.params.id} />;
      case 'new-order': return <NewOrder {...props} />;
      case 'customers': return <Customers {...props} />;
      case 'customer-detail': return <CustomerDetail {...props} id={current.params.id} />;
      case 'production': return <Production {...props} />;
      case 'recipes': return <Recipes {...props} />;
      case 'recipe-detail': return <RecipeDetail {...props} id={current.params.id} />;
      case 'inventory': return <Inventory {...props} />;
      case 'marketing': return <Marketing {...props} />;
      case 'new-campaign': return <NewCampaign {...props} />;
      case 'campaign-detail': return <CampaignDetail {...props} id={current.params.id} />;
      case 'accounting': return <Accounting {...props} addExpenseOnMount={current.params.addExpense} />;
      case 'reports': return <Reports {...props} />;
      case 'reviews': return <Reviews {...props} />;
      case 'kitchen': return <Kitchen {...props} />;
      case 'tools': return <Tools {...props} />;
      default: return <Home {...props} />;
    }
  };

  const isFlow = ['new-order', 'new-campaign', 'order-detail', 'customer-detail', 'recipe-detail', 'campaign-detail'].includes(current.screen);
  const isBottomNavScreen = tabScreens.has(current.screen);

  return (
    <TimersProvider>
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <div key={stack.length + '-' + current.screen} style={{ position: 'absolute', inset: 0, animation: 'screenIn .2s' }}>
          {renderScreen()}
        </div>

        <TimerPeek navigate={navigate} hidden={current.screen === 'kitchen'} liftedForNav={isBottomNavScreen} />

        {isBottomNavScreen && (
          <BottomNav
            current={current.screen}
            navigate={navigate}
            openSheet={openSheet}
            modeDef={modeDef}
          />
        )}

      {/* More sheet */}
      <Sheet open={sheet?.id === 'more'} onClose={closeSheet} title="More">
        <MoreMenu
          navigate={(s, p) => { closeSheet(); setTimeout(() => navigate(s, p), 100); }}
          modeDef={modeDef}
        />
      </Sheet>

      {/* Mode picker sheet */}
      <Sheet open={sheet?.id === 'mode'} onClose={closeSheet} title="Choose your mode">
        <ModePicker
          current={mode}
          onPick={(id) => { setMode(id); closeSheet(); toast(`Switched to ${window.MODES[id].label}`); }}
        />
      </Sheet>

      {/* Tweaks sheet */}
      <Sheet open={sheet?.id === 'tweaks' || tweakOpen} onClose={() => { closeSheet(); setTweakOpen(false); try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {} }} title="Tweaks">
        <TweaksPanel tweaks={tweaks} setTweak={setTweak} />
      </Sheet>

      {/* Notifications sheet */}
      <Sheet open={sheet?.id === 'notifications'} onClose={closeSheet} title="Notifications">
        <Notifications navigate={(s, p) => { closeSheet(); setTimeout(() => navigate(s, p), 100); }} />
      </Sheet>

      {/* Inbox sheet */}
      <Sheet open={sheet?.id === 'inbox'} onClose={closeSheet} title="Inbox">
        <InboxSheet navigate={(s, p) => { closeSheet(); setTimeout(() => navigate(s, p), 100); }} />
      </Sheet>

      {/* Restock sheet */}
      <Sheet open={sheet?.id === 'restock'} onClose={closeSheet} title={sheet?.data?.name}>
        <RestockSheet item={sheet?.data} onClose={() => { closeSheet(); toast('Restock ordered'); }} />
      </Sheet>

        <Toast open={!!toastMsg} message={toastMsg} />
      </div>
    </TimersProvider>
  );
}

// ---------- Persistent running-timer peek ----------

function TimerPeek({ navigate, hidden, liftedForNav }) {
  const timers = window.useTimers && window.useTimers();
  if (!timers || hidden) return null;
  const active = timers.done.length > 0 ? timers.done[0] : timers.running.slice().sort((a, b) => a.remainingMs - b.remainingMs)[0];
  if (!active) return null;
  const extras = (timers.running.length + timers.done.length) - 1;
  const c = window.TIMER_COLORS[active.color] || window.TIMER_COLORS.caramel;
  const progress = active.status === 'done' ? 1 : 1 - (active.remainingMs / active.totalMs);
  const isDone = active.status === 'done';
  return (
    <div
      onClick={() => navigate('kitchen')}
      style={{
        position: 'absolute',
        left: 12, right: 12,
        bottom: liftedForNav ? 78 : 16,
        zIndex: 40,
        padding: '8px 10px 8px 8px',
        borderRadius: 999,
        background: isDone ? c.soft : 'oklch(from var(--surface) l c h / 0.96)',
        border: '1px solid ' + (isDone ? c.ring : 'var(--line)'),
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        boxShadow: 'var(--shadow)',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer',
        animation: isDone ? 'pulse 1.4s ease-in-out infinite' : 'fadeIn .2s',
      }}
    >
      <TimerRing progress={progress} color={active.color} size={38} stroke={3}>
        {isDone ? '!' : window.fmtTimerTime(active.remainingMs)}
      </TimerRing>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {active.label}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>
          {isDone ? 'Done — tap to dismiss' : extras > 0 ? `+${extras} more timer${extras === 1 ? '' : 's'}` : 'tap to manage'}
        </div>
      </div>
      <Icon.Chevron size={16} style={{ color: 'var(--muted)' }} />
    </div>
  );
}

// ---------- Bottom nav ----------

const NAV_ITEM_DEFS = {
  home: { label: 'Home', icon: Icon.Home },
  orders: { label: 'Orders', icon: Icon.Receipt },
  production: { label: 'Bakes', icon: Icon.Cake },
  customers: { label: 'People', icon: Icon.Users },
  recipes: { label: 'Recipes', icon: Icon.Cake },
  inventory: { label: 'Stock', icon: Icon.Box },
  marketing: { label: 'Marketing', icon: Icon.Megaphone },
  kitchen: { label: 'Kitchen', icon: Icon.Clock },
  accounting: { label: 'Books', icon: Icon.Wallet },
  reports: { label: 'Reports', icon: Icon.Doc },
  more: { label: 'More', icon: Icon.Grid, isSheet: true },
};

function BottomNav({ current, navigate, openSheet, modeDef }) {
  const navIds = modeDef?.nav || ['home', 'orders', 'production', 'customers', 'more'];
  const items = navIds.map(id => ({ id, ...NAV_ITEM_DEFS[id] }));
  return (
    <nav style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'oklch(from var(--surface) l c h / 0.92)',
      backdropFilter: 'saturate(140%) blur(20px)',
      WebkitBackdropFilter: 'saturate(140%) blur(20px)',
      borderTop: '1px solid var(--line-soft)',
      padding: '8px 8px 20px',
      display: 'flex',
      justifyContent: 'space-around',
      zIndex: 20,
    }}>
      {items.map(item => {
        const Icn = item.icon;
        const active = current === item.id;
        return (
          <button
            key={item.id}
            onClick={() => item.isSheet ? openSheet('more') : navigate(item.id)}
            style={{
              background: 'transparent', border: 'none',
              padding: '4px 6px',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: active ? 'var(--caramel-deep)' : 'var(--muted)',
              transition: 'color .15s',
              fontFamily: 'inherit',
              minWidth: 50,
            }}
          >
            <Icn size={22} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ---------- More menu ----------

function MoreMenu({ navigate, modeDef }) {
  const timers = window.useTimers && window.useTimers();
  const tCount = timers ? (timers.running.length + timers.done.length) : 0;
  const reviewCount = (window.__data?.orders || [])
    .filter(o => o.status === 'delivered' && o.feedbackReceived !== 'Y').length;
  const allItems = [
    { id: 'kitchen', label: 'Kitchen', sub: tCount > 0 ? `${tCount} timer${tCount === 1 ? '' : 's'} running` : 'Timers · multi-bake helper', icon: <Icon.Clock size={18} />, tone: 'caramel' },
    { id: 'tools', label: 'Tools', sub: 'Cup↔g · °C↔°F · scale', icon: <Icon.Sparkle size={18} />, tone: 'sage' },
    { id: 'recipes', label: 'Recipes', sub: '8 on the menu', icon: <Icon.Cake size={18} />, tone: 'caramel' },
    { id: 'inventory', label: 'Inventory', sub: '20 items · 4 low', icon: <Icon.Box size={18} />, tone: 'rose' },
    { id: 'marketing', label: 'Marketing', sub: '2 live campaigns', icon: <Icon.Megaphone size={18} />, tone: 'sage' },
    { id: 'reviews', label: 'Reviews', sub: reviewCount > 0 ? `${reviewCount} to ask` : 'All caught up', icon: <Icon.Star size={18} />, tone: 'rose' },
    { id: 'customers', label: 'People', sub: 'CRM · 24 customers', icon: <Icon.Users size={18} />, tone: 'rose' },
    { id: 'production', label: 'Bakes', sub: 'Week schedule + oven plan', icon: <Icon.Cake size={18} />, tone: 'caramel' },
    { id: 'accounting', label: 'Accounting', sub: 'May P&L · ₹29.5k', icon: <Icon.Wallet size={18} />, tone: 'caramel' },
    { id: 'reports', label: 'Reports', sub: 'P&L · Balance sheet · Cash flow', icon: <Icon.Doc size={18} />, tone: 'sage' },
  ];
  // Hide items already pinned in the bottom-nav, then sort by mode primaries.
  const navSet = new Set(modeDef?.nav || []);
  const primarySet = new Set(modeDef?.morePrimary || []);
  const items = allItems
    .filter(it => !navSet.has(it.id))
    .sort((a, b) => {
      const aP = primarySet.has(a.id) ? 0 : 1;
      const bP = primarySet.has(b.id) ? 0 : 1;
      return aP - bP;
    });
  const tones = {
    caramel: { bg: 'var(--caramel-soft)', fg: 'var(--caramel-deep)' },
    rose: { bg: 'var(--rose-soft)', fg: 'oklch(0.38 0.10 25)' },
    sage: { bg: 'var(--sage-soft)', fg: 'oklch(0.34 0.07 145)' },
  };
  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '4px 4px 18px',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: `var(--surface) center/86% no-repeat url(${window.__logoUrl || 'logo.jpg'})`,
          boxShadow: '0 4px 14px oklch(0.40 0.12 50 / 0.18), inset 0 0 0 1px oklch(0.85 0.02 60 / 0.4)',
          flexShrink: 0,
        }} aria-hidden="true" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 19, lineHeight: 1.1, color: 'var(--ink)' }}>
            Tiered Cake Company
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            Custom-themed cakes · Hyderabad
          </div>
        </div>
      </div>
      <Card padding={0} style={{ marginTop: 4 }}>
        {items.map((it, i) => {
          const t = tones[it.tone];
          return (
            <ListRow
              key={it.id}
              divider={i < items.length - 1}
              onClick={() => navigate(it.id)}
              padding="12px 14px"
              left={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: t.bg, color: t.fg,
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>{it.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{it.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{it.sub}</div>
                  </div>
                </div>
              }
              right={<Icon.Chevron size={16} style={{ color: 'var(--muted)' }} />}
            />
          );
        })}
      </Card>

      <div style={{ marginTop: 18 }}>
        <SectionHeader>Studio</SectionHeader>
        <Card padding={0}>
          <ListRow divider left={<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Icon.Settings size={16} style={{ color: 'var(--muted)' }} /><span style={{ fontSize: 14, fontWeight: 500 }}>Settings</span></div>} right={<Icon.Chevron size={16} style={{ color: 'var(--muted)' }} />} />
          <ListRow divider={false} left={<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Icon.Doc size={16} style={{ color: 'var(--muted)' }} /><span style={{ fontSize: 14, fontWeight: 500 }}>Help & support</span></div>} right={<Icon.Chevron size={16} style={{ color: 'var(--muted)' }} />} />
        </Card>
      </div>
    </div>
  );
}

// ---------- Compliance helpers + card ----------

window.complianceStatus = (dueDate) => {
  const today = new Date('2026-05-24');
  const d = new Date(dueDate);
  const days = Math.round((d - today) / (1000 * 60 * 60 * 24));
  if (days < 0) return { status: 'overdue', days, label: `${-days}d overdue`, color: 'var(--danger)', soft: 'oklch(0.94 0.05 28)' };
  if (days <= 14) return { status: 'urgent', days, label: `${days}d`, color: 'oklch(0.42 0.12 70)', soft: 'oklch(0.95 0.07 80)' };
  if (days <= 45) return { status: 'soon', days, label: `${days}d`, color: 'var(--caramel-deep)', soft: 'var(--caramel-soft)' };
  return { status: 'ok', days, label: `${days}d`, color: 'oklch(0.34 0.07 145)', soft: 'var(--sage-soft)' };
};

function ComplianceCard({ navigate, limit = 3 }) {
  const items = (window.__data.finance?.compliance || [])
    .map(c => ({ ...c, ...window.complianceStatus(c.dueDate) }))
    .sort((a, b) => a.days - b.days);
  if (items.length === 0) return null;
  const shown = items.slice(0, limit);
  const overdue = items.filter(i => i.status === 'overdue').length;
  const urgent = items.filter(i => i.status === 'urgent').length;
  const summary = overdue > 0
    ? `${overdue} overdue · ${urgent} urgent`
    : urgent > 0 ? `${urgent} due in 2 weeks` : 'All filings on track';
  const typeIcon = (type) => {
    if (type === 'licence') return <Icon.Doc size={15} />;
    if (type === 'tax-return') return <Icon.Receipt size={15} />;
    if (type === 'advance-tax') return <Icon.Wallet size={15} />;
    if (type === 'insurance') return <Icon.Heart size={15} />;
    return <Icon.Doc size={15} />;
  };
  return (
    <Card padding={0} style={{ overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Compliance</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{summary}</div>
        </div>
        {limit < items.length && (
          <span
            onClick={() => navigate && navigate('accounting')}
            style={{ fontSize: 12, color: 'var(--caramel-deep)', cursor: 'pointer', fontWeight: 600 }}
          >
            All →
          </span>
        )}
      </div>
      {shown.map((it, i) => (
        <div key={it.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 14px',
          borderBottom: i < shown.length - 1 ? '1px solid var(--line-soft)' : 'none',
        }}>
          <span style={{
            width: 32, height: 32, borderRadius: 8,
            background: it.soft, color: it.color,
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>{typeIcon(it.type)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{it.item}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              due {window.fmtDate(it.dueDate, { showYear: true })}
            </div>
          </div>
          <span style={{
            background: it.soft, color: it.color, border: '1px solid ' + it.color,
            padding: '3px 9px', borderRadius: 999,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>{it.label}</span>
        </div>
      ))}
    </Card>
  );
}

window.ComplianceCard = ComplianceCard;

// ---------- Upcoming-occasions card (birthday/anniversary reminders) ----------

window.upcomingOccasions = (windowDays = 30) => {
  const today = new Date('2026-05-24');
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + windowDays);
  const list = [];
  (window.__data.customers || []).forEach(c => {
    (c.occasions || []).forEach(occ => {
      // Compute the next occurrence in or after today, taking the year from occ.date.
      const orig = new Date(occ.date);
      // Use this year's date; if it's already passed, roll to next year.
      const thisYearDate = new Date(today.getFullYear(), orig.getMonth(), orig.getDate());
      const target = thisYearDate < today
        ? new Date(today.getFullYear() + 1, orig.getMonth(), orig.getDate())
        : thisYearDate;
      const days = Math.round((target - today) / (1000 * 60 * 60 * 24));
      if (days >= 0 && days <= windowDays) {
        list.push({ customer: c, occasion: occ, days, target: target.toISOString().slice(0, 10) });
      }
    });
  });
  return list.sort((a, b) => a.days - b.days);
};

function OccasionsCard({ navigate, limit = 3 }) {
  const items = window.upcomingOccasions(30).slice(0, limit);
  if (items.length === 0) return null;
  const occLabel = (kind) => ({
    'birthday': '🎂',
    'kid-birthday': '🧁',
    'anniversary': '💐',
    'milestone': '🎉',
  })[kind] || '🎂';
  return (
    <Card padding={0}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Upcoming occasions</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{window.upcomingOccasions(30).length} in next 30 days</div>
        </div>
      </div>
      {items.map((it, i) => (
        <ListRow
          key={it.customer.id + ':' + it.occasion.date}
          divider={i < items.length - 1}
          onClick={() => navigate('customer-detail', { id: it.customer.id })}
          padding="10px 14px"
          left={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{occLabel(it.occasion.kind)}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>
                  {it.occasion.label || it.occasion.kind} · {it.customer.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {it.days === 0 ? 'today' : it.days === 1 ? 'tomorrow' : `in ${it.days} days`} · {window.fmtDate(it.target)}
                </div>
              </div>
            </div>
          }
          right={<span style={{ fontSize: 11, color: 'var(--caramel-deep)', fontWeight: 600 }}>Pitch</span>}
        />
      ))}
    </Card>
  );
}

window.OccasionsCard = OccasionsCard;

// ---------- Mode picker ----------

function ModePicker({ current, onPick }) {
  return (
    <div style={{ paddingBottom: 24 }}>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 4px 14px', lineHeight: 1.5 }}>
        Pick the hat you're wearing right now. The app trims itself down to what matters in this mode — everything else is one tap away under More.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {window.MODE_ORDER.map(id => {
          const m = window.MODES[id];
          const sel = current === id;
          const c = window.TIMER_COLORS[m.color] || window.TIMER_COLORS.caramel;
          const Icn = Icon[m.iconKey] || Icon.Grid;
          return (
            <div
              key={id}
              onClick={() => onPick(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 14px',
                borderRadius: 'var(--r-lg)',
                background: sel ? c.soft : 'var(--surface)',
                border: '1.5px solid ' + (sel ? c.ring : 'var(--line)'),
                cursor: 'pointer',
              }}
            >
              <span style={{
                width: 44, height: 44, borderRadius: '50%',
                background: c.ring, color: 'var(--surface)',
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                <Icn size={22} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 17, color: 'var(--ink)', lineHeight: 1.2 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                  {m.desc}
                </div>
              </div>
              {sel && (
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: c.ring, color: 'var(--surface)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <Icon.Check size={14} />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Mode pill (used in Home header) ----------

function ModePill({ modeDef, onClick }) {
  if (!modeDef) return null;
  const c = window.TIMER_COLORS[modeDef.color] || window.TIMER_COLORS.caramel;
  const Icn = Icon[modeDef.iconKey] || Icon.Grid;
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px 4px 6px',
        borderRadius: 999,
        background: c.soft,
        border: '1px solid ' + c.ring,
        color: c.deep,
        fontSize: 12, fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
      title="Switch mode"
    >
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        background: c.ring, color: 'var(--surface)',
        display: 'grid', placeItems: 'center',
      }}>
        <Icn size={11} />
      </span>
      {modeDef.short}
      <Icon.ChevronDown size={12} />
    </button>
  );
}

window.ModePill = ModePill;

// ---------- Tweaks panel ----------

function TweaksPanel({ tweaks, setTweak }) {
  return (
    <div style={{ paddingBottom: 24 }}>
      <SectionHeader>Palette</SectionHeader>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { v: 'caramel', name: 'Caramel', color: 'oklch(0.58 0.13 55)' },
          { v: 'rose', name: 'Rose', color: 'oklch(0.58 0.13 25)' },
          { v: 'sage', name: 'Sage', color: 'oklch(0.52 0.10 145)' },
          { v: 'plum', name: 'Plum', color: 'oklch(0.50 0.12 340)' },
        ].map(p => {
          const sel = tweaks.palette === p.v;
          return (
            <div
              key={p.v}
              onClick={() => setTweak('palette', p.v)}
              style={{
                padding: '8px 4px',
                border: '1.5px solid ' + (sel ? p.color : 'var(--line)'),
                background: 'var(--surface)',
                borderRadius: 'var(--r)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 999,
                background: p.color, margin: '0 auto 4px',
              }} />
              <div style={{ fontSize: 11, fontWeight: 600 }}>{p.name}</div>
            </div>
          );
        })}
      </div>

      <SectionHeader>Density</SectionHeader>
      <SegmentedControl
        value={tweaks.density}
        onChange={v => setTweak('density', v)}
        options={[
          { value: 'cozy', label: 'Cozy' },
          { value: 'compact', label: 'Compact' },
        ]}
      />

      <SectionHeader>Appearance</SectionHeader>
      <Card padding={14}>
        <Toggle checked={tweaks.darkMode} onChange={v => setTweak('darkMode', v)} label="Dark mode" />
        <div style={{ height: 1, background: 'var(--line-soft)', margin: '10px 0' }} />
        <Toggle checked={tweaks.showBalances} onChange={v => setTweak('showBalances', v)} label="Show balances on home" />
      </Card>

      <div style={{ marginTop: 18, fontSize: 11.5, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
        Tweaks save to your phone. Reload anytime.
      </div>
    </div>
  );
}

// ---------- Notifications sheet ----------

function Notifications({ navigate }) {
  const items = [
    { who: 'Aanya Reddy', what: 'paid balance ₹2,800', when: '20 min', kind: 'pay', orderId: 'o-2071' },
    { who: 'Inventory', what: 'Pistachio paste below reorder', when: '2h', kind: 'stock' },
    { who: 'Mango campaign', what: '3 new orders today', when: '4h', kind: 'mkt' },
    { who: 'Vikram Iyer', what: 'asked about GST invoice', when: '5h', kind: 'msg', customerId: 'c-002' },
    { who: 'EMI reminder', what: 'Equipment loan ₹11,320 due Jun 1', when: '1d', kind: 'fin' },
  ];
  return (
    <div style={{ paddingBottom: 24 }}>
      <Card padding={0} style={{ marginTop: 4 }}>
        {items.map((n, i) => (
          <ListRow
            key={i}
            divider={i < items.length - 1}
            onClick={() => {
              if (n.orderId) navigate('order-detail', { id: n.orderId });
              if (n.customerId) navigate('customer-detail', { id: n.customerId });
            }}
            left={
              <div>
                <div style={{ fontSize: 13.5 }}>
                  <b style={{ fontWeight: 600 }}>{n.who}</b> {n.what}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{n.when} ago</div>
              </div>
            }
            right={<Icon.Chevron size={14} style={{ color: 'var(--muted)' }} />}
          />
        ))}
      </Card>
    </div>
  );
}

// ---------- Inbox sheet ----------

function InboxSheet({ navigate }) {
  const msgs = [
    { id: 'c-012', name: 'Divya Menon', preview: 'Can you do a 3-tier for engagement?', when: '2h', tag: 'New' },
    { id: 'c-002', name: 'Vikram Iyer', preview: 'GST invoice for last order', when: '5h', tag: null },
    { id: 'c-007', name: 'Priya Subramanian', preview: 'Confirming pickup time tomorrow', when: '1d', tag: 'VIP' },
    { id: 'c-005', name: 'Sara Joseph', preview: 'Twins bday — same setup as last year?', when: '2d', tag: null },
    { id: 'c-009', name: 'Nisha Pillai', preview: 'See you at 7! Address pinned.', when: '3d', tag: null },
  ];
  return (
    <div style={{ paddingBottom: 24 }}>
      <Card padding={0}>
        {msgs.map((m, i) => {
          const c = window.getCustomer(m.id);
          return (
            <ListRow
              key={m.id}
              divider={i < msgs.length - 1}
              onClick={() => navigate('customer-detail', { id: m.id })}
              left={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={m.name} tone={c?.avatarTone} size={38} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{m.name}</span>
                      {m.tag && <Pill tone={m.tag === 'VIP' ? 'caramel' : 'rose'} size="xs">{m.tag}</Pill>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.preview}</div>
                  </div>
                </div>
              }
              right={<span style={{ fontSize: 11, color: 'var(--muted)' }}>{m.when}</span>}
            />
          );
        })}
      </Card>
    </div>
  );
}

// ---------- Restock sheet ----------

function RestockSheet({ item, onClose }) {
  if (!item) return null;
  const [qty, setQty] = React.useState(item.reorderAt * 3);
  const total = qty * item.unitCost;
  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 14 }}>
        <span style={{
          width: 44, height: 44, borderRadius: 12, background: 'var(--caramel-soft)',
          color: 'var(--caramel-deep)', display: 'grid', placeItems: 'center',
        }}><Icon.Box size={20} /></span>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.supplier}</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Last restock {window.fmtDate(item.lastRestock)}</div>
        </div>
      </div>

      <Card padding={0}>
        <div style={{ padding: 14, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Current stock</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: item.qty < item.reorderAt ? 'var(--danger)' : 'var(--ink)' }}>{item.qty}{item.unit}</span>
        </div>
        <div style={{ padding: '0 14px 14px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Reorder threshold</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{item.reorderAt}{item.unit}</span>
        </div>
      </Card>

      <Field label={`Order quantity (${item.unit})`} style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setQty(Math.max(0, qty - 1))} style={{
            width: 38, height: 38, borderRadius: 'var(--r)', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 18, cursor: 'pointer',
          }}>−</button>
          <input
            value={qty}
            onChange={e => setQty(+e.target.value.replace(/[^0-9.]/g, '') || 0)}
            style={{
              flex: 1, fontFamily: 'DM Serif Display, serif', fontSize: 22,
              padding: '8px 12px', textAlign: 'center',
              border: '1px solid var(--line)', borderRadius: 'var(--r)',
              background: 'var(--surface)', outline: 'none',
            }}
          />
          <button onClick={() => setQty(qty + 1)} style={{
            width: 38, height: 38, borderRadius: 'var(--r)', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 18, cursor: 'pointer',
          }}>+</button>
        </div>
      </Field>

      <Card padding={14} style={{ marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Estimated cost · {qty}{item.unit} × ₹{item.unitCost}</span>
          <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22 }}>{window.fmtMoney(total)}</span>
        </div>
      </Card>

      <Button variant="primary" size="lg" full style={{ marginTop: 14 }} onClick={onClose} icon={<Icon.Whatsapp size={16} />}>
        Order via WhatsApp
      </Button>
    </div>
  );
}

// ---------- Mount ----------

window.__dataReady.then(() => {
  const root = ReactDOM.createRoot(document.getElementById('app'));
  root.render(<App />);
});

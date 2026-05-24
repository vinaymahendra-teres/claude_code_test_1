// Recipes list + recipe detail.

function Recipes({ navigate }) {
  const data = window.__data;
  const [filter, setFilter] = React.useState('all'); // all, eggless, signature

  let list = data.recipes;
  if (filter === 'eggless') list = list.filter(r => r.eggless);
  if (filter === 'signature') list = list.filter(r => r.category === 'Signature');

  return (
    <Screen>
      <div data-screen-label="Recipes">
        <ScreenHeader
          title="Recipes"
          subtitle={`${data.recipes.length} on the menu`}
          onBack={() => navigate('home')}
          right={<IconButton style={{ background: 'var(--caramel)', color: 'var(--surface)', width: 34, height: 34 }}><Icon.Plus size={20} /></IconButton>}
        />
        <div style={{ padding: '0 18px 8px', borderBottom: '1px solid var(--line-soft)' }}>
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'signature', label: 'Signature' },
              { value: 'eggless', label: 'Eggless' },
            ]}
          />
        </div>
        <ScreenBody padding="12px 18px 100px">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {list.map(r => (
              <div
                key={r.id}
                onClick={() => navigate('recipe-detail', { id: r.id })}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line-soft)',
                  borderRadius: 'var(--r-lg)',
                  padding: 10,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <CakeArt
                  tone={r.eggless ? 'sage' : r.category === 'Signature' ? 'caramel' : 'rose'}
                  size={170}
                  label={r.name}
                  style={{ width: '100%', height: 110, borderRadius: 12, marginBottom: 10 }}
                />
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon.Clock size={11} /> {r.prepMins + r.bakeMins}m
                  <span style={{ marginLeft: 'auto', color: 'var(--ink)', fontWeight: 600 }}>{window.fmtMoney(r.costPerCake)}</span>
                </div>
                {r.eggless && <Pill tone="sage" size="xs" style={{ marginTop: 6 }}>Eggless</Pill>}
              </div>
            ))}
          </div>
        </ScreenBody>
      </div>
    </Screen>
  );
}

function RecipeDetail({ navigate, id, toast }) {
  const r = window.__data.recipes.find(x => x.id === id);
  const timers = window.useTimers && window.useTimers();
  const [pendingStep, setPendingStep] = React.useState(null);
  if (!r) return <Screen><div style={{ padding: 20 }}>Not found</div></Screen>;

  const startStepTimer = (i, m) => {
    const ms = window.parseStepDuration(m);
    if (ms && timers) {
      timers.start({
        label: `${r.name} — step ${i + 1}`,
        durationMs: ms,
        color: r.eggless ? 'sage' : 'caramel',
        link: { kind: 'recipe', id: r.id, label: r.name },
      });
      toast && toast(`Timer set: ${window.fmtTimerTime(ms)}`);
    } else {
      setPendingStep({ index: i, text: m });
    }
  };

  return (
    <Screen>
      <div data-screen-label="Recipe Detail">
        <ScreenHeader
          title=" "
          onBack={() => navigate('back')}
          right={<><IconButton><Icon.Edit size={19} /></IconButton><IconButton><Icon.More size={20} /></IconButton></>}
        />
        <ScreenBody padding="0 0 80px">
          <CakeArt
            tone={r.eggless ? 'sage' : 'caramel'}
            label={r.name}
            style={{ width: '100%', height: 200 }}
          />
          <div style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <Pill tone="caramel" size="xs">{r.category}</Pill>
              {r.eggless && <Pill tone="sage" size="xs">Eggless</Pill>}
            </div>
            <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, margin: 0, lineHeight: 1.1 }}>{r.name}</h1>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>{r.yieldNote}</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
              <StatTile label="Prep" value={`${r.prepMins}m`} tone="rose" />
              <StatTile label="Bake" value={`${r.bakeMins}m`} tone="caramel" />
              <StatTile label="Cost" value={window.fmtMoney(r.costPerCake)} tone="sage" />
            </div>

            <SectionHeader>Ingredients</SectionHeader>
            <Card padding={0}>
              {r.ingredients.map((ing, i) => {
                const stock = window.__data.inventory.find(s => s.id === ing.stockKey);
                const low = stock && stock.qty < stock.reorderAt;
                return (
                  <ListRow
                    key={i}
                    divider={i < r.ingredients.length - 1}
                    padding="10px 14px"
                    left={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          width: 26, height: 26, borderRadius: 8,
                          background: low ? 'oklch(0.95 0.07 80)' : 'var(--surface-3)',
                          display: 'grid', placeItems: 'center',
                          color: low ? 'oklch(0.42 0.12 70)' : 'var(--muted)',
                        }}>{low ? <Icon.Bell size={13} /> : <Icon.Check size={13} />}</span>
                        <div style={{ fontSize: 13.5 }}>{ing.item}</div>
                      </div>
                    }
                    right={<span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontFamily: 'JetBrains Mono, monospace' }}>{ing.qty}</span>}
                  />
                );
              })}
            </Card>

            <SectionHeader action={<span onClick={() => navigate('kitchen')} style={{ color: 'var(--caramel-deep)', cursor: 'pointer', fontWeight: 600 }}>Kitchen →</span>}>Method</SectionHeader>
            <Card padding={14}>
              {r.method.map((m, i) => {
                const ms = window.parseStepDuration(m);
                return (
                  <div key={i} style={{
                    display: 'flex', gap: 12, padding: '6px 0', alignItems: 'flex-start',
                    borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)',
                    marginTop: i === 0 ? 0 : 6,
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 999,
                      background: 'var(--caramel-soft)',
                      color: 'var(--caramel-deep)',
                      display: 'grid', placeItems: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                      marginTop: 4,
                    }}>{i + 1}</span>
                    <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.55, paddingTop: 5 }}>{m}</div>
                    <button
                      onClick={() => startStepTimer(i, m)}
                      style={{
                        background: ms ? 'var(--caramel-soft)' : 'transparent',
                        color: ms ? 'var(--caramel-deep)' : 'var(--muted)',
                        border: '1px solid ' + (ms ? 'var(--caramel)' : 'var(--line)'),
                        borderRadius: 999,
                        padding: '4px 10px',
                        fontSize: 11, fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        marginTop: 2,
                        fontFamily: 'inherit',
                      }}
                      title="Start a timer for this step"
                    >
                      <Icon.Clock size={11} />
                      {ms ? window.fmtTimerTime(ms) : 'Timer'}
                    </button>
                  </div>
                );
              })}
            </Card>
          </div>
        </ScreenBody>

        <Sheet open={!!pendingStep} onClose={() => setPendingStep(null)} title="Start a timer">
          {pendingStep && (
            <NewTimerForm
              defaults={{
                label: `${r.name} — step ${pendingStep.index + 1}`,
                minutes: 5,
                color: r.eggless ? 'sage' : 'caramel',
                link: { kind: 'recipe', id: r.id, label: r.name },
              }}
              onStart={timers.start}
              onClose={() => { setPendingStep(null); toast && toast('Timer started'); }}
            />
          )}
        </Sheet>
      </div>
    </Screen>
  );
}

window.Recipes = Recipes;
window.RecipeDetail = RecipeDetail;

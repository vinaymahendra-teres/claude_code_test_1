// Kitchen tools — multi-timer rack + conversions.
// Components also used inline elsewhere (Bakes strip, persistent peek, recipe step button).

// ---------- Ring countdown ----------

function TimerRing({ progress, color = 'caramel', size = 56, stroke = 4, children }) {
  const c = window.TIMER_COLORS[color] || window.TIMER_COLORS.caramel;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.max(0, Math.min(1, progress));
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={c.ring} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ transition: 'stroke-dasharray .3s linear' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
        fontSize: size >= 56 ? 12 : 10, fontWeight: 600, color: c.deep, fontVariantNumeric: 'tabular-nums',
      }}>{children}</div>
    </div>
  );
}

window.TimerRing = TimerRing;

// ---------- Single timer card row ----------

function TimerCard({ t, onPause, onResume, onAdd, onDismiss, onRestart, onJump }) {
  const progress = t.status === 'done' ? 1 : 1 - (t.remainingMs / t.totalMs);
  const c = window.TIMER_COLORS[t.color] || window.TIMER_COLORS.caramel;
  const isDone = t.status === 'done';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 12px',
      borderRadius: 'var(--r-lg)',
      background: isDone ? c.soft : 'var(--surface)',
      border: '1px solid ' + (isDone ? c.ring : 'var(--line-soft)'),
      animation: isDone ? 'pulse 1.4s ease-in-out infinite' : undefined,
    }}>
      <TimerRing progress={progress} color={t.color} size={56}>
        {isDone ? 'DONE' : window.fmtTimerTime(t.remainingMs)}
      </TimerRing>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</div>
        {t.link && (
          <div onClick={() => onJump && onJump(t.link)} style={{ fontSize: 11.5, color: c.deep, marginTop: 2, cursor: onJump ? 'pointer' : 'default' }}>
            {t.link.label}
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
          {isDone ? 'tap +1m to extend or dismiss' :
            t.status === 'paused' ? 'paused' :
            `${window.fmtTimerTime(t.totalMs)} total`}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {isDone ? (
          <>
            <IconButton onClick={() => onAdd(t.id, 60000)} title="+1 min">
              <span style={{ fontSize: 11, fontWeight: 700, color: c.deep }}>+1m</span>
            </IconButton>
            <IconButton onClick={() => onDismiss(t.id)} title="Dismiss">
              <Icon.Check size={18} />
            </IconButton>
          </>
        ) : (
          <>
            <IconButton onClick={() => onAdd(t.id, 60000)} title="+1 min">
              <span style={{ fontSize: 11, fontWeight: 700 }}>+1m</span>
            </IconButton>
            {t.status === 'running' ? (
              <IconButton onClick={() => onPause(t.id)} title="Pause">
                <span style={{ display: 'inline-flex', gap: 2 }}>
                  <span style={{ width: 3, height: 12, background: 'currentColor', borderRadius: 1 }} />
                  <span style={{ width: 3, height: 12, background: 'currentColor', borderRadius: 1 }} />
                </span>
              </IconButton>
            ) : (
              <IconButton onClick={() => onResume(t.id)} title="Resume">
                <span style={{ width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '11px solid currentColor' }} />
              </IconButton>
            )}
            <IconButton onClick={() => onDismiss(t.id)} title="Stop">
              <Icon.X size={18} />
            </IconButton>
          </>
        )}
      </div>
    </div>
  );
}

window.TimerCard = TimerCard;

// ---------- New timer composer ----------

function NewTimerForm({ onStart, onClose, defaults = {} }) {
  const [label, setLabel] = React.useState(defaults.label || '');
  const [minutes, setMinutes] = React.useState(defaults.minutes != null ? String(defaults.minutes) : '5');
  const [color, setColor] = React.useState(defaults.color || 'caramel');
  const presets = [
    { label: 'Preheat', mins: 15, color: 'rose' },
    { label: 'Bake', mins: 35, color: 'caramel' },
    { label: 'Cool', mins: 20, color: 'sage' },
    { label: 'Whip', mins: 5, color: 'plum' },
    { label: 'Proof', mins: 60, color: 'caramel' },
    { label: 'Chill', mins: 30, color: 'sage' },
  ];

  const submit = () => {
    const mins = parseFloat(minutes);
    if (!isFinite(mins) || mins <= 0) return;
    onStart({
      label: label || `${mins}-min timer`,
      durationMs: Math.round(mins * 60 * 1000),
      color,
      link: defaults.link || null,
    });
    onClose && onClose();
  };

  return (
    <div style={{ padding: '4px 0 24px' }}>
      <Field label="Label">
        <TextInput
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="e.g. Belgian Dark — bake"
          autoFocus
        />
      </Field>

      <Field label="Quick presets">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {presets.map(p => (
            <span
              key={p.label}
              onClick={() => { setLabel(label || p.label); setMinutes(String(p.mins)); setColor(p.color); }}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                borderRadius: 999,
                fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: 999,
                background: window.TIMER_COLORS[p.color].ring,
              }} />
              {p.label} · {p.mins}m
            </span>
          ))}
        </div>
      </Field>

      <Field label="Minutes">
        <TextInput
          value={minutes}
          onChange={e => setMinutes(e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder="0"
          style={{ fontSize: 22, padding: '14px 12px', fontWeight: 600, fontFamily: 'DM Serif Display, serif' }}
        />
      </Field>

      <Field label="Color">
        <div style={{ display: 'flex', gap: 8 }}>
          {Object.keys(window.TIMER_COLORS).map(k => (
            <span
              key={k}
              onClick={() => setColor(k)}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: window.TIMER_COLORS[k].ring,
                cursor: 'pointer',
                boxShadow: color === k ? '0 0 0 3px var(--bg), 0 0 0 5px ' + window.TIMER_COLORS[k].ring : 'none',
              }}
            />
          ))}
        </div>
      </Field>

      <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
        <Button variant="secondary" size="lg" full onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="lg" full onClick={submit} icon={<Icon.Clock size={16} />}>Start</Button>
      </div>
    </div>
  );
}

window.NewTimerForm = NewTimerForm;

// ---------- Kitchen (Timers) screen ----------

function Kitchen({ navigate, toast }) {
  const timers = window.useTimers();
  const [adding, setAdding] = React.useState(false);

  if (!timers) return <Screen><div style={{ padding: 20 }}>Loading…</div></Screen>;

  const jump = (link) => {
    if (!link) return;
    if (link.kind === 'recipe') navigate('recipe-detail', { id: link.id });
    if (link.kind === 'order') navigate('order-detail', { id: link.id });
  };

  return (
    <Screen>
      <div data-screen-label="Kitchen">
        <ScreenHeader
          title="Kitchen"
          subtitle={`${timers.running.length} running · ${timers.done.length} done`}
          onBack={() => navigate('home')}
          right={
            <>
              <IconButton onClick={timers.muteToggle} title={timers.soundOn ? 'Mute' : 'Unmute'}>
                {timers.soundOn ? <Icon.Bell size={19} /> : <Icon.BellOff size={19} />}
              </IconButton>
              <IconButton onClick={() => setAdding(true)} style={{ background: 'var(--caramel)', color: 'var(--surface)', width: 34, height: 34 }}>
                <Icon.Plus size={20} />
              </IconButton>
            </>
          }
        />

        <ScreenBody padding="14px 18px 100px">
          {timers.timers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'var(--surface-3)',
                display: 'inline-grid', placeItems: 'center',
                color: 'var(--caramel)',
                marginBottom: 14,
              }}>
                <Icon.Clock size={32} />
              </div>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--ink)' }}>No timers yet</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Start a timer from a recipe step,<br />an order, or tap + here.</div>
              <Button variant="primary" size="lg" style={{ marginTop: 18 }} onClick={() => setAdding(true)} icon={<Icon.Plus size={16} />}>
                Start a timer
              </Button>
            </div>
          ) : (
            <>
              {timers.done.length > 0 && (
                <>
                  <SectionHeader>Done</SectionHeader>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {timers.done.map(t => (
                      <TimerCard
                        key={t.id} t={t}
                        onPause={timers.pause} onResume={timers.resume}
                        onAdd={timers.addMs} onDismiss={timers.dismiss}
                        onRestart={timers.restart} onJump={jump}
                      />
                    ))}
                  </div>
                </>
              )}

              {timers.running.length > 0 && (
                <>
                  <SectionHeader>Running</SectionHeader>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {timers.running
                      .slice()
                      .sort((a, b) => a.remainingMs - b.remainingMs)
                      .map(t => (
                        <TimerCard
                          key={t.id} t={t}
                          onPause={timers.pause} onResume={timers.resume}
                          onAdd={timers.addMs} onDismiss={timers.dismiss}
                          onRestart={timers.restart} onJump={jump}
                        />
                      ))}
                  </div>
                </>
              )}

              {timers.paused.length > 0 && (
                <>
                  <SectionHeader>Paused</SectionHeader>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {timers.paused.map(t => (
                      <TimerCard
                        key={t.id} t={t}
                        onPause={timers.pause} onResume={timers.resume}
                        onAdd={timers.addMs} onDismiss={timers.dismiss}
                        onRestart={timers.restart} onJump={jump}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </ScreenBody>

        <Sheet open={adding} onClose={() => setAdding(false)} title="New timer">
          <NewTimerForm
            onStart={timers.start}
            onClose={() => { setAdding(false); toast && toast('Timer started'); }}
          />
        </Sheet>
      </div>
    </Screen>
  );
}

// ---------- Conversions tool ----------

const CUP_GRAMS = {
  'All-purpose flour': 125,
  'Cake flour': 115,
  'Caster sugar': 200,
  'Brown sugar (packed)': 220,
  'Icing sugar': 120,
  'Butter (softened)': 227,
  'Cocoa powder': 90,
  'Milk (whole)': 240,
  'Greek yogurt': 245,
  'Honey': 340,
  'Pistachio paste': 270,
  'Heavy cream': 240,
};

function Tools({ navigate }) {
  const [tab, setTab] = React.useState('cups');
  const [cupsValue, setCupsValue] = React.useState('1');
  const [cupsIngredient, setCupsIngredient] = React.useState('All-purpose flour');
  const [tempValue, setTempValue] = React.useState('180');
  const [tempDir, setTempDir] = React.useState('c-to-f');
  const [scaleFrom, setScaleFrom] = React.useState('8');
  const [scaleTo, setScaleTo] = React.useState('12');

  const cupsResult = (() => {
    const n = parseFloat(cupsValue);
    if (!isFinite(n)) return '—';
    const g = (CUP_GRAMS[cupsIngredient] || 0) * n;
    return `${Math.round(g)} g`;
  })();
  const tempResult = (() => {
    const n = parseFloat(tempValue);
    if (!isFinite(n)) return '—';
    if (tempDir === 'c-to-f') return `${Math.round((n * 9) / 5 + 32)} °F`;
    return `${Math.round(((n - 32) * 5) / 9)} °C`;
  })();
  const scaleFactor = (() => {
    const f = parseFloat(scaleFrom);
    const t = parseFloat(scaleTo);
    if (!isFinite(f) || !isFinite(t) || f <= 0) return null;
    return t / f;
  })();

  return (
    <Screen>
      <div data-screen-label="Tools">
        <ScreenHeader
          title="Tools"
          subtitle="Cup-grams, temp, scale"
          onBack={() => navigate('home')}
        />
        <div style={{ padding: '0 18px 8px', borderBottom: '1px solid var(--line-soft)' }}>
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: 'cups', label: 'Cups ⇄ g' },
              { value: 'temp', label: '°C ⇄ °F' },
              { value: 'scale', label: 'Scale' },
            ]}
          />
        </div>

        <ScreenBody padding="14px 18px 100px">
          {tab === 'cups' && (
            <div>
              <Field label="Ingredient">
                <select
                  value={cupsIngredient}
                  onChange={e => setCupsIngredient(e.target.value)}
                  style={{
                    width: '100%', padding: '12px',
                    background: 'var(--surface)', border: '1px solid var(--line)',
                    borderRadius: 'var(--r)', fontSize: 14, fontFamily: 'inherit',
                  }}
                >
                  {Object.keys(CUP_GRAMS).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </Field>
              <Field label="Cups">
                <TextInput
                  value={cupsValue}
                  onChange={e => setCupsValue(e.target.value.replace(/[^0-9./]/g, ''))}
                  placeholder="1"
                  style={{ fontSize: 22, padding: '14px 12px', fontWeight: 600, fontFamily: 'DM Serif Display, serif' }}
                />
              </Field>
              <Card padding={18} style={{ marginTop: 14, background: 'var(--caramel-soft)', border: '1px solid var(--caramel)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--caramel-deep)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Grams</div>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 36, color: 'var(--caramel-deep)', marginTop: 4 }}>
                  {cupsResult}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                  {CUP_GRAMS[cupsIngredient]} g per cup
                </div>
              </Card>
            </div>
          )}

          {tab === 'temp' && (
            <div>
              <Field label="Direction">
                <SegmentedControl
                  value={tempDir}
                  onChange={setTempDir}
                  options={[
                    { value: 'c-to-f', label: '°C → °F' },
                    { value: 'f-to-c', label: '°F → °C' },
                  ]}
                />
              </Field>
              <Field label={tempDir === 'c-to-f' ? 'Celsius' : 'Fahrenheit'}>
                <TextInput
                  value={tempValue}
                  onChange={e => setTempValue(e.target.value.replace(/[^0-9.\-]/g, ''))}
                  placeholder="0"
                  style={{ fontSize: 22, padding: '14px 12px', fontWeight: 600, fontFamily: 'DM Serif Display, serif' }}
                />
              </Field>
              <Card padding={18} style={{ marginTop: 14, background: 'var(--rose-soft)', border: '1px solid var(--rose)' }}>
                <div style={{ fontSize: 11.5, color: 'oklch(0.38 0.10 25)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {tempDir === 'c-to-f' ? 'Fahrenheit' : 'Celsius'}
                </div>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 36, color: 'oklch(0.38 0.10 25)', marginTop: 4 }}>
                  {tempResult}
                </div>
              </Card>
              <SectionHeader>Common bake temps</SectionHeader>
              <Card padding={0}>
                {[
                  ['Low / proof', '50 °C', '120 °F'],
                  ['Sponge cake', '165 °C', '325 °F'],
                  ['Standard bake', '180 °C', '350 °F'],
                  ['Bread', '200 °C', '395 °F'],
                  ['Pizza', '230 °C', '450 °F'],
                ].map(([k, c, f], i, arr) => (
                  <ListRow
                    key={k}
                    divider={i < arr.length - 1}
                    padding="10px 14px"
                    left={<div style={{ fontSize: 13.5 }}>{k}</div>}
                    right={<div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontFamily: 'JetBrains Mono, monospace' }}>{c} · {f}</div>}
                  />
                ))}
              </Card>
            </div>
          )}

          {tab === 'scale' && (
            <div>
              <Field label="Original servings">
                <TextInput value={scaleFrom} onChange={e => setScaleFrom(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="8" />
              </Field>
              <Field label="Target servings">
                <TextInput value={scaleTo} onChange={e => setScaleTo(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="12" />
              </Field>
              <Card padding={18} style={{ marginTop: 14, background: 'var(--sage-soft)', border: '1px solid var(--sage)' }}>
                <div style={{ fontSize: 11.5, color: 'oklch(0.34 0.07 145)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Multiply every ingredient by</div>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 36, color: 'oklch(0.34 0.07 145)', marginTop: 4 }}>
                  {scaleFactor ? '×' + scaleFactor.toFixed(2) : '—'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
                  Bake time scales less than linearly — add 10-15% time, keep temp the same.
                </div>
              </Card>
            </div>
          )}
        </ScreenBody>
      </div>
    </Screen>
  );
}

window.Kitchen = Kitchen;
window.Tools = Tools;

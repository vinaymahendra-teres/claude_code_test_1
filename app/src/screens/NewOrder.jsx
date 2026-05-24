// New Order multi-step flow:
// 1. Customer (existing or new)
// 2. Cake (flavor, size, eggless, servings)
// 3. Theme + references
// 4. Delivery (date, slot, area)
// 5. Pricing + deposit
// 6. Review

function NewOrder({ navigate, toast }) {
  const data = window.__data;
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState({
    customerId: null,
    newCustomerName: '',
    newCustomerPhone: '',
    newCustomerInsta: '',
    title: '',
    flavor: '',
    size: '',
    servings: '',
    eggless: false,
    theme: '',
    addOns: [],
    deliveryDate: '',
    deliverySlot: '',
    deliveryArea: '',
    coldChainNotes: '',
    price: '',
    deposit: '',
    notes: '',
  });
  const [errors, setErrors] = React.useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const steps = [
    { label: 'Customer', icon: <Icon.Users size={14} /> },
    { label: 'Cake', icon: <Icon.Cake size={14} /> },
    { label: 'Theme', icon: <Icon.Sparkle size={14} /> },
    { label: 'Delivery', icon: <Icon.Truck size={14} /> },
    { label: 'Pricing', icon: <Icon.Wallet size={14} /> },
    { label: 'Review', icon: <Icon.Check size={14} /> },
  ];

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.customerId && !form.newCustomerName) e.customer = 'Pick or add a customer';
      if (!form.customerId && form.newCustomerName && !form.newCustomerPhone && !form.newCustomerInsta) e.contact = 'Add a phone or Instagram handle';
    }
    if (step === 1) {
      if (!form.title) e.title = 'Give the order a name';
      if (!form.flavor) e.flavor = 'Pick a flavor';
      if (!form.size) e.size = 'Pick a size';
    }
    if (step === 2) {
      if (!form.theme) e.theme = 'Describe the theme — even a sentence helps';
    }
    if (step === 3) {
      if (!form.deliveryDate) e.deliveryDate = 'Pick a date';
      if (!form.deliverySlot) e.deliverySlot = 'Pick a time slot';
      if (!form.deliveryArea) e.deliveryArea = 'Where is this going?';
    }
    if (step === 4) {
      if (!form.price || isNaN(+form.price)) e.price = 'Enter a number';
      else if (+form.price < 500) e.price = 'Hmm, ₹500 floor for custom orders';
      if (form.deposit && isNaN(+form.deposit)) e.deposit = 'Enter a number';
      else if (form.deposit && +form.deposit > +form.price) e.deposit = 'Deposit cannot exceed price';
    }
    return e;
  };

  const next = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) {
      if (step === steps.length - 1) {
        toast('Order saved · WhatsApp draft created');
        setTimeout(() => navigate('orders'), 600);
      } else {
        setStep(s => s + 1);
      }
    }
  };

  const back = () => {
    if (step === 0) navigate('back');
    else setStep(s => s - 1);
  };

  return (
    <Screen>
      <div data-screen-label="New Order">
        <ScreenHeader
          title="New order"
          subtitle={steps[step].label}
          onBack={back}
          right={<IconButton onClick={() => { toast('Saved as draft'); navigate('orders'); }} style={{ fontSize: 13, width: 'auto', padding: '0 8px', color: 'var(--muted)' }}>Save draft</IconButton>}
        />

        {/* Stepper */}
        <div style={{ padding: '6px 18px 14px', background: 'var(--bg)', borderBottom: '1px solid var(--line-soft)' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {steps.map((s, i) => (
              <div key={s.label} style={{ flex: 1 }}>
                <div style={{
                  height: 4, borderRadius: 999,
                  background: i <= step ? 'var(--caramel)' : 'var(--line)',
                  transition: 'background .2s',
                }} />
                <div style={{
                  fontSize: 10.5, marginTop: 5, textAlign: 'center',
                  fontWeight: i === step ? 600 : 500,
                  color: i === step ? 'var(--ink)' : 'var(--muted)',
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <ScreenBody padding="16px 18px 100px">
          {step === 0 && <StepCustomer form={form} set={set} errors={errors} />}
          {step === 1 && <StepCake form={form} set={set} errors={errors} />}
          {step === 2 && <StepTheme form={form} set={set} errors={errors} />}
          {step === 3 && <StepDelivery form={form} set={set} errors={errors} />}
          {step === 4 && <StepPricing form={form} set={set} errors={errors} />}
          {step === 5 && <StepReview form={form} />}
        </ScreenBody>

        {/* Bottom action bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 18px 24px',
          background: 'var(--bg)',
          borderTop: '1px solid var(--line-soft)',
          display: 'flex', gap: 10,
        }}>
          <Button variant="secondary" size="lg" onClick={back} style={{ width: 100 }}>
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button variant="primary" size="lg" full onClick={next}>
            {step === steps.length - 1 ? 'Create order' : 'Continue'}
            {step !== steps.length - 1 && <Icon.Arrow size={16} />}
          </Button>
        </div>
      </div>
    </Screen>
  );
}

// ---------- Step 1: Customer ----------

function StepCustomer({ form, set, errors }) {
  const data = window.__data;
  const [search, setSearch] = React.useState('');
  const [adding, setAdding] = React.useState(false);

  const filtered = data.customers
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.instagram.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 6);

  if (adding) {
    return (
      <div>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: '0 0 4px' }}>Add new customer</h2>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 18px' }}>We'll auto-create their profile.</p>
        <Field label="Full name" error={errors.contact && !form.newCustomerName ? 'Required' : null}>
          <TextInput value={form.newCustomerName} onChange={e => set('newCustomerName', e.target.value)} placeholder="e.g. Aanya Reddy" />
        </Field>
        <Field label="Instagram handle" optional>
          <TextInput value={form.newCustomerInsta} onChange={e => set('newCustomerInsta', e.target.value)} placeholder="@username" prefix="@" />
        </Field>
        <Field label="Phone" optional error={errors.contact}>
          <TextInput value={form.newCustomerPhone} onChange={e => set('newCustomerPhone', e.target.value)} placeholder="+91 …" />
        </Field>
        <Button variant="ghost" size="sm" onClick={() => setAdding(false)} icon={<Icon.ChevronLeft size={14} />}>Back to search</Button>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: '0 0 4px' }}>Who's the order for?</h2>
      <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 18px' }}>Search existing or add a new contact.</p>

      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Icon.Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, @handle"
          style={{
            width: '100%', fontFamily: 'inherit', fontSize: 14,
            padding: '11px 12px 11px 36px',
            borderRadius: 'var(--r)',
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <Card padding={0}>
        <ListRow
          onClick={() => setAdding(true)}
          left={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 40, height: 40, borderRadius: 999,
                background: 'var(--caramel-soft)',
                color: 'var(--caramel-deep)',
                display: 'grid', placeItems: 'center',
              }}><Icon.Plus size={18} /></span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Add new customer</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>First time ordering</div>
              </div>
            </div>
          }
          right={<Icon.Chevron size={16} style={{ color: 'var(--muted)' }} />}
        />
        {filtered.map((c, i) => {
          const selected = form.customerId === c.id;
          return (
            <ListRow
              key={c.id}
              divider={i < filtered.length - 1}
              onClick={() => set('customerId', selected ? null : c.id)}
              left={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={c.name} tone={c.avatarTone} size={40} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center' }}>
                      {c.name}
                      {c.tags.includes('VIP') && <Pill tone="caramel" size="xs">VIP</Pill>}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                      {c.area} · {c.orderCount} {c.orderCount === 1 ? 'order' : 'orders'}
                    </div>
                  </div>
                </div>
              }
              right={
                selected ? (
                  <span style={{
                    width: 22, height: 22, borderRadius: 999, background: 'var(--caramel)', color: 'var(--surface)',
                    display: 'grid', placeItems: 'center',
                  }}><Icon.Check size={14} /></span>
                ) : null
              }
            />
          );
        })}
      </Card>
      {errors.customer && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>{errors.customer}</div>}
    </div>
  );
}

// ---------- Step 2: Cake ----------

function StepCake({ form, set, errors }) {
  const data = window.__data;
  return (
    <div>
      <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: '0 0 4px' }}>What are we baking?</h2>
      <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 18px' }}>Pick a flavor from your menu and size it up.</p>

      <Field label="Order name" hint={'A short title for your kitchen — “Pastel floral 6″ — Aanya”'} error={errors.title}>
        <TextInput value={form.title} onChange={e => set('title', e.target.value)} placeholder={'e.g. Pastel floral 6″ — Aanya'} error={!!errors.title} />
      </Field>

      <Field label="Flavor" error={errors.flavor}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -18px', padding: '4px 18px 4px', scrollbarWidth: 'none' }}>
          {data.recipes.map(r => {
            const selected = form.flavor === r.name;
            return (
              <div
                key={r.id}
                onClick={() => set('flavor', r.name)}
                style={{
                  flexShrink: 0,
                  width: 130,
                  background: selected ? 'var(--caramel-soft)' : 'var(--surface)',
                  border: '1.5px solid ' + (selected ? 'var(--caramel)' : 'var(--line-soft)'),
                  borderRadius: 14,
                  padding: 10,
                  cursor: 'pointer',
                  transition: 'border-color .12s',
                }}
              >
                <CakeArt tone={r.eggless ? 'sage' : 'caramel'} size={110} label={r.name.split(' ')[0]} style={{ width: '100%', height: 78, marginBottom: 8 }} />
                <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }}>{r.name}</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>
                  {r.eggless && <Pill tone="sage" size="xs" style={{ marginRight: 4 }}>Eggless</Pill>}
                  cost {window.fmtMoney(r.costPerCake)}
                </div>
              </div>
            );
          })}
        </div>
      </Field>

      <Field label="Size" error={errors.size}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { v: 'Bento', servings: 2, price: '₹1.2k' },
            { v: '4 inch', servings: 6, price: '₹1.8k' },
            { v: '6 inch', servings: 12, price: '₹3.5k' },
            { v: '7 inch', servings: 16, price: '₹4.5k' },
            { v: '8 inch', servings: 22, price: '₹5.5k' },
            { v: 'Two-tier', servings: 38, price: '₹12k+' },
          ].map(s => {
            const sel = form.size === s.v;
            return (
              <div
                key={s.v}
                onClick={() => {
                  set('size', s.v);
                  set('servings', s.servings);
                }}
                style={{
                  padding: '10px 8px',
                  border: '1.5px solid ' + (sel ? 'var(--caramel)' : 'var(--line)'),
                  background: sel ? 'var(--caramel-soft)' : 'var(--surface)',
                  borderRadius: 'var(--r)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.v}</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>{s.servings} servings · {s.price}</div>
              </div>
            );
          })}
        </div>
      </Field>

      <Field label="Eggless?">
        <Toggle checked={form.eggless} onChange={v => set('eggless', v)} label={form.eggless ? "Yes — eggless build" : "Regular (with eggs)"} />
      </Field>
    </div>
  );
}

// ---------- Step 3: Theme ----------

function StepTheme({ form, set, errors }) {
  const addOnOptions = ['Matching cupcakes (12)', 'Cake topper', 'Number candle', 'Custom message card', 'Edible photo print', 'Gold leaf finish'];
  return (
    <div>
      <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: '0 0 4px' }}>Describe the look</h2>
      <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 18px' }}>Paste the brief from their DM. References help.</p>

      <Field label="Theme & vibe" hint="Be specific — palette, motifs, message text" error={errors.theme}>
        <TextInput
          multiline
          value={form.theme}
          onChange={e => set('theme', e.target.value)}
          placeholder="e.g. Pastel floral, ivory + dusty pink. Hand-piped peonies. Topper: 'Sixty & Glowing'"
          error={!!errors.theme}
        />
      </Field>

      <Field label="Reference images" optional>
        <div style={{
          border: '1.5px dashed var(--line)',
          borderRadius: 'var(--r)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface-2)',
          cursor: 'pointer',
        }}>
          <Icon.Camera size={24} style={{ color: 'var(--muted)' }} />
          <div style={{ fontSize: 13, fontWeight: 600 }}>Drop images, paste link, or upload</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Up to 8 references</div>
        </div>
      </Field>

      <Field label="Add-ons" optional>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {addOnOptions.map(a => {
            const selected = form.addOns.includes(a);
            return (
              <span
                key={a}
                onClick={() => {
                  const next = selected ? form.addOns.filter(x => x !== a) : [...form.addOns, a];
                  set('addOns', next);
                }}
                style={{
                  padding: '7px 11px',
                  fontSize: 12.5, fontWeight: 600,
                  borderRadius: 999,
                  border: '1.5px solid ' + (selected ? 'var(--caramel)' : 'var(--line)'),
                  background: selected ? 'var(--caramel-soft)' : 'var(--surface)',
                  color: selected ? 'var(--caramel-deep)' : 'var(--ink-soft)',
                  cursor: 'pointer',
                  display: 'inline-flex', gap: 4, alignItems: 'center',
                }}
              >
                {selected && <Icon.Check size={12} />}{a}
              </span>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

// ---------- Step 4: Delivery ----------

function StepDelivery({ form, set, errors }) {
  // Date picker — next 14 days
  const today = new Date('2026-05-24');
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  // Capacity + festival lookups
  const data = window.__data;
  const cal = data.calendar || { capacityCeiling: 3, blockedDates: [] };
  const blockedMap = {};
  cal.blockedDates.forEach(b => { blockedMap[b.date] = b; });
  // Capacity load = count non-draft orders per date (excluding the in-progress new order)
  const loadByDate = {};
  data.orders.forEach(o => {
    if (o.status === 'draft') return;
    loadByDate[o.deliveryDate] = (loadByDate[o.deliveryDate] || 0) + 1;
  });

  const selDate = form.deliveryDate;
  const selBlock = selDate ? blockedMap[selDate] : null;
  const selLoad = selDate ? (loadByDate[selDate] || 0) : 0;
  const selCeil = cal.capacityCeiling;
  const selFull = selLoad >= selCeil;

  // Cold-chain notes relevant for Mar-Sep (Hyderabad heat / monsoon)
  const showColdChain = selDate && (() => {
    const m = parseInt(selDate.slice(5, 7), 10);
    return m >= 3 && m <= 9;
  })();

  return (
    <div>
      <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: '0 0 4px' }}>When & where?</h2>
      <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 18px' }}>Block delivery slots to avoid kitchen pile-ups.</p>

      <Field label="Delivery date" error={errors.deliveryDate}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', margin: '0 -18px', padding: '0 18px 4px', scrollbarWidth: 'none' }}>
          {dates.map(d => {
            const dt = new Date(d);
            const selected = form.deliveryDate === d;
            const isToday = d === '2026-05-24';
            const load = loadByDate[d] || 0;
            const full = load >= cal.capacityCeiling;
            const blocked = !!blockedMap[d];
            const heat = blocked ? 'var(--danger)' : full ? 'var(--warn)' : load > 0 ? 'var(--caramel)' : 'var(--ok)';
            return (
              <div
                key={d}
                onClick={() => set('deliveryDate', d)}
                style={{
                  flexShrink: 0,
                  width: 58, padding: '10px 0 8px',
                  border: '1.5px solid ' + (selected ? 'var(--caramel)' : 'var(--line)'),
                  background: selected ? 'var(--caramel)' : 'var(--surface)',
                  color: selected ? 'var(--surface)' : 'var(--ink)',
                  borderRadius: 'var(--r)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: 10.5, opacity: 0.8 }}>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()]}</div>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, lineHeight: 1.1, marginTop: 4 }}>
                  {dt.getDate()}
                </div>
                {isToday && <div style={{ fontSize: 9, marginTop: 2, opacity: 0.8 }}>today</div>}
                <div style={{
                  width: 6, height: 6, borderRadius: 999,
                  background: heat,
                  margin: '4px auto 0',
                  opacity: selected ? 0.9 : 0.85,
                }} />
              </div>
            );
          })}
        </div>
      </Field>

      {/* Context for the selected date — capacity + festival */}
      {selDate && (
        <div style={{
          padding: '10px 12px',
          marginTop: -6, marginBottom: 16,
          borderRadius: 'var(--r)',
          background: selBlock ? 'oklch(0.94 0.05 28)' : selFull ? 'oklch(0.95 0.07 80)' : 'var(--sage-soft)',
          border: '1px solid ' + (selBlock ? 'var(--danger)' : selFull ? 'oklch(0.82 0.12 80)' : 'var(--sage)'),
          fontSize: 12.5, lineHeight: 1.5,
          color: selBlock ? 'var(--danger)' : selFull ? 'oklch(0.40 0.10 70)' : 'oklch(0.32 0.06 145)',
        }}>
          {selBlock ? (
            <>
              <strong>{selBlock.type === 'festival' ? '🪔 Festival' : '🚧 Blocked'}</strong> · {selBlock.reason}
            </>
          ) : selFull ? (
            <>
              <strong>At capacity</strong> · {selLoad} cake{selLoad === 1 ? '' : 's'} already on this date (ceiling {selCeil}). Push to next day or quote a premium.
            </>
          ) : (
            <>
              <strong>{selLoad}/{selCeil} cakes</strong> already booked · {selCeil - selLoad} slot{selCeil - selLoad === 1 ? '' : 's'} left for this date.
            </>
          )}
        </div>
      )}

      <Field label="Time slot" error={errors.deliverySlot}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {['9 AM', '11 AM', '1 PM', '3 PM', '5 PM', '7 PM', '8 PM', 'Anytime'].map(s => {
            const sel = form.deliverySlot === s;
            return (
              <div
                key={s}
                onClick={() => set('deliverySlot', s)}
                style={{
                  padding: '9px 4px', fontSize: 12.5,
                  border: '1.5px solid ' + (sel ? 'var(--caramel)' : 'var(--line)'),
                  background: sel ? 'var(--caramel-soft)' : 'var(--surface)',
                  borderRadius: 'var(--r)',
                  textAlign: 'center', cursor: 'pointer',
                  fontWeight: sel ? 600 : 500,
                }}
              >{s}</div>
            );
          })}
        </div>
      </Field>

      <Field label="Area / address" error={errors.deliveryArea}>
        <TextInput value={form.deliveryArea} onChange={e => set('deliveryArea', e.target.value)} placeholder="Madhapur, near IKEA" error={!!errors.deliveryArea} />
      </Field>

      {showColdChain && (
        <Field label="Cold-chain notes" optional>
          <TextInput
            value={form.coldChainNotes}
            onChange={e => set('coldChainNotes', e.target.value)}
            placeholder="Insulated box + 4 ice packs · keep upright"
          />
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.45 }}>
            Hyderabad heat / monsoon (Mar–Sep) — buttercream and cream cakes need ice packs and short transit.
          </div>
        </Field>
      )}
    </div>
  );
}

// ---------- Step 5: Pricing ----------

function StepPricing({ form, set, errors }) {
  const price = +form.price || 0;
  const deposit = +form.deposit || 0;
  const recipe = window.getRecipeByFlavor(form.flavor);
  const ingCost = recipe?.costPerCake || 0;
  const margin = price - ingCost;
  const marginPct = price > 0 ? Math.round((margin / price) * 100) : 0;

  return (
    <div>
      <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: '0 0 4px' }}>Price it out</h2>
      <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 18px' }}>Cost auto-pulled from the recipe. Margin updates live.</p>

      <Field label="Quoted price" error={errors.price}>
        <TextInput
          value={form.price}
          onChange={e => set('price', e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder="0"
          prefix="₹"
          error={!!errors.price}
        />
      </Field>

      <Field label="Deposit / advance" hint="Standard practice: 50% upfront" optional error={errors.deposit}>
        <TextInput
          value={form.deposit}
          onChange={e => set('deposit', e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder="0"
          prefix="₹"
          error={!!errors.deposit}
        />
        {price > 0 && !form.deposit && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {[0.3, 0.5, 1.0].map(pct => (
              <Button key={pct} size="sm" variant="secondary" onClick={() => set('deposit', String(Math.round(price * pct)))}>
                {(pct * 100).toFixed(0)}% · ₹{Math.round(price * pct).toLocaleString('en-IN')}
              </Button>
            ))}
          </div>
        )}
      </Field>

      <Card style={{ background: 'var(--surface-2)', marginTop: 4 }}>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>
          Cost breakdown
        </div>
        <Row label="Ingredients cost" value={window.fmtMoney(ingCost)} />
        <Row label="Quoted price" value={window.fmtMoney(price)} />
        <div style={{ borderTop: '1px dashed var(--line)', margin: '10px 0' }} />
        <Row label="Gross margin" value={`${window.fmtMoney(margin)} (${marginPct}%)`} valueColor={marginPct >= 50 ? 'var(--ok)' : marginPct >= 30 ? 'var(--warn)' : 'var(--danger)'} />
        <Row label="Deposit" value={window.fmtMoney(deposit)} />
        <Row label="Balance on delivery" value={window.fmtMoney(price - deposit)} bold />
      </Card>

      <Field label="Internal notes" optional style={{ marginTop: 14 }}>
        <TextInput multiline value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Allergies, special instructions for the kitchen…" />
      </Field>
    </div>
  );
}

function Row({ label, value, bold, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: bold ? 700 : 600, color: valueColor || 'var(--ink)' }}>{value}</span>
    </div>
  );
}

// ---------- Step 6: Review ----------

function StepReview({ form }) {
  const customer = form.customerId ? window.getCustomer(form.customerId) : null;
  const customerName = customer?.name || form.newCustomerName;

  return (
    <div>
      <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: '0 0 4px' }}>Looks good?</h2>
      <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 18px' }}>This creates the order and starts a WhatsApp draft.</p>

      <CakeArt tone={customer?.avatarTone || 'caramel'} label={form.flavor} style={{ width: '100%', height: 140, borderRadius: 14, marginBottom: 14 }} />

      <Card padding={0}>
        <ListRow divider left={<div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Customer</div><div style={{ fontWeight: 600 }}>{customerName}</div></div>} />
        <ListRow divider left={<div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Order</div><div style={{ fontWeight: 600 }}>{form.title}</div></div>} />
        <ListRow divider left={<div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Flavor & size</div><div style={{ fontWeight: 600 }}>{form.flavor} · {form.size}{form.eggless ? ' · Eggless' : ''}</div></div>} />
        <ListRow divider left={<div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Theme</div><div style={{ fontSize: 13, lineHeight: 1.4 }}>{form.theme}</div></div>} />
        {form.addOns.length > 0 && <ListRow divider left={<div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Add-ons</div><div style={{ fontSize: 13 }}>{form.addOns.join(', ')}</div></div>} />}
        <ListRow divider left={<div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Delivery</div><div style={{ fontWeight: 600 }}>{window.fmtDate(form.deliveryDate, { showYear: true })} · {form.deliverySlot}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>{form.deliveryArea}</div></div>} />
        <ListRow divider={false} left={<div style={{ width: '100%' }}><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Price</div><div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22 }}>{window.fmtMoney(+form.price || 0)}</div><div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, color: 'var(--muted)' }}>Deposit · {window.fmtMoney(+form.deposit || 0)}</div><div style={{ fontSize: 12, color: 'var(--danger)' }}>Balance · {window.fmtMoney((+form.price || 0) - (+form.deposit || 0))}</div></div></div></div>} />
      </Card>

      <Card style={{ marginTop: 12, background: 'var(--caramel-soft)', border: '1px solid oklch(0.86 0.05 70)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Icon.Whatsapp size={20} style={{ color: 'var(--caramel-deep)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--caramel-deep)' }}>WhatsApp confirmation</div>
            <div style={{ fontSize: 12.5, color: 'var(--caramel-deep)', marginTop: 2, opacity: 0.85, lineHeight: 1.45 }}>
              Draft message ready — confirms details, shares payment link for {window.fmtMoney(+form.deposit || 0)}, and pins the delivery slot.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

window.NewOrder = NewOrder;

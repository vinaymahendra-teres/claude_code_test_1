// Marketing — campaigns list + new campaign flow.

function Marketing({ navigate, toast }) {
  const data = window.__data;
  const [view, setView] = React.useState('campaigns');

  return (
    <Screen>
      <div data-screen-label="Marketing">
        <ScreenHeader
          title="Marketing"
          subtitle="Reach the right people"
          onBack={() => navigate('home')}
          right={<IconButton onClick={() => navigate('new-campaign')} style={{ background: 'var(--caramel)', color: 'var(--surface)', width: 34, height: 34 }}><Icon.Plus size={20} /></IconButton>}
        />

        <div style={{ padding: '0 18px 8px', borderBottom: '1px solid var(--line-soft)' }}>
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { value: 'campaigns', label: 'Campaigns' },
              { value: 'audience', label: 'Audience' },
              { value: 'templates', label: 'Templates' },
            ]}
          />
        </div>

        <ScreenBody padding="12px 18px 100px">
          {view === 'campaigns' && <CampaignsList navigate={navigate} toast={toast} />}
          {view === 'audience' && <AudienceView />}
          {view === 'templates' && <TemplatesView toast={toast} />}
        </ScreenBody>
      </div>
    </Screen>
  );
}

function CampaignsList({ navigate, toast }) {
  const data = window.__data;
  const live = data.marketing.campaigns.filter(c => c.status === 'live');
  const draft = data.marketing.campaigns.filter(c => c.status === 'draft');
  const done = data.marketing.campaigns.filter(c => c.status === 'completed');

  const totalRevenue = data.marketing.campaigns.reduce((s, c) => s + c.revenue, 0);
  const totalSpend = data.marketing.campaigns.reduce((s, c) => s + c.spend, 0);
  const roas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(1) : '∞';

  return (
    <div>
      {/* ROAS card */}
      <Card padding={0} style={{
        background: 'linear-gradient(135deg, var(--rose-soft), var(--caramel-soft))',
        border: '1px solid oklch(0.86 0.05 50)',
      }}>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Last 30 days</div>
          <div style={{ display: 'flex', gap: 20, marginTop: 6, alignItems: 'baseline' }}>
            <div>
              <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28 }}>{window.fmtCompactMoney(totalRevenue)}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)', marginLeft: 4 }}>revenue</span>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{roas}×</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>return on spend</div>
            </div>
          </div>
        </div>
      </Card>

      {live.length > 0 && (
        <>
          <SectionHeader>Live</SectionHeader>
          {live.map(c => <CampaignCard key={c.id} c={c} navigate={navigate} />)}
        </>
      )}
      {draft.length > 0 && (
        <>
          <SectionHeader>Drafts</SectionHeader>
          {draft.map(c => <CampaignCard key={c.id} c={c} navigate={navigate} />)}
        </>
      )}
      {done.length > 0 && (
        <>
          <SectionHeader>Completed</SectionHeader>
          {done.map(c => <CampaignCard key={c.id} c={c} navigate={navigate} />)}
        </>
      )}
    </div>
  );
}

function CampaignCard({ c, navigate }) {
  const channels = {
    'Instagram Reels': <Icon.Instagram size={13} />,
    'Instagram Post': <Icon.Instagram size={13} />,
    'Instagram Story': <Icon.Instagram size={13} />,
    'WhatsApp Broadcast': <Icon.Whatsapp size={13} />,
    'WhatsApp': <Icon.Whatsapp size={13} />,
    'Email': <Icon.Mail size={13} />,
  };
  return (
    <Card
      style={{ marginBottom: 10 }}
      padding={14}
      onClick={() => navigate('campaign-detail', { id: c.id })}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
            <Pill tone={c.status === 'live' ? 'ok' : c.status === 'draft' ? 'neutral' : 'caramel'} size="xs">
              {c.status === 'live' ? 'Live' : c.status === 'draft' ? 'Draft' : 'Done'}
            </Pill>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>{c.subject}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
            {c.channels.map((ch, i) => (
              <span key={i} style={{ color: 'var(--muted)' }}>{channels[ch] || ch}</span>
            ))}
            <span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--line)' }} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{c.audience}</span>
          </div>
        </div>
        {c.status !== 'draft' && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18 }}>{window.fmtCompactMoney(c.revenue)}</div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{c.orders} orders</div>
          </div>
        )}
      </div>
      {c.status !== 'draft' && (
        <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line-soft)' }}>
          <Stat label="Open" value={`${Math.round(c.openRate * 100)}%`} />
          <Stat label="Click" value={`${Math.round(c.clickRate * 100)}%`} />
          <Stat label="Spend" value={window.fmtCompactMoney(c.spend)} />
          <Stat label="ROAS" value={c.spend > 0 ? `${(c.revenue / c.spend).toFixed(1)}×` : '∞'} />
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{label}</div>
    </div>
  );
}

function AudienceView() {
  const data = window.__data;
  const segments = [
    { name: 'All customers', count: data.customers.length, color: 'var(--caramel)' },
    { name: 'VIP', count: data.customers.filter(c => c.tags.includes('VIP')).length, color: 'var(--rose)' },
    { name: 'Recurring', count: data.customers.filter(c => c.tags.includes('Recurring')).length, color: 'var(--sage)' },
    { name: 'New (30d)', count: data.customers.filter(c => c.tags.includes('New')).length, color: 'var(--plum)' },
    { name: 'Eggless preference', count: data.customers.filter(c => c.tags.includes('Eggless')).length, color: 'var(--caramel-deep)' },
    { name: 'Corporate', count: data.customers.filter(c => c.tags.includes('Corporate')).length, color: 'var(--caramel)' },
  ];
  return (
    <div>
      <SectionHeader>Smart segments</SectionHeader>
      <Card padding={0}>
        {segments.map((s, i) => (
          <ListRow
            key={s.name}
            divider={i < segments.length - 1}
            left={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: s.color, opacity: 0.18,
                }} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{s.count} contacts</div>
                </div>
              </div>
            }
            right={<Button variant="secondary" size="sm">Message</Button>}
          />
        ))}
      </Card>

      <SectionHeader>Birthday reminders</SectionHeader>
      <Card>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
          <b style={{ color: 'var(--ink)' }}>3 birthdays coming up</b> — auto-DM goes out 7 days before with personalised template.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <Pill tone="rose">Nisha · May 25</Pill>
          <Pill tone="caramel">Aanya · Jun 2</Pill>
          <Pill tone="sage">Karthik · Jun 8</Pill>
        </div>
      </Card>
    </div>
  );
}

function TemplatesView({ toast }) {
  const data = window.__data;
  return (
    <div>
      <SectionHeader>Quick replies</SectionHeader>
      {data.marketing.templates.map(t => (
        <Card key={t.id} style={{ marginBottom: 10 }} padding={14}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.45 }}>{t.preview}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => toast('Template copied')}><Icon.Edit size={14} /></Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------- New Campaign Flow ----------

function NewCampaign({ navigate, toast }) {
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState({
    name: '',
    audience: 'All customers (52)',
    channels: [],
    subject: '',
    preview: '',
    scheduleType: 'now',
    spendCap: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [errors, setErrors] = React.useState({});

  const steps = ['Audience', 'Message', 'Schedule', 'Review'];

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.name) e.name = 'Name your campaign';
      if (form.channels.length === 0) e.channels = 'Pick at least one channel';
    }
    if (step === 1) {
      if (!form.subject) e.subject = 'Required';
      if (!form.preview) e.preview = 'Add a message body';
    }
    return e;
  };

  const next = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) {
      if (step === steps.length - 1) {
        toast('Campaign saved & queued');
        setTimeout(() => navigate('marketing'), 500);
      } else setStep(s => s + 1);
    }
  };

  const back = () => step === 0 ? navigate('back') : setStep(s => s - 1);

  return (
    <Screen>
      <div data-screen-label="New Campaign">
        <ScreenHeader title="New campaign" subtitle={steps[step]} onBack={back} />

        <div style={{ padding: '6px 18px 12px', background: 'var(--bg)', borderBottom: '1px solid var(--line-soft)' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= step ? 'var(--caramel)' : 'var(--line)' }} />
            ))}
          </div>
        </div>

        <ScreenBody padding="16px 18px 100px">
          {step === 0 && (
            <div>
              <Field label="Campaign name" error={errors.name}>
                <TextInput value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Monsoon bento club" error={!!errors.name} />
              </Field>
              <Field label="Audience">
                <Select
                  value={form.audience}
                  onChange={e => set('audience', e.target.value)}
                  options={[
                    'All customers (52)',
                    'VIP customers (3)',
                    'Recurring buyers (12)',
                    'New in 30 days (2)',
                    'Eggless preference (4)',
                    'Corporate clients (2)',
                  ]}
                />
              </Field>
              <Field label="Channels" error={errors.channels}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { v: 'Instagram', icon: <Icon.Instagram size={18} />, sub: 'Story + Reel' },
                    { v: 'WhatsApp Broadcast', icon: <Icon.Whatsapp size={18} />, sub: 'Direct broadcast' },
                    { v: 'Email', icon: <Icon.Mail size={18} />, sub: 'For corporate clients' },
                  ].map(ch => {
                    const sel = form.channels.includes(ch.v);
                    return (
                      <div
                        key={ch.v}
                        onClick={() => set('channels', sel ? form.channels.filter(c => c !== ch.v) : [...form.channels, ch.v])}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: 12,
                          border: '1.5px solid ' + (sel ? 'var(--caramel)' : 'var(--line)'),
                          background: sel ? 'var(--caramel-soft)' : 'var(--surface)',
                          borderRadius: 'var(--r)',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ color: sel ? 'var(--caramel-deep)' : 'var(--muted)' }}>{ch.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{ch.v}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{ch.sub}</div>
                        </div>
                        {sel && <Icon.Check size={18} style={{ color: 'var(--caramel-deep)' }} />}
                      </div>
                    );
                  })}
                </div>
              </Field>
            </div>
          )}
          {step === 1 && (
            <div>
              <Field label="Hook line" hint="First thing they see — make it count" error={errors.subject}>
                <TextInput value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Alphonso is back. Limited slots — 30 only." error={!!errors.subject} />
              </Field>
              <Field label="Message" hint={`{name} and {area} auto-fill`} error={errors.preview}>
                <TextInput multiline value={form.preview} onChange={e => set('preview', e.target.value)} placeholder="Hi {name}! We saved the best Alphonso for you. Pre-book mango pistachio before Monday…" error={!!errors.preview} />
              </Field>
              <Field label="Add image" optional>
                <div style={{
                  border: '1.5px dashed var(--line)', borderRadius: 'var(--r)',
                  padding: 16, textAlign: 'center', cursor: 'pointer',
                  background: 'var(--surface-2)',
                }}>
                  <Icon.Camera size={20} style={{ color: 'var(--muted)' }} />
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Upload or generate</div>
                </div>
              </Field>
            </div>
          )}
          {step === 2 && (
            <div>
              <Field label="When to send">
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {['now', 'schedule', 'best-time'].map(t => (
                    <div key={t}
                      onClick={() => set('scheduleType', t)}
                      style={{
                        flex: 1, padding: '10px 8px',
                        border: '1.5px solid ' + (form.scheduleType === t ? 'var(--caramel)' : 'var(--line)'),
                        background: form.scheduleType === t ? 'var(--caramel-soft)' : 'var(--surface)',
                        borderRadius: 'var(--r)', cursor: 'pointer', textAlign: 'center',
                        fontSize: 12.5, fontWeight: 600,
                      }}>
                      {t === 'now' ? 'Now' : t === 'schedule' ? 'Schedule' : 'Best time'}
                    </div>
                  ))}
                </div>
              </Field>
              <Field label="Spend cap (Meta Ads)" optional hint="Limit budget on boosted posts">
                <TextInput value={form.spendCap} onChange={e => set('spendCap', e.target.value.replace(/[^0-9]/g, ''))} prefix="₹" placeholder="1500" />
              </Field>
              <Card style={{ background: 'var(--sage-soft)', border: '1px solid oklch(0.86 0.06 145)', marginTop: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Icon.Sparkle size={18} style={{ color: 'oklch(0.40 0.10 145)', flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'oklch(0.34 0.07 145)' }}>
                    <b>Best time prediction:</b> Tuesday at 7:30 PM. Your audience opens DMs 2.4× more around dinner.
                  </div>
                </div>
              </Card>
            </div>
          )}
          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: '0 0 4px' }}>Ready to send?</h2>
              <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 18px' }}>Goes to {form.audience}.</p>

              <Card padding={14}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {form.channels.map(c => <Pill key={c} tone="caramel" size="xs">{c}</Pill>)}
                </div>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, lineHeight: 1.2 }}>
                  {form.subject || 'Your hook line'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.5 }}>
                  {form.preview || 'Your message preview here.'}
                </div>
              </Card>

              <Card padding={0} style={{ marginTop: 12 }}>
                <ListRow divider left={<div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Audience</div><div style={{ fontWeight: 600 }}>{form.audience}</div></div>} />
                <ListRow divider left={<div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Send time</div><div style={{ fontWeight: 600 }}>{form.scheduleType === 'now' ? 'Right now' : form.scheduleType === 'schedule' ? 'Scheduled' : 'Best time (Tue 7:30 PM)'}</div></div>} />
                {form.spendCap && <ListRow divider={false} left={<div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Spend cap</div><div style={{ fontWeight: 600 }}>{window.fmtMoney(+form.spendCap)}</div></div>} />}
              </Card>
            </div>
          )}
        </ScreenBody>

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
            {step === steps.length - 1 ? 'Send campaign' : 'Continue'}
          </Button>
        </div>
      </div>
    </Screen>
  );
}

function CampaignDetail({ navigate, id }) {
  const c = window.__data.marketing.campaigns.find(x => x.id === id);
  if (!c) return <Screen><div style={{ padding: 20 }}>Not found</div></Screen>;
  return (
    <Screen>
      <div data-screen-label="Campaign Detail">
        <ScreenHeader title=" " onBack={() => navigate('back')} right={<><IconButton><Icon.Edit size={19} /></IconButton><IconButton><Icon.Share size={19} /></IconButton></>} />
        <ScreenBody>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Pill tone={c.status === 'live' ? 'ok' : c.status === 'draft' ? 'neutral' : 'caramel'}>{c.status}</Pill>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{c.channels.join(' · ')}</span>
          </div>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 26, margin: 0, lineHeight: 1.15 }}>{c.name}</h1>

          {c.status !== 'draft' && (
            <Card style={{ marginTop: 14 }} padding={14}>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Performance</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                <Stat label="Orders" value={c.orders} />
                <Stat label="Revenue" value={window.fmtCompactMoney(c.revenue)} />
                <Stat label="Open" value={`${Math.round(c.openRate * 100)}%`} />
                <Stat label="Click" value={`${Math.round(c.clickRate * 100)}%`} />
              </div>
            </Card>
          )}

          <SectionHeader>Message</SectionHeader>
          <Card padding={14}>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, lineHeight: 1.2 }}>{c.subject}</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.55 }}>{c.preview}</div>
          </Card>

          <SectionHeader>Audience</SectionHeader>
          <Card padding={14}>
            <div style={{ fontSize: 13.5 }}>{c.audience}</div>
            {c.sent && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Sent {window.fmtDate(c.sent, { showYear: true })}</div>}
          </Card>
        </ScreenBody>
      </div>
    </Screen>
  );
}

window.Marketing = Marketing;
window.NewCampaign = NewCampaign;
window.CampaignDetail = CampaignDetail;

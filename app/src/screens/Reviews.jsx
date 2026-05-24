// Reviews queue — delivered orders without feedback yet.
// Mirrors brainstorming/crm_sheets/apps_script/feedback_request.gs.

function reviewQueue() {
  const today = new Date('2026-05-24');
  const list = (window.__data.orders || [])
    .filter(o => o.status === 'delivered' && o.feedbackReceived !== 'Y')
    .map(o => {
      const d = new Date(o.deliveryDate);
      const daysSince = Math.round((today - d) / (1000 * 60 * 60 * 24));
      return { ...o, daysSince };
    })
    .filter(o => o.daysSince >= 0) // only past
    .sort((a, b) => a.daysSince - b.daysSince); // soonest first (just delivered)
  return list;
}

function Reviews({ navigate, toast }) {
  const [list, setList] = React.useState(() => reviewQueue());

  const markReceived = (id) => {
    setList(prev => prev.filter(o => o.id !== id));
    toast && toast('Marked review received');
  };
  const ask = (o) => {
    toast && toast(`Review request sent to ${window.getCustomer(o.customerId)?.name?.split(' ')[0] || 'customer'}`);
  };

  return (
    <Screen>
      <div data-screen-label="Reviews">
        <ScreenHeader
          title="Reviews"
          subtitle={list.length === 0 ? 'All caught up' : `${list.length} customer${list.length === 1 ? '' : 's'} to ask`}
          onBack={() => navigate('home')}
        />
        <ScreenBody padding="14px 18px 100px">
          {list.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'var(--sage-soft)', color: 'oklch(0.34 0.07 145)',
                display: 'inline-grid', placeItems: 'center', marginBottom: 14,
              }}>
                <Icon.Check size={32} />
              </div>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--ink)' }}>No reviews to ask for</div>
              <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
                Delivered orders without a recorded review will appear here<br />on T+2 to remind you.
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 4px 14px', lineHeight: 1.5 }}>
                T+2 follow-up — review requests get the best response 2-7 days after delivery while the cake is still memorable.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {list.map(o => {
                  const c = window.getCustomer(o.customerId);
                  const stale = o.daysSince > 7;
                  return (
                    <Card key={o.id} padding={0} style={{
                      border: '1px solid ' + (stale ? 'var(--line)' : 'var(--caramel-soft)'),
                    }}>
                      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={c?.name || '?'} tone={c?.avatarTone || 'caramel'} size={42} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{c?.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {o.title}
                          </div>
                          <div style={{ fontSize: 11, color: stale ? 'var(--danger)' : 'var(--ink-soft)', marginTop: 4, fontWeight: 500 }}>
                            delivered {o.daysSince === 0 ? 'today' : `${o.daysSince}d ago`}
                            {stale && ' · stale'}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        borderTop: '1px solid var(--line-soft)',
                      }}>
                        <button onClick={() => markReceived(o.id)} style={{
                          background: 'transparent', border: 'none', borderRight: '1px solid var(--line-soft)',
                          padding: '10px 0', cursor: 'pointer', fontFamily: 'inherit',
                          fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                          <Icon.Check size={14} /> Mark received
                        </button>
                        <button onClick={() => ask(o)} style={{
                          background: 'transparent', border: 'none',
                          padding: '10px 0', cursor: 'pointer', fontFamily: 'inherit',
                          fontSize: 12.5, fontWeight: 600, color: 'var(--caramel-deep)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                          <Icon.Whatsapp size={14} /> Ask for review
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </ScreenBody>
      </div>
    </Screen>
  );
}

// ---------- Home preview card (used in Marketing mode) ----------

function ReviewsPreviewCard({ navigate }) {
  const list = reviewQueue().slice(0, 2);
  if (list.length === 0) return null;
  return (
    <Card padding={0}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Review queue</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{reviewQueue().length} delivered · awaiting review</div>
        </div>
        <span onClick={() => navigate('reviews')} style={{ fontSize: 12, color: 'var(--caramel-deep)', cursor: 'pointer', fontWeight: 600 }}>
          All →
        </span>
      </div>
      {list.map((o, i) => {
        const c = window.getCustomer(o.customerId);
        return (
          <ListRow
            key={o.id}
            divider={i < list.length - 1}
            onClick={() => navigate('reviews')}
            padding="10px 14px"
            left={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={c?.name || '?'} tone={c?.avatarTone || 'caramel'} size={34} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    delivered {o.daysSince === 0 ? 'today' : `${o.daysSince}d ago`}
                  </div>
                </div>
              </div>
            }
            right={<span style={{ fontSize: 11, color: 'var(--caramel-deep)', fontWeight: 600 }}>Ask</span>}
          />
        );
      })}
    </Card>
  );
}

window.Reviews = Reviews;
window.ReviewsPreviewCard = ReviewsPreviewCard;

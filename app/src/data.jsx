// Data loader — fetches JSON from /data and stashes on window.__data
// Other scripts await window.__dataReady before reading.

window.__dataReady = (async () => {
  const load = async (name) => {
    const res = await fetch(`data/${name}.json`);
    if (!res.ok) throw new Error(`Failed to load ${name}: ${res.status}`);
    return res.json();
  };
  const [customers, orders, recipes, inventory, finance, marketing, calendar] = await Promise.all([
    load('customers'),
    load('orders'),
    load('recipes'),
    load('inventory'),
    load('finance'),
    load('marketing'),
    load('calendar'),
  ]);

  window.__data = {
    customers,
    orders,
    recipes,
    inventory,
    finance,
    marketing,
    calendar,
  };
})().catch(err => {
  console.error(err);
  const el = document.getElementById('app');
  if (el) {
    el.innerHTML = `<div style="padding:32px;font-family:DM Sans;color:#7a3"><b>Could not load data.</b><br/>${err.message}<br/><br/>Serve over http:// (preview does this automatically).</div>`;
  }
});

// ---------- Formatters & helpers ----------

window.fmtMoney = (n, { decimals = 0 } = {}) => {
  if (n == null || isNaN(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const v = Math.abs(n);
  return sign + '₹' + v.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

window.fmtCompactMoney = (n) => {
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 100000) return (n / 100000).toFixed(abs >= 1000000 ? 0 : 1) + 'L';
  if (abs >= 1000) return (n / 1000).toFixed(abs >= 10000 ? 0 : 1) + 'k';
  return String(n);
};

window.fmtDate = (iso, { showYear = false } = {}) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  return `${day} ${months[d.getMonth()]}${showYear ? ' ' + d.getFullYear() : ''}`;
};

window.fmtRelative = (iso) => {
  if (!iso) return '—';
  const today = new Date('2026-05-24');
  const d = new Date(iso);
  const days = Math.round((d - today) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1 && days < 7) return `In ${days} days`;
  if (days < -1 && days > -7) return `${-days}d ago`;
  return window.fmtDate(iso);
};

window.dayOfWeek = (iso) => {
  const d = new Date(iso);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
};

window.fmtPhone = (p) => p || '—';

window.statusColor = (status) => {
  switch (status) {
    case 'delivered': return { bg: 'var(--sage-soft)', fg: 'oklch(0.34 0.07 145)', dot: 'var(--ok)' };
    case 'ready': return { bg: 'oklch(0.93 0.05 180)', fg: 'oklch(0.32 0.07 200)', dot: 'oklch(0.55 0.10 200)' };
    case 'in-production': return { bg: 'var(--caramel-soft)', fg: 'var(--caramel-deep)', dot: 'var(--caramel)' };
    case 'confirmed': return { bg: 'var(--rose-soft)', fg: 'oklch(0.38 0.10 25)', dot: 'var(--rose)' };
    case 'draft': return { bg: 'oklch(0.94 0.005 70)', fg: 'var(--muted)', dot: 'var(--muted)' };
    default: return { bg: 'oklch(0.94 0.005 70)', fg: 'var(--muted)', dot: 'var(--muted)' };
  }
};

window.statusLabel = (s) => ({
  'delivered': 'Delivered',
  'ready': 'Ready to ship',
  'in-production': 'Baking',
  'confirmed': 'Confirmed',
  'draft': 'Draft',
})[s] || s;

// Lookup helpers
window.getCustomer = (id) => window.__data.customers.find(c => c.id === id);
window.getCustomerOrders = (id) => window.__data.orders.filter(o => o.customerId === id).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
window.getRecipeByFlavor = (flavor) => {
  if (!flavor) return null;
  const key = flavor.toLowerCase();
  return window.__data.recipes.find(r => key.includes(r.name.toLowerCase())) || null;
};

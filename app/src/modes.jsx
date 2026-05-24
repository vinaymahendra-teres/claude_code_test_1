// Mode toggles — four hats the baker can wear.
// Each mode tailors: bottom-nav tabs, Home quick-actions, and More menu ordering.

const MODE_KEY = 'tieredcake-mode';
const DEFAULT_MODE = 'operations';

window.MODES = {
  planning: {
    id: 'planning',
    label: 'Planning & setup',
    short: 'Planning',
    desc: 'Recipes, inventory, conversion tools',
    color: 'plum',
    iconKey: 'Sparkle',
    nav: ['home', 'orders', 'recipes', 'inventory', 'more'],
    morePrimary: ['recipes', 'inventory', 'tools'],
    home: {
      action0: { id: 'new-order', label: 'New order', icon: 'Plus' },
      action1: { id: 'tools', label: 'Scale', icon: 'Sparkle' },
      action2: { id: 'inventory', label: 'Restock', icon: 'Box' },
      action3: { id: 'recipes', label: 'Recipes', icon: 'Cake' },
    },
    sections: ['hero', 'quickActions', 'lowStock', 'tomorrow'],
  },
  marketing: {
    id: 'marketing',
    label: 'Marketing & CRM',
    short: 'Marketing',
    desc: 'Customers, campaigns, inbox',
    color: 'rose',
    iconKey: 'Megaphone',
    nav: ['home', 'orders', 'customers', 'marketing', 'more'],
    morePrimary: ['marketing', 'customers', 'reviews'],
    home: {
      action0: { id: 'new-order', label: 'New order', icon: 'Plus' },
      action1: { id: 'marketing', label: 'Campaign', icon: 'Megaphone' },
      action2: { id: 'inbox', label: 'Inbox', icon: 'Mail', sheet: true },
      action3: { id: 'customers', label: 'People', icon: 'Users' },
    },
    sections: ['hero', 'quickActions', 'occasions', 'inbox', 'reviews', 'campaign', 'tomorrow'],
  },
  operations: {
    id: 'operations',
    label: 'Operations',
    short: 'Operations',
    desc: 'Schedule, kitchen, timers',
    color: 'caramel',
    iconKey: 'Clock',
    nav: ['home', 'orders', 'production', 'kitchen', 'more'],
    morePrimary: ['kitchen', 'production', 'recipes', 'inventory'],
    home: {
      action0: { id: 'new-order', label: 'New order', icon: 'Plus' },
      action1: { id: 'kitchen', label: 'Timers', icon: 'Clock' },
      action2: { id: 'production', label: 'Plan week', icon: 'Calendar' },
      action3: { id: 'inventory', label: 'Stock', icon: 'Box' },
    },
    sections: ['hero', 'quickActions', 'today', 'tomorrow', 'inbox', 'lowStock'],
  },
  finance: {
    id: 'finance',
    label: 'Finance & accounting',
    short: 'Finance',
    desc: 'Books, P&L, balance sheet, cash flow',
    color: 'sage',
    iconKey: 'Wallet',
    nav: ['home', 'orders', 'accounting', 'reports', 'more'],
    morePrimary: ['accounting', 'reports'],
    home: {
      action0: { id: 'accounting', label: 'Expense', icon: 'Wallet', params: { addExpense: true } },
      action1: { id: 'new-order', label: 'New order', icon: 'Plus' },
      action2: { id: 'accounting', label: 'Books', icon: 'Receipt' },
      action3: { id: 'reports', label: 'Reports', icon: 'Doc' },
    },
    sections: ['hero', 'quickActions', 'compliance', 'tomorrow'],
  },
};

window.MODE_ORDER = ['planning', 'marketing', 'operations', 'finance'];

window.loadMode = () => {
  try {
    const v = localStorage.getItem(MODE_KEY);
    return window.MODES[v] ? v : DEFAULT_MODE;
  } catch (e) { return DEFAULT_MODE; }
};

window.saveMode = (id) => {
  try { localStorage.setItem(MODE_KEY, id); } catch (e) {}
};

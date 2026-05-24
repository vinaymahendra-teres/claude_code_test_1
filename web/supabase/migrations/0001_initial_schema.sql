-- Tiered Cake Company — initial schema
-- Mirrors the JSON shapes in app/data/*.json. Nested arrays stay as jsonb
-- where they're naturally polymorphic (recipe ingredients, customer occasions)
-- to keep this migration cleanly reversible.

-- =========================================================================
-- Tables
-- =========================================================================

create table public.customers (
  id text primary key,
  name text not null,
  phone text,
  instagram text,
  area text,
  tags text[] default '{}',
  since date,
  order_count integer default 0,
  lifetime_value integer default 0,
  last_order date,
  preferred_flavors text[] default '{}',
  notes text,
  avatar_tone text,
  marketing_consent text default 'N' check (marketing_consent in ('Y','N')),
  consent_date date,
  occasions jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.orders (
  id text primary key,
  customer_id text references public.customers(id) on delete set null,
  title text,
  flavor text,
  tiers integer,
  size text,
  servings integer,
  eggless boolean default false,
  theme text,
  add_ons text[] default '{}',
  price integer default 0,
  deposit integer default 0,
  balance integer default 0,
  delivery_date date,
  delivery_slot text,
  delivery_area text,
  status text default 'draft',
  channel text,
  reference_count integer default 0,
  notes text,
  payment_mode text,
  upi_reference_utr text,
  payer_vpa text,
  cold_chain_notes text,
  feedback_received text default 'N' check (feedback_received in ('Y','N')),
  rating integer check (rating between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index orders_customer_id_idx on public.orders (customer_id);
create index orders_delivery_date_idx on public.orders (delivery_date);
create index orders_status_idx on public.orders (status);

create table public.recipes (
  id text primary key,
  name text not null,
  category text,
  eggless boolean default false,
  yield_note text,
  prep_mins integer default 0,
  bake_mins integer default 0,
  cost_per_cake integer default 0,
  ingredients jsonb default '[]'::jsonb,
  method jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table public.inventory_items (
  id text primary key,
  name text not null,
  category text,
  qty numeric default 0,
  unit text,
  reorder_at numeric default 0,
  unit_cost integer default 0,
  supplier text,
  last_restock date,
  reorder_qty numeric default 0,
  days_cover_at_typical_use integer,
  updated_at timestamptz default now()
);

create table public.expenses (
  id text primary key,
  date date not null,
  vendor text not null,
  category text,
  amount integer not null,
  method text,
  note text,
  receipt boolean default false,
  account_debited text,
  upi_reference_utr text,
  payee_vpa text,
  created_at timestamptz default now()
);
create index expenses_date_idx on public.expenses (date);
create index expenses_category_idx on public.expenses (category);

create table public.monthly_summary (
  month text primary key, -- e.g. '2026-05'
  income integer default 0,
  expense integer default 0,
  profit integer default 0
);

create table public.compliance_items (
  id text primary key,
  item text not null,
  type text, -- 'licence' | 'tax-return' | 'advance-tax' | 'insurance' | 'renewal'
  due_date date not null,
  note text,
  status text default 'open' check (status in ('open','completed','dismissed')),
  completed_at timestamptz
);
create index compliance_due_date_idx on public.compliance_items (due_date);

create table public.campaigns (
  id text primary key,
  data jsonb not null
);

create table public.templates (
  id text primary key,
  data jsonb not null
);

create table public.audience_segments (
  id text primary key,
  data jsonb not null
);

create table public.blocked_dates (
  date date primary key,
  reason text not null,
  type text -- 'festival' | 'internal' | 'rest'
);

create table public.bakery_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- =========================================================================
-- Row Level Security
-- =========================================================================
-- For v1: public read on operational tables (since the app is a single-tenant
-- bakery and the prototype is demo-grade). Writes require authenticated user.
-- Tighten when multi-user / customer-facing surfaces are added.

alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.recipes enable row level security;
alter table public.inventory_items enable row level security;
alter table public.expenses enable row level security;
alter table public.monthly_summary enable row level security;
alter table public.compliance_items enable row level security;
alter table public.campaigns enable row level security;
alter table public.templates enable row level security;
alter table public.audience_segments enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.bakery_settings enable row level security;

-- Anonymous read access
create policy "anon read customers" on public.customers for select using (true);
create policy "anon read orders" on public.orders for select using (true);
create policy "anon read recipes" on public.recipes for select using (true);
create policy "anon read inventory" on public.inventory_items for select using (true);
create policy "anon read expenses" on public.expenses for select using (true);
create policy "anon read monthly_summary" on public.monthly_summary for select using (true);
create policy "anon read compliance" on public.compliance_items for select using (true);
create policy "anon read campaigns" on public.campaigns for select using (true);
create policy "anon read templates" on public.templates for select using (true);
create policy "anon read segments" on public.audience_segments for select using (true);
create policy "anon read blocked_dates" on public.blocked_dates for select using (true);
create policy "anon read bakery_settings" on public.bakery_settings for select using (true);

-- Authenticated writes (any signed-in user can mutate)
create policy "auth write customers" on public.customers for all to authenticated using (true) with check (true);
create policy "auth write orders" on public.orders for all to authenticated using (true) with check (true);
create policy "auth write recipes" on public.recipes for all to authenticated using (true) with check (true);
create policy "auth write inventory" on public.inventory_items for all to authenticated using (true) with check (true);
create policy "auth write expenses" on public.expenses for all to authenticated using (true) with check (true);
create policy "auth write monthly_summary" on public.monthly_summary for all to authenticated using (true) with check (true);
create policy "auth write compliance" on public.compliance_items for all to authenticated using (true) with check (true);
create policy "auth write campaigns" on public.campaigns for all to authenticated using (true) with check (true);
create policy "auth write templates" on public.templates for all to authenticated using (true) with check (true);
create policy "auth write segments" on public.audience_segments for all to authenticated using (true) with check (true);
create policy "auth write blocked_dates" on public.blocked_dates for all to authenticated using (true) with check (true);
create policy "auth write bakery_settings" on public.bakery_settings for all to authenticated using (true) with check (true);

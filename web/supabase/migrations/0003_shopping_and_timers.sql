-- =========================================================================
-- Shopping lists + timer templates
-- =========================================================================
--
-- Shopping lists back a recurring procurement workflow:
--   * Operators open a list, add items (manually, or auto-generated from
--     low-stock inventory and from upcoming order requirements).
--   * Each item is checked off as picked up; total estimated cost rolls up.
--   * When the list is marked complete the rows stay for history; an admin
--     can archive or delete the list outright.
--
-- Timer templates are saved "preset" timers so common tasks ("Belgian Dark
-- bake — 35 min", "Cheesecake water-bath — 65 min") can be one-tap started
-- from the kitchen rack.

create table if not exists public.shopping_lists (
  id text primary key,
  name text not null,
  status text not null default 'open' check (status in ('open','completed','archived')),
  notes text,
  created_at timestamptz default now(),
  completed_at timestamptz,
  archived_at timestamptz
);

create index if not exists shopping_lists_status_idx on public.shopping_lists (status);

create table if not exists public.shopping_list_items (
  id text primary key,
  list_id text not null references public.shopping_lists(id) on delete cascade,
  item_name text not null,
  qty numeric,
  unit text,
  supplier text,
  estimated_cost integer default 0,
  source text not null default 'manual' check (source in ('manual','low-stock','order')),
  inventory_item_id text references public.inventory_items(id) on delete set null,
  source_ref text,           -- e.g. order id, recipe id used to derive this row
  checked boolean default false,
  notes text,
  created_at timestamptz default now()
);

create index if not exists shopping_list_items_list_idx on public.shopping_list_items (list_id);

create table if not exists public.timer_templates (
  id text primary key,
  label text not null,
  duration_ms integer not null check (duration_ms > 0),
  color text not null default 'caramel' check (color in ('caramel','rose','sage','plum')),
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table public.shopping_lists enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.timer_templates enable row level security;

create policy "anon read shopping_lists" on public.shopping_lists for select using (true);
create policy "anon read shopping_list_items" on public.shopping_list_items for select using (true);
create policy "anon read timer_templates" on public.timer_templates for select using (true);

create policy "auth write shopping_lists" on public.shopping_lists for all to authenticated using (true) with check (true);
create policy "auth write shopping_list_items" on public.shopping_list_items for all to authenticated using (true) with check (true);
create policy "auth write timer_templates" on public.timer_templates for all to authenticated using (true) with check (true);

-- =========================================================================
-- Product lines
-- =========================================================================
--
-- The bakery sells more than cakes: cupcakes, brownies, cake tubs and
-- bomboloni. Each line has its own size / serving conventions and price
-- hints. Storing them as a CRUD-able table lets the operator add seasonal
-- lines (e.g. "Cookie tin") without a code change, and lets the New Order
-- form refresh size options based on the picked line.

create table if not exists public.product_lines (
  id text primary key,
  name text not null,                -- machine-friendly: cake, cupcake, brownie, tub, bomboloni
  label text not null,               -- display: "Cake", "Cupcake box", "Brownie tray"
  description text,
  sizes jsonb not null default '[]'::jsonb,
  -- Each size: { "name": "6 inch", "servings": 12, "price_hint": 3500, "notes": "..." }
  default_unit text,                 -- 'cake' | 'box' | 'tray' | 'tub' | 'piece'
  is_active boolean not null default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists product_lines_active_idx on public.product_lines (is_active, sort_order);

alter table public.product_lines enable row level security;
create policy "anon read product_lines" on public.product_lines for select using (true);
create policy "auth write product_lines" on public.product_lines for all to authenticated using (true) with check (true);

-- Attach the line to each order. Existing rows are backfilled to 'cake'.
alter table public.orders
  add column if not exists product_line text default 'cake';

create index if not exists orders_product_line_idx on public.orders (product_line);

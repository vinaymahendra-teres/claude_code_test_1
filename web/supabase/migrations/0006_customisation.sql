-- =========================================================================
-- Customisation: catalogue of addons + per-order customisation brief
-- =========================================================================
--
-- A "customisation" on an order has two parts:
--
--   1. A free-form brief that captures the creative intent: occasion,
--      theme keywords, colour palette, message piped on the cake, shape,
--      figurines/toppers, dietary preferences. Stored as JSON because the
--      shape varies per order.
--
--   2. A list of priced addons drawn from the customisation_addons
--      catalogue. Each addon row carries a default cost and optional
--      link to an inventory_items row, so when an order selects an addon
--      the kitchen knows which supply to draw down (and the shopping list
--      generator can flag short stock).

create table if not exists public.customisation_addons (
  id text primary key,
  name text not null,
  category text not null default 'finish' check (
    category in ('figurine', 'topper', 'decor', 'finish', 'shape', 'technique', 'dietary', 'other')
  ),
  default_cost integer not null default 0,
  default_qty numeric not null default 1,
  unit text,                      -- e.g. 'each', 'g', 'set'
  stock_item_id text references public.inventory_items(id) on delete set null,
  notes text,
  is_active boolean not null default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists customisation_addons_active_idx on public.customisation_addons (is_active, sort_order);

alter table public.customisation_addons enable row level security;
create policy "anon read addons" on public.customisation_addons for select using (true);
create policy "auth write addons" on public.customisation_addons for all to authenticated using (true) with check (true);

-- Per-order customisation: jsonb to keep the brief flexible. Shape:
--   {
--     "brief": {
--       "occasion": "birthday" | "anniversary" | "wedding" | "baby" | "other",
--       "theme": "Pastel floral, ivory + dusty pink",
--       "colors": ["#f5d6dc", "#fdf7f0"],
--       "shape": "round" | "square" | "heart" | "number" | "letter" | "custom",
--       "tiers": 1,
--       "message": { "text": "Sixty & Glowing", "color": "gold" },
--       "figurines": "Hand-piped peonies + ranunculus, no toppers",
--       "dietary": ["eggless"],
--       "notes": "Match the cake to the saree palette."
--     },
--     "addons": [
--       { "id": "ca-gold-leaf", "name": "Gold leaf finish", "qty": 1, "price": 400, "notes": "Top tier only" }
--     ]
--   }
--
-- All keys are optional; default to {} when omitted.
alter table public.orders
  add column if not exists customisation jsonb;

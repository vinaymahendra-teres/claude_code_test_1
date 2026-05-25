-- =========================================================================
-- Branches
-- =========================================================================
--
-- Tiered Cake Company operates out of two gated-community kitchens, each
-- serving its own resident customer base:
--
--   * Rajapushpa Eterna — Nanakramguda
--   * Rajapushpa Provincia — Narsingi
--
-- Modelling each as a branch lets every operational entity (customer,
-- order, inventory, shopping list) carry a branch_id so production lines
-- stay separate. Shared entities (recipes, calendar, marketing campaigns,
-- compliance items, app users, customisation_addons, product_lines) stay
-- unscoped — they're brand-level.

create table if not exists public.branches (
  id text primary key,
  name text not null,             -- machine-friendly: eterna, provincia
  label text not null,            -- display: "Rajapushpa Eterna"
  community text,                 -- "Rajapushpa Eterna" (the gated community served)
  neighbourhood text,             -- "Nanakramguda" (postal landmark)
  address text,
  -- Operator-on-the-ground: Sh runs Eterna; S runs Provincia. Nullable so
  -- new branches can be added before assigning a staffer.
  operator_id text references public.app_users(id) on delete set null,
  is_active boolean not null default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create index if not exists branches_active_idx on public.branches (is_active, sort_order);

alter table public.branches enable row level security;
create policy "anon read branches" on public.branches for select using (true);
create policy "auth write branches" on public.branches for all to authenticated using (true) with check (true);

-- Add branch_id to operational entities. NULL is allowed for legacy rows
-- until the seed/backfill stamps them with a default branch.
alter table public.customers       add column if not exists branch_id text references public.branches(id) on delete set null;
alter table public.orders          add column if not exists branch_id text references public.branches(id) on delete set null;
alter table public.inventory_items add column if not exists branch_id text references public.branches(id) on delete set null;
alter table public.shopping_lists  add column if not exists branch_id text references public.branches(id) on delete set null;

create index if not exists customers_branch_idx       on public.customers (branch_id);
create index if not exists orders_branch_idx          on public.orders (branch_id);
create index if not exists inventory_items_branch_idx on public.inventory_items (branch_id);
create index if not exists shopping_lists_branch_idx  on public.shopping_lists (branch_id);

-- Tower / flat detail — finer-grained address inside the branch's community.
-- Existing `area` column on customers stays for now (will be reused by the
-- seed below to derive a default tower/flat label).
alter table public.customers add column if not exists address_detail text;

-- Collaborative orders: when both Sh and S team up on a big or complex order,
-- the order keeps its primary branch_id (= customer's home community) AND
-- flips this flag. UI surfaces a "collaborative" badge so the other operator
-- sees it on their day-of view.
alter table public.orders add column if not exists is_collaborative boolean default false;
create index if not exists orders_collab_idx on public.orders (is_collaborative);

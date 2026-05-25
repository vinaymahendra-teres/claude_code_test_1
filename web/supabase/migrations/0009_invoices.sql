-- =========================================================================
-- Invoices + payment receipts (per branch)
-- =========================================================================
--
-- Sh and S invoice independently from their respective branches. Each
-- branch maintains its own sequential numbering and (optional) GSTIN.
-- GST fields are present from day one but the flag stays off until the
-- bakery formally registers; templates honour the flag at render time.

-- Per-branch invoicing config rolled into the existing branches table.
alter table public.branches
  add column if not exists invoice_prefix text default 'INV',
  add column if not exists invoice_counter integer not null default 0,
  add column if not exists receipt_prefix text default 'RCT',
  add column if not exists receipt_counter integer not null default 0,
  add column if not exists gstin text,
  add column if not exists gst_enabled boolean not null default false,
  add column if not exists bank_name text,
  add column if not exists bank_account_number text,
  add column if not exists bank_ifsc text,
  add column if not exists bank_upi text,
  add column if not exists signature_label text,
  add column if not exists invoice_terms text,
  add column if not exists invoice_footer text;

-- Sensible defaults for the two seeded branches (idempotent: only stamps
-- prefixes that are still the migration default).
update public.branches set invoice_prefix = 'ET', receipt_prefix = 'ET-R'
  where id = 'br-eterna'    and invoice_prefix = 'INV';
update public.branches set invoice_prefix = 'PR', receipt_prefix = 'PR-R'
  where id = 'br-provincia' and invoice_prefix = 'INV';

create table if not exists public.invoices (
  id text primary key,
  number text not null,
  branch_id text not null references public.branches(id) on delete restrict,
  order_id text references public.orders(id) on delete set null,
  customer_id text references public.customers(id) on delete set null,
  status text not null default 'issued' check (status in ('draft','issued','paid','cancelled','voided')),
  issue_date date not null,
  due_date date,
  subtotal integer not null default 0,
  tax_total integer not null default 0,
  total integer not null default 0,
  amount_paid integer not null default 0,
  line_items jsonb not null default '[]'::jsonb,
  -- snapshots at time of issue
  customer_snapshot jsonb,             -- {name, phone, instagram, address}
  branch_snapshot jsonb,               -- {label, address, gstin, bank, ...}
  gst_enabled boolean not null default false,
  customer_gstin text,
  notes text,
  terms text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (branch_id, number)
);

create index if not exists invoices_branch_idx on public.invoices (branch_id);
create index if not exists invoices_order_idx on public.invoices (order_id);
create index if not exists invoices_customer_idx on public.invoices (customer_id);
create index if not exists invoices_status_idx on public.invoices (status);

create table if not exists public.payment_receipts (
  id text primary key,
  number text not null,
  branch_id text not null references public.branches(id) on delete restrict,
  order_id text references public.orders(id) on delete set null,
  invoice_id text references public.invoices(id) on delete set null,
  customer_id text references public.customers(id) on delete set null,
  receipt_date date not null,
  amount integer not null,
  method text,                           -- 'UPI' | 'Cash' | 'Card' | 'Bank transfer'
  upi_reference_utr text,
  payer_vpa text,
  notes text,
  customer_snapshot jsonb,
  branch_snapshot jsonb,
  created_at timestamptz default now(),
  unique (branch_id, number)
);

create index if not exists receipts_branch_idx on public.payment_receipts (branch_id);
create index if not exists receipts_order_idx on public.payment_receipts (order_id);
create index if not exists receipts_invoice_idx on public.payment_receipts (invoice_id);

alter table public.invoices         enable row level security;
alter table public.payment_receipts enable row level security;
create policy "anon read invoices"   on public.invoices         for select using (true);
create policy "anon read receipts"   on public.payment_receipts for select using (true);
create policy "auth write invoices"  on public.invoices         for all to authenticated using (true) with check (true);
create policy "auth write receipts"  on public.payment_receipts for all to authenticated using (true) with check (true);

-- Atomic per-branch number issuance. Returns the next prefix-N number while
-- bumping the counter under a row-level lock so two concurrent invoice
-- creations don't collide.
create or replace function public.next_invoice_number(p_branch_id text)
returns text
language plpgsql
as $$
declare
  v_prefix text;
  v_n int;
begin
  update public.branches
     set invoice_counter = invoice_counter + 1
   where id = p_branch_id
   returning invoice_prefix, invoice_counter into v_prefix, v_n;
  if v_prefix is null then
    raise exception 'Branch % not found', p_branch_id;
  end if;
  return v_prefix || '-' || lpad(v_n::text, 4, '0');
end $$;

create or replace function public.next_receipt_number(p_branch_id text)
returns text
language plpgsql
as $$
declare
  v_prefix text;
  v_n int;
begin
  update public.branches
     set receipt_counter = receipt_counter + 1
   where id = p_branch_id
   returning receipt_prefix, receipt_counter into v_prefix, v_n;
  if v_prefix is null then
    raise exception 'Branch % not found', p_branch_id;
  end if;
  return v_prefix || '-' || lpad(v_n::text, 4, '0');
end $$;

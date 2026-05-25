-- =========================================================================
-- Open write policies — internal admin app, NextAuth-gated
-- =========================================================================
--
-- We don't use Supabase Auth (we use NextAuth), so requests from server
-- actions go through the publishable key and the Postgres `anon` role.
-- The original migrations restricted writes to `authenticated`, which means
-- every UPDATE/INSERT/DELETE has been silently no-op'ing (or raising) since
-- day one.
--
-- The middleware redirects every unauthenticated request to /login before
-- the action runs, so granting write to anon doesn't widen the threat
-- surface — it matches the existing read access.

do $$
declare
  t text;
  tables text[] := array[
    'customers','orders','recipes','inventory_items','expenses',
    'monthly_summary','compliance_items','campaigns','templates',
    'audience_segments','blocked_dates','bakery_settings',
    'shopping_lists','shopping_list_items','timer_templates',
    'app_users','calendar_events','attachments',
    'customisation_addons','product_lines','branches',
    'invoices','payment_receipts'
  ];
begin
  foreach t in array tables loop
    -- Drop any existing "auth write *" policy that ties the policy to the
    -- authenticated role.
    execute format($SQL$drop policy if exists "auth write %1$s" on public.%1$s$SQL$, t);
    -- Drop the variants that didn't get the standard name in earlier
    -- migrations (no-op if absent).
    execute format($SQL$drop policy if exists "auth write %1$s consent" on public.%1$s$SQL$, t);
    execute format($SQL$drop policy if exists "anon write %1$s" on public.%1$s$SQL$, t);
    -- Open writes to all roles. Reads were already public-via the existing
    -- "anon read *" policy on each table.
    execute format(
      $SQL$create policy "open write %1$s" on public.%1$s for all using (true) with check (true)$SQL$,
      t
    );
  end loop;
end $$;

-- Per-branch invoice/receipt number issuance must bypass RLS regardless of
-- who calls — the function does an UPDATE on branches and depends on
-- RETURNING the new counter. Make both functions SECURITY DEFINER so they
-- run as the function owner (which has unrestricted access).
alter function public.next_invoice_number(text) security definer;
alter function public.next_receipt_number(text) security definer;

-- Lock down search_path so the SECURITY DEFINER functions can't be coerced
-- into looking up a malicious "branches" table in a higher-priority schema.
alter function public.next_invoice_number(text) set search_path = public;
alter function public.next_receipt_number(text) set search_path = public;

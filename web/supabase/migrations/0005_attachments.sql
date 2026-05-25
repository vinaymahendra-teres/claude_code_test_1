-- =========================================================================
-- Attachments (photos/images attached to any entity)
-- =========================================================================
--
-- Generic table linking a Supabase Storage object to any entity in the app
-- (orders, recipes, customers, calendar events, reviews). The bucket is
-- public-read for simplicity (this is a single-tenant internal-admin app and
-- paths use UUIDs); writes are exclusively performed by Server Actions using
-- the service-role key, so client-side RLS is read-only.

create table if not exists public.attachments (
  id text primary key,
  entity_type text not null check (
    entity_type in ('order', 'recipe', 'customer', 'event', 'review')
  ),
  entity_id text not null,
  storage_path text not null,  -- relative path inside the 'attachments' bucket
  kind text not null default 'reference' check (
    kind in ('reference', 'gallery', 'flyer', 'delivered', 'avatar', 'other')
  ),
  caption text,
  mime text,
  size_bytes integer,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create index if not exists attachments_entity_idx on public.attachments (entity_type, entity_id);

alter table public.attachments enable row level security;

create policy "anon read attachments" on public.attachments for select using (true);
create policy "auth write attachments" on public.attachments for all to authenticated using (true) with check (true);

-- =========================================================================
-- Storage: bucket + read policy
-- =========================================================================
-- Re-running this migration is safe (`on conflict do nothing` for the
-- bucket; `create policy if not exists` for the policy).

insert into storage.buckets (id, name, public)
  values ('attachments', 'attachments', true)
  on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read attachments bucket'
  ) then
    create policy "Public read attachments bucket"
      on storage.objects for select
      using (bucket_id = 'attachments');
  end if;
end $$;

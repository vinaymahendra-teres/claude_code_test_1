-- =========================================================================
-- Calendar events
-- =========================================================================
--
-- Free-form date entries surfaced on the Calendar screen alongside read-only
-- overlays of orders.delivery_date, compliance_items.due_date and
-- blocked_dates. Use this for: shoot days, pop-up events, marketing
-- milestones, supplier visits, personal reminders, etc.

create table if not exists public.calendar_events (
  id text primary key,
  title text not null,
  date date not null,
  end_date date,  -- null = single-day; set for multi-day spans
  kind text not null default 'event' check (
    kind in ('event', 'festival', 'milestone', 'marketing', 'personal', 'reminder')
  ),
  notes text,
  all_day boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists calendar_events_date_idx on public.calendar_events (date);
create index if not exists calendar_events_kind_idx on public.calendar_events (kind);

alter table public.calendar_events enable row level security;

create policy "anon read calendar_events" on public.calendar_events for select using (true);
create policy "auth write calendar_events" on public.calendar_events for all to authenticated using (true) with check (true);

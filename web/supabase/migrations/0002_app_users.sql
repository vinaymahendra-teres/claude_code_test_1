-- =========================================================================
-- Application users (NextAuth Credentials provider)
-- =========================================================================
-- A small users table backing the app's own login + RBAC. Independent of
-- Supabase Auth: we only need email + password_hash + role for the two
-- bakery operators (Swetha & Shreya).
--
-- Roles:
--   admin  — full read/write across every screen + can manage users
--   staff  — full operational read/write (orders, kitchen, inventory)
--   viewer — read-only (e.g. accountant glancing at reports)

create table if not exists public.app_users (
  id text primary key,
  email text not null unique,
  name text not null,
  password_hash text not null,
  role text not null default 'staff' check (role in ('admin','staff','viewer')),
  created_at timestamptz default now(),
  last_login_at timestamptz
);

create index if not exists app_users_email_idx on public.app_users (lower(email));

alter table public.app_users enable row level security;

-- No anonymous policy: app_users is read/written only by the server with the
-- service-role key (the Supabase secret), never by the anon client. The
-- table stays invisible to the browser regardless of session state.

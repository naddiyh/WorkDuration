-- Run this in Supabase: SQL Editor > New query.
create table if not exists public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  project text not null default 'Personal',
  work_date date not null,
  start_time time,
  end_time time,
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  color text not null default 'blue' check (color in ('blue', 'violet', 'amber', 'green')),
  source text not null default 'dashboard' check (source in ('dashboard', 'telegram', 'api')),
  created_at timestamptz not null default now()
);

create index if not exists work_sessions_work_date_idx on public.work_sessions (work_date);

-- Temporarily keeps an incomplete Telegram entry while the bot asks for its
-- missing details. Drafts expire automatically in the application after 30 minutes.
create table if not exists public.telegram_work_drafts (
  chat_id bigint primary key,
  draft jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

-- The table is accessed only by the server-side service-role client. RLS blocks
-- direct browser access. Add Supabase Auth policies when multi-user support is added.
alter table public.work_sessions enable row level security;
alter table public.telegram_work_drafts enable row level security;

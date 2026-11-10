-- Budget app schema. Access goes only through the Next.js server using the
-- service-role key; RLS is on with no policies, so the public anon key can
-- read or write nothing.

create table if not exists public.months (
  month text primary key check (month ~ '^\d{4}-\d{2}$'),
  fx_usd_uah numeric(10, 4) not null check (fx_usd_uah > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  member text not null check (member in ('ostap', 'olena')),
  item_key text not null,
  amount_kop bigint not null check (amount_kop > 0),
  paid_on date not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists entries_month_idx on public.entries (month);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  title text not null check (length(title) between 1 and 200),
  assignee text check (assignee in ('ostap', 'olena')),
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists tasks_month_idx on public.tasks (month);

alter table public.months enable row level security;
alter table public.entries enable row level security;
alter table public.tasks enable row level security;

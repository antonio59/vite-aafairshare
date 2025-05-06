-- 2024-05-12 Initial schema for AAFairShare

-- USERS
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  username text,
  photo_url text,
  created_at timestamptz not null default now(),
  provider text
);

-- CATEGORIES
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text,
  icon text,
  created_at timestamptz not null default now()
);

-- LOCATIONS
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

-- EXPENSES
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  amount numeric not null,
  description text,
  date date not null,
  paid_by uuid references public.users(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  participants jsonb,
  notes text,
  month text not null
);

-- SETTLEMENTS
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references public.users(id) on delete set null,
  to_user_id uuid references public.users(id) on delete set null,
  amount numeric not null,
  date date not null,
  status text not null,
  created_at timestamptz not null default now(),
  month text not null
);

-- RECURRING
create table if not exists public.recurring (
  id uuid primary key default gen_random_uuid(),
  amount numeric not null,
  description text,
  frequency text not null,
  next_due_date date not null,
  user_id uuid references public.users(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Indexes for performance (optional)
create index if not exists idx_expenses_month on public.expenses(month);
create index if not exists idx_settlements_month on public.settlements(month);

-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto"; 
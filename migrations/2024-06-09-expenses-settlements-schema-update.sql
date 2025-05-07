-- 2024-06-09 Update expenses and settlements schema to match app requirements (camel_case)

-- EXPENSES TABLE
ALTER TABLE public.expenses
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS paid_by,
  DROP COLUMN IF EXISTS category_id,
  DROP COLUMN IF EXISTS location_id,
  DROP COLUMN IF EXISTS split_type,
  DROP COLUMN IF EXISTS updated_at;

ALTER TABLE public.expenses
  ADD COLUMN description text,
  ADD COLUMN paid_by_id uuid references public.users(id) on delete set null,
  ADD COLUMN category_id uuid references public.categories(id) on delete set null,
  ADD COLUMN location_id uuid references public.locations(id) on delete set null,
  ADD COLUMN split_type text,
  ADD COLUMN updated_at timestamptz;

-- SETTLEMENTS TABLE
ALTER TABLE public.settlements
  DROP COLUMN IF EXISTS from_user_id,
  DROP COLUMN IF EXISTS to_user_id,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS recorded_by,
  DROP COLUMN IF EXISTS created_at;

ALTER TABLE public.settlements
  ADD COLUMN from_user_id uuid references public.users(id) on delete set null,
  ADD COLUMN to_user_id uuid references public.users(id) on delete set null,
  ADD COLUMN notes text,
  ADD COLUMN recorded_by uuid references public.users(id) on delete set null,
  ADD COLUMN created_at timestamptz; 
-- 2024-06-09 Add split_type to expenses, remove participants and notes

ALTER TABLE public.expenses
  ADD COLUMN split_type text;

ALTER TABLE public.expenses
  DROP COLUMN IF EXISTS participants,
  DROP COLUMN IF EXISTS notes; 
-- 2024-06-09 Drop created_at from categories and locations tables

ALTER TABLE public.categories
  DROP COLUMN IF EXISTS created_at;

ALTER TABLE public.locations
  DROP COLUMN IF EXISTS created_at; 
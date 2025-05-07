-- 2024-06-09 Remove address from locations, remove provider from users

ALTER TABLE public.locations
  DROP COLUMN IF EXISTS address;

ALTER TABLE public.users
  DROP COLUMN IF EXISTS provider;

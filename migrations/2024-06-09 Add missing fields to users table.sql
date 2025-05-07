-- 2024-06-09 Add missing fields to users table

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS uid uuid,
  ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Optionally, backfill uid with id for existing users
UPDATE public.users SET uid = id WHERE uid IS NULL;
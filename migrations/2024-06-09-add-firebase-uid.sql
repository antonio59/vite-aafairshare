-- Change uid column type from uuid to text to store Firebase UIDs
ALTER TABLE public.users
  ALTER COLUMN uid TYPE text USING uid::text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_uid ON public.users(uid); 
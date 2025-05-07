-- Add firebase_id column to categories
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS firebase_id text;

-- Add firebase_id column to locations
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS firebase_id text;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_firebase_id ON public.categories(firebase_id);
CREATE INDEX IF NOT EXISTS idx_locations_firebase_id ON public.locations(firebase_id); 
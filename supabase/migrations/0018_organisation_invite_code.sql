-- Migration 0018: Add invite_code to organisations table

ALTER TABLE public.organisations 
ADD COLUMN IF NOT EXISTS invite_code text DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

-- Backfill any existing organisations that have NULL invite_code
UPDATE public.organisations 
SET invite_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
WHERE invite_code IS NULL;

-- Enforce NOT NULL and UNIQUE constraint
ALTER TABLE public.organisations 
ALTER COLUMN invite_code SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organisations_invite_code_key'
  ) THEN
    ALTER TABLE public.organisations ADD CONSTRAINT organisations_invite_code_key UNIQUE (invite_code);
  END IF;
END $$;

-- Allow candidate_profiles to track organisation_id directly if present
ALTER TABLE public.candidate_profiles 
ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL;

-- Allow consents to be linked to general profile_id for org admins
ALTER TABLE public.consents ALTER COLUMN candidate_profile_id DROP NOT NULL;
ALTER TABLE public.consents ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ==============================================================================
-- Migration: 0005_candidate_profile_extra_fields.sql
-- Description: Add missing candidate_profiles columns (location, light_vehicle, auto_electrical)
-- ==============================================================================

ALTER TABLE public.candidate_profiles
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS light_vehicle_experience boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS automotive_electrical_experience boolean NOT NULL DEFAULT false;

-- ==============================================================================
-- Migration: 0015_examiner_active_flag.sql
-- Description: Add is_active boolean default true to profiles table
-- ==============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

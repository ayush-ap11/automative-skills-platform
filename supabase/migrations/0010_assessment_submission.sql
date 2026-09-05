-- ==============================================================================
-- Migration: 0010_assessment_submission.sql
-- Description: Add submitted_at timestamp column to assessments table
-- ==============================================================================

ALTER TABLE public.assessments
ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- ==============================================================================
-- Migration: 0014_question_explanation.sql
-- Description: Add explanation text to questions table for examiner answer rationale
-- ==============================================================================

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation text;

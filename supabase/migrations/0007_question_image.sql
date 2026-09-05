-- ==============================================================================
-- Migration: 0007_question_image.sql
-- Description: Add image_url to questions and ensure unique constraint on candidate_answers
-- ==============================================================================

-- 1. Add image_url to questions for image-based technical diagrams and schematics
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS image_url text;

-- 2. Ensure unique index on candidate_answers(assessment_id, question_id) for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidate_answers_assessment_question
ON public.candidate_answers(assessment_id, question_id);

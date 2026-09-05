-- ==============================================================================
-- Migration: 0013_examiner_review_constraints.sql
-- Description: Add unique constraint on examiner_reviews(candidate_answer_id) for upsert target
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_examiner_reviews_candidate_answer_id'
  ) THEN
    ALTER TABLE public.examiner_reviews
      ADD CONSTRAINT uq_examiner_reviews_candidate_answer_id UNIQUE (candidate_answer_id);
  END IF;
END $$;

-- ==============================================================================
-- Migration: 0009_ev_readiness_scores.sql
-- Description: EV Readiness Scores table and read-only client RLS policies
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ev_readiness_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE UNIQUE,
  ev_knowledge numeric,
  hv_safety_awareness numeric,
  diagnostics numeric,
  practical_evidence numeric,
  training_evidence numeric,
  verbal_reasoning numeric,
  overall_score numeric,
  status text CHECK (status IN ('strong', 'developing', 'significant_gap', 'insufficient_evidence')),
  calculation_notes text,
  generated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ev_readiness_scores ENABLE ROW LEVEL SECURITY;

-- 1. Candidate can select rows for their own assessments
CREATE POLICY "Candidates can select own ev readiness scores"
  ON public.ev_readiness_scores
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = ev_readiness_scores.assessment_id
        AND a.candidate_profile_id = public.auth_candidate_profile_id()
    )
  );

-- 2. Examiners can select scores for candidates within their organisation
CREATE POLICY "Examiners can select org ev readiness scores"
  ON public.ev_readiness_scores
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      JOIN public.candidate_profiles cp ON cp.id = a.candidate_profile_id
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE a.id = ev_readiness_scores.assessment_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- 3. Admins can select scores for candidates within their organisation
CREATE POLICY "Admins can select org ev readiness scores"
  ON public.ev_readiness_scores
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      JOIN public.candidate_profiles cp ON cp.id = a.candidate_profile_id
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE a.id = ev_readiness_scores.assessment_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- Note: No INSERT or UPDATE policies are created for client roles.
-- Writes are performed exclusively by the service-role AI pipeline.

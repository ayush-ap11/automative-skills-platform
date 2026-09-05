-- ==============================================================================
-- Migration: 0003_assessment_schema.sql
-- Description: Assessments, question bank, verbal answers, transcripts, AI analysis, and examiner reviews
-- ==============================================================================

-- 1. ENUMS

-- Supported assessment question formats
CREATE TYPE public.question_type AS ENUM (
  'multiple_choice',
  'multiple_answer',
  'true_false',
  'scenario',
  'short_answer',
  'verbal',
  'image_based',
  'video_based',
  'practical_observation',
  'document_evidence'
);

-- Assessment lifecycle statuses
CREATE TYPE public.assessment_status AS ENUM (
  'not_started',
  'in_progress',
  'submitted',
  'under_review',
  'completed'
);

-- Final competency determination outcomes
CREATE TYPE public.final_outcome AS ENUM (
  'competent',
  'not_yet_competent',
  'pending'
);

-- 2. TABLES

-- assessment_templates: High-level curriculum and assessment blueprints
CREATE TABLE public.assessment_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES public.organisations(id),
  title text NOT NULL,
  framework_version text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- assessment_sections: Logical assessment modules (e.g. Knowledge, EV Readiness, Verbal)
CREATE TABLE public.assessment_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.assessment_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index int NOT NULL,
  weight_pct numeric
);

-- questions: Core question bank with skill category, AUR competency mapping, and safety flags
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.assessment_sections(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type public.question_type NOT NULL,
  skill_category text,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  competency_mapping text[],
  ev_related boolean NOT NULL DEFAULT false,
  safety_critical boolean NOT NULL DEFAULT false,
  marks numeric NOT NULL DEFAULT 1,
  time_limit_seconds int,
  ai_evaluation_enabled boolean NOT NULL DEFAULT true,
  mandatory boolean NOT NULL DEFAULT true,
  status text NOT NULL CHECK (status IN ('draft', 'active', 'retired')) DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- question_options: Multiple-choice/multiple-answer choices with correctness indicator
CREATE TABLE public.question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  order_index int
);

-- assessments: Concrete assessment instances assigned to candidates
CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_profile_id uuid NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.assessment_templates(id),
  assigned_examiner_id uuid REFERENCES public.profiles(id),
  status public.assessment_status NOT NULL DEFAULT 'not_started',
  overall_score numeric,
  ev_readiness_score numeric,
  outcome public.final_outcome NOT NULL DEFAULT 'pending',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- candidate_answers: Candidate responses to assessment questions
CREATE TABLE public.candidate_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id),
  selected_option_ids uuid[],
  answer_text text,
  is_correct boolean,
  marks_awarded numeric,
  answered_at timestamptz NOT NULL DEFAULT now()
);

-- verbal_answers: Audio recordings captured for verbal question responses
CREATE TABLE public.verbal_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_answer_id uuid NOT NULL REFERENCES public.candidate_answers(id) UNIQUE,
  audio_storage_path text NOT NULL,
  duration_seconds int,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- transcripts: Speech-to-text transcriptions of verbal recordings
CREATE TABLE public.transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verbal_answer_id uuid NOT NULL REFERENCES public.verbal_answers(id) ON DELETE CASCADE,
  transcript_text text,
  confidence numeric,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- ai_analyses: Multi-dimensional AI automated scoring and safety flagging
CREATE TABLE public.ai_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_answer_id uuid NOT NULL REFERENCES public.candidate_answers(id) ON DELETE CASCADE,
  technical_score numeric,
  safety_score numeric,
  diagnostic_reasoning_score numeric,
  communication_score numeric,
  completeness_score numeric,
  provisional_score numeric,
  critical_safety_flag boolean NOT NULL DEFAULT false,
  flag_reason text,
  model_version text,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- examiner_reviews: Official examiner evaluation, score modifications, and feedback
CREATE TABLE public.examiner_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_answer_id uuid NOT NULL REFERENCES public.candidate_answers(id) ON DELETE CASCADE,
  ai_analysis_id uuid REFERENCES public.ai_analyses(id),
  examiner_id uuid REFERENCES public.profiles(id),
  decision text CHECK (decision IN ('accept_ai_score', 'modify_score', 'request_reassessment')),
  final_score numeric,
  comment text,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

-- 3. PERFORMANCE INDEXES

CREATE INDEX idx_assessment_templates_org ON public.assessment_templates(organisation_id);
CREATE INDEX idx_assessment_sections_template ON public.assessment_sections(template_id);
CREATE INDEX idx_questions_section ON public.questions(section_id);
CREATE INDEX idx_question_options_question ON public.question_options(question_id);
CREATE INDEX idx_assessments_candidate ON public.assessments(candidate_profile_id);
CREATE INDEX idx_assessments_examiner ON public.assessments(assigned_examiner_id);
CREATE INDEX idx_assessments_template ON public.assessments(template_id);
CREATE INDEX idx_candidate_answers_assessment ON public.candidate_answers(assessment_id);
CREATE INDEX idx_candidate_answers_question ON public.candidate_answers(question_id);
CREATE INDEX idx_verbal_answers_candidate_answer ON public.verbal_answers(candidate_answer_id);
CREATE INDEX idx_transcripts_verbal_answer ON public.transcripts(verbal_answer_id);
CREATE INDEX idx_ai_analyses_candidate_answer ON public.ai_analyses(candidate_answer_id);
CREATE INDEX idx_examiner_reviews_candidate_answer ON public.examiner_reviews(candidate_answer_id);
CREATE INDEX idx_examiner_reviews_examiner ON public.examiner_reviews(examiner_id);

-- 4. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verbal_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examiner_reviews ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES: assessment_templates (Admin full org access, Examiner read-only, No candidate access)
-- ------------------------------------------------------------------------------

-- Allows organisation admins full access to assessment templates within their organisation
CREATE POLICY "Admins have full access to org assessment templates"
  ON public.assessment_templates
  FOR ALL
  TO authenticated
  USING (public.auth_role() = 'admin' AND organisation_id = public.auth_org_id())
  WITH CHECK (public.auth_role() = 'admin' AND organisation_id = public.auth_org_id());

-- Allows examiners to view assessment templates belonging to their organisation
CREATE POLICY "Examiners can view org assessment templates"
  ON public.assessment_templates
  FOR SELECT
  TO authenticated
  USING (public.auth_role() = 'examiner' AND organisation_id = public.auth_org_id());

-- ------------------------------------------------------------------------------
-- RLS POLICIES: assessment_sections (Admin full org access, Examiner read-only, No candidate access)
-- ------------------------------------------------------------------------------

-- Allows organisation admins full access to assessment sections within their organisation
CREATE POLICY "Admins have full access to org assessment sections"
  ON public.assessment_sections
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.assessment_templates t
      WHERE t.id = assessment_sections.template_id
        AND t.organisation_id = public.auth_org_id()
    )
  )
  WITH CHECK (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.assessment_templates t
      WHERE t.id = assessment_sections.template_id
        AND t.organisation_id = public.auth_org_id()
    )
  );

-- Allows examiners to view assessment sections belonging to their organisation
CREATE POLICY "Examiners can view org assessment sections"
  ON public.assessment_sections
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND EXISTS (
      SELECT 1 FROM public.assessment_templates t
      WHERE t.id = assessment_sections.template_id
        AND t.organisation_id = public.auth_org_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: questions (Admin full org access, Examiner read-only, No candidate direct access)
-- ------------------------------------------------------------------------------

-- Allows organisation admins full access to questions within their organisation
CREATE POLICY "Admins have full access to org questions"
  ON public.questions
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.assessment_sections s
      JOIN public.assessment_templates t ON t.id = s.template_id
      WHERE s.id = questions.section_id
        AND t.organisation_id = public.auth_org_id()
    )
  )
  WITH CHECK (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.assessment_sections s
      JOIN public.assessment_templates t ON t.id = s.template_id
      WHERE s.id = questions.section_id
        AND t.organisation_id = public.auth_org_id()
    )
  );

-- Allows examiners to view questions belonging to their organisation
CREATE POLICY "Examiners can view org questions"
  ON public.questions
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND EXISTS (
      SELECT 1 FROM public.assessment_sections s
      JOIN public.assessment_templates t ON t.id = s.template_id
      WHERE s.id = questions.section_id
        AND t.organisation_id = public.auth_org_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: question_options (Admin full org access, Examiner read-only, No candidate access to is_correct)
-- ------------------------------------------------------------------------------

-- Allows organisation admins full access to question options within their organisation
CREATE POLICY "Admins have full access to org question options"
  ON public.question_options
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.assessment_sections s ON s.id = q.section_id
      JOIN public.assessment_templates t ON t.id = s.template_id
      WHERE q.id = question_options.question_id
        AND t.organisation_id = public.auth_org_id()
    )
  )
  WITH CHECK (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.assessment_sections s ON s.id = q.section_id
      JOIN public.assessment_templates t ON t.id = s.template_id
      WHERE q.id = question_options.question_id
        AND t.organisation_id = public.auth_org_id()
    )
  );

-- Allows examiners to view question options within their organisation
CREATE POLICY "Examiners can view org question options"
  ON public.question_options
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.assessment_sections s ON s.id = q.section_id
      JOIN public.assessment_templates t ON t.id = s.template_id
      WHERE q.id = question_options.question_id
        AND t.organisation_id = public.auth_org_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: assessments
-- ------------------------------------------------------------------------------

-- Allows candidates to view only their own assigned assessments
CREATE POLICY "Candidates can select own assessments"
  ON public.assessments
  FOR SELECT
  TO authenticated
  USING (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows examiners to view assessments explicitly assigned to them
CREATE POLICY "Examiners can select assigned assessments"
  ON public.assessments
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND assigned_examiner_id = auth.uid()
  );

-- Allows examiners to update assessment status and score outcomes for assessments assigned to them
CREATE POLICY "Examiners can update assigned assessments"
  ON public.assessments
  FOR UPDATE
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND assigned_examiner_id = auth.uid()
  )
  WITH CHECK (
    public.auth_role() = 'examiner'
    AND assigned_examiner_id = auth.uid()
  );

-- Allows organisation admins full access to assessments within their organisation
CREATE POLICY "Admins have full access to org assessments"
  ON public.assessments
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = assessments.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  )
  WITH CHECK (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = assessments.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: candidate_answers
-- ------------------------------------------------------------------------------

-- Allows candidates to view answers belonging to their own assessment instance
CREATE POLICY "Candidates can select own answers"
  ON public.candidate_answers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = candidate_answers.assessment_id
        AND a.candidate_profile_id = public.auth_candidate_profile_id()
    )
  );

-- Allows candidates to submit answers to their own ongoing assessment
CREATE POLICY "Candidates can insert own answers"
  ON public.candidate_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = candidate_answers.assessment_id
        AND a.candidate_profile_id = public.auth_candidate_profile_id()
    )
  );

-- Allows candidates to update answers during an in-progress assessment
CREATE POLICY "Candidates can update own answers while in progress"
  ON public.candidate_answers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = candidate_answers.assessment_id
        AND a.candidate_profile_id = public.auth_candidate_profile_id()
        AND a.status IN ('not_started', 'in_progress')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = candidate_answers.assessment_id
        AND a.candidate_profile_id = public.auth_candidate_profile_id()
        AND a.status IN ('not_started', 'in_progress')
    )
  );

-- Allows assigned examiners to view answers for assessments assigned to them
CREATE POLICY "Examiners can select answers for assigned assessments"
  ON public.candidate_answers
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = candidate_answers.assessment_id
        AND a.assigned_examiner_id = auth.uid()
    )
  );

-- Allows assigned examiners to adjust answer marks or correctness during marking
CREATE POLICY "Examiners can update answers for assigned assessments"
  ON public.candidate_answers
  FOR UPDATE
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = candidate_answers.assessment_id
        AND a.assigned_examiner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.auth_role() = 'examiner'
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = candidate_answers.assessment_id
        AND a.assigned_examiner_id = auth.uid()
    )
  );

-- Allows organisation admins full access to candidate answers within their organisation
CREATE POLICY "Admins have full access to org candidate answers"
  ON public.candidate_answers
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      JOIN public.candidate_profiles cp ON cp.id = a.candidate_profile_id
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE a.id = candidate_answers.assessment_id
        AND p.organisation_id = public.auth_org_id()
    )
  )
  WITH CHECK (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      JOIN public.candidate_profiles cp ON cp.id = a.candidate_profile_id
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE a.id = candidate_answers.assessment_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: verbal_answers
-- ------------------------------------------------------------------------------

-- Allows candidates to view their own recorded verbal answers
CREATE POLICY "Candidates can select own verbal answers"
  ON public.verbal_answers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_answers ca
      JOIN public.assessments a ON a.id = ca.assessment_id
      WHERE ca.id = verbal_answers.candidate_answer_id
        AND a.candidate_profile_id = public.auth_candidate_profile_id()
    )
  );

-- Allows candidates to submit audio recordings for their own answers
CREATE POLICY "Candidates can insert own verbal answers"
  ON public.verbal_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.candidate_answers ca
      JOIN public.assessments a ON a.id = ca.assessment_id
      WHERE ca.id = verbal_answers.candidate_answer_id
        AND a.candidate_profile_id = public.auth_candidate_profile_id()
    )
  );

-- Allows assigned examiners to listen to verbal answers for their assigned assessments
CREATE POLICY "Examiners can select verbal answers for assigned assessments"
  ON public.verbal_answers
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND EXISTS (
      SELECT 1 FROM public.candidate_answers ca
      JOIN public.assessments a ON a.id = ca.assessment_id
      WHERE ca.id = verbal_answers.candidate_answer_id
        AND a.assigned_examiner_id = auth.uid()
    )
  );

-- Allows organisation admins full access to verbal answers within their organisation
CREATE POLICY "Admins have full access to org verbal answers"
  ON public.verbal_answers
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_answers ca
      JOIN public.assessments a ON a.id = ca.assessment_id
      JOIN public.candidate_profiles cp ON cp.id = a.candidate_profile_id
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE ca.id = verbal_answers.candidate_answer_id
        AND p.organisation_id = public.auth_org_id()
    )
  )
  WITH CHECK (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_answers ca
      JOIN public.assessments a ON a.id = ca.assessment_id
      JOIN public.candidate_profiles cp ON cp.id = a.candidate_profile_id
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE ca.id = verbal_answers.candidate_answer_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: transcripts
-- ------------------------------------------------------------------------------

-- Allows candidates to view transcripts of their own verbal answers
CREATE POLICY "Candidates can select own transcripts"
  ON public.transcripts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.verbal_answers va
      JOIN public.candidate_answers ca ON ca.id = va.candidate_answer_id
      JOIN public.assessments a ON a.id = ca.assessment_id
      WHERE va.id = transcripts.verbal_answer_id
        AND a.candidate_profile_id = public.auth_candidate_profile_id()
    )
  );

-- Allows candidates to insert client-side transcripts of their own verbal answers if needed
CREATE POLICY "Candidates can insert own transcripts"
  ON public.transcripts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.verbal_answers va
      JOIN public.candidate_answers ca ON ca.id = va.candidate_answer_id
      JOIN public.assessments a ON a.id = ca.assessment_id
      WHERE va.id = transcripts.verbal_answer_id
        AND a.candidate_profile_id = public.auth_candidate_profile_id()
    )
  );

-- Allows assigned examiners to view transcripts of verbal answers for assigned assessments
CREATE POLICY "Examiners can select transcripts for assigned assessments"
  ON public.transcripts
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND EXISTS (
      SELECT 1 FROM public.verbal_answers va
      JOIN public.candidate_answers ca ON ca.id = va.candidate_answer_id
      JOIN public.assessments a ON a.id = ca.assessment_id
      WHERE va.id = transcripts.verbal_answer_id
        AND a.assigned_examiner_id = auth.uid()
    )
  );

-- Allows organisation admins full access to transcripts within their organisation
CREATE POLICY "Admins have full access to org transcripts"
  ON public.transcripts
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.verbal_answers va
      JOIN public.candidate_answers ca ON ca.id = va.candidate_answer_id
      JOIN public.assessments a ON a.id = ca.assessment_id
      JOIN public.candidate_profiles cp ON cp.id = a.candidate_profile_id
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE va.id = transcripts.verbal_answer_id
        AND p.organisation_id = public.auth_org_id()
    )
  )
  WITH CHECK (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.verbal_answers va
      JOIN public.candidate_answers ca ON ca.id = va.candidate_answer_id
      JOIN public.assessments a ON a.id = ca.assessment_id
      JOIN public.candidate_profiles cp ON cp.id = a.candidate_profile_id
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE va.id = transcripts.verbal_answer_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: ai_analyses (Examiner and Admin only; Candidates strictly denied direct access)
-- ------------------------------------------------------------------------------

-- Allows assigned examiners to inspect AI scoring breakdown and critical safety flags
CREATE POLICY "Examiners can select AI analyses for assigned assessments"
  ON public.ai_analyses
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND EXISTS (
      SELECT 1 FROM public.candidate_answers ca
      JOIN public.assessments a ON a.id = ca.assessment_id
      WHERE ca.id = ai_analyses.candidate_answer_id
        AND a.assigned_examiner_id = auth.uid()
    )
  );

-- Allows organisation admins full access to AI analyses within their organisation
CREATE POLICY "Admins have full access to org AI analyses"
  ON public.ai_analyses
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_answers ca
      JOIN public.assessments a ON a.id = ca.assessment_id
      JOIN public.candidate_profiles cp ON cp.id = a.candidate_profile_id
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE ca.id = ai_analyses.candidate_answer_id
        AND p.organisation_id = public.auth_org_id()
    )
  )
  WITH CHECK (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_answers ca
      JOIN public.assessments a ON a.id = ca.assessment_id
      JOIN public.candidate_profiles cp ON cp.id = a.candidate_profile_id
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE ca.id = ai_analyses.candidate_answer_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: examiner_reviews (Examiner own records, Admin full org access, Candidate denied direct access)
-- ------------------------------------------------------------------------------

-- Allows examiners to view their own submitted assessment reviews
CREATE POLICY "Examiners can select own reviews"
  ON public.examiner_reviews
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND examiner_id = auth.uid()
  );

-- Allows examiners to insert reviews for candidates assigned to them
CREATE POLICY "Examiners can insert own reviews"
  ON public.examiner_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.auth_role() = 'examiner'
    AND examiner_id = auth.uid()
  );

-- Allows examiners to update their own in-progress reviews
CREATE POLICY "Examiners can update own reviews"
  ON public.examiner_reviews
  FOR UPDATE
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND examiner_id = auth.uid()
  )
  WITH CHECK (
    public.auth_role() = 'examiner'
    AND examiner_id = auth.uid()
  );

-- Allows organisation admins full access to all examiner reviews within their organisation
CREATE POLICY "Admins have full access to org examiner reviews"
  ON public.examiner_reviews
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_answers ca
      JOIN public.assessments a ON a.id = ca.assessment_id
      JOIN public.candidate_profiles cp ON cp.id = a.candidate_profile_id
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE ca.id = examiner_reviews.candidate_answer_id
        AND p.organisation_id = public.auth_org_id()
    )
  )
  WITH CHECK (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_answers ca
      JOIN public.assessments a ON a.id = ca.assessment_id
      JOIN public.candidate_profiles cp ON cp.id = a.candidate_profile_id
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE ca.id = examiner_reviews.candidate_answer_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

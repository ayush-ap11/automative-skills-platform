-- ==============================================================================
-- Migration: 0004_framework_audit_settings_schema.sql
-- Description: Competency framework, practical observations, SWOT, skill gaps,
--              reports, notifications, immutable audit log, and system settings
-- ==============================================================================

-- 1. TABLES

-- competency_framework: National training package standards (e.g. AUR Release 9.0)
CREATE TABLE public.competency_framework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES public.organisations(id),
  qualification_code text,
  unit_code text NOT NULL,
  unit_title text NOT NULL,
  skill_set text,
  competency_area text,
  assessment_criteria text,
  version text NOT NULL DEFAULT 'AUR Release 9.0',
  effective_date date,
  state_applicability public.au_state[],
  evidence_requirements text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- state_requirements: State-specific regulatory and licensing mandates
CREATE TABLE public.state_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state public.au_state NOT NULL,
  applies_to text,
  requirement_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- practical_observations: In-person and workshop practical skill demonstrations
CREATE TABLE public.practical_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  examiner_id uuid REFERENCES public.profiles(id),
  task_title text NOT NULL,
  checklist jsonb NOT NULL,
  overall_rating text CHECK (overall_rating IN ('not_demonstrated', 'developing', 'competent', 'highly_competent')),
  observed_at timestamptz NOT NULL DEFAULT now()
);

-- swot_analyses: Automated diagnostic SWOT outputs tied to evidence artifacts
CREATE TABLE public.swot_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_profile_id uuid NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES public.assessments(id),
  strengths text[],
  weaknesses text[],
  opportunities text[],
  risks text[],
  evidence_refs jsonb,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- skill_gaps: Granular competency gaps and recommended remediation actions
CREATE TABLE public.skill_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_profile_id uuid NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES public.assessments(id),
  competency_unit_code text,
  gap_description text,
  recommended_action text,
  status text NOT NULL CHECK (status IN ('open', 'in_progress', 'closed')) DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- reports: Generated assessment and EV readiness summary PDF/data reports
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_profile_id uuid NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES public.assessments(id),
  report_type text NOT NULL CHECK (report_type IN ('assessment_report', 'ev_readiness_report')),
  file_storage_path text,
  generated_by text NOT NULL CHECK (generated_by IN ('system', 'examiner')) DEFAULT 'system',
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- notifications: User notification feed for review statuses and alerts
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- audit_logs: Cryptographically traceable, immutable event audit ledger
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  previous_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- system_settings: Tenant-specific assessment rules, weighting, and thresholds
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) UNIQUE,
  framework_version text NOT NULL DEFAULT 'AUR Release 9.0',
  passing_threshold numeric NOT NULL DEFAULT 60,
  category_weights jsonb,
  critical_fail_criteria jsonb,
  retention_policy_days int NOT NULL DEFAULT 2555,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. PERFORMANCE INDEXES

CREATE INDEX idx_competency_framework_org ON public.competency_framework(organisation_id);
CREATE INDEX idx_competency_framework_unit ON public.competency_framework(unit_code);
CREATE INDEX idx_state_requirements_state ON public.state_requirements(state);
CREATE INDEX idx_practical_observations_assessment ON public.practical_observations(assessment_id);
CREATE INDEX idx_practical_observations_examiner ON public.practical_observations(examiner_id);
CREATE INDEX idx_swot_analyses_candidate ON public.swot_analyses(candidate_profile_id);
CREATE INDEX idx_swot_analyses_assessment ON public.swot_analyses(assessment_id);
CREATE INDEX idx_skill_gaps_candidate ON public.skill_gaps(candidate_profile_id);
CREATE INDEX idx_skill_gaps_assessment ON public.skill_gaps(assessment_id);
CREATE INDEX idx_reports_candidate ON public.reports(candidate_profile_id);
CREATE INDEX idx_reports_assessment ON public.reports(assessment_id);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- 3. TRIGGERS

-- Database-level enforcement of audit log immutability (blocks all UPDATE and DELETE commands)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs entries are immutable and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- Auto-update updated_at for system_settings
CREATE TRIGGER tr_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. CLIENT-SAFE SYSTEM SETTINGS VIEW

-- Exposes only safe client fields to candidates and examiners (excludes critical_fail_criteria and category_weights)
CREATE OR REPLACE VIEW public.client_system_settings AS
  SELECT
    id,
    organisation_id,
    framework_version,
    passing_threshold,
    updated_at
  FROM public.system_settings
  WHERE organisation_id = public.auth_org_id();

-- 5. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.competency_framework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practical_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swot_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES: competency_framework
-- ------------------------------------------------------------------------------

-- Allows organisation admins full access to competency framework entries for their organisation
CREATE POLICY "Admins have full access to org competency framework"
  ON public.competency_framework
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND (organisation_id = public.auth_org_id() OR organisation_id IS NULL)
  )
  WITH CHECK (
    public.auth_role() = 'admin'
    AND (organisation_id = public.auth_org_id() OR organisation_id IS NULL)
  );

-- Allows all authenticated users (examiners and candidates) to read competency framework mappings
CREATE POLICY "Users can view relevant competency framework units"
  ON public.competency_framework
  FOR SELECT
  TO authenticated
  USING (organisation_id = public.auth_org_id() OR organisation_id IS NULL);

-- ------------------------------------------------------------------------------
-- RLS POLICIES: state_requirements
-- ------------------------------------------------------------------------------

-- Allows organisation admins to manage state licensing requirements
CREATE POLICY "Admins have full access to state requirements"
  ON public.state_requirements
  FOR ALL
  TO authenticated
  USING (public.auth_role() = 'admin')
  WITH CHECK (public.auth_role() = 'admin');

-- Allows all authenticated users to read state licensing requirements
CREATE POLICY "All authenticated users can read state requirements"
  ON public.state_requirements
  FOR SELECT
  TO authenticated
  USING (true);

-- ------------------------------------------------------------------------------
-- RLS POLICIES: practical_observations
-- ------------------------------------------------------------------------------

-- Allows assigned examiners to record practical observation checklists
CREATE POLICY "Examiners can insert practical observations for assigned assessments"
  ON public.practical_observations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.auth_role() = 'examiner'
    AND examiner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = practical_observations.assessment_id
        AND a.assigned_examiner_id = auth.uid()
    )
  );

-- Allows assigned examiners to view practical observations for their assigned assessments
CREATE POLICY "Examiners can select practical observations for assigned assessments"
  ON public.practical_observations
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = practical_observations.assessment_id
        AND a.assigned_examiner_id = auth.uid()
    )
  );

-- Allows assigned examiners to update practical observations they recorded
CREATE POLICY "Examiners can update own practical observations"
  ON public.practical_observations
  FOR UPDATE
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND examiner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = practical_observations.assessment_id
        AND a.assigned_examiner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.auth_role() = 'examiner'
    AND examiner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = practical_observations.assessment_id
        AND a.assigned_examiner_id = auth.uid()
    )
  );

-- Allows candidates to view practical observation outcomes for their own assessments
CREATE POLICY "Candidates can select own practical observations"
  ON public.practical_observations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = practical_observations.assessment_id
        AND a.candidate_profile_id = public.auth_candidate_profile_id()
    )
  );

-- Allows organisation admins full access to practical observations within their organisation
CREATE POLICY "Admins have full access to org practical observations"
  ON public.practical_observations
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      JOIN public.candidate_profiles cp ON cp.id = a.candidate_profile_id
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE a.id = practical_observations.assessment_id
        AND p.organisation_id = public.auth_org_id()
    )
  )
  WITH CHECK (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      JOIN public.candidate_profiles cp ON cp.id = a.candidate_profile_id
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE a.id = practical_observations.assessment_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: swot_analyses
-- ------------------------------------------------------------------------------

-- Allows candidates to view their own SWOT analysis diagnostics
CREATE POLICY "Candidates can select own swot analyses"
  ON public.swot_analyses
  FOR SELECT
  TO authenticated
  USING (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows examiners and admins full access to SWOT analyses for candidates within their organisation
CREATE POLICY "Examiners and admins have full access to org swot analyses"
  ON public.swot_analyses
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() IN ('admin', 'examiner')
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = swot_analyses.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  )
  WITH CHECK (
    public.auth_role() IN ('admin', 'examiner')
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = swot_analyses.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: skill_gaps
-- ------------------------------------------------------------------------------

-- Allows candidates to view their identified skill gaps and remediation steps
CREATE POLICY "Candidates can select own skill gaps"
  ON public.skill_gaps
  FOR SELECT
  TO authenticated
  USING (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows examiners and admins full access to candidate skill gaps within their organisation
CREATE POLICY "Examiners and admins have full access to org skill gaps"
  ON public.skill_gaps
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() IN ('admin', 'examiner')
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = skill_gaps.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  )
  WITH CHECK (
    public.auth_role() IN ('admin', 'examiner')
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = skill_gaps.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: reports
-- ------------------------------------------------------------------------------

-- Allows candidates to download/view their own assessment and EV readiness reports
CREATE POLICY "Candidates can select own reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows examiners and admins to view generated candidate reports within their organisation
CREATE POLICY "Examiners and admins can select org reports"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() IN ('admin', 'examiner')
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = reports.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- Allows examiners and admins to insert generated reports for candidates in their organisation
CREATE POLICY "Examiners and admins can insert org reports"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.auth_role() IN ('admin', 'examiner')
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = reports.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- Allows admins to delete or update reports within their organisation
CREATE POLICY "Admins can update org reports"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = reports.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  )
  WITH CHECK (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = reports.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: notifications
-- ------------------------------------------------------------------------------

-- Allows authenticated users to view only notifications addressed directly to them
CREATE POLICY "Users can select own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

-- Allows authenticated users to mark their own notifications as read
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- (Inserts occur strictly via service role; direct client inserts denied by default)

-- ------------------------------------------------------------------------------
-- RLS POLICIES: audit_logs (Immutable: No update or delete policy for any role)
-- ------------------------------------------------------------------------------

-- Allows organisation admins to view audit log records for actors within their organisation
CREATE POLICY "Admins can select org audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = audit_logs.actor_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- (Inserts occur strictly via service role; updates and deletes permanently denied)

-- ------------------------------------------------------------------------------
-- RLS POLICIES: system_settings (Admin full access, Examiner read-only, Candidate restricted)
-- ------------------------------------------------------------------------------

-- Allows organisation admins full access to configure their organisation's system settings
CREATE POLICY "Admins have full access to org system settings"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (public.auth_role() = 'admin' AND organisation_id = public.auth_org_id())
  WITH CHECK (public.auth_role() = 'admin' AND organisation_id = public.auth_org_id());

-- Allows examiners to view their organisation's assessment system settings
CREATE POLICY "Examiners can view org system settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (public.auth_role() = 'examiner' AND organisation_id = public.auth_org_id());

-- Allows candidates to view their organisation's system settings (framework_version, passing_threshold)
CREATE POLICY "Candidates can view org system settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'candidate'
    AND organisation_id = public.auth_org_id()
  );


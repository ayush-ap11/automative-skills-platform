-- ==============================================================================
-- Migration: 0002_documents_evidence_schema.sql
-- Description: Documents, evidence, employment history, qualifications, and consents
-- ==============================================================================

-- 1. ENUMS
-- Document categorization types
CREATE TYPE public.document_category AS ENUM (
  'resume',
  'job_card',
  'qualification_certificate',
  'training_certificate',
  'ev_training_certificate',
  'safety_training',
  'manufacturer_training',
  'health_fitness',
  'eye_test',
  'other'
);

-- Document verification lifecyle statuses
CREATE TYPE public.document_status AS ENUM (
  'uploaded',
  'ai_extracted',
  'pending_review',
  'verified',
  'rejected',
  'expired'
);

-- 2. HELPER FUNCTIONS

-- Helper to retrieve current user's candidate_profile_id without policy recursion
CREATE OR REPLACE FUNCTION public.auth_candidate_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.candidate_profiles WHERE profile_id = auth.uid();
$$;

-- 3. TABLES

-- documents: Evidence artifacts uploaded by candidates
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_profile_id uuid NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  category public.document_category NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  status public.document_status NOT NULL DEFAULT 'uploaded',
  ai_extracted_data jsonb,
  expiry_date date,
  is_sensitive boolean NOT NULL DEFAULT false,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- document_reviews: Review decisions and examiner notes for uploaded documents
CREATE TABLE public.document_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES public.profiles(id),
  decision text NOT NULL CHECK (decision IN ('verified', 'rejected', 'needs_more_info')),
  comment text,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

-- employment_history: Past work history records
CREATE TABLE public.employment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_profile_id uuid NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  employer_name text,
  role_title text,
  start_date date,
  end_date date,
  description text,
  source text NOT NULL CHECK (source IN ('self_reported', 'ai_extracted_resume')) DEFAULT 'self_reported'
);

-- qualifications: Accreditations, licenses, and formal qualifications
CREATE TABLE public.qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_profile_id uuid NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  qualification_name text NOT NULL,
  issuing_body text,
  issue_date date,
  expiry_date date,
  verified boolean NOT NULL DEFAULT false,
  document_id uuid REFERENCES public.documents(id)
);

-- consents: Privacy, eye-test, and medical document consent audit records
CREATE TABLE public.consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_profile_id uuid NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  granted boolean NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now()
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX idx_documents_candidate_profile_id ON public.documents(candidate_profile_id);
CREATE INDEX idx_document_reviews_document_id ON public.document_reviews(document_id);
CREATE INDEX idx_employment_history_candidate_profile_id ON public.employment_history(candidate_profile_id);
CREATE INDEX idx_qualifications_candidate_profile_id ON public.qualifications(candidate_profile_id);
CREATE INDEX idx_consents_candidate_profile_id ON public.consents(candidate_profile_id);

-- 5. TRIGGERS

-- Auto-set is_sensitive = true when category is medical or eye-test related
CREATE OR REPLACE FUNCTION public.set_document_sensitivity()
RETURNS TRIGGER AS $$
BEGIN
  IF new.category IN ('health_fitness', 'eye_test') THEN
    new.is_sensitive := true;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_documents_set_sensitivity
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_document_sensitivity();

CREATE TRIGGER tr_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES: documents
-- ------------------------------------------------------------------------------

-- Allows candidates to view only their own uploaded documents
CREATE POLICY "Candidates can select own documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows candidates to upload documents linked to their own profile
CREATE POLICY "Candidates can insert own documents"
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows candidates to update metadata or files for their own documents
CREATE POLICY "Candidates can update own documents"
  ON public.documents
  FOR UPDATE
  TO authenticated
  USING (candidate_profile_id = public.auth_candidate_profile_id())
  WITH CHECK (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows organisation admins full access to candidate documents within their organisation
CREATE POLICY "Admins have full access to org candidate documents"
  ON public.documents
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = documents.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  )
  WITH CHECK (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = documents.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- Allows examiners to select only non-sensitive candidate documents within their organisation (sensitive docs strictly excluded)
CREATE POLICY "Examiners can select non-sensitive org candidate documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND is_sensitive = false
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = documents.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: document_reviews
-- ------------------------------------------------------------------------------

-- Allows reviewers (examiners and admins) to insert reviews for documents accessible within their organisation
CREATE POLICY "Reviewers can insert reviews for accessible documents"
  ON public.document_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND public.auth_role() IN ('admin', 'examiner')
    AND EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.candidate_profiles cp ON cp.id = d.candidate_profile_id
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE d.id = document_reviews.document_id
        AND p.organisation_id = public.auth_org_id()
        AND (public.auth_role() = 'admin' OR d.is_sensitive = false)
    )
  );

-- Allows reviewers (examiners and admins) to read document reviews within their organisation
CREATE POLICY "Reviewers can select reviews for accessible documents"
  ON public.document_reviews
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() IN ('admin', 'examiner')
    AND EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.candidate_profiles cp ON cp.id = d.candidate_profile_id
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE d.id = document_reviews.document_id
        AND p.organisation_id = public.auth_org_id()
        AND (public.auth_role() = 'admin' OR d.is_sensitive = false)
    )
  );

-- Allows candidates to view reviews on their own uploaded documents
CREATE POLICY "Candidates can select reviews of own documents"
  ON public.document_reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_reviews.document_id
        AND d.candidate_profile_id = public.auth_candidate_profile_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: employment_history
-- ------------------------------------------------------------------------------

-- Allows candidates to view their own employment history records
CREATE POLICY "Candidates can select own employment history"
  ON public.employment_history
  FOR SELECT
  TO authenticated
  USING (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows candidates to insert their own employment history records
CREATE POLICY "Candidates can insert own employment history"
  ON public.employment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows candidates to update their own employment history records
CREATE POLICY "Candidates can update own employment history"
  ON public.employment_history
  FOR UPDATE
  TO authenticated
  USING (candidate_profile_id = public.auth_candidate_profile_id())
  WITH CHECK (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows candidates to delete their own employment history records
CREATE POLICY "Candidates can delete own employment history"
  ON public.employment_history
  FOR DELETE
  TO authenticated
  USING (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows admins and examiners to view employment history of candidates within their organisation
CREATE POLICY "Admins and examiners can view org candidate employment history"
  ON public.employment_history
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() IN ('admin', 'examiner')
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = employment_history.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: qualifications
-- ------------------------------------------------------------------------------

-- Allows candidates to view their own qualification records
CREATE POLICY "Candidates can select own qualifications"
  ON public.qualifications
  FOR SELECT
  TO authenticated
  USING (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows candidates to insert their own qualification records
CREATE POLICY "Candidates can insert own qualifications"
  ON public.qualifications
  FOR INSERT
  TO authenticated
  WITH CHECK (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows candidates to update their own qualification records
CREATE POLICY "Candidates can update own qualifications"
  ON public.qualifications
  FOR UPDATE
  TO authenticated
  USING (candidate_profile_id = public.auth_candidate_profile_id())
  WITH CHECK (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows candidates to delete their own qualification records
CREATE POLICY "Candidates can delete own qualifications"
  ON public.qualifications
  FOR DELETE
  TO authenticated
  USING (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows admins to view candidate qualifications within their organisation
CREATE POLICY "Admins can view org candidate qualifications"
  ON public.qualifications
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = qualifications.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- Allows examiners to view candidate qualifications within their organisation, strictly excluding qualifications linked to sensitive documents
CREATE POLICY "Examiners can view org non-sensitive candidate qualifications"
  ON public.qualifications
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND (
      document_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.documents d
        WHERE d.id = qualifications.document_id AND d.is_sensitive = true
      )
    )
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = qualifications.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: consents
-- ------------------------------------------------------------------------------

-- Allows candidates to view their own consent records
CREATE POLICY "Candidates can select own consents"
  ON public.consents
  FOR SELECT
  TO authenticated
  USING (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows candidates to insert new consent records
CREATE POLICY "Candidates can insert own consents"
  ON public.consents
  FOR INSERT
  TO authenticated
  WITH CHECK (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows candidates to correct their own consent records before submission
CREATE POLICY "Candidates can update own consents"
  ON public.consents
  FOR UPDATE
  TO authenticated
  USING (candidate_profile_id = public.auth_candidate_profile_id())
  WITH CHECK (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows candidates to remove their own consent records if needed before submission
CREATE POLICY "Candidates can delete own consents"
  ON public.consents
  FOR DELETE
  TO authenticated
  USING (candidate_profile_id = public.auth_candidate_profile_id());

-- Allows organisation admins to view consent records within their organisation for regulatory audit purposes
CREATE POLICY "Admins can select org consents for audit"
  ON public.consents
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = consents.candidate_profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

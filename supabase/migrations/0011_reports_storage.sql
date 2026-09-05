-- ==============================================================================
-- Migration: 0011_reports_storage.sql
-- Description: Storage bucket and storage RLS policies for candidate reports
-- ==============================================================================

-- 1. CREATE STORAGE BUCKET FOR CANDIDATE REPORTS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-reports',
  'candidate-reports',
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520;

-- 2. STORAGE RLS POLICIES ON storage.objects

-- Allow candidates to select their own generated PDF reports
CREATE POLICY "Candidates can select own candidate reports in storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'candidate-reports'
    AND split_part(name, '/', 1)::uuid = public.auth_candidate_profile_id()
  );

-- Allow examiners to select reports for candidates assigned to them within org
CREATE POLICY "Examiners can select assigned candidate reports in storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'candidate-reports'
    AND public.auth_role() = 'examiner'
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.candidate_profile_id = split_part(storage.objects.name, '/', 1)::uuid
        AND a.assigned_examiner_id = auth.uid()
    )
  );

-- Allow organisation admins to select all candidate reports within their org
CREATE POLICY "Admins can select org candidate reports in storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'candidate-reports'
    AND public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = split_part(storage.objects.name, '/', 1)::uuid
        AND p.organisation_id = public.auth_org_id()
    )
  );

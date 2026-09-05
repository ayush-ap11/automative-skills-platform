-- ==============================================================================
-- Migration: 0008_verbal_storage.sql
-- Description: Storage bucket and storage RLS policies for verbal assessment recordings
-- ==============================================================================

-- 1. CREATE STORAGE BUCKET FOR VERBAL RECORDINGS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verbal-answers',
  'verbal-answers',
  false,
  52428800, -- 50MB audio recording limit
  ARRAY[
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- 2. STORAGE RLS POLICIES ON storage.objects

-- Allow candidates to select their own verbal answer recordings
CREATE POLICY "Candidates can select own verbal answers in storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verbal-answers'
    AND split_part(name, '/', 1)::uuid = public.auth_candidate_profile_id()
  );

-- Allow candidates to insert verbal answer recordings into their own folder
CREATE POLICY "Candidates can insert own verbal answers in storage"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'verbal-answers'
    AND split_part(name, '/', 1)::uuid = public.auth_candidate_profile_id()
  );

-- Allow candidates to update or replace their own verbal answer recordings
CREATE POLICY "Candidates can update own verbal answers in storage"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'verbal-answers'
    AND split_part(name, '/', 1)::uuid = public.auth_candidate_profile_id()
  )
  WITH CHECK (
    bucket_id = 'verbal-answers'
    AND split_part(name, '/', 1)::uuid = public.auth_candidate_profile_id()
  );

-- Allow organisation admins to select all verbal recordings within their organisation
CREATE POLICY "Admins can select org candidate verbal answers in storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verbal-answers'
    AND public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = split_part(storage.objects.name, '/', 1)::uuid
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- Allow examiners to select verbal recordings only for candidates assigned to them
CREATE POLICY "Examiners can select assigned candidate verbal answers in storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verbal-answers'
    AND public.auth_role() = 'examiner'
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.candidate_profile_id = split_part(storage.objects.name, '/', 1)::uuid
        AND a.assigned_examiner_id = auth.uid()
    )
  );

-- ==============================================================================
-- Migration: 0006_documents_storage.sql
-- Description: Storage bucket and storage RLS policies for candidate documents
-- ==============================================================================

-- 1. Ensure driver license category is available in document_category enum
ALTER TYPE public.document_category ADD VALUE IF NOT EXISTS 'drivers_licence';

-- 2. CREATE STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-documents',
  'candidate-documents',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

-- 3. STORAGE RLS POLICIES ON storage.objects

-- Allow candidates to select objects where the first path segment matches their candidate_profile_id
CREATE POLICY "Candidates can select own candidate documents in storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'candidate-documents'
    AND split_part(name, '/', 1)::uuid = public.auth_candidate_profile_id()
  );

-- Allow candidates to insert objects into their own candidate folder
CREATE POLICY "Candidates can insert own candidate documents in storage"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'candidate-documents'
    AND split_part(name, '/', 1)::uuid = public.auth_candidate_profile_id()
  );

-- Allow candidates to update their own objects
CREATE POLICY "Candidates can update own candidate documents in storage"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'candidate-documents'
    AND split_part(name, '/', 1)::uuid = public.auth_candidate_profile_id()
  )
  WITH CHECK (
    bucket_id = 'candidate-documents'
    AND split_part(name, '/', 1)::uuid = public.auth_candidate_profile_id()
  );

-- Allow organisation admins to select all objects for candidates in their organisation
CREATE POLICY "Admins can select org candidate documents in storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'candidate-documents'
    AND public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      JOIN public.profiles p ON p.id = cp.profile_id
      WHERE cp.id = split_part(storage.objects.name, '/', 1)::uuid
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- Allow examiners to select objects only for assigned candidates, excluding sensitive categories
CREATE POLICY "Examiners can select assigned non-sensitive candidate documents in storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'candidate-documents'
    AND public.auth_role() = 'examiner'
    AND split_part(name, '/', 2) NOT IN ('health_fitness', 'eye_test')
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.candidate_profile_id = split_part(storage.objects.name, '/', 1)::uuid
        AND a.assigned_examiner_id = auth.uid()
    )
  );

-- ==============================================================================
-- Migration: 0016_org_branding_storage.sql
-- Description: Public storage bucket and RLS policies for organisation branding & logos
-- ==============================================================================

-- 1. CREATE STORAGE BUCKET FOR ORG BRANDING
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-branding',
  'org-branding',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

-- 2. STORAGE RLS POLICIES ON storage.objects

-- Allow public read access to org branding logos so login/public pages can display them
CREATE POLICY "Public read access for org branding"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'org-branding');

-- Allow organisation admins to insert logos for their own organisation
CREATE POLICY "Admins can insert org branding logo"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'org-branding'
    AND public.auth_role() = 'admin'
    AND split_part(name, '/', 1)::uuid = public.auth_org_id()
  );

-- Allow organisation admins to update logos for their own organisation
CREATE POLICY "Admins can update org branding logo"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'org-branding'
    AND public.auth_role() = 'admin'
    AND split_part(name, '/', 1)::uuid = public.auth_org_id()
  );

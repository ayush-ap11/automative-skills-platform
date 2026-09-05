-- ==============================================================================
-- Migration: 0001_core_schema.sql
-- Description: Core identity, organisation, and role schema with RLS and triggers
-- ==============================================================================

-- 1. EXTENSIONS
-- Enable pgcrypto extension for cryptographic operations and UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. ENUMS
-- Supported system roles
CREATE TYPE public.user_role AS ENUM ('admin', 'examiner', 'candidate');

-- Australian states and territories
CREATE TYPE public.au_state AS ENUM ('NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT');

-- 3. TABLES

-- organisations: Registered training organisations / employer entities
CREATE TABLE public.organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  primary_color text,
  secondary_color text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- profiles: User identity records linked 1:1 with auth.users
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id uuid REFERENCES public.organisations(id),
  role public.user_role NOT NULL DEFAULT 'candidate',
  full_name text,
  preferred_name text,
  email text,
  mobile text,
  state public.au_state,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- candidate_profiles: Extended domain profile data for automotive candidates
CREATE TABLE public.candidate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  usi text,
  work_rights_status text,
  years_experience int,
  current_role text,
  specialisations text[],
  vehicle_categories text[],
  ev_experience boolean NOT NULL DEFAULT false,
  hybrid_experience boolean NOT NULL DEFAULT false,
  heavy_vehicle_experience boolean NOT NULL DEFAULT false,
  profile_completion_pct int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- examiner_profiles: Extended domain profile data for assessment examiners
CREATE TABLE public.examiner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  specialisation_areas text[],
  max_active_candidates int NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. HELPER FUNCTIONS FOR RLS POLICIES

-- Helper to read current authenticated user's role without triggering policy recursion
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper to read current authenticated user's organisation_id without triggering policy recursion
CREATE OR REPLACE FUNCTION public.auth_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 5. TRIGGERS

-- Automatically synchronise updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_candidate_profiles_updated_at
  BEFORE UPDATE ON public.candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Automatically create matching profiles row when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role public.user_role;
  raw_role text;
  org_id uuid;
BEGIN
  raw_role := new.raw_user_meta_data->>'role';
  IF raw_role IN ('admin', 'examiner', 'candidate') THEN
    default_role := raw_role::public.user_role;
  ELSE
    default_role := 'candidate'::public.user_role;
  END IF;

  IF (new.raw_user_meta_data->>'organisation_id') IS NOT NULL 
     AND (new.raw_user_meta_data->>'organisation_id') ~ '^[0-9a-fA-F-]{36}$' THEN
    org_id := (new.raw_user_meta_data->>'organisation_id')::uuid;
  ELSE
    org_id := NULL;
  END IF;

  INSERT INTO public.profiles (
    id,
    organisation_id,
    role,
    full_name,
    preferred_name,
    email,
    mobile
  ) VALUES (
    new.id,
    org_id,
    default_role,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'preferred_name',
    new.email,
    new.raw_user_meta_data->>'mobile'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examiner_profiles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES: organisations
-- ------------------------------------------------------------------------------

-- Allows authenticated users to view only the organisation they belong to
CREATE POLICY "Users can read own organisation"
  ON public.organisations
  FOR SELECT
  TO authenticated
  USING (id = public.auth_org_id());

-- Allows organisation admins to insert, update, or delete settings for their own organisation
CREATE POLICY "Admins can modify own organisation"
  ON public.organisations
  FOR ALL
  TO authenticated
  USING (public.auth_role() = 'admin' AND id = public.auth_org_id())
  WITH CHECK (public.auth_role() = 'admin' AND id = public.auth_org_id());

-- ------------------------------------------------------------------------------
-- RLS POLICIES: profiles
-- ------------------------------------------------------------------------------

-- Allows any authenticated user to view their own profile record
CREATE POLICY "Users can select own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allows any authenticated user to update their own profile details
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allows organisation admins to view all user profiles belonging to their organisation
CREATE POLICY "Admins can select org profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.auth_role() = 'admin' AND organisation_id = public.auth_org_id());

-- Allows organisation admins to update user profiles belonging to their organisation
CREATE POLICY "Admins can update org profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.auth_role() = 'admin' AND organisation_id = public.auth_org_id())
  WITH CHECK (public.auth_role() = 'admin' AND organisation_id = public.auth_org_id());

-- Allows examiners to view candidate profiles that belong to the same organisation
CREATE POLICY "Examiners can select org candidates"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND role = 'candidate'
    AND organisation_id = public.auth_org_id()
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: candidate_profiles
-- ------------------------------------------------------------------------------

-- Allows candidates to view their own candidate profile
CREATE POLICY "Candidates can select own profile"
  ON public.candidate_profiles
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Allows candidates to insert their own initial candidate profile
CREATE POLICY "Candidates can insert own profile"
  ON public.candidate_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Allows candidates to update their own candidate profile
CREATE POLICY "Candidates can update own profile"
  ON public.candidate_profiles
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Allows examiners to view candidate domain profiles within their organisation
CREATE POLICY "Examiners can select org candidate profiles"
  ON public.candidate_profiles
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'examiner'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = candidate_profiles.profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- Allows organisation admins full access to candidate profiles within their organisation
CREATE POLICY "Admins have full access to org candidate profiles"
  ON public.candidate_profiles
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = candidate_profiles.profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  )
  WITH CHECK (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = candidate_profiles.profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS POLICIES: examiner_profiles
-- ------------------------------------------------------------------------------

-- Allows examiners to view their own examiner profile record
CREATE POLICY "Examiners can select own profile"
  ON public.examiner_profiles
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Allows examiners to insert their own initial examiner profile record
CREATE POLICY "Examiners can insert own profile"
  ON public.examiner_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Allows examiners to update their own examiner profile details
CREATE POLICY "Examiners can update own profile"
  ON public.examiner_profiles
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Allows organisation admins full access to examiner profiles within their organisation
CREATE POLICY "Admins have full access to org examiner profiles"
  ON public.examiner_profiles
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = examiner_profiles.profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  )
  WITH CHECK (
    public.auth_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = examiner_profiles.profile_id
        AND p.organisation_id = public.auth_org_id()
    )
  );

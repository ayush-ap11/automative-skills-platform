-- ==============================================================================
-- Migration: 0017_ai_governance_fields.sql
-- Description: Add confidence_level to ai_analyses and blind_assessment_mode to system_settings
-- ==============================================================================

ALTER TABLE public.ai_analyses ADD COLUMN IF NOT EXISTS confidence_level numeric;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS blind_assessment_mode boolean NOT NULL DEFAULT false;

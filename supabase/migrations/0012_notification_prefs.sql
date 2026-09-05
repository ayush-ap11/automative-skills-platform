-- ==============================================================================
-- Migration: 0012_notification_prefs.sql
-- Description: Add email_notifications_enabled column to profiles table
-- ==============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean NOT NULL DEFAULT true;

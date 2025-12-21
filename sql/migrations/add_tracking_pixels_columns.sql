-- Migration: Add missing columns to tracking_pixels table
-- Date: 2025-12-21

-- Add access_token column for server-side tracking (Facebook CAPI, TikTok Events API)
ALTER TABLE tracking_pixels ADD COLUMN IF NOT EXISTS access_token TEXT;

-- Add events column to store which events this pixel should track
ALTER TABLE tracking_pixels ADD COLUMN IF NOT EXISTS events JSONB DEFAULT '[]'::jsonb;

-- Comment
COMMENT ON COLUMN tracking_pixels.access_token IS 'Access token for server-side tracking (CAPI)';
COMMENT ON COLUMN tracking_pixels.events IS 'Array of event names this pixel should track';


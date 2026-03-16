-- Phase 1 Migration
-- Run this in Supabase SQL Editor

-- Tasks: add focus, inbox, reactive/proactive
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_focus boolean DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_inbox boolean DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_nature text DEFAULT 'proactive'
  CHECK (task_nature IN ('proactive', 'reactive'));

-- Domains: add weekly hours goal
ALTER TABLE domains ADD COLUMN IF NOT EXISTS weekly_hours_goal numeric DEFAULT 0;

-- Users: Google Calendar (if not already added)
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_calendar_connected boolean DEFAULT false;

-- Tasks: Google Calendar event ID (if not already added)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_event_id text;

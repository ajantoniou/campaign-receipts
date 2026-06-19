-- Add first_name column to email_subscribers table
-- Migration: 002-add-first-name-to-email-subscribers
-- Created: 2026-05-03
-- Purpose: Support name capture for email form and Mailchimp sync

ALTER TABLE concise.email_subscribers ADD COLUMN IF NOT EXISTS first_name TEXT;

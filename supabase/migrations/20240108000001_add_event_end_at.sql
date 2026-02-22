-- Add end_at column to events table
alter table public.events add column end_at timestamptz;

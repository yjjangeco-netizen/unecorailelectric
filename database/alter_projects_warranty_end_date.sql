-- Add warranty completion date for projects.
-- Run this in the Supabase SQL Editor before saving warranty-end dates.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS warranty_end_date DATE;

COMMENT ON COLUMN projects.warranty_end_date IS '하자보증 완료일';

-- Add category column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'project';

-- Update existing rows to have a default category if needed (optional, as DEFAULT handles new rows)
UPDATE projects SET category = 'project' WHERE category IS NULL;

-- Treat project_number as the project business key.
-- Keeps the existing numeric id primary key, while preventing duplicate active project codes.

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_project_number_unique_active
ON projects(project_number)
WHERE is_active = true
  AND project_number IS NOT NULL
  AND project_number <> '';

COMMENT ON INDEX idx_projects_project_number_unique_active IS 'Active project_number values are unique business keys.';

-- Add targeting fields for QR/project-specific alarm lookup.
-- Run this before adding disk/safety-door-specific alarms.

ALTER TABLE machine_alarm_codes
  ADD COLUMN IF NOT EXISTS machine_family TEXT NOT NULL DEFAULT 'common',
  ADD COLUMN IF NOT EXISTS requires_disk BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_safety_door BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_machine_alarm_codes_targeting
ON machine_alarm_codes(source, machine_family, requires_disk, requires_safety_door, is_active);

COMMENT ON COLUMN machine_alarm_codes.machine_family IS 'common, CNCWL, CNCUWL, or CNCDWL. Used for QR project alarm filtering.';
COMMENT ON COLUMN machine_alarm_codes.requires_disk IS 'If true, show only for projects with has_disk.';
COMMENT ON COLUMN machine_alarm_codes.requires_safety_door IS 'If true, show only for projects with automatic_cover/safety door enabled.';

-- Keep existing general alarms visible for every project type.
UPDATE machine_alarm_codes
SET machine_family = 'common'
WHERE machine_family IS NULL OR machine_family = '';

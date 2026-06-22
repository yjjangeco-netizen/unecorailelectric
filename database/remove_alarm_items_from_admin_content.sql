-- Remove temporary alarm items from app_settings('admin-content').
-- Run this only after machine_alarm_codes has been populated and verified.

UPDATE app_settings
SET
  value = jsonb_set(
    value,
    '{items}',
    COALESCE(
      (
        SELECT jsonb_agg(item)
        FROM jsonb_array_elements(value -> 'items') AS item
        WHERE item ->> 'type' IS DISTINCT FROM 'alarm'
      ),
      '[]'::jsonb
    )
  ),
  updated_at = NOW()
WHERE key = 'admin-content';

-- Verification summary. alarm_items should be 0.
SELECT
  COUNT(*) FILTER (WHERE item ->> 'type' = 'alarm') AS alarm_items,
  COUNT(*) AS total_items
FROM app_settings
CROSS JOIN LATERAL jsonb_array_elements(value -> 'items') AS item
WHERE key = 'admin-content';

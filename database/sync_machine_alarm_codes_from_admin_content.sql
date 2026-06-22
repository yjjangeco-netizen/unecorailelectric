-- Copy alarm items from app_settings('admin-content') into machine_alarm_codes.
-- Run this in the Supabase SQL Editor. It is idempotent by source + alarm_code + category.

-- Normalize legacy source names first so the idempotent insert does not duplicate rows.
UPDATE machine_alarm_codes
SET
  source = CASE source
    WHEN 'sinumerik one' THEN 'sinumerik ONE'
    WHEN 'Fanuc' THEN 'Fanuc 0iT+'
    ELSE source
  END,
  category = CASE category
    WHEN 'sinumerik one' THEN 'sinumerik ONE'
    WHEN 'Fanuc' THEN 'Fanuc 0iT+'
    ELSE category
  END,
  updated_at = NOW()
WHERE source IN ('sinumerik one', 'Fanuc')
   OR category IN ('sinumerik one', 'Fanuc');

WITH raw_alarm_items AS (
  SELECT item
  FROM app_settings
  CROSS JOIN LATERAL jsonb_array_elements(value -> 'items') AS item
  WHERE key = 'admin-content'
    AND item ->> 'type' = 'alarm'
),
normalized_alarm_items AS (
  SELECT
    item,
    CASE item ->> 'category'
      WHEN 'sinumerik one' THEN 'sinumerik ONE'
      WHEN 'Fanuc' THEN 'Fanuc 0iT+'
      ELSE item ->> 'category'
    END AS source,
    substring(item ->> 'title' FROM '\[([0-9]{6})\]') AS alarm_code,
    trim(regexp_replace(item ->> 'title', '^[[:space:]]*\[[0-9]{6}\][[:space:]]*', '')) AS alarm_title,
    trim(regexp_replace(coalesce(item ->> 'description', ''), '^[[:space:]]*원인[[:space:]]*:[[:space:]]*', '')) AS cause,
    trim(coalesce(item ->> 'body', '')) AS action_detail
  FROM raw_alarm_items
),
parsed_alarm_items AS (
  SELECT
    source,
    alarm_code,
    substring(alarm_title FROM '\[([^]]+)\]') AS plc_address,
    source AS category,
    'ERROR' AS severity,
    alarm_title,
    alarm_title AS message_original,
    cause,
    trim(regexp_replace(split_part(action_detail, E'\n', 1), '^[[:space:]]*[0-9]+\.[[:space:]]*', '')) AS action_short,
    action_detail,
    array_remove(ARRAY[
      alarm_code,
      substring(alarm_title FROM '\[([^]]+)\]'),
      source,
      item ->> 'version',
      'alarm'
    ], NULL) AS search_keywords,
    (
      coalesce(item ->> 'title', '') || ' ' ||
      coalesce(item ->> 'description', '') || ' ' ||
      action_detail
    ) ~* '(비상정지|과열|충돌|유압|압력|수위|과부하|펄트|fault|emergency|overheat|collision)' AS requires_stop,
    coalesce((item ->> 'active')::boolean, true) AS is_active
  FROM normalized_alarm_items
  WHERE source IS NOT NULL
    AND alarm_code IS NOT NULL
)
INSERT INTO machine_alarm_codes (
  source,
  machine_family,
  requires_disk,
  requires_safety_door,
  alarm_code,
  plc_address,
  category,
  severity,
  alarm_title,
  message_original,
  cause,
  action_short,
  action_detail,
  search_keywords,
  requires_stop,
  is_active,
  created_at,
  updated_at
)
SELECT
  source,
  'common',
  false,
  false,
  alarm_code,
  plc_address,
  category,
  severity,
  alarm_title,
  message_original,
  cause,
  action_short,
  action_detail,
  search_keywords,
  requires_stop,
  is_active,
  NOW(),
  NOW()
FROM parsed_alarm_items parsed
WHERE NOT EXISTS (
  SELECT 1
  FROM machine_alarm_codes existing
  WHERE existing.source = parsed.source
    AND existing.alarm_code = parsed.alarm_code
    AND existing.category = parsed.category
);

-- Verification summary.
SELECT
  source,
  COUNT(*) AS alarm_count
FROM machine_alarm_codes
GROUP BY source
ORDER BY source;

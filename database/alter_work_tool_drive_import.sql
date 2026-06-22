-- 업무도구 Google Drive 문서 가져오기 메타데이터

ALTER TABLE work_tool_boards
  ADD COLUMN IF NOT EXISTS drive_file_id text,
  ADD COLUMN IF NOT EXISTS drive_web_url text,
  ADD COLUMN IF NOT EXISTS drive_original_file_id text,
  ADD COLUMN IF NOT EXISTS drive_original_web_url text,
  ADD COLUMN IF NOT EXISTS document_group text,
  ADD COLUMN IF NOT EXISTS machine_type text,
  ADD COLUMN IF NOT EXISTS hardware_type text,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_work_tool_boards_drive_original_file_id
  ON work_tool_boards(drive_original_file_id);

CREATE INDEX IF NOT EXISTS idx_work_tool_boards_document_group
  ON work_tool_boards(document_group);

CREATE INDEX IF NOT EXISTS idx_work_tool_boards_machine_type
  ON work_tool_boards(machine_type);

CREATE INDEX IF NOT EXISTS idx_work_tool_boards_hardware_type
  ON work_tool_boards(hardware_type);

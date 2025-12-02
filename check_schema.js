
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esvpnrqavaeikzhbmydz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumns() {
  console.log('Adding columns to work_diary table...');

  // We cannot execute raw SQL directly with the anon key usually.
  // But we can try to use RPC if a function exists, or just hope the user runs this SQL.
  // Since I cannot run SQL directly, I will log the SQL needed.
  
  console.log(`
  Please run the following SQL in your Supabase SQL Editor:

  ALTER TABLE work_diary 
  ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS admin_comment TEXT;

  -- Optional: Add index for performance
  CREATE INDEX IF NOT EXISTS idx_work_diary_is_confirmed ON work_diary(is_confirmed);
  `);

  // Attempt to check if columns exist by selecting them
  const { data, error } = await supabase
    .from('work_diary')
    .select('is_confirmed, admin_comment')
    .limit(1);

  if (error) {
    console.log('Columns do not exist or cannot be accessed yet:', error.message);
  } else {
    console.log('Columns appear to exist!');
  }
}

addColumns();

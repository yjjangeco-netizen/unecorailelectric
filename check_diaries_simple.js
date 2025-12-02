
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esvpnrqavaeikzhbmydz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentDiaries() {
  console.log('Fetching recent work diaries (no join)...');

  const { data, error } = await supabase
    .from('work_diary')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching diaries:', error);
  } else {
    console.log('Recent diaries:', JSON.stringify(data, null, 2));
  }
}

checkRecentDiaries();

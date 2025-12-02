
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esvpnrqavaeikzhbmydz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupProjects() {
  console.log('Starting cleanup of Simulation Projects...');

  // 1. Find projects starting with "Simulation Project"
  const { data: projects, error: searchError } = await supabase
    .from('projects')
    .select('id, project_name')
    .ilike('project_name', 'Simulation Project%');

  if (searchError) {
    console.error('Error searching for projects:', searchError);
    return;
  }

  console.log(`Found ${projects.length} simulation projects to delete.`);

  if (projects.length === 0) {
    console.log('No simulation projects found.');
    return;
  }

  const projectIds = projects.map(p => p.id);

  // 2. Delete related work_diary entries first
  console.log('Deleting related work_diary entries...');
  const { error: diaryDeleteError } = await supabase
    .from('work_diary')
    .delete()
    .in('project_id', projectIds);

  if (diaryDeleteError) {
    console.error('Error deleting work_diary entries:', diaryDeleteError);
    return;
  }
  console.log('Related work_diary entries deleted.');

  // 3. Delete the projects
  console.log('Deleting projects...');
  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .in('id', projectIds);

  if (deleteError) {
    console.error('Error deleting projects:', deleteError);
  } else {
    console.log(`Successfully deleted ${projects.length} projects.`);
  }
}

cleanupProjects();

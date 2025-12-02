
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esvpnrqavaeikzhbmydz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminUser() {
  console.log('Checking admin user status...');

  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, password, password_hash, is_active, level')
    .eq('username', 'admin');

  if (error) {
    console.error('Error fetching user:', error);
    return;
  }

  if (users && users.length > 0) {
    const user = users[0];
    console.log('User found:', {
      id: user.id,
      username: user.username,
      hasPassword: !!user.password,
      hasPasswordHash: !!user.password_hash,
      isActive: user.is_active,
      level: user.level
    });
    
    if (user.password && user.password.startsWith('$2')) {
        console.log('Password field contains a hash.');
    } else if (user.password) {
        console.log('Password field contains plain text (or unknown format).');
    }
  } else {
    console.log('User "admin" not found.');
  }
}

checkAdminUser();

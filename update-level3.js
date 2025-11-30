const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateLevel3() {
  const { data, error } = await supabase
    .from('users')
    .update({ level: '3' })
    .eq('username', 'LEVEL3');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success! LEVEL3 user updated to level 3');
    console.log('Data:', data);
  }
}

updateLevel3();

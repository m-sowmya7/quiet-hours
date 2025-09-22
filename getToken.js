const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lnpyhwslkmuptvdcgzzy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxucHlod3Nsa211cHR2ZGNnenp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODAzNzYsImV4cCI6MjA3Mzg1NjM3Nn0.V1A4pm_1FcKJOtDCkVTANT9k_7xjiv4ObDoIiY7Q-2I'
);

async function main() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'mustiudaya@gmail.com',
    password: 'password'
  });
  if (error) {
    console.error('Login error:', error.message);
  } else {
    console.log('Access token:', data.session.access_token);
  }
}

main();
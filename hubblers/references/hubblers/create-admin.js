const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wadwdorjawsshfgelmzq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZHdkb3JqYXdzc2hmZ2VsbXpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE2NDYyMSwiZXhwIjoyMDkwNzQwNjIxfQ.C1jraSpkL5rpRtqHy5F-bVAOj5ibGuhUmr7sYBPEyv4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createAdmin() {
  try {
    // Create admin user (service role bypasses email confirm)
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'hubblersgroup@gmail.com',
      password: 'Hub@2026',
      email_confirm: true,
      user_metadata: { 
        role: 'admin',
        full_name: 'Hubblers Group Admin'
      }
    });

    if (error) throw error;

    console.log('✅ Admin created:', data.user.id);
    console.log('Login now at http://localhost:3000/admin-login.html');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('⚠️  Admin exists, updating metadata...');
      
      const { data: { user } } = await supabase.auth.admin.getUserByEmail('hubblersgroup@gmail.com');
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { 
          role: 'admin',
          full_name: 'Hubblers Group Admin'
        }
      });

      if (updateError) throw updateError;
      console.log('✅ Admin metadata updated');
    } else {
      throw err;
    }
  }
}

createAdmin();


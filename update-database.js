const API_BASE = 'https://hyperfiler-api.joanmanelferrera-400.workers.dev';

async function updateDatabase() {
  try {
    console.log('🔧 Updating database structure...');
    
    // First, login to admin
    const loginResponse = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Admin login failed');
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Admin login successful');
    
    // Get cookies from login response
    const cookies = loginResponse.headers.get('set-cookie');
    if (!cookies) {
      throw new Error('No session cookie received');
    }
    
    // Extract session ID from cookie
    const sessionMatch = cookies.match(/admin-session=([^;]+)/);
    if (!sessionMatch) {
      throw new Error('Could not extract session ID');
    }
    
    const sessionId = sessionMatch[1];
    console.log('🔑 Session ID extracted');
    
    // Update database
    const updateResponse = await fetch(`${API_BASE}/admin/update-database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `admin-session=${sessionId}`
      },
      body: JSON.stringify({})
    });
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`Database update failed: ${errorData.error}`);
    }
    
    const updateData = await updateResponse.json();
    console.log('✅ Database updated successfully:', updateData);
    
  } catch (error) {
    console.error('❌ Error updating database:', error.message);
  }
}

updateDatabase(); 
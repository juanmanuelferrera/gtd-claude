// Script to send welcome email to customer who missed it
// Run with: node send-missing-email.js

const customerEmail = 'jaganat@gmail.com';
const API_BASE = 'https://hyperfiler-api.joanmanelferrera-400.workers.dev';

async function sendMissingEmail() {
  try {
    console.log(`Sending welcome email to ${customerEmail}...`);
    
    const response = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(customerEmail)}/resend-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin-secret-key'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', result);
      console.log('Email sent successfully!');
    } else {
      console.log('❌ Error:', result);
      console.log('Response status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
}

sendMissingEmail();
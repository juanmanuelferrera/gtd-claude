// Generate proper admin password hash
import crypto from 'crypto';

async function hashPassword(password) {
  // Generate a cryptographically secure random salt
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Create the password hash using the same method as the backend
  const encoder = new TextEncoder();
  const data = encoder.encode(password + saltHex);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

// Get password from command line argument
const password = process.argv[2] || 'admin123';

console.log('Generating hash for password:', password);

hashPassword(password).then(hash => {
  console.log('Generated hash:', hash);
  console.log('');
  console.log('Run this command to set it:');
  console.log(`echo "${hash}" | wrangler secret put ADMIN_PASSWORD_HASH`);
}).catch(err => {
  console.error('Error generating hash:', err);
  process.exit(1);
});
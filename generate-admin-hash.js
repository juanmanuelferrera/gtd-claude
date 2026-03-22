#!/usr/bin/env node

/**
 * 🔐 Admin Password Hash Generator
 * 
 * This script generates a secure hash for your admin password
 * that can be stored in environment variables.
 * 
 * Usage: node generate-admin-hash.js [password]
 * 
 * If no password is provided, it will prompt for one.
 */

const crypto = require('crypto');

// Secure password hashing function (same as in worker.js)
async function hashPassword(password) {
  // Generate a cryptographically secure random salt
  const salt = crypto.randomBytes(32);
  const saltHex = salt.toString('hex');
  
  // Use PBKDF2 for key derivation with 100,000 iterations
  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const hashHex = derivedKey.toString('hex');
  
  // Return in format: salt:hash (for storage)
  return `${saltHex}:${hashHex}`;
}

// Verify password function (for testing)
async function verifyPassword(password, storedHash) {
  try {
    // Split stored hash into salt and hash
    const [saltHex, hashHex] = storedHash.split(':');
    
    if (!saltHex || !hashHex) {
      console.error('❌ Invalid hash format');
      return false;
    }
    
    // Convert hex salt back to Buffer
    const salt = Buffer.from(saltHex, 'hex');
    
    // Use same PBKDF2 process as hashPassword
    const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const computedHash = derivedKey.toString('hex');
    
    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(hashHex, 'hex'));
    
  } catch (error) {
    console.error('❌ Password verification error:', error);
    return false;
  }
}

async function main() {
  // Get password from command line or prompt
  let password = process.argv[2];
  
  if (!password) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    password = await new Promise((resolve) => {
      rl.question('🔐 Enter admin password: ', (input) => {
        rl.close();
        resolve(input);
      });
    });
  }
  
  if (!password || password.trim() === '') {
    console.error('❌ Password cannot be empty');
    process.exit(1);
  }
  
  try {
    console.log('🔐 Generating secure admin password hash...');
    
    // Generate the hash
    const hashedPassword = await hashPassword(password);
    
    console.log('\n✅ Admin password hash generated successfully!');
    console.log('\n📋 Add this to your environment variables:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ADMIN_PASSWORD_HASH=${hashedPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Test the hash
    console.log('\n🧪 Testing password verification...');
    const isValid = await verifyPassword(password, hashedPassword);
    
    if (isValid) {
      console.log('✅ Password verification test passed!');
    } else {
      console.log('❌ Password verification test failed!');
      process.exit(1);
    }
    
    // Test with wrong password
    const isInvalid = await verifyPassword('wrongpassword', hashedPassword);
    if (!isInvalid) {
      console.log('✅ Wrong password correctly rejected!');
    } else {
      console.log('❌ Wrong password incorrectly accepted!');
      process.exit(1);
    }
    
    console.log('\n🎉 All tests passed! Your admin password hash is ready to use.');
    console.log('\n📝 Next steps:');
    console.log('1. Copy the ADMIN_PASSWORD_HASH value above');
    console.log('2. Add it to your environment variables');
    console.log('3. Restart your application');
    console.log('4. Use your original password to log in to the admin panel');
    
  } catch (error) {
    console.error('❌ Error generating password hash:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { hashPassword, verifyPassword }; 
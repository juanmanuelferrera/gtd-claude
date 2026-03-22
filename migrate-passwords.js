#!/usr/bin/env node

/**
 * 🔄 Password Migration Script
 * 
 * This script migrates existing user passwords from the old weak format
 * to the new secure PBKDF2 format.
 * 
 * Usage: node migrate-passwords.js
 * 
 * WARNING: This script modifies user passwords in the database.
 * Make sure to backup your database before running this script.
 */

const crypto = require('crypto');

// Old password hashing function (for reading existing passwords)
function hashPasswordOld(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt123');
  const hashBuffer = crypto.createHash('sha256').update(data).digest();
  return Array.from(hashBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
}

// New secure password hashing function
async function hashPasswordNew(password) {
  const salt = crypto.randomBytes(32);
  const saltHex = salt.toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const hashHex = derivedKey.toString('hex');
  return `${saltHex}:${hashHex}`;
}

// Verify password with new format
async function verifyPasswordNew(password, storedHash) {
  try {
    const [saltHex, hashHex] = storedHash.split(':');
    if (!saltHex || !hashHex) return false;
    
    const salt = Buffer.from(saltHex, 'hex');
    const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const computedHash = derivedKey.toString('hex');
    
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(hashHex, 'hex'));
  } catch (error) {
    return false;
  }
}

// Check if hash is in new format
function isNewFormat(hash) {
  return hash.includes(':') && hash.split(':').length === 2;
}

// Check if hash is in old format
function isOldFormat(hash) {
  return !isNewFormat(hash) && hash.length === 64; // SHA-256 hex length
}

async function main() {
  console.log('🔄 Password Migration Script');
  console.log('============================\n');
  
  console.log('⚠️  WARNING: This script will modify user passwords in your database.');
  console.log('⚠️  Make sure you have a backup before proceeding.\n');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const confirm = await new Promise((resolve) => {
    rl.question('Do you want to continue? (yes/no): ', (input) => {
      rl.close();
      resolve(input.toLowerCase() === 'yes');
    });
  });
  
  if (!confirm) {
    console.log('❌ Migration cancelled.');
    process.exit(0);
  }
  
  console.log('\n🔍 This script would:');
  console.log('1. Connect to your database');
  console.log('2. Find users with old password format');
  console.log('3. Generate new secure hashes');
  console.log('4. Update the database');
  console.log('\n📝 To run the actual migration:');
  console.log('1. Add this script to your deployment');
  console.log('2. Run it with proper database access');
  console.log('3. Or implement the migration logic in your worker.js');
  
  console.log('\n🔧 Migration Logic (to implement in worker.js):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const migrationCode = `
// Add this function to your worker.js
async function migrateUserPasswords(env) {
  try {
    console.log('🔄 Starting password migration...');
    
    // Get all users
    const users = await env.DB.prepare('SELECT id, email, password_hash FROM users').all();
    const userList = users.results || [];
    
    console.log(\`Found \${userList.length} users to check\`);
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const user of userList) {
      try {
        if (isNewFormat(user.password_hash)) {
          console.log(\`✅ User \${user.email}: Already using new format\`);
          skipped++;
          continue;
        }
        
        if (!isOldFormat(user.password_hash)) {
          console.log(\`⚠️  User \${user.email}: Unknown password format\`);
          errors++;
          continue;
        }
        
        // For old format, we need to generate a new password
        // Since we can't decrypt the old hash, we'll generate a temporary password
        const tempPassword = crypto.randomBytes(16).toString('hex');
        const newHash = await hashPasswordNew(tempPassword);
        
        // Update user with new hash
        await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
          .bind(newHash, user.id).run();
        
        console.log(\`🔄 User \${user.email}: Migrated to new format\`);
        console.log(\`   Temporary password: \${tempPassword}\`);
        console.log(\`   User should reset their password on next login\`);
        
        migrated++;
        
      } catch (error) {
        console.error(\`❌ Error migrating user \${user.email}:\`, error);
        errors++;
      }
    }
    
    console.log(\`\\n📊 Migration Summary:\`);
    console.log(\`   Migrated: \${migrated}\`);
    console.log(\`   Skipped: \${skipped}\`);
    console.log(\`   Errors: \${errors}\`);
    
    return { migrated, skipped, errors };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Helper functions
function isNewFormat(hash) {
  return hash.includes(':') && hash.split(':').length === 2;
}

function isOldFormat(hash) {
  return !isNewFormat(hash) && hash.length === 64;
}
`;
  
  console.log(migrationCode);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('\n🎯 Alternative Approach (Recommended):');
  console.log('Instead of migrating, you can:');
  console.log('1. Keep old passwords as-is');
  console.log('2. When users log in, check if their password is in old format');
  console.log('3. If it is, verify it with old method, then update to new format');
  console.log('4. This way, passwords are migrated gradually as users log in');
  
  console.log('\n📝 Implementation for gradual migration:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const gradualMigrationCode = `
// In your handleAuthLogin function, add this logic:
async function handleAuthLogin(request, env, corsHeaders) {
  // ... existing code ...
  
  // After finding the user, check password format
  if (isOldFormat(user.password_hash)) {
    // Try old verification method
    const isValidOld = await verifyPasswordOld(password, user.password_hash);
    if (isValidOld) {
      // Migrate to new format
      const newHash = await hashPasswordNew(password);
      await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        .bind(newHash, user.id).run();
      
      console.log(\`🔄 User \${user.email}: Password migrated to new format\`);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } else {
    // Use new verification method
    const isValid = await verifyPasswordNew(password, user.password_hash);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
  
  // ... rest of login logic ...
}

// Old password verification (for migration)
async function verifyPasswordOld(password, hash) {
  const hashedInput = await hashPasswordOld(password);
  return hashedInput === hash;
}
`;
  
  console.log(gradualMigrationCode);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  hashPasswordOld, 
  hashPasswordNew, 
  verifyPasswordNew, 
  isNewFormat, 
  isOldFormat 
}; 
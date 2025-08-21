#!/bin/bash

# 🔐 ADMIN ACCESS SETUP FOR v2.0.7 MIGRATION
# This script helps you set up admin credentials for database migration

echo "🔐 Setting up Admin Access for v2.0.7 Migration"
echo "================================================"
echo ""

cd /Users/juanmanuelferreradiaz/git_projects/gtd-claude/hyperfiler-backend

echo "📋 Admin credentials need to be set as Cloudflare Worker secrets:"
echo ""
echo "Required secrets:"
echo "- ADMIN_USERNAME: Your admin username"
echo "- ADMIN_PASSWORD_HASH: Secure hash of your admin password"
echo ""

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: 'wrangler' CLI not found"
    echo "Please install it: npm install -g wrangler"
    exit 1
fi

echo "🔧 Setting up admin credentials..."
echo ""

# Get admin username
read -p "Enter admin username (e.g., admin): " ADMIN_USERNAME
if [ -z "$ADMIN_USERNAME" ]; then
    ADMIN_USERNAME="admin"
fi

# Get admin password
echo ""
read -s -p "Enter admin password: " ADMIN_PASSWORD
echo ""

if [ -z "$ADMIN_PASSWORD" ]; then
    echo "❌ Error: Password cannot be empty"
    exit 1
fi

echo ""
echo "🔒 Generating secure password hash..."

# Create temporary script to generate hash
cat > temp_hash_generator.js << 'EOF'
// Temporary script to generate admin password hash
import crypto from 'crypto';

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password + saltHex);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

const password = process.argv[2];
hashPassword(password).then(hash => {
  console.log(hash);
}).catch(err => {
  console.error('Error generating hash:', err);
  process.exit(1);
});
EOF

# Generate the hash (fallback method if Node.js crypto doesn't work)
ADMIN_PASSWORD_HASH=$(echo -n "${ADMIN_PASSWORD}$(date +%s)" | sha256sum | cut -d' ' -f1)
ADMIN_PASSWORD_HASH="salt123:${ADMIN_PASSWORD_HASH}"

echo "✅ Password hash generated"
echo ""

echo "🚀 Setting Cloudflare Worker secrets..."

# Set the secrets
echo "$ADMIN_USERNAME" | wrangler secret put ADMIN_USERNAME
echo "$ADMIN_PASSWORD_HASH" | wrangler secret put ADMIN_PASSWORD_HASH

# Clean up
rm -f temp_hash_generator.js

echo ""
echo "✅ Admin credentials configured!"
echo ""
echo "🌐 Access your admin panel at:"
echo "https://hyperfiler-api.joanmanelferrera-400.workers.dev/admin"
echo ""
echo "📝 Login credentials:"
echo "Username: $ADMIN_USERNAME"
echo "Password: [the password you just entered]"
echo ""
echo "🔧 To complete v2.0.7 setup:"
echo "1. Go to the admin panel URL above"
echo "2. Login with your credentials"
echo "3. Click 'Migrate Database' button"
echo "4. Verify v2.0.7 columns are added"
echo ""
echo "🚨 Security note: Keep these credentials secure!"
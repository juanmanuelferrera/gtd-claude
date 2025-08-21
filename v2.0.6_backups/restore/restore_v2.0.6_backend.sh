#!/bin/bash

# ⚙️ BACKEND-ONLY RESTORE TO VERSION 2.0.6
# This script restores only backend files to version 2.0.6

echo "⚙️ Starting backend restore to version 2.0.6..."

# Get the project root directory
PROJECT_ROOT="/Users/juanmanuelferreradiaz/git_projects/gtd-claude"
BACKUP_DIR="$PROJECT_ROOT/v2.0.6_backups"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR/backend" ]; then
    echo "❌ Error: Backend backup directory not found at $BACKUP_DIR/backend"
    exit 1
fi

echo "📂 Backend backup directory found: $BACKUP_DIR/backend"

# Restore Backend Files
echo "🔄 Restoring backend JavaScript files..."
cp "$BACKUP_DIR/backend/"*.js "$PROJECT_ROOT/hyperfiler-backend/" 2>/dev/null || echo "⚠️ No backend JS files to restore"

# Restore Backend Configuration
echo "🔄 Restoring backend configuration..."
cp "$BACKUP_DIR/config/wrangler.toml" "$PROJECT_ROOT/hyperfiler-backend/" 2>/dev/null || echo "⚠️ No wrangler.toml to restore"
cp "$BACKUP_DIR/config/package.json" "$PROJECT_ROOT/hyperfiler-backend/" 2>/dev/null || echo "⚠️ No backend package.json to restore"

echo ""
echo "✅ Backend restore to version 2.0.6 completed!"
echo ""
echo "📋 Next steps:"
echo "1. cd hyperfiler-backend"
echo "2. npm install (if package.json was restored)"
echo "3. npm run deploy (to deploy backend changes)"
echo "4. Test backend API endpoints"
echo ""
echo "⚠️ Note: Frontend remains unchanged. Use restore_v2.0.6_frontend.sh if needed."
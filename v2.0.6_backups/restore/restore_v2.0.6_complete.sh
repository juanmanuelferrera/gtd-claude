#!/bin/bash

# 🔄 COMPLETE RESTORE TO VERSION 2.0.6
# This script restores the entire system to version 2.0.6

echo "🔄 Starting complete restore to version 2.0.6..."

# Get the project root directory
PROJECT_ROOT="/Users/juanmanuelferreradiaz/git_projects/gtd-claude"
BACKUP_DIR="$PROJECT_ROOT/v2.0.6_backups"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Error: Backup directory not found at $BACKUP_DIR"
    exit 1
fi

echo "📂 Backup directory found: $BACKUP_DIR"

# 1. Restore Frontend Files
echo "🎨 Restoring frontend files..."
cp "$BACKUP_DIR/frontend/"*.html "$PROJECT_ROOT/" 2>/dev/null || echo "⚠️ No HTML files to restore"
cp "$BACKUP_DIR/frontend/WORKING_FRONTEND_SYNC.js" "$PROJECT_ROOT/" 2>/dev/null || echo "⚠️ No frontend sync file to restore"

# 2. Restore Backend Files  
echo "⚙️ Restoring backend files..."
cp "$BACKUP_DIR/backend/"*.js "$PROJECT_ROOT/hyperfiler-backend/" 2>/dev/null || echo "⚠️ No backend JS files to restore"

# 3. Restore Configuration Files
echo "⚙️ Restoring configuration files..."
cp "$BACKUP_DIR/config/_headers" "$PROJECT_ROOT/" 2>/dev/null || echo "⚠️ No _headers file to restore"
cp "$BACKUP_DIR/config/_redirects" "$PROJECT_ROOT/" 2>/dev/null || echo "⚠️ No _redirects file to restore"
cp "$BACKUP_DIR/config/wrangler.toml" "$PROJECT_ROOT/hyperfiler-backend/" 2>/dev/null || echo "⚠️ No wrangler.toml to restore"
cp "$BACKUP_DIR/config/package.json" "$PROJECT_ROOT/hyperfiler-backend/" 2>/dev/null || echo "⚠️ No backend package.json to restore"

# 4. Restore Documentation
echo "📚 Restoring documentation..."
cp "$BACKUP_DIR/docs/"*.md "$PROJECT_ROOT/" 2>/dev/null || echo "⚠️ No documentation files to restore"

echo ""
echo "✅ Version 2.0.6 restore completed!"
echo ""
echo "📋 Next steps:"
echo "1. cd hyperfiler-backend && npm install (if package.json changed)"
echo "2. npm run deploy (to deploy backend)"
echo "3. Deploy frontend files to your hosting"
echo "4. Test the application"
echo ""
echo "🔍 Verification:"
echo "- Check that all files are restored correctly"
echo "- Verify CORS settings in _headers"
echo "- Test sync functionality"
echo ""
echo "📄 For detailed restore info, see: VERSION_2.0.6_BACKUP.md"
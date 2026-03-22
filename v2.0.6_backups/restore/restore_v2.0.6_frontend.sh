#!/bin/bash

# 🎨 FRONTEND-ONLY RESTORE TO VERSION 2.0.6
# This script restores only frontend files to version 2.0.6

echo "🎨 Starting frontend restore to version 2.0.6..."

# Get the project root directory
PROJECT_ROOT="/Users/juanmanuelferreradiaz/git_projects/gtd-claude"
BACKUP_DIR="$PROJECT_ROOT/v2.0.6_backups"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR/frontend" ]; then
    echo "❌ Error: Frontend backup directory not found at $BACKUP_DIR/frontend"
    exit 1
fi

echo "📂 Frontend backup directory found: $BACKUP_DIR/frontend"

# Restore Frontend Files
echo "🔄 Restoring HTML files..."
cp "$BACKUP_DIR/frontend/"*.html "$PROJECT_ROOT/" 2>/dev/null || echo "⚠️ No HTML files to restore"

echo "🔄 Restoring frontend sync file..."
cp "$BACKUP_DIR/frontend/WORKING_FRONTEND_SYNC.js" "$PROJECT_ROOT/" 2>/dev/null || echo "⚠️ No frontend sync file to restore"

# Restore Configuration Files that affect frontend
echo "🔄 Restoring CORS configuration..."
cp "$BACKUP_DIR/config/_headers" "$PROJECT_ROOT/" 2>/dev/null || echo "⚠️ No _headers file to restore"
cp "$BACKUP_DIR/config/_redirects" "$PROJECT_ROOT/" 2>/dev/null || echo "⚠️ No _redirects file to restore"

echo ""
echo "✅ Frontend restore to version 2.0.6 completed!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy frontend files to your hosting"
echo "2. Test the frontend application"
echo "3. Verify CORS settings are working"
echo ""
echo "⚠️ Note: Backend remains unchanged. Use restore_v2.0.6_backend.sh if needed."
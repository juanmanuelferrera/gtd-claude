#!/bin/bash

# Rollback to happy1 state
echo "🔄 Rolling back to happy1 state..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if happy1 tag exists
if ! git rev-parse happy1 >/dev/null 2>&1; then
    echo "❌ Error: happy1 tag not found"
    exit 1
fi

# Confirm rollback
echo "⚠️  This will revert all changes since happy1 tag"
echo "📁 Current changes will be lost"
read -p "Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelled"
    exit 1
fi

# Perform rollback
echo "🔄 Rolling back to happy1..."
git reset --hard happy1

# Clean up any untracked files
echo "🧹 Cleaning up untracked files..."
git clean -fd

echo "✅ Successfully rolled back to happy1 state"
echo "📁 All files restored to working state"
echo "🚀 Your sync system is back to the previous working version" 
#!/bin/bash

# 🧪 TEST USER TYPE MIGRATION
# This script tests the user type classification migration safely

echo "🧪 Testing User Type Classification Migration"
echo "============================================="
echo ""

cd /Users/juanmanuelferreradiaz/git_projects/gtd-claude/hyperfiler-backend

# Step 1: Backup current data
echo "📦 Step 1: Creating backup..."
curl -s "https://hyperfiler-api.joanmanelferrera-400.workers.dev/admin/database-analysis" \
  -b /tmp/admin_cookies.txt | jq '.analysis' > /tmp/pre_migration_stats.json

echo "✅ Pre-migration stats saved to /tmp/pre_migration_stats.json"
echo ""

# Step 2: Show current user distribution
echo "📊 Step 2: Current user distribution..."
echo ""
echo "Current subscription data:"
curl -s "https://hyperfiler-api.joanmanelferrera-400.workers.dev/admin/users" \
  -b /tmp/admin_cookies.txt | jq '.users[] | {email, plan_name: (.plan_name // "none"), stripe_customer: (.stripe_customer_id != null)}'

echo ""
echo "🚀 Step 3: Apply migration..."
echo "Would you like to proceed with the migration? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Applying migration 0009..."
    
    # Apply the migration via admin panel
    migration_result=$(curl -s "https://hyperfiler-api.joanmanelferrera-400.workers.dev/admin/migrate-database" \
      -X POST \
      -b /tmp/admin_cookies.txt)
    
    echo "Migration result:"
    echo "$migration_result" | jq '.'
    
    echo ""
    echo "📊 Step 4: Verify new user types..."
    
    # Check new user types
    echo "New user type distribution:"
    curl -s "https://hyperfiler-api.joanmanelferrera-400.workers.dev/admin/database-analysis" \
      -b /tmp/admin_cookies.txt | jq '.analysis'
    
    echo ""
    echo "✅ Migration test completed!"
    echo ""
    echo "📝 To rollback if needed, run:"
    echo "wrangler d1 execute hyperfiler-prod --remote --file=migrations/0009_rollback_user_type_classification.sql"
    
else
    echo "❌ Migration cancelled by user"
fi

echo ""
echo "🔍 Check /tmp/pre_migration_stats.json for original state"
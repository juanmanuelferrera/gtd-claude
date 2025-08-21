#!/bin/bash

echo "🗑️ Deleting user joanmanelferrera@gmail.com from database..."
echo "⚠️  This will permanently delete the user and all their data!"
echo ""

# Confirm deletion
read -p "Are you sure you want to delete the user? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Deletion cancelled"
    exit 1
fi

read -p "Final confirmation - type 'DELETE' to proceed: " final_confirm
if [ "$final_confirm" != "DELETE" ]; then
    echo "❌ Deletion cancelled"
    exit 1
fi

echo ""
echo "🗑️ Starting user deletion..."

# Delete from subscriptions table
echo "🗑️ Deleting from subscriptions table..."
wrangler d1 execute hyperfiler-prod --command "DELETE FROM subscriptions WHERE user_id = '56c2c350-3645-4729-a0cd-5b8d01a110a1';"

# Delete from tasks table
echo "🗑️ Deleting from tasks table..."
wrangler d1 execute hyperfiler-prod --command "DELETE FROM tasks WHERE user_id = '56c2c350-3645-4729-a0cd-5b8d01a110a1';"

# Delete from user_task_tombstones table
echo "🗑️ Deleting from user_task_tombstones table..."
wrangler d1 execute hyperfiler-prod --command "DELETE FROM user_task_tombstones WHERE user_id = '56c2c350-3645-4729-a0cd-5b8d01a110a1';"

# Finally delete the user
echo "🗑️ Deleting user from users table..."
wrangler d1 execute hyperfiler-prod --command "DELETE FROM users WHERE email = 'joanmanelferrera@gmail.com';"

echo ""
echo "✅ User deletion completed!"
echo ""

# Verify deletion
echo "🔍 Verifying deletion..."
echo "Checking users table:"
wrangler d1 execute hyperfiler-prod --command "SELECT COUNT(*) as user_count FROM users WHERE email = 'joanmanelferrera@gmail.com';"

echo "Checking tasks table:"
wrangler d1 execute hyperfiler-prod --command "SELECT COUNT(*) as task_count FROM tasks WHERE user_id = '56c2c350-3645-4729-a0cd-5b8d01a110a1';"

echo "Checking subscriptions table:"
wrangler d1 execute hyperfiler-prod --command "SELECT COUNT(*) as sub_count FROM subscriptions WHERE user_id = '56c2c350-3645-4729-a0cd-5b8d01a110a1';"

echo ""
echo "🎉 User deletion verification complete!"
echo "The user can now register a new account with the same email." 
# 🔐 COMPLETE RESTORE GUIDE - v1.0-sync-working

## ✅ What This Restores
**EVERYTHING** needed to get back to the working sync state:
- Frontend code
- Backend code  
- Live Cloudflare deployment
- Database structure
- Environment secrets

## 🚨 EMERGENCY RESTORE PROCEDURE

### Step 1: Restore Code
```bash
# Restore all code to working state
git checkout v1.0-sync-working

# Or restore specific files:
git checkout v1.0-sync-working -- hyperfiler-pro.html
git checkout v1.0-sync-working -- hyperfiler-backend/worker.js
git checkout v1.0-sync-working -- hyperfiler-backend/simple-sync.js
```

### Step 2: Redeploy Backend  
```bash
cd hyperfiler-backend

# Deploy to Cloudflare (this will restore the live backend)
wrangler deploy

# Verify deployment
curl https://hyperfiler-api.joanmanelferrera.workers.dev/health
```

### Step 3: Verify Database & Secrets
```bash
# Check database is accessible
wrangler d1 execute hyperfiler-prod --command "SELECT COUNT(*) FROM user_tasks;"

# Verify secrets are still set
wrangler secret list

# Should show:
# - JWT_SECRET ✓
# - RESEND_API_KEY ✓  
# - STRIPE_SECRET_KEY ✓
# - STRIPE_WEBHOOK_SECRET ✓
# - STRIPE_PRICE_ID ✓
```

## 🏗️ Current Working Infrastructure

### Backend Deployment:
- **Service:** `hyperfiler-api` 
- **URL:** `https://hyperfiler-api.joanmanelferrera.workers.dev`
- **Database:** `hyperfiler-prod` (ID: 47875cbd-ebb6-43d1-8109-6ccbc879c49e)

### Key Endpoints:
- `GET /health` - Health check
- `POST /tasks/sync` - Upload all tasks (working)
- `GET /tasks/{userId}` - Download all tasks (working)
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Database Schema:
```sql
-- user_tasks table (confirmed working)
id, user_id, title, notes, due_date, due_time, status, 
repeat_type, template, created_at, updated_at, is_deleted, deleted_at
```

## 🧪 Test Working State

### Frontend Test:
1. Open hyperfiler app
2. Create a task
3. Check console for: `✅ SIMPLE SYNC: Upload successful`
4. Open another browser/device
5. Task should appear within 5 seconds

### Backend Test:
```bash
# Health check
curl https://hyperfiler-api.joanmanelferrera.workers.dev/health

# Should return: {"status":"OK","message":"HyperFiler Backend is running!"}
```

## 🆘 If Secrets Are Lost

```bash
# Reset all secrets (ask user for values)
wrangler secret put JWT_SECRET
wrangler secret put RESEND_API_KEY  
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put STRIPE_PRICE_ID
```

## 📋 Working State Checklist

After restore, verify:
- [ ] `git tag` shows `v1.0-sync-working`
- [ ] Backend health endpoint responds
- [ ] Frontend loads without errors
- [ ] Task creation triggers upload logs
- [ ] Tasks sync between devices in 5 seconds
- [ ] No "sync failed" error banners
- [ ] Task moving from previous days works

---

**This guide guarantees a complete restore to the working sync system state.**
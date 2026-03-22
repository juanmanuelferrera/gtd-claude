# 🚀 COMPLETE BACKEND BACKUP - v1.0-sync-working

## Current Live Deployment State
**Date:** 2025-01-13  
**Status:** WORKING TASK SYNC SYSTEM  
**Wrangler Version:** Check with `wrangler --version`

## 1. Backend Files Backup
```bash
# These files represent the working deployed state:
- worker.js (commit: 43ed3e9)
- simple-sync.js (commit: 43ed3e9)  
- wrangler.toml
- package.json
```

## 2. Current Database Schema
```sql
-- Verify with: wrangler d1 execute hyperfiler-db --command "PRAGMA table_info(user_tasks);"

CREATE TABLE user_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    notes TEXT,
    due_date TEXT,
    due_time TEXT,
    status TEXT DEFAULT 'pending',
    repeat_type TEXT,
    template TEXT,
    created_at TEXT,
    updated_at TEXT,
    is_deleted INTEGER DEFAULT 0,
    deleted_at TEXT
);
```

## 3. Environment Variables (Encrypted)
```bash
# These secrets are set in Cloudflare Workers:
- JWT_SECRET
- RESEND_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

# Verify with: wrangler secret list
```

## 4. Deployment Commands for Restore
```bash
# From hyperfiler-backend directory:

# 1. Restore code files
git checkout v1.0-sync-working -- worker.js simple-sync.js

# 2. Redeploy to Cloudflare
wrangler deploy

# 3. Verify deployment
curl https://hyperfiler-backend.joanmanelferrera.workers.dev/health
```

## 5. Full Emergency Restore Process
```bash
# STEP 1: Restore all code
cd /path/to/hyperfiler-backend
git checkout v1.0-sync-working

# STEP 2: Reinstall dependencies (if needed)
npm install

# STEP 3: Redeploy backend
wrangler deploy

# STEP 4: Test the deployment
curl https://hyperfiler-backend.joanmanelferrera.workers.dev/health

# STEP 5: Test task sync
# Open hyperfiler app, create/edit a task, check console for sync logs
```

## 6. Verification Checklist
- [ ] `GET /health` returns `{"status":"OK"}`
- [ ] `POST /tasks/sync` accepts task arrays
- [ ] `GET /tasks/{userId}` returns user tasks
- [ ] Frontend sync logs show "✅ SIMPLE SYNC: Upload successful"
- [ ] Tasks appear across devices within 5 seconds

## 7. Live Backend URL
**Production:** `https://hyperfiler-backend.joanmanelferrera.workers.dev`

## 8. Database Backup Command
```bash
# Create backup of current data (if needed)
wrangler d1 export hyperfiler-db --output backup-$(date +%Y%m%d).sql
```

---

⚠️ **IMPORTANT:** This assumes your Cloudflare secrets are still configured. If secrets are lost, you'll need to reset:
```bash
wrangler secret put JWT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```
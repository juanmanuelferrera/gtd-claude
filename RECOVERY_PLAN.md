# 🆘 RECOVERY PLAN & CONSTRAINTS

## 🔒 STABLE ANCHOR POINT
**Commit:** `0041bca423b1a69b0aab28e00ac67afa1fb53162`  
**Version:** HyperFiler Pro v1.3.2  
**Status:** ✅ Fully functional, tested, deployed

## 🔄 SYNC LOGIC CONSTRAINTS

### ⚠️ CRITICAL: Maintain "Server Wins" Strategy
```javascript
// ✅ CURRENT WORKING LOGIC (DO NOT CHANGE):
function resolveConflicts(localData, serverData) {
  // Server data ALWAYS takes precedence
  return serverData;
}

// ✅ MERGE STRATEGY (PRESERVE THIS):
const mergedTasks = serverTasks.concat(
  localTasks.filter(local => 
    !serverTasks.find(server => server.id === local.id)
  )
);
```

### Why "Server Wins" Must Be Preserved:
1. **Data Integrity** - Prevents data corruption
2. **Multi-device Consistency** - Same data across all devices  
3. **Conflict Simplicity** - No complex merge algorithms needed
4. **User Expectation** - Predictable behavior
5. **Proven Stability** - Currently working without issues

## 🚨 EMERGENCY RECOVERY COMMANDS

### Immediate Recovery (Any Breaking Changes)
```bash
# 1. Reset to stable point
git reset --hard 0041bca423b1a69b0aab28e00ac67afa1fb53162

# 2. Force push if needed (be careful!)
git push --force-with-lease

# 3. Deploy immediately
wrangler pages deploy . --project-name=hyperfiler

# 4. Verify at: https://hyperfiler.pages.dev
```

### Partial Recovery (Specific Files)
```bash  
# Restore specific critical files
git checkout 0041bca -- hyperfiler-pro.html
git checkout 0041bca -- js/sync.js
git checkout 0041bca -- js/tasks.js
git checkout 0041bca -- js/missing-functions.js

# Commit and deploy
git commit -m "Restore critical files to stable state"
wrangler pages deploy . --project-name=hyperfiler
```

### Sync System Recovery
```bash
# If sync breaks, restore sync components only
git checkout 0041bca -- js/sync.js
git checkout 0041bca -- js/auth.js  
git commit -m "Restore sync system to working state"
```

## 📋 PRE-CHANGE SAFETY CHECKLIST

### Before ANY Code Changes:
- [ ] Create feature branch: `git checkout -b feature/[name]`
- [ ] Document expected changes in commit message
- [ ] Test in development environment first
- [ ] Verify current functionality works
- [ ] Keep ANCHOR_POINT_STABLE.md updated

### Before Sync Logic Changes:
- [ ] **NEVER** change "server wins" conflict resolution
- [ ] Test with multiple devices/sessions
- [ ] Verify no data loss scenarios
- [ ] Test offline→online sync scenarios
- [ ] Preserve all existing API contracts

### Before Deployment:
- [ ] Test all core functionality manually
- [ ] Verify sync operations work
- [ ] Check modal behaviors (Set button, edit modal)
- [ ] Test on mobile device  
- [ ] Confirm no console errors

## 🎯 SAFE DEVELOPMENT PRACTICES

### Recommended Workflow:
```bash
# 1. Always start from stable anchor
git checkout master
git reset --hard 0041bca423b1a69b0aab28e00ac67afa1fb53162

# 2. Create feature branch  
git checkout -b feature/offline-support

# 3. Make incremental changes
# 4. Test thoroughly after each change
# 5. Commit frequently with clear messages

# 6. When ready, merge carefully
git checkout master
git merge feature/offline-support

# 7. Deploy and verify
wrangler pages deploy . --project-name=hyperfiler
```

### Code Change Principles:
1. **Additive Only** - Add new features without breaking existing ones
2. **Backward Compatible** - Maintain all existing APIs
3. **Server Wins Preserved** - Never change conflict resolution
4. **Incremental Testing** - Test after every small change
5. **Rollback Ready** - Always be able to revert quickly

## 🔧 OFFLINE DEVELOPMENT CONSTRAINTS

### ✅ What Can Be Added Safely:
- Service Worker for app caching
- PWA manifest for installability  
- Background sync queue for offline operations
- IndexedDB as storage upgrade (optional)
- Network status detection
- Offline UI indicators

### ❌ What Must NOT Be Changed:
- Current sync.js conflict resolution logic
- localStorage data format/schema
- Existing API endpoint contracts  
- "Server wins" merge strategy
- Current authentication flow
- Task data structure

### 🔄 Offline Sync Strategy (Maintain Server Wins):
```javascript
// ✅ ALLOWED: Queue offline changes
const offlineQueue = [];

// ✅ ALLOWED: Sync when online
function syncOfflineQueue() {
  // Upload queued changes
  // Download latest server data  
  // Apply "server wins" resolution
  // Clear queue only after successful sync
}

// ❌ FORBIDDEN: Client-side conflict resolution
// ❌ FORBIDDEN: "Client wins" or "manual resolution" 
// ❌ FORBIDDEN: Complex merge algorithms
```

## 📞 Emergency Contacts & Resources

### Documentation References:
- `ANCHOR_POINT_STABLE.md` - Stable state details
- `FRONTEND_BACKUP_STABLE.md` - Frontend code inventory
- `BACKEND_SYNC_STABLE.md` - Sync system documentation  
- `CLAUDE.md` - Project instructions and deployment

### Key Command Reference:
```bash
# View current commit
git log --oneline -1

# Check for changes
git status

# Deploy current state
wrangler pages deploy . --project-name=hyperfiler

# Emergency reset
git reset --hard 0041bca423b1a69b0aab28e00ac67afa1fb53162
```

---
**⚠️ REMEMBER: When in doubt, revert to anchor point 0041bca - it's proven stable!**  
**🔄 NEVER change the "server wins" sync logic - it prevents data corruption!**
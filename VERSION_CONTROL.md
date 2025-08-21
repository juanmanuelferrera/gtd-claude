# 🔢 GTD SYSTEM VERSION CONTROL

## Current Version System

### Version 2.0.6 (Current Stable)
- **Status**: ✅ Working, backed up
- **Features**: Basic sync, task management, CORS configured
- **Known Issues**: Sync conflicts, old data overwrites fresh data
- **Backup Location**: `v2.0.6_backups/`
- **Restoration**: Available via scripts

### Version 2.0.7 (In Development)
- **Status**: 🚧 Planned improvements
- **Target Fixes**: 
  - Unified storage keys (fix hyperfiler-tasks vs gtdTasks)
  - Staleness detection 
  - Improved deletion logic
  - Better conflict resolution
- **Risk Level**: Medium (touching core sync logic)

## 🚀 Quick Commands

### Check Current Version
```bash
# Look for version markers in key files
grep -r "2\.0\." . --include="*.js" --include="*.html" --include="*.md"
```

### Create New Version Backup
```bash
# Create backup for current version before changes
mkdir -p v2.0.X_backups/{frontend,backend,config,docs,restore}
cp *.html v2.0.X_backups/frontend/
cp hyperfiler-backend/*.js v2.0.X_backups/backend/
# ... continue pattern
```

### Restore Version 2.0.6
```bash
# Complete restore
./v2.0.6_backups/restore/restore_v2.0.6_complete.sh

# Frontend only
./v2.0.6_backups/restore/restore_v2.0.6_frontend.sh

# Backend only  
./v2.0.6_backups/restore/restore_v2.0.6_backend.sh
```

## 📁 Backup Contents by Version

### v2.0.6_backups/
```
├── frontend/
│   ├── hyperfiler.html           # Free version UI
│   ├── hyperfiler-pro.html       # Pro version UI
│   ├── index.html                # Landing page
│   ├── login.html                # Auth pages
│   ├── register.html
│   └── WORKING_FRONTEND_SYNC.js  # Frontend sync logic
├── backend/
│   ├── worker.js                 # Main Cloudflare Worker
│   ├── lists-sync.js             # Lists synchronization  
│   ├── WORKING_SYNC_BACKUP.js    # Backup sync functions
│   └── *.js                      # Other backend utilities
├── config/
│   ├── _headers                  # CORS configuration
│   ├── _redirects                # URL redirects
│   ├── wrangler.toml             # Cloudflare config
│   └── package.json              # Dependencies
└── restore/
    ├── restore_v2.0.6_complete.sh
    ├── restore_v2.0.6_frontend.sh
    └── restore_v2.0.6_backend.sh
```

## 🔍 Version Identification

### Key Version Markers
- **Frontend**: Check `hyperfiler.html` title or sync function names
- **Backend**: Look for sync endpoint patterns in `worker.js`
- **Sync Logic**: Function names in `WORKING_FRONTEND_SYNC.js`

### Critical Files for Versioning
1. **Core Sync**: `WORKING_FRONTEND_SYNC.js`, `worker.js`
2. **UI**: `hyperfiler.html`, `hyperfiler-pro.html`  
3. **Config**: `_headers`, `wrangler.toml`
4. **Database**: Migration scripts in `hyperfiler-backend/migrations/`

## 🚨 Emergency Rollback Procedure

### If Version 2.0.7 Breaks Production:

1. **Immediate Action**
   ```bash
   cd /Users/juanmanuelferreradiaz/git_projects/gtd-claude
   ./v2.0.6_backups/restore/restore_v2.0.6_complete.sh
   ```

2. **Redeploy Backend**
   ```bash
   cd hyperfiler-backend
   npm install
   npm run deploy
   ```

3. **Redeploy Frontend**
   ```bash
   # Upload HTML files to your hosting provider
   # Ensure _headers and _redirects are deployed
   ```

4. **Verify Restoration**
   - Test login/registration
   - Test task creation and sync
   - Check CORS headers
   - Verify mobile responsiveness

## 🔄 Version Development Workflow

### Before Starting 2.0.7:
1. ✅ Backup 2.0.6 (COMPLETED)
2. ✅ Create restoration scripts (COMPLETED)
3. ⏳ Begin 2.0.7 development
4. ⏳ Test 2.0.7 thoroughly
5. ⏳ Deploy 2.0.7 or rollback if issues

### During 2.0.7 Development:
- Make incremental changes
- Test each change thoroughly
- Keep version markers updated
- Document any breaking changes

### After 2.0.7 Completion:
- Create v2.0.7 backup system
- Update this version control document
- Mark 2.0.7 as stable
- Archive 2.0.6 backups (keep available)

## 📊 Version History

| Version | Date | Status | Key Features | Backup Available |
|---------|------|---------|--------------|------------------|
| 2.0.6 | 2025-08-02 | ✅ Stable | Basic sync, working UI | ✅ Yes |
| 2.0.7 | TBD | 🚧 Dev | Improved sync logic | ⏳ Planned |

---
**Last Updated**: 2025-08-02  
**Next Review**: After 2.0.7 completion
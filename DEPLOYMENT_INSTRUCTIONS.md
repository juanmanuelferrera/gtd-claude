# HyperFiler Deployment Instructions

## 🚀 Production Deployment Only

**IMPORTANT**: Only deploy to production to avoid confusion with preview environments.

### Quick Deploy
```bash
./deploy-production.sh
```

### Manual Deploy
```bash
npx wrangler pages deploy . --project-name=hyperfiler --branch=master
```

## 🌐 Production URLs
- **Primary**: https://hyperfiler.pro
- **Alternative**: https://hyperfiler.pages.dev

## ⚠️ Avoid These
- ❌ Don't use `--branch=main` (creates preview environment)
- ❌ Don't deploy without branch specification
- ❌ Don't use preview URLs

## 🔧 Backend Deployment
```bash
cd ../hyperfiler-backend
npx wrangler deploy --env production
```

## 📋 Current Status
- ✅ Backend: Production deployed with tombstone protection
- ✅ Frontend: Production deployed with stale user ID detection
- ✅ Database: Tombstone table created
- ✅ Protection: Multi-layer stale user ID detection active 
# 🚀 HyperFiler Pro Deployment Guide

## ✅ Backend Deployed
**Workers URL**: https://hyperfiler-backend.joanmanelferrera-400.workers.dev
**Status**: ✅ Live and running

## 📋 Cloudflare Pages Deployment Steps

### 1. Go to Cloudflare Dashboard
- Visit: https://dash.cloudflare.com
- Click "Pages" in the left sidebar

### 2. Create New Project
- Click "Create a project"
- Choose "Upload directly" (quickest option)

### 3. Upload Files
**Upload these files to the root directory:**
- `index.html` (main landing page)
- `hyperfiler.html` (free version app)
- `hyperfiler-pro.html` (pro version app)
- `admin.html` (admin dashboard)
- `frontend/` folder with all contents

### 4. Project Configuration
```
Project name: hyperfiler
Custom domain: (you'll get hyperfiler.pages.dev automatically)
Branch: main
Build command: (leave empty)
Build output directory: /
```

### 5. Your Live URLs Will Be:
- **Main Site**: `https://hyperfiler.pages.dev`
- **Free App**: `https://hyperfiler.pages.dev/hyperfiler.html`
- **Pro App**: `https://hyperfiler.pages.dev/hyperfiler-pro.html`
- **Upgrade Page**: `https://hyperfiler.pages.dev/frontend/upgrade-compare.html`
- **Admin Dashboard**: `https://hyperfiler.pages.dev/admin.html`

## 🔐 Production Environment Variables

### Workers Secrets (already set for development):
```bash
npx wrangler secret put STRIPE_SECRET_KEY --env production
npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production
npx wrangler secret put JWT_SECRET --env production
```

## 🎯 What's Already Configured:
- ✅ **Auto-environment detection** in frontend code
- ✅ **CORS enabled** for cross-origin requests
- ✅ **Database schema** ready (D1)
- ✅ **Email templates** with proper links
- ✅ **Stripe integration** configured
- ✅ **Admin dashboard** ready

## 📧 Email Configuration (Optional)
After Pages deployment, you can:
1. Go to Cloudflare Dashboard → Email Routing
2. Enable for your `.pages.dev` domain
3. Add route: `noreply@hyperfiler.pages.dev` → your email

## 🧪 Testing Checklist
After deployment, test:
- [ ] Landing page loads (`/index.html`)
- [ ] Free app works (`/hyperfiler.html`)
- [ ] Upgrade page works (`/frontend/upgrade-compare.html`)
- [ ] Promo codes work (test with `HYPERFILER2025`)
- [ ] Stripe payments work (test mode)
- [ ] Admin dashboard works (`/admin.html`)

## 🎉 You'll Have:
- **Free .pages.dev domain** 🆓
- **Global CDN** with edge caching ⚡
- **SSL/HTTPS** automatic 🔒
- **Unlimited bandwidth** 📈
- **99.9% uptime** 🚀

**Total Monthly Cost**: $0 (completely free!) 💰
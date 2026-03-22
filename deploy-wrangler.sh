#!/bin/bash

echo "🚀 Deploying HyperFiler with Wrangler..."

# First, prepare files
./deploy.sh

echo "📦 Deploying to Cloudflare Pages via Wrangler..."

# Deploy using wrangler pages
npx wrangler pages deploy ./deploy --project-name=hyperfiler

echo "✅ Deployment complete!"
echo "🌍 Your site should be live at: https://hyperfiler.pages.dev"
#!/bin/bash

# Production-only deployment script for HyperFiler
# This ensures we only deploy to production, not preview

echo "🚀 Deploying HyperFiler to PRODUCTION only..."

# Deploy from root directory (no deploy subdirectory needed)
echo "📦 Deploying to production environment..."
npx wrangler pages deploy . --project-name=hyperfiler --branch=master

echo "✅ Production deployment complete!"
echo "🌐 Production URL: https://hyperfiler.pro"
echo "🔗 Alternative URL: https://hyperfiler.pages.dev"
echo ""
echo "⚠️  No preview environment - only production deployed!" 
#!/bin/bash

# Simple deployment script for HyperFiler
# This will prepare files for Cloudflare Pages upload

echo "🚀 Preparing HyperFiler for deployment..."

# Create deployment directory
mkdir -p deploy

# Copy main files
cp index.html deploy/
cp hyperfiler.html deploy/
cp hyperfiler-pro.html deploy/
cp cancel.html deploy/
cp readme.html deploy/
cp marketing-text.md deploy/
cp _headers deploy/
cp _redirects deploy/

# Copy frontend directory
cp -r frontend/ deploy/

echo "📁 Files prepared in ./deploy/ directory"
echo ""
echo "Next steps:"
echo "1. Go to: https://dash.cloudflare.com"
echo "2. Click 'Pages' → 'Create a project' → 'Upload directly'"
echo "3. Upload all files from the ./deploy/ directory"
echo "4. Set project name: hyperfiler"
echo "5. Deploy!"
echo ""
echo "✅ Your updated hyperfiler-pro.html will be live!"
#!/bin/bash
echo "🚀 Deploying HyperFiler..."
git add .
git commit -m "Deploy changes" 
wrangler pages deploy . --project-name hyperfiler
echo "✅ Deployment complete!"
echo "🌐 Check: https://hyperfiler.pro/hyperfiler-pro"

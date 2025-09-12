## Git Tips
- Always commit and push changes after making modifications
- When changes are made, always run: git add -A && git commit -m "descriptive message" && git push
- never deploy to hyperfiler-fresh... always deploy to hyperfiler project

## Deployment
- ALWAYS deploy after committing changes: wrangler pages deploy . --project-name=hyperfiler
- Deploy automatically after every commit to ensure changes are live
- Never deploy to hyperfiler-fresh, always use hyperfiler project
- index.html is the website and hyperfiler-pro.html is the app

## CACHE-BUSTING (CRITICAL)
When fixes don't appear on live site:
1. **Update version numbers** in hyperfiler-pro.html for changed JS files:
   - Change `js/filename.js?v=oldnumber` to `js/filename.js?v=YYYYMMDD`
2. **Add deployment marker** in console.log:
   - Change `console.log('🔥 HTML FILE LOADED - v1.1 Stable');`
   - To `console.log('🔥 HTML FILE LOADED - v1.1 Stable [Deploy-YYYYMMDD]');`
3. **Always commit and deploy** after version changes
4. **Verify deployment shows "Uploaded X files"** not "0 files uploaded"
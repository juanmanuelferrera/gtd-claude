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
When fixes don't appear on live site, it means Cloudflare is serving cached versions of old files. 
The problem occurs when deployments show "0 files uploaded" - this means no changes were detected.

**Complete Strategy:**
1. **Update version numbers** in hyperfiler-pro.html for ALL changed JS files:
   ```
   Change: <script src="extracted_js.js?v=1757613936"></script>
   To:     <script src="extracted_js.js?v=20250912-fix"></script>
   ```

2. **Add deployment marker** in console.log to force HTML change:
   ```
   Change: console.log('🔥 HTML FILE LOADED - v1.1 Stable');
   To:     console.log('🔥 HTML FILE LOADED - v1.1 [Deploy-20250912-fix]');
   ```

3. **Commit, push, and deploy**:
   ```
   git add -A && git commit -m "Cache-bust: force fresh JS files" && git push
   wrangler pages deploy . --project-name=hyperfiler
   ```

4. **Verify success**:
   - Deployment shows "Uploaded X files" (NOT "0 files uploaded")
   - Console shows new deployment marker when loading site
   - Fixed JavaScript loads with new version number

**Why this works:** Changing version numbers forces browsers to download fresh files instead of using cache. The deployment marker ensures the HTML file itself changes, triggering a proper deployment.
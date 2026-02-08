## HyperFiler Task Rules
- Events (isEvent: true) NEVER get moved to a different date when redistributing/rebalancing tasks, unless the user explicitly orders it
- **Auto-Event marking**: When a user moves a task to a future date (via delay buttons, date picker, or drag-drop), the task is automatically marked as an Event to protect it from being pulled forward by the cron. This only applies to future dates, not today.
- When deleting tasks via MCP, always set both `isDeleted: true` AND `status: 'deleted'` for frontend compatibility
- When the user asks to reorder tasks by priority, apply own judgment using these criteria (in order): 1) Legal/administrative deadlines, 2) Real-world urgent actions (communication, health, errands), 3) Active projects with momentum (books, marketing, web), 4) Digital/tech tasks, 5) Personal care, 6) Household chores, 7) Reference/recipes/low priority
- ALL tasks with "TOT" (uppercase) in the title go to the 10:00-13:00 block. Even if there are multiple TOT tasks on the same day, they all share the same 10:00 slot. When organizing a day, place other tasks before 10:00 or after 13:00 around the TOT block.
- "cocinar" or "comer" tasks always go at 14:00
- Tasks containing "desayuno" in the title always go at 09:00
- Tasks containing "comprar" in the title should have @recados added to their notes (if not already present)
- URLs/links should always go in the task title (body), not in notes
- Tasks can start from 06:00. Maximum task time is 19:00. Never schedule tasks beyond 19:00.
- 06:00-07:00 is always reserved for "programa espiritual" (spiritual program). Never schedule other tasks in this slot.
- Always schedule most important tasks first, then sort by shortest duration within the same priority level.
- If any tasks don't fit in the day (overflow past 19:00), automatically move them to the next day.
- If tasks don't fit today, they overflow to tomorrow and beyond automatically.
- New tasks are always created for today without a time — the cron organizes them.

## CarryOver (midnight cron)
- When the cron runs at midnight, tasks carried over from the previous day have **higher priority** than tasks already scheduled for the new day, since they represent unfinished work.
- All carried-over tasks lose their time assignment (set to no time) so the auto-organizer can place them fresh in the day's schedule.
- @bhoga tasks are the exception: they always move to the next Monday as pending, regardless of their current status.

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
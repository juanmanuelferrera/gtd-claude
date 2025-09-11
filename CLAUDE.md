## Git Tips
- Always commit and push changes after making modifications
- When changes are made, always run: git add -A && git commit -m "descriptive message" && git push
- never deploy to hyperfiler-fresh... always deploy to hyperfiler project

## Deployment
- ALWAYS deploy after committing changes: wrangler pages deploy . --project-name=hyperfiler
- Deploy automatically after every commit to ensure changes are live
- Never deploy to hyperfiler-fresh, always use hyperfiler project
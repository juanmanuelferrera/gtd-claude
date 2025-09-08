## Git Tips
- Always commit and push changes after making modifications
- When changes are made, always run: git add -A && git commit -m "descriptive message" && git push
- never deploy to hyperfiler-fresh... always deploy to hyperfiler project

## Deployment
- If changes don't appear on the live site after git push, manually deploy with: wrangler pages deploy . --project-name=hyperfiler
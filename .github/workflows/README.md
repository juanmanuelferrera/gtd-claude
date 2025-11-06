# GitHub Actions Workflows for HyperFiler Pro

This directory contains 5 Claude Code-powered workflows for automated code review, testing, and deployment validation.

## 🤖 Workflows

### 1. **claude-pr-review.yml** - Pull Request Review
**Triggers:** When PRs are opened/updated
**Purpose:** Comprehensive code review focusing on:
- ES6 module structure and organization
- Architecture compliance with ARCHITECTURE.md
- Code quality and naming conventions
- Test coverage for new code
- Security and performance implications

### 2. **claude-test-runner.yml** - Automated Testing
**Triggers:** PRs and pushes to main/master
**Purpose:** Validates test suite execution:
- Verifies all 23 modules load correctly
- Checks for JavaScript errors
- Tests module dependencies
- Validates 627+ test suite

### 3. **claude-module-validator.yml** - Module Structure Check
**Triggers:** Changes to module files (src/modules/**/*.js)
**Purpose:** Ensures modular architecture integrity:
- Validates proper module organization (core/features/ui)
- Checks for circular dependencies
- Ensures backward compatibility
- Verifies no cross-module coupling violations

### 4. **claude-security-check.yml** - Security Analysis
**Triggers:** PRs and weekly on Sundays
**Purpose:** Comprehensive security scanning:
- XSS prevention validation
- Data storage security checks
- API authentication review
- Dependency vulnerability scanning
- Reports issues by severity (Critical/Medium/Low)

### 5. **claude-deployment-check.yml** - Pre-Deployment Validation
**Triggers:** Pushes to main/master
**Purpose:** Pre-deployment checklist validation:
- Build verification (all modules present)
- Configuration validation
- Performance checks
- Documentation currency
- Browser compatibility verification

## 🔧 Setup Instructions

### 1. Add Anthropic API Key to GitHub

1. Go to your repository: https://github.com/juanmanuelferrera/hyperfiler
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `ANTHROPIC_API_KEY`
5. Value: Your Anthropic API key from https://console.anthropic.com
6. Click **Add secret**

### 2. Commit and Push Workflows

```bash
cd /Users/jaganat/.emacs.d/git_projects/gtd-claude
git add .github/workflows/
git commit -m "Add Claude Code GitHub Actions workflows"
git push origin main
```

### 3. Verify Workflows

After pushing:
1. Go to **Actions** tab in your GitHub repo
2. You should see all 5 workflows listed
3. They will automatically trigger on their respective events

## 📊 Workflow Status Badges

Add these to your README.md:

```markdown
![PR Review](https://github.com/juanmanuelferrera/hyperfiler/actions/workflows/claude-pr-review.yml/badge.svg)
![Tests](https://github.com/juanmanuelferrera/hyperfiler/actions/workflows/claude-test-runner.yml/badge.svg)
![Security](https://github.com/juanmanuelferrera/hyperfiler/actions/workflows/claude-security-check.yml/badge.svg)
```

## 🎯 What Each Workflow Checks

### Code Quality (PR Review)
- ✅ Proper module structure
- ✅ Function naming consistency
- ✅ JSDoc documentation
- ✅ No breaking changes

### Testing (Test Runner)
- ✅ All modules load successfully
- ✅ No JavaScript errors
- ✅ Test suite execution
- ✅ Module dependencies valid

### Architecture (Module Validator)
- ✅ Correct module category (core/features/ui)
- ✅ No circular dependencies
- ✅ Proper imports/exports
- ✅ Backward compatibility

### Security (Security Check)
- ✅ XSS prevention in UI
- ✅ Data sanitization
- ✅ API authentication
- ✅ Dependency vulnerabilities

### Deployment (Deployment Check)
- ✅ Build configuration
- ✅ File structure complete
- ✅ Performance metrics
- ✅ Documentation updated

## 🔄 Customizing Workflows

To modify workflow behavior, edit the `prompt:` section in each YAML file. The prompts are tailored to HyperFiler Pro's architecture but can be adjusted for specific needs.

## 📖 Learn More

- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [HyperFiler Pro Architecture](../ARCHITECTURE.md)

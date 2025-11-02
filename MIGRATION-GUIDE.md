# Migration Guide: Monolithic → Modular Architecture

This guide explains how to migrate code from the old monolithic structure to the new ES6 modular architecture.

## Quick Reference

| Old Location | New Location | Module Type |
|--------------|--------------|-------------|
| `js/utils.js` | `src/modules/core/utils.js` | Core |
| `js/globals.js` | `src/modules/core/globals.js` | Core |
| `js/tasks.js` | `src/modules/features/tasks.js` + `task-management.js` | Feature |
| `js/auth.js` | `src/modules/features/auth.js` | Feature |
| `js/sync.js` | `src/modules/features/sync.js` | Feature |
| `js/ui.js` | `src/modules/ui/ui-components.js` | UI |
| `js/toast.js` | `src/modules/ui/notifications.js` | UI |
| `js/dark-mode.js` | `src/modules/ui/dark-mode.js` | UI |
| `js/missing-functions.js` | `src/modules/features/missing-functions.js` | Feature |

## Migration Patterns

### Pattern 1: Simple Import

**Before (Monolithic):**
```javascript
// In HTML
<script src="js/utils.js"></script>
<script>
  const formatted = formatDate(new Date());
</script>
```

**After (Modular):**
```javascript
// In your ES6 module
import { formatDate } from './modules/core/utils.js';

const formatted = formatDate(new Date());
```

### Pattern 2: Multiple Imports from Same Module

**Before:**
```javascript
// Functions scattered across files or accessed via window
const date = formatDate(new Date());
const time = formatTime('14:30');
const local = getLocalDateString();
```

**After:**
```javascript
import {
  formatDate,
  formatTime,
  getLocalDateString
} from './modules/core/utils.js';

const date = formatDate(new Date());
const time = formatTime('14:30');
const local = getLocalDateString();
```

### Pattern 3: Cross-Module Dependencies

**Before:**
```javascript
// task-creation.js (manually loaded after utils.js)
function createTask(title) {
  return {
    id: generateId(),
    title: sanitizeInput(title), // From different file
    date: formatDate(new Date()) // From different file
  };
}
```

**After:**
```javascript
// task-creation.js
import { generateTaskId } from './modules/features/tasks.js';
import { sanitizeInput } from './modules/core/sanitization.js';
import { formatDate } from './modules/core/utils.js';

function createTask(title) {
  return {
    id: generateTaskId(),
    title: sanitizeInput(title),
    date: formatDate(new Date())
  };
}
```

### Pattern 4: UI Components

**Before:**
```javascript
// HTML file
<script src="js/ui.js"></script>
<script>
  renderTodayView();
  showView('week');
</script>
```

**After:**
```javascript
// your-module.js
import {
  renderTodayView,
  showView
} from './modules/ui/ui-components.js';

renderTodayView();
showView('week');
```

### Pattern 5: Notifications

**Before:**
```javascript
// Using toast.js
showToast('Success!', 'success');
```

**After:**
```javascript
import { showSuccessToast } from './modules/ui/notifications.js';

showSuccessToast('Success!');
```

## Common Migration Scenarios

### Scenario 1: Converting a Standalone Script

**Old File:** `custom-feature.js`
```javascript
// custom-feature.js (loaded after utils.js and tasks.js)
function myCustomFeature() {
  const task = {
    id: generateTaskId(),
    title: 'New task',
    date: formatDate(new Date())
  };
  saveTasksToLocalStorage([task]);
}
```

**New File:** `custom-feature.js`
```javascript
// custom-feature.js (ES6 module)
import { generateTaskId } from './modules/features/tasks.js';
import { formatDate } from './modules/core/utils.js';
import { saveTasksToLocalStorage } from './modules/features/task-management.js';

export function myCustomFeature() {
  const task = {
    id: generateTaskId(),
    title: 'New task',
    date: formatDate(new Date())
  };
  saveTasksToLocalStorage([task]);
}
```

### Scenario 2: Converting HTML to Module

**Before:**
```html
<!DOCTYPE html>
<html>
<head>
  <script src="js/utils.js"></script>
  <script src="js/tasks.js"></script>
  <script src="js/ui.js"></script>
</head>
<body>
  <div id="app"></div>
  <script>
    // Direct function calls
    const tasks = loadTasksFromLocalStorage();
    renderTodayView();
  </script>
</body>
</html>
```

**After:**
```html
<!DOCTYPE html>
<html>
<head></head>
<body>
  <div id="app"></div>

  <!-- Option 1: Use main.js (recommended for backward compatibility) -->
  <script type="module" src="src/main.js"></script>
  <script type="module">
    // Functions available via window during migration
    const tasks = window.loadTasksFromLocalStorage();
    window.renderTodayView();
  </script>

  <!-- Option 2: Pure modular approach (future) -->
  <script type="module">
    import { loadTasksFromLocalStorage } from './src/modules/features/task-management.js';
    import { renderTodayView } from './src/modules/ui/ui-components.js';

    const tasks = loadTasksFromLocalStorage();
    renderTodayView();
  </script>
</body>
</html>
```

### Scenario 3: Adding New Functionality

**Step-by-Step:**

1. **Choose the right module** or create a new one:
   - Core functionality → `src/modules/core/`
   - Feature → `src/modules/features/`
   - UI → `src/modules/ui/`

2. **Create or edit the module:**
```javascript
// src/modules/features/my-feature.js
import { formatDate } from '../core/utils.js';
import { sanitizeInput } from '../core/sanitization.js';

export function myNewFunction(input) {
  const sanitized = sanitizeInput(input);
  const date = formatDate(new Date());
  return `${sanitized} - ${date}`;
}

export function anotherFunction() {
  // Implementation
}
```

3. **Add to main.js imports:**
```javascript
import {
  myNewFunction,
  anotherFunction
} from './modules/features/my-feature.js';
```

4. **Expose to window (for backward compatibility):**
```javascript
window.myNewFunction = myNewFunction;
window.anotherFunction = anotherFunction;
```

5. **Update module list in console.log:**
```javascript
console.log('📦 Modules loaded: ... , my-feature');
```

6. **Add tests:**
```javascript
// In hyperfiler-pro-modular.html
if (typeof window.myNewFunction === 'function') {
  results.innerHTML += '<p>✅ myNewFunction loaded</p>';
  testsPassed++;
}
```

## Module Organization Guidelines

### When to Create a New Module

Create a new module when:
- ✅ Functionality is logically distinct (e.g., "chart rendering")
- ✅ File would be 200+ lines
- ✅ Multiple files would import it
- ✅ It represents a cohesive feature

Don't create a new module when:
- ❌ Functionality is only 1-2 small functions
- ❌ Only used in one place
- ❌ Tightly coupled to existing module

### Module Naming Conventions

- **Kebab-case:** `task-management.js`, `offline-sync.js`
- **Descriptive:** Name should indicate purpose
- **Consistent suffix:**
  - Features: describe what it does (e.g., `sync.js`, `undo.js`)
  - UI: describe component type (e.g., `notifications.js`, `dark-mode.js`)
  - Core: describe utility type (e.g., `utils.js`, `storage.js`)

## Testing Your Migration

### Checklist

- [ ] All imports resolve correctly (no 404s in console)
- [ ] No `undefined` errors when calling functions
- [ ] All tests in `hyperfiler-pro-modular.html` pass
- [ ] Original functionality still works
- [ ] No console errors
- [ ] Dark mode still works
- [ ] Network status works
- [ ] Sync functionality works

### Running Tests

1. **Open test file:**
   ```
   http://localhost:8000/hyperfiler-pro-modular.html
   ```

2. **Check console for:**
   ```
   ✅ Modular system initialized
   📦 Modules loaded: [list of all 23 modules]
   ```

3. **Verify test results:**
   - Should show "X passed, 0 failed"
   - All functions should show ✅ green checkmarks

4. **Test actual functionality:**
   - Create a task
   - Edit a task
   - Delete a task
   - Switch views
   - Test search
   - Test templates

## Common Issues & Solutions

### Issue 1: Function Not Found

**Error:**
```
Uncaught ReferenceError: formatDate is not defined
```

**Solution:**
```javascript
// Add import at top of file
import { formatDate } from './modules/core/utils.js';
```

### Issue 2: Circular Dependency

**Error:**
```
Uncaught ReferenceError: Cannot access 'X' before initialization
```

**Solution:**
- Restructure to avoid circular imports
- Move shared code to a third module
- Use dependency injection

### Issue 3: Module Not Loading

**Error:**
```
GET http://localhost:8000/modules/core/utils.js 404 (Not Found)
```

**Solution:**
- Check path is correct (should start with `./` or `../`)
- Verify file exists at that location
- Ensure using `type="module"` in script tag

### Issue 4: Window Global Not Available

**Error:**
```
Uncaught TypeError: window.someFunction is not a function
```

**Solution:**
- Check function is exposed in main.js:
```javascript
window.someFunction = someFunction;
```
- Ensure main.js loaded before your script:
```html
<script type="module" src="src/main.js"></script>
<script type="module">
  // Your code here - window.someFunction now available
</script>
```

## Performance Optimization

### Current State
- All 23 modules loaded via main.js
- ~860KB total module code
- No bundling or minification

### Future Optimization

**Step 1: Remove Window Globals**
```javascript
// Instead of:
window.formatDate(new Date())

// Use:
import { formatDate } from './modules/core/utils.js';
formatDate(new Date())
```

**Step 2: Tree Shaking**
- Only import what you need
- Unused exports will be removed in production build

**Step 3: Code Splitting**
```javascript
// Lazy load heavy modules
const { generateReport } = await import('./modules/features/reports.js');
```

**Step 4: Bundling**
```bash
# Using Rollup or Vite
npm install --save-dev rollup
rollup -c rollup.config.js
```

## Migration Timeline

### Phase 1: ✅ COMPLETE (v4.5.22)
- All functions extracted into 23 modules
- Backward compatibility via window globals
- 627+ tests passing

### Phase 2: Documentation (Current)
- [x] ARCHITECTURE.md
- [x] MIGRATION-GUIDE.md
- [ ] Update README.md

### Phase 3: Cleanup
- [ ] Remove duplicate js/ files
- [ ] Archive old files
- [ ] Update HTML files to use main.js

### Phase 4: Optimization
- [ ] Remove window globals from module internals
- [ ] Implement tree shaking
- [ ] Bundle for production
- [ ] Measure performance improvements

## Best Practices

### Do's ✅
- Import only what you need
- Use named exports (not default exports)
- Keep modules focused and small
- Document complex modules with JSDoc
- Write tests for new functionality
- Follow existing naming conventions

### Don'ts ❌
- Don't create circular dependencies
- Don't access window globals from modules
- Don't mix ES6 and CommonJS
- Don't use default exports
- Don't create God modules (>500 lines)
- Don't skip writing tests

## Resources

- **Architecture Overview:** `ARCHITECTURE.md`
- **Change History:** `MODULAR-CHANGELOG.md`
- **Test Examples:** `hyperfiler-pro-modular.html`
- **Module Source:** `src/modules/` directory
- **ES6 Modules:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules

## Getting Help

If you encounter issues during migration:

1. Check this guide's Common Issues section
2. Review ARCHITECTURE.md for module structure
3. Look at existing modules for patterns
4. Check hyperfiler-pro-modular.html for test examples
5. Review console for specific error messages

## Example: Complete Feature Migration

Here's a complete example of migrating a custom feature:

**Before:** `custom-dashboard.js` (old)
```javascript
// Assumes utils.js, tasks.js, ui.js already loaded
function initDashboard() {
  const tasks = loadTasksFromLocalStorage();
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    today: tasks.filter(t => isTaskToday(t)).length
  };

  document.getElementById('stats').innerHTML = `
    <div>Total: ${stats.total}</div>
    <div>Completed: ${stats.completed}</div>
    <div>Today: ${stats.today}</div>
  `;

  renderTodayView();
}
```

**After:** `custom-dashboard.js` (new)
```javascript
// ES6 module with explicit imports
import { loadTasksFromLocalStorage } from './src/modules/features/task-management.js';
import { isTaskToday } from './src/modules/features/tasks.js';
import { renderTodayView } from './src/modules/ui/ui-components.js';

export function initDashboard() {
  const tasks = loadTasksFromLocalStorage();
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    today: tasks.filter(t => isTaskToday(t)).length
  };

  document.getElementById('stats').innerHTML = `
    <div>Total: ${stats.total}</div>
    <div>Completed: ${stats.completed}</div>
    <div>Today: ${stats.today}</div>
  `;

  renderTodayView();
}

// If needed in HTML directly, expose to window
if (typeof window !== 'undefined') {
  window.initDashboard = initDashboard;
}
```

This migration:
- ✅ Uses explicit imports
- ✅ Exports the function
- ✅ Maintains window global for backward compatibility
- ✅ Clear dependencies
- ✅ Ready for tree-shaking

---

**Version:** 1.0.0
**Last Updated:** 2025-11-02
**Status:** Complete migration guide for v4.5.22

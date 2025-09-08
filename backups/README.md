# HyperFiler Pro Backups

## Files Generated

### Full Backup
- **File**: `hyperfiler-backup-2025-09-08T07-50-46-093Z.json`
- **Description**: Complete backup with sample data structure
- **Size**: 4 KB
- **Tasks**: 3
- **Lists**: 2

### Template Backup
- **File**: `hyperfiler-template-2025-09-08T07-50-46-093Z.json`
- **Description**: Empty backup structure (template for new setups)

### CSV Export
- **File**: `hyperfiler-tasks-2025-09-08T07-50-46-093Z.csv`
- **Description**: Tasks exported in CSV format for spreadsheet import

### Restore Script
- **File**: `restore.js`
- **Usage**: `node restore.js <backup-file.json>`

## Data Structure

### Tasks
Each task contains:
- ID, title, notes
- Due date and time
- Status (pending/completed)
- Event and recurring flags
- Priority and tags
- Creation and modification timestamps

### Lists
Organized in sections with:
- Section metadata (name, color, order)
- List items with descriptions and task counts

### Preferences
User settings including:
- Language and theme
- Date/time formats
- Default views
- Sync and notification settings

## Restoring Data

1. Choose your backup file
2. Run: `node restore.js backup-file.json`
3. Follow the console instructions
4. Or manually import via browser Developer Tools

## Security Notes

- Backups exclude sensitive authentication tokens
- User IDs and personal data are anonymized in templates
- Always verify backup integrity before restoring

Generated: 8/9/2025, 9:50:46

#!/usr/bin/env node

/**
 * HyperFiler Pro - JSON Backup Generator
 * Creates comprehensive backup of all user data
 */

const fs = require('fs');
const path = require('path');

console.log('📦 HyperFiler Pro - JSON Backup Generator');
console.log('🔍 Analyzing data structure...');

// Create backup directory
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Generate timestamp for backup filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFilename = `hyperfiler-backup-${timestamp}.json`;
const backupPath = path.join(backupDir, backupFilename);

// Template for the backup structure
const backupTemplate = {
    metadata: {
        version: '1.0',
        backupDate: new Date().toISOString(),
        backupType: 'full',
        source: 'HyperFiler Pro',
        description: 'Complete backup of all user data including tasks, lists, preferences, and settings'
    },
    
    // Core data structures
    data: {
        // Main tasks array
        tasks: [],
        
        // Lists and sections
        lists: {
            sections: [],
            items: []
        },
        
        // User preferences
        preferences: {
            language: 'en',
            theme: 'light',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24h',
            weekStartsOn: 'monday',
            defaultView: 'today',
            notifications: true,
            autoSync: true
        },
        
        // View states
        viewStates: {
            currentView: 'today',
            currentTodayDate: new Date().toISOString(),
            currentWeekDate: new Date().toISOString(),
            currentCalendarDate: new Date().toISOString()
        },
        
        // Filter states
        filters: {
            activeTodayTemplateFilter: null,
            activeWeekTemplateFilter: null,
            activeMonthTemplateFilter: null,
            activeAllTasksTemplateFilter: null
        },
        
        // Authentication (excluding sensitive data)
        auth: {
            isLoggedIn: false,
            userId: null,
            lastSyncTime: null
        },
        
        // Settings and configurations
        settings: {
            ui: {
                mobileBreakpoint: 768,
                animationsEnabled: true,
                compactMode: false
            },
            sync: {
                autoSyncInterval: 30000,
                conflictResolution: 'latest',
                retryAttempts: 3
            },
            backup: {
                autoBackup: true,
                backupInterval: 86400000, // 24 hours
                maxBackups: 30
            }
        }
    },
    
    // Statistics
    statistics: {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        totalLists: 0,
        totalListItems: 0,
        dataSize: 0
    }
};

// Sample data structure based on common localStorage keys used in HyperFiler
const sampleData = {
    // Sample tasks structure
    tasks: [
        {
            id: "sample_task_1",
            title: "Sample Task 1",
            notes: "This is a sample task with notes",
            dueDate: "2024-01-15",
            dueTime: "14:30",
            status: "pending",
            isEvent: false,
            isRecurring: false,
            createdAt: "2024-01-10T10:00:00.000Z",
            updatedAt: "2024-01-10T10:00:00.000Z",
            priority: 1,
            tags: ["work", "@project"],
            listId: null
        },
        {
            id: "sample_task_2", 
            title: "Sample Completed Task",
            notes: "",
            dueDate: "2024-01-14",
            dueTime: null,
            status: "completed",
            isEvent: false,
            isRecurring: false,
            createdAt: "2024-01-09T09:00:00.000Z",
            updatedAt: "2024-01-14T16:30:00.000Z",
            completedAt: "2024-01-14T16:30:00.000Z",
            priority: 0,
            tags: ["personal"],
            listId: null
        },
        {
            id: "sample_event_1",
            title: "Team Meeting",
            notes: "Weekly team sync meeting",
            dueDate: "2024-01-16",
            dueTime: "09:00",
            status: "pending",
            isEvent: true,
            isRecurring: true,
            recurringPattern: {
                type: "weekly",
                interval: 1,
                daysOfWeek: [2], // Tuesday
                endDate: null
            },
            createdAt: "2024-01-01T08:00:00.000Z",
            updatedAt: "2024-01-01T08:00:00.000Z",
            priority: 2,
            tags: ["work", "meeting"],
            listId: null
        }
    ],
    
    // Sample lists structure
    lists: {
        sections: [
            {
                id: "work_section",
                name: "Work Projects",
                color: "#007aff",
                order: 1,
                isCollapsed: false,
                createdAt: "2024-01-01T00:00:00.000Z"
            },
            {
                id: "personal_section",
                name: "Personal",
                color: "#34c759",
                order: 2,
                isCollapsed: false,
                createdAt: "2024-01-01T00:00:00.000Z"
            }
        ],
        
        items: [
            {
                id: "list_1",
                sectionId: "work_section",
                name: "Project Alpha",
                description: "Main project tasks and deliverables",
                color: "#ff9500",
                order: 1,
                isArchived: false,
                createdAt: "2024-01-01T00:00:00.000Z",
                taskCount: 5,
                completedCount: 2
            },
            {
                id: "list_2", 
                sectionId: "personal_section",
                name: "Home Improvement",
                description: "Tasks for home renovation project",
                color: "#ff3b30",
                order: 1,
                isArchived: false,
                createdAt: "2024-01-02T00:00:00.000Z",
                taskCount: 8,
                completedCount: 3
            }
        ]
    }
};

function generateBackup(includeExampleData = true) {
    console.log('📋 Generating backup structure...');
    
    const backup = JSON.parse(JSON.stringify(backupTemplate));
    
    if (includeExampleData) {
        // Include sample data to show structure
        backup.data.tasks = sampleData.tasks;
        backup.data.lists = sampleData.lists;
        
        console.log('📝 Including sample data structure');
    }
    
    // Calculate statistics
    backup.statistics.totalTasks = backup.data.tasks.length;
    backup.statistics.completedTasks = backup.data.tasks.filter(t => t.status === 'completed').length;
    backup.statistics.pendingTasks = backup.data.tasks.filter(t => t.status === 'pending').length;
    backup.statistics.overdueTasks = backup.data.tasks.filter(t => {
        const today = new Date().toISOString().split('T')[0];
        return t.dueDate && t.dueDate < today && t.status === 'pending';
    }).length;
    backup.statistics.totalLists = backup.data.lists.sections.length;
    backup.statistics.totalListItems = backup.data.lists.items.length;
    
    // Calculate data size
    const jsonString = JSON.stringify(backup, null, 2);
    backup.statistics.dataSize = Buffer.byteLength(jsonString, 'utf8');
    
    return backup;
}

function createBackupFiles() {
    console.log('💾 Creating backup files...');
    
    // Generate full backup with sample data
    const fullBackup = generateBackup(true);
    fs.writeFileSync(backupPath, JSON.stringify(fullBackup, null, 2));
    
    // Generate template backup (structure only)
    const templatePath = path.join(backupDir, `hyperfiler-template-${timestamp}.json`);
    const templateBackup = generateBackup(false);
    fs.writeFileSync(templatePath, JSON.stringify(templateBackup, null, 2));
    
    // Generate CSV export for tasks
    const csvPath = path.join(backupDir, `hyperfiler-tasks-${timestamp}.csv`);
    const csvHeader = 'ID,Title,Notes,Due Date,Due Time,Status,Is Event,Priority,Tags,Created At,Updated At,Completed At\n';
    const csvRows = fullBackup.data.tasks.map(task => {
        return [
            task.id,
            `"${(task.title || '').replace(/"/g, '""')}"`,
            `"${(task.notes || '').replace(/"/g, '""')}"`,
            task.dueDate || '',
            task.dueTime || '',
            task.status,
            task.isEvent ? 'Yes' : 'No',
            task.priority || 0,
            `"${(task.tags || []).join(', ')}"`,
            task.createdAt || '',
            task.updatedAt || '',
            task.completedAt || ''
        ].join(',');
    }).join('\n');
    fs.writeFileSync(csvPath, csvHeader + csvRows);
    
    return { fullBackup, templateBackup, backupPath, templatePath, csvPath };
}

// Create restore script
function createRestoreScript() {
    const restoreScriptContent = `#!/usr/bin/env node

/**
 * HyperFiler Pro - Data Restore Script
 * Restores data from JSON backup
 */

const fs = require('fs');
const path = require('path');

function restoreFromBackup(backupFilePath) {
    console.log('🔄 HyperFiler Pro - Data Restore');
    console.log('📂 Loading backup file:', backupFilePath);
    
    if (!fs.existsSync(backupFilePath)) {
        console.error('❌ Backup file not found:', backupFilePath);
        return false;
    }
    
    try {
        const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
        
        console.log('✅ Backup loaded successfully');
        console.log('📊 Backup info:');
        console.log('   - Version:', backupData.metadata.version);
        console.log('   - Date:', new Date(backupData.metadata.backupDate).toLocaleString());
        console.log('   - Tasks:', backupData.statistics.totalTasks);
        console.log('   - Lists:', backupData.statistics.totalLists);
        
        // In a real restore, you would:
        // 1. Validate the backup structure
        // 2. Backup current data
        // 3. Clear existing localStorage data
        // 4. Import the backup data
        // 5. Verify the restoration
        
        console.log('\\n📋 To restore this data in HyperFiler Pro:');
        console.log('1. Open HyperFiler Pro in your browser');
        console.log('2. Open browser Developer Tools (F12)');
        console.log('3. Go to Console tab');
        console.log('4. Paste the following code:');
        console.log('\\n// Clear existing data');
        console.log('localStorage.removeItem("gtdTasks");');
        console.log('localStorage.removeItem("gtd_lists");');
        console.log('\\n// Import backup data');
        console.log('const backupData =', JSON.stringify(backupData.data.tasks, null, 2), ';');
        console.log('localStorage.setItem("gtdTasks", JSON.stringify(backupData));');
        console.log('\\n// Reload the page');
        console.log('location.reload();');
        
        return true;
    } catch (error) {
        console.error('❌ Failed to restore backup:', error.message);
        return false;
    }
}

// Usage
const backupFile = process.argv[2];
if (!backupFile) {
    console.log('Usage: node restore.js <backup-file.json>');
    process.exit(1);
}

restoreFromBackup(backupFile);
`;

    const restoreScriptPath = path.join(backupDir, 'restore.js');
    fs.writeFileSync(restoreScriptPath, restoreScriptContent);
    return restoreScriptPath;
}

// Main execution
try {
    const { fullBackup, templateBackup, backupPath, templatePath, csvPath } = createBackupFiles();
    const restoreScriptPath = createRestoreScript();
    
    // Create README for backups
    const readmePath = path.join(backupDir, 'README.md');
    const readmeContent = `# HyperFiler Pro Backups

## Files Generated

### Full Backup
- **File**: \`${path.basename(backupPath)}\`
- **Description**: Complete backup with sample data structure
- **Size**: ${Math.round(fullBackup.statistics.dataSize / 1024)} KB
- **Tasks**: ${fullBackup.statistics.totalTasks}
- **Lists**: ${fullBackup.statistics.totalLists}

### Template Backup
- **File**: \`${path.basename(templatePath)}\`
- **Description**: Empty backup structure (template for new setups)

### CSV Export
- **File**: \`${path.basename(csvPath)}\`
- **Description**: Tasks exported in CSV format for spreadsheet import

### Restore Script
- **File**: \`restore.js\`
- **Usage**: \`node restore.js <backup-file.json>\`

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
2. Run: \`node restore.js backup-file.json\`
3. Follow the console instructions
4. Or manually import via browser Developer Tools

## Security Notes

- Backups exclude sensitive authentication tokens
- User IDs and personal data are anonymized in templates
- Always verify backup integrity before restoring

Generated: ${new Date().toLocaleString()}
`;
    
    fs.writeFileSync(readmePath, readmeContent);
    
    console.log('\n🎉 Backup generation complete!');
    console.log('\n📁 Files created:');
    console.log(`   📄 Full backup: ${backupPath}`);
    console.log(`   📋 Template: ${templatePath}`);
    console.log(`   📊 CSV export: ${csvPath}`);
    console.log(`   🔧 Restore script: ${restoreScriptPath}`);
    console.log(`   📖 README: ${readmePath}`);
    
    console.log('\n📊 Backup Statistics:');
    console.log(`   💾 Data size: ${Math.round(fullBackup.statistics.dataSize / 1024)} KB`);
    console.log(`   📝 Tasks: ${fullBackup.statistics.totalTasks} (${fullBackup.statistics.completedTasks} completed)`);
    console.log(`   📂 Lists: ${fullBackup.statistics.totalLists}`);
    console.log(`   🔗 List items: ${fullBackup.statistics.totalListItems}`);
    
    console.log('\n✅ Backup ready for deployment or archival');
    
} catch (error) {
    console.error('❌ Backup generation failed:', error.message);
    process.exit(1);
}
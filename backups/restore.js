#!/usr/bin/env node

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
        
        console.log('\n📋 To restore this data in HyperFiler Pro:');
        console.log('1. Open HyperFiler Pro in your browser');
        console.log('2. Open browser Developer Tools (F12)');
        console.log('3. Go to Console tab');
        console.log('4. Paste the following code:');
        console.log('\n// Clear existing data');
        console.log('localStorage.removeItem("gtdTasks");');
        console.log('localStorage.removeItem("gtd_lists");');
        console.log('\n// Import backup data');
        console.log('const backupData =', JSON.stringify(backupData.data.tasks, null, 2), ';');
        console.log('localStorage.setItem("gtdTasks", JSON.stringify(backupData));');
        console.log('\n// Reload the page');
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

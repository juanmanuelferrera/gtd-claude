// 🛠️ DATA RECOVERY SCRIPT - Fix corrupted localStorage structure
// Run this in browser console to recover from backup corruption

function fixCorruptedLocalStorage() {
    console.log('🔧 DATA RECOVERY: Starting localStorage repair...');
    
    // Get the corrupted data
    const corruptedData = JSON.parse(localStorage.getItem('hyperfiler-tasks') || '{}');
    console.log('📊 Found corrupted data with', Object.keys(corruptedData).length, 'keys');
    
    // Extract valid sections (ignore numbered indexes)
    const validSections = {};
    let totalTasks = 0;
    
    Object.keys(corruptedData).forEach(key => {
        const data = corruptedData[key];
        
        // Skip numbered indexes (0, 1, 2, etc.) - these are corruption
        if (/^\d+$/.test(key)) {
            console.log('🗑️ Skipping corrupted index:', key);
            return;
        }
        
        // Only keep valid section names with actual task arrays
        if (Array.isArray(data) && data.length > 0) {
            validSections[key] = data;
            totalTasks += data.length;
            console.log('✅ Recovered section:', key, 'with', data.length, 'tasks');
        } else if (data && Array.isArray(data)) {
            validSections[key] = data; // Keep empty arrays for valid sections
            console.log('📝 Kept empty section:', key);
        }
    });
    
    console.log('🔧 RECOVERY SUMMARY:');
    console.log('  - Valid sections:', Object.keys(validSections).length);
    console.log('  - Total tasks recovered:', totalTasks);
    console.log('  - Sections found:', Object.keys(validSections));
    
    // Save the cleaned data
    localStorage.setItem('hyperfiler-tasks', JSON.stringify(validSections));
    console.log('✅ DATA RECOVERY: Clean data saved to localStorage');
    
    // Also clean up the old corrupted key if it exists
    const oldData = localStorage.getItem('gtdTasks');
    if (oldData) {
        try {
            const parsed = JSON.parse(oldData);
            if (Array.isArray(parsed)) {
                console.log('🔧 Converting old array format to sectioned format...');
                
                // Convert old flat array to sectioned format
                const sectioned = { inbox: [] };
                parsed.forEach(task => {
                    const section = task.section || 'inbox';
                    if (!sectioned[section]) {
                        sectioned[section] = [];
                    }
                    sectioned[section].push(task);
                });
                
                // Merge with recovered data
                Object.keys(sectioned).forEach(section => {
                    if (!validSections[section]) {
                        validSections[section] = sectioned[section];
                        console.log('🔄 Merged old section:', section, 'with', sectioned[section].length, 'tasks');
                    }
                });
                
                // Update with merged data
                localStorage.setItem('hyperfiler-tasks', JSON.stringify(validSections));
            }
        } catch (e) {
            console.log('⚠️ Could not process old data:', e.message);
        }
        
        // Remove the old corrupted key
        localStorage.removeItem('gtdTasks');
        console.log('🗑️ Removed old corrupted data key');
    }
    
    console.log('🎉 DATA RECOVERY COMPLETE!');
    console.log('📊 Final data structure:', Object.keys(validSections));
    
    // Reload the page to reinitialize with clean data
    if (confirm('Data recovery complete! Reload page to see recovered tasks?')) {
        window.location.reload();
    }
    
    return validSections;
}

// Auto-run the recovery function
console.log('🚨 Corrupted localStorage detected, running automatic recovery...');
fixCorruptedLocalStorage();
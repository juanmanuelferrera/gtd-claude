// 🚀 WORKING FRONTEND SYNC FUNCTIONS - v1.0-sync-working
// These functions are proven to work for cross-device task sync
// Use this to restore if future changes break sync

// ===== 1. INITIALIZATION =====
function initializeSimpleSync() {
    if (!window.currentUser?.user?.id) {
        console.log('⏭️ No user logged in - skipping sync initialization');
        return;
    }
    
    console.log('🚀 NEW SIMPLE SYNC: Starting ultra-simple two-way sync');
    
    // Immediate upload on login to save any local changes
    uploadAllTasks().catch(err => console.log('Initial upload failed:', err));
    
    // Simple download: poll every 5 seconds
    setInterval(async () => {
        if (window.currentUser && navigator.onLine) {
            await downloadAllTasks();
        }
    }, 5000);
    
    console.log('✅ Simple sync system initialized');
}

// ===== 2. UPLOAD (Send all tasks to server) =====
async function uploadAllTasks() {
    if (!window.currentUser?.user?.id) return;
    
    try {
        console.log('📤 SIMPLE SYNC: Uploading all tasks to server');
        const authToken = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_BASE}/tasks/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                userId: window.currentUser.user.id,
                tasks: tasks // Send entire tasks array
            })
        });

        if (response.ok) {
            console.log('✅ SIMPLE SYNC: Upload successful');
        } else {
            console.error('❌ SIMPLE SYNC: Upload failed:', response.status);
        }
    } catch (error) {
        console.error('❌ SIMPLE SYNC: Upload error:', error);
    }
}

// ===== 3. DOWNLOAD (Get all tasks from server) =====
async function downloadAllTasks() {
    if (!window.currentUser?.user?.id) return;
    
    // Don't download if we just moved tasks to prevent overwriting
    if (window.justMovedTasks) {
        console.log('📥 SIMPLE SYNC: Skipping download - just moved tasks');
        return;
    }
    
    try {
        const authToken = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_BASE}/tasks/${window.currentUser.user.id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const serverTasks = data.tasks || [];
            
            // Simple comparison: if different, replace everything
            if (JSON.stringify(serverTasks) !== JSON.stringify(tasks)) {
                console.log('📥 SIMPLE SYNC: Server has different data, updating local');
                tasks = serverTasks;
                localStorage.setItem('gtdTasks', JSON.stringify(tasks));
                renderCurrentView(); // Refresh UI
            }
        } else {
            console.log('📥 SIMPLE SYNC: Download failed:', response.status);
        }
    } catch (error) {
        console.log('📥 SIMPLE SYNC: Download error:', error);
    }
}

// ===== 4. HOOK INTO TASK OPERATIONS =====
// Replace existing sync calls with:
// await uploadAllTasks();

// ===== 5. INITIALIZATION CALL =====
// Add this after authentication:
// initializeSimpleSync();

// ===== KEY PRINCIPLES =====
// - Complete array replacement (no merging)
// - 5-second polling
// - No error banners 
// - Race condition protection with justMovedTasks flag
// - Consistent localStorage key: 'gtdTasks'
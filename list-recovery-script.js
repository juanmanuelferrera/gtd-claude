/**
 * LIST SECTIONS RECOVERY SCRIPT
 * Run this in the browser console to attempt recovery of lost list sections
 */

(async function recoverListSections() {
    console.log('🔍 === LIST SECTIONS RECOVERY SCRIPT ===');
    console.log('');

    // Step 1: Check current state
    console.log('Step 1: Checking current state...');
    const localLists = localStorage.getItem('gtd_list_sections');
    console.log('📦 Local storage gtd_list_sections:', localLists);
    console.log('📦 window.listSections:', window.listSections);

    // Step 2: Check if user is logged in
    if (!window.currentUser?.user?.id) {
        console.error('❌ ERROR: Not logged in. Cannot recover from server.');
        console.log('💡 TIP: Please log in first, then run this script again.');
        return;
    }

    console.log('✅ User logged in:', window.currentUser.user.id);

    // Step 3: Force download from server
    console.log('');
    console.log('Step 2: Attempting to download lists from server...');
    console.log('🌐 API Base:', window.API_BASE);

    try {
        // Get auth headers
        const authToken = localStorage.getItem('authToken');
        const headers = {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        };

        console.log('📡 Fetching from:', `${window.API_BASE}/lists/${window.currentUser.user.id}`);

        const response = await fetch(`${window.API_BASE}/lists/${window.currentUser.user.id}`, {
            headers: headers
        });

        console.log('📡 Response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('📥 Server response:', data);

            const serverLists = data.listSections || [];
            console.log('📊 Server has', serverLists.length, 'list sections');

            if (serverLists.length > 0) {
                console.log('');
                console.log('✅ === RECOVERY SUCCESSFUL ===');
                console.log('Found', serverLists.length, 'list sections on server!');
                console.log('');
                console.log('🔧 Restoring lists now...');

                // Restore to window and localStorage
                window.listSections = serverLists;
                localStorage.setItem('gtd_list_sections', JSON.stringify(serverLists));

                console.log('✅ Lists restored to memory and localStorage');
                console.log('');
                console.log('🔄 Refreshing lists view...');

                // Re-render the lists view if it exists
                if (typeof renderListsView === 'function') {
                    renderListsView();
                    console.log('✅ Lists view refreshed!');
                } else {
                    console.log('⚠️ renderListsView function not found. Please navigate to Lists view to see restored data.');
                }

                console.log('');
                console.log('🎉 === RECOVERY COMPLETE ===');
                console.log('Your lists have been restored from the server!');

            } else {
                console.log('');
                console.log('⚠️ === SERVER HAS NO LIST DATA ===');
                console.log('The server returned 0 list sections.');
                console.log('');
                console.log('This means either:');
                console.log('1. The data was never synced to the server');
                console.log('2. The data was deleted from the server');
                console.log('');
                console.log('💡 RECOVERY OPTIONS:');
                console.log('  - Check if you have a backup JSON file from "Export All" or "Quick Backup"');
                console.log('  - If yes, use the "Import JSON" feature to restore');
                console.log('  - If no, the data may be permanently lost');
            }

        } else {
            console.error('❌ Server returned error status:', response.status);
            console.error('Response text:', await response.text());
        }

    } catch (error) {
        console.error('❌ Error fetching from server:', error);
        console.log('');
        console.log('💡 This could mean:');
        console.log('  - Network connection issues');
        console.log('  - Server is down');
        console.log('  - Authentication expired');
    }

    console.log('');
    console.log('=== RECOVERY SCRIPT COMPLETE ===');
})();

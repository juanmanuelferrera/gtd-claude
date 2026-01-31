/**
 * List Operations for HyperFiler Pro
 */

// List management functions
function openCreateSectionModal() {
    console.log('Opening create section modal...');
    const sectionName = prompt('Enter section name:');
    if (sectionName && sectionName.trim()) {
        createListSection(sectionName.trim());
    }
}
// Create new list section
async function createListSection(name) {
    const newSection = {
        id: Date.now().toString(),
        name: name,
        lists: [],
        collapsed: false,
        createdAt: new Date().toISOString()
    };
    
    // Initialize listSections if it doesn't exist
    if (!window.listSections) {
        window.listSections = [];
    }
    
    window.listSections.push(newSection);
    
    // Save to localStorage and sync
    if (typeof saveListSections === 'function') {
        await saveListSections();
    }
    
    // Re-render the lists view
    if (typeof renderListsView === 'function') {
        renderListsView();
    }
    
    console.log('✅ Created new section:', name);
}
// Edit list section
async function editListSection(sectionId) {
    const section = window.listSections?.find(s => s.id === sectionId);
    if (!section) return;
    
    const newName = prompt('Edit section name:', section.name);
    if (newName && newName.trim() && newName.trim() !== section.name) {
        section.name = newName.trim();
        if (typeof saveListSections === 'function') {
            await saveListSections();
        }
        if (typeof renderListsView === 'function') {
            renderListsView();
        }
    }
}

// List item management functions (global scope)
async function addListItem() {
    console.log('🔍 Global addListItem called');
    const input = document.getElementById('newListItemInput');
    const text = input.value.trim();
    
    if (!text) {
        console.error('Empty list item text');
        input.focus();
        return;
    }
    
    // Use global variables (not window.)
    const listSections = window.listSections;
    const currentListSectionId = window.currentListSectionId;
    const currentListId = window.currentListId;
    
    console.log('🔍 Current context:', { currentListSectionId, currentListId, listSectionsLength: listSections?.length });
    
    const section = listSections?.find(s => s.id == currentListSectionId);
    if (!section) {
        console.error('❌ Section not found:', currentListSectionId);
        return;
    }
    
    const list = section.lists?.find(l => l.id == currentListId);
    if (!list) {
        console.error('❌ List not found:', currentListId);
        return;
    }
    
    if (!list.items) {
        list.items = [];
    }
    
    // Add new item
    const newItem = {
        id: Date.now().toString(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    list.items.unshift(newItem);
    console.log('✅ Added item:', newItem.text, 'to list:', list.name);
    
    // Save and refresh using window functions
    if (typeof window.saveListSections === 'function') {
        await window.saveListSections();
        console.log('💾 Saved to localStorage and server');
    }
    if (typeof renderListItems === 'function') {
        renderListItems();
        console.log('🔄 Refreshed list items');
    }
    if (typeof renderListsView === 'function') {
        renderListsView();
        console.log('🔄 Refreshed lists view');
    }
    
    // Clear input and focus
    input.value = '';
    input.focus();
}
async function editListItem(itemIndex) {
    console.log('🔍 Global editListItem called:', itemIndex);
    const section = window.listSections?.find(s => s.id == window.currentListSectionId);
    if (!section) return;
    
    const list = section.lists?.find(l => l.id == window.currentListId);
    if (!list || !list.items || !list.items[itemIndex]) return;
    
    const item = list.items[itemIndex];
    const newText = prompt('Edit item:', item.text);
    
    if (newText !== null && newText.trim() && newText.trim() !== item.text) {
        item.text = newText.trim();
        item.updatedAt = new Date().toISOString();
        console.log('✅ Edited item:', item.text);
        
        // Save and refresh
        if (typeof saveListSections === 'function') {
            await saveListSections();
        }
        if (typeof renderListItems === 'function') {
            renderListItems();
        }
    }
}
async function deleteListItem(itemIndex) {
    console.log('🔍 Global deleteListItem called:', itemIndex);
    const section = window.listSections?.find(s => s.id == window.currentListSectionId);
    if (!section) return;
    
    const list = section.lists?.find(l => l.id == window.currentListId);
    if (!list || !list.items || !list.items[itemIndex]) return;
    
    // Delete item
    const deletedItem = list.items.splice(itemIndex, 1)[0];
    console.log('✅ Deleted item:', deletedItem.text);
    
    // Save and refresh
    if (typeof saveListSections === 'function') {
        await saveListSections();
    }
    if (typeof renderListItems === 'function') {
        renderListItems();
    }
}
async function toggleListItem(itemIndex) {
    console.log('🔍 Global toggleListItem called:', itemIndex);
    
    // Rapid-click protection
    const currentTime = Date.now();
    if (!window.toggleListItemLastClick) window.toggleListItemLastClick = {};
    const clickKey = `${window.currentListSectionId}-${window.currentListId}-${itemIndex}`;
    if (window.toggleListItemLastClick[clickKey] && 
        currentTime - window.toggleListItemLastClick[clickKey] < 300) {
        console.log(`⏱️ Rapid-click blocked for list item ${itemIndex}`);
        return;
    }
    window.toggleListItemLastClick[clickKey] = currentTime;
    
    // Enhanced null checks
    if (itemIndex === null || itemIndex === undefined || itemIndex < 0) {
        console.warn('Invalid itemIndex provided to toggleListItem:', itemIndex);
        return;
    }
    
    const section = window.listSections?.find(s => s.id == window.currentListSectionId);
    if (!section) {
        console.warn('No section found for currentListSectionId:', window.currentListSectionId);
        return;
    }
    
    const list = section.lists?.find(l => l.id == window.currentListId);
    if (!list || !list.items || !list.items[itemIndex]) {
        console.warn('No list or item found:', { 
            listId: window.currentListId, 
            itemIndex, 
            itemsLength: list?.items?.length 
        });
        return;
    }
    
    try {
        // Toggle completed status
        const item = list.items[itemIndex];
        const wasCompleted = item.completed;
        item.completed = !wasCompleted;
        
        console.log('✅ Toggled item:', item.text, 'completed:', item.completed);
        
        // Update accessibility attributes for the item element
        const itemElement = document.querySelector(`[data-item-index="${itemIndex}"]`);
        if (itemElement) {
            itemElement.setAttribute('aria-checked', item.completed.toString());
            itemElement.setAttribute('aria-label', 
                `${item.text} - ${item.completed ? 'completed' : 'pending'}`);
        }
        
        // Save and refresh
        if (typeof saveListSections === 'function') {
            await saveListSections();
        }
        if (typeof renderListItems === 'function') {
            renderListItems();
        }
        
    } catch (error) {
        console.error('Error in toggleListItem:', error);
    }
}

// Delete list section
async function deleteListSection(sectionId) {
    const section = window.listSections?.find(s => s.id === sectionId);
    if (!section) return;
    
    const listsCount = section.lists ? section.lists.length : 0;
    const message = listsCount > 0 
        ? `Delete section "${section.name}" and all its ${listsCount} lists?`
        : `Delete section "${section.name}"?`;
    
    if (confirm(message)) {
        window.listSections = window.listSections.filter(s => s.id !== sectionId);
        if (typeof saveListSections === 'function') {
            await saveListSections();
        }
        if (typeof renderListsView === 'function') {
            renderListsView();
        }
    }
}
// Open create list modal
function openCreateListModal(sectionId) {
    const listName = prompt('Enter list name:', '');
    if (listName && listName.trim()) {
        createList(sectionId, listName.trim());
    }
}
// Create new list
async function createList(sectionId, name) {
    if (!window.listSections) {
        window.listSections = [];
    }
    
    const section = window.listSections.find(s => s.id === sectionId);
    if (!section) return;
    
    if (!section.lists) {
        section.lists = [];
    }
    
    const newList = {
        id: Date.now().toString(),
        name: name,
        items: [],
        createdAt: new Date().toISOString()
    };
    
    section.lists.push(newList);
    if (typeof saveListSections === 'function') {
        await saveListSections();
    }
    if (typeof renderListsView === 'function') {
        renderListsView();
    }
}
// Edit list
async function editList(sectionId, listId) {
    const section = window.listSections?.find(s => s.id === sectionId);
    if (!section) return;
    
    const list = section.lists?.find(l => l.id === listId);
    if (!list) return;
    
    const newName = prompt('Edit list name:', list.name);
    if (newName && newName.trim() && newName.trim() !== list.name) {
        list.name = newName.trim();
        if (typeof saveListSections === 'function') {
            await saveListSections();
        }
        if (typeof renderListsView === 'function') {
            renderListsView();
        }
    }
}
// Delete list
async function deleteList(sectionId, listId) {
    const section = window.listSections?.find(s => s.id === sectionId);
    if (!section) return;
    
    const list = section.lists?.find(l => l.id === listId);
    if (!list) return;
    
    const itemsCount = list.items ? list.items.length : 0;
    const message = itemsCount > 0 
        ? `Delete list "${list.name}" and all its ${itemsCount} items?`
        : `Delete list "${list.name}"?`;
    
    if (confirm(message)) {
        section.lists = section.lists.filter(l => l.id !== listId);
        if (typeof saveListSections === 'function') {
            await saveListSections();
        }
        if (typeof renderListsView === 'function') {
            renderListsView();
        }
    }
}
// Open list modal to view/edit list items
function openListModal(sectionId, listId) {
    
    const section = window.listSections?.find(s => s.id == sectionId);
    if (!section) {
        console.error('❌ Section not found:', sectionId);
        console.log('Available sections:', window.listSections?.map(s => s.id));
        return;
    }
    
    const list = section.lists?.find(l => l.id == listId);
    if (!list) {
        console.error('❌ List not found:', listId);
        console.log('Available lists in section:', section.lists?.map(l => l.id));
        return;
    }
    
    console.log('✅ Found list:', list.name);
    
    // Store current list context
    window.currentListSectionId = sectionId;
    window.currentListId = listId;
    
    // Update modal title
    const titleElement = document.getElementById('listItemsModalTitle');
    const subtitleElement = document.getElementById('listItemsModalSubtitle');
    
    if (titleElement) {
        titleElement.textContent = `📋 ${list.name}`;
    }
    if (subtitleElement) {
        subtitleElement.textContent = '';
    }
    
    // Initialize items if not exists
    if (!list.items) {
        list.items = [];
    }
    
    // Clear input
    const inputElement = document.getElementById('newListItemInput');
    if (inputElement) {
        inputElement.value = '';
    }
    
    // Render items
    if (typeof renderListItems === 'function') {
        renderListItems();
    }
    
    // Show modal
    const modal = document.getElementById('listItemsModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Focus input after a short delay
        setTimeout(() => {
            if (inputElement) {
                inputElement.focus();
            }
        }, 100);
    }
}
// Render list items in modal
function renderListItems() {
    const section = window.listSections?.find(s => s.id == window.currentListSectionId);
    if (!section) return;
    
    const list = section.lists?.find(l => l.id == window.currentListId);
    if (!list) return;
    
    const container = document.getElementById('listItemsContainer');
    const emptyState = document.getElementById('emptyListItems');
    const countElement = document.getElementById('listItemsCount');
    
    if (!container) return;
    
    if (!list.items || list.items.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (countElement) countElement.textContent = '0 items';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (countElement) countElement.textContent = `${list.items.length} item${list.items.length === 1 ? '' : 's'}`;
    
    // Sort items: unchecked first, then checked
    const sortedItems = [...list.items].sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    });
    
    let html = '';
    sortedItems.forEach((item, index) => {
        const originalIndex = list.items.indexOf(item);
        html += `
            <div class="list-modal-item ${item.completed ? 'completed' : ''}" 
                 data-item-index="${originalIndex}">
                <div class="list-modal-item-content">
                    <input type="checkbox" 
                           class="list-modal-item-checkbox" 
                           ${item.completed ? 'checked' : ''} 
                           onchange="toggleListItem(${originalIndex})">
                    <div class="list-modal-item-text">${escapeHtml(item.text)}</div>
                </div>
                <div class="list-modal-item-actions">
                    <button class="list-modal-action-btn edit" 
                            onclick="editListItem(${originalIndex})" 
                            title="Edit item">✏️</button>
                    <button class="list-modal-action-btn delete" 
                            onclick="deleteListItem(${originalIndex})" 
                            title="Delete item">🗑️</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

window.openCreateSectionModal = openCreateSectionModal;
window.createListSection = createListSection;

// Global list modal functions
async function toggleAllListItems() {
    const listSections = window.listSections;
    const currentListSectionId = window.currentListSectionId;
    const currentListId = window.currentListId;
    
    const section = listSections.find(s => s.id == currentListSectionId);
    if (!section) return;
    
    const list = section.lists.find(l => l.id == currentListId);
    if (!list || !list.items || list.items.length === 0) return;
    
    const allCompleted = list.items.every(item => item.completed);
    list.items.forEach(item => {
        item.completed = !allCompleted;
    });
    
    await window.saveListSections();
    window.openListItemsModal(currentListSectionId, currentListId);
}
async function exportListToHTML() {
    const listSections = window.listSections;
    const currentListSectionId = window.currentListSectionId;
    const currentListId = window.currentListId;
    
    const section = listSections.find(s => s.id == currentListSectionId);
    if (!section) return;
    
    const list = section.lists.find(l => l.id == currentListId);
    if (!list) return;
    
    const uncompletedItems = (list.items || []).filter(item => !item.completed);
    const htmlContent = window.generateListHTML ? window.generateListHTML(section.name, list.name, uncompletedItems) : 'Export function not available';
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${section.name}-${list.name}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
async function convertEntireListToTasks() {
    const listSections = window.listSections;
    const currentListSectionId = window.currentListSectionId;
    const currentListId = window.currentListId;
    
    const section = listSections.find(s => s.id == currentListSectionId);
    if (!section) return;
    
    const list = section.lists.find(l => l.id == currentListId);
    if (!list || !list.items || list.items.length === 0) return;
    
    if (!confirm(`Convert all ${list.items.length} items from "${list.name}" to tasks for today?`)) {
        return;
    }
    
    const today = window.formatDate ? window.formatDate(new Date()) : new Date().toISOString().split('T')[0];
    
    if (typeof window.addTask === 'function') {
        for (let item of list.items) {
            if (!item.completed) {
                await window.addTask(item.text, today, null, null, false);
            }
        }
    }
    
    window.closeListItemsModal();
    if (typeof window.switchToTodayView === 'function') {
        window.switchToTodayView();
    }
}
async function deleteCompletedListItems() {
    const listSections = window.listSections;
    const currentListSectionId = window.currentListSectionId;
    const currentListId = window.currentListId;
    
    const section = listSections.find(s => s.id == currentListSectionId);
    if (!section) return;
    
    const list = section.lists.find(l => l.id == currentListId);
    if (!list || !list.items || list.items.length === 0) return;
    
    const completedCount = list.items.filter(item => item.completed).length;
    if (completedCount === 0) {
        alert('No completed items to delete');
        return;
    }
    
    if (!confirm(`Delete ${completedCount} completed items?`)) {
        return;
    }
    
    list.items = list.items.filter(item => !item.completed);
    
    await window.saveListSections();
    window.openListItemsModal(currentListSectionId, currentListId);
}
function closeListItemsModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('listItemsModal').style.display = 'none';
}
async function convertSelectedItemsToTasks() {
    const listSections = window.listSections;
    const currentListSectionId = window.currentListSectionId;
    const currentListId = window.currentListId;
    
    const section = listSections.find(s => s.id == currentListSectionId);
    if (!section) return;
    
    const list = section.lists.find(l => l.id == currentListId);
    if (!list || !list.items || list.items.length === 0) return;
    
    const selectedItems = list.items.filter(item => item.completed);
    if (selectedItems.length === 0) {
        alert('No completed items to convert');
        return;
    }
    
    if (!confirm(`Convert ${selectedItems.length} completed items to tasks for today?`)) {
        return;
    }
    
    const today = window.formatDate ? window.formatDate(new Date()) : new Date().toISOString().split('T')[0];
    
    if (typeof window.addTask === 'function') {
        for (let item of selectedItems) {
            await window.addTask(item.text, today, null, null, false);
        }
    }
    
    window.closeListItemsModal();
    if (typeof window.switchToTodayView === 'function') {
        window.switchToTodayView();
    }
}
// Handle Enter key press in add item input
function handleAddItemKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addListItem();
    }
}

// Save list sections - restored from v2.0.7 working version with debug logging
async function saveListSections() {
    console.log('🚀 saveListSections called - v2.0.7 style');
    console.log('📋 Saving', window.listSections?.length || 0, 'list sections');
    try {
        localStorage.setItem('gtd_list_sections', JSON.stringify(window.listSections));
        console.log('💾 Saved to localStorage');
        
        // Set flag to prevent downloads from overwriting changes
        window.justModifiedLists = true;
        console.log('🔒 Set justModifiedLists flag');
        
        // Upload to server
        if (typeof uploadAllLists === 'function') {
            console.log('📤 Calling uploadAllLists...');
            await uploadAllLists();
            console.log('✅ uploadAllLists completed');
        } else {
            console.error('❌ uploadAllLists function not found!');
        }
        
        // Clear flag after successful upload
        setTimeout(() => {
            window.justModifiedLists = false;
            console.log('🔓 Cleared justModifiedLists flag');
        }, 5000); // 5 seconds for reliable cross-browser sync
        
    } catch (error) {
        console.error('❌ Error saving list sections:', error);
    }
}

window.handleAddItemKeyPress = handleAddItemKeyPress;
window.saveListSections = saveListSections;
window.toggleAllListItems = toggleAllListItems;
window.exportListToHTML = exportListToHTML;
window.convertEntireListToTasks = convertEntireListToTasks;
window.deleteCompletedListItems = deleteCompletedListItems;
window.closeListItemsModal = closeListItemsModal;
window.convertSelectedItemsToTasks = convertSelectedItemsToTasks;

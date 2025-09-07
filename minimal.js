// Working HyperFiler Pro - rebuilt from scratch
console.log('🚀 Loading HyperFiler Pro...');

// Global variables
window.tasks = [];
window.currentView = 'today';
window.currentUser = null;

// Load tasks from localStorage
function loadTasksFromLocalStorage() {
    try {
        const stored = localStorage.getItem('gtd_tasks');
        if (stored) {
            window.tasks = JSON.parse(stored);
            console.log('📥 Loaded', window.tasks.length, 'tasks from localStorage');
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        window.tasks = [];
    }
}

// Render today's tasks with time slots
function renderTodayView() {
    let container = document.getElementById('todaySchedule');
    if (!container) {
        console.error('❌ todaySchedule container not found, trying alternatives...');
        
        // Try other possible containers
        container = document.getElementById('mainContent') || 
                   document.getElementById('content') ||
                   document.querySelector('main') ||
                   document.querySelector('.container');
        
        if (!container) {
            console.error('❌ No suitable container found, creating one in body');
            container = document.createElement('div');
            container.id = 'todaySchedule';
            container.style.cssText = 'padding: 20px; margin: 20px auto; max-width: 800px;';
            document.body.appendChild(container);
        }
    }

    const today = new Date().toISOString().split('T')[0];
    const todayTasks = window.tasks.filter(task => 
        task.dueDate === today && !task.isCompleted
    );

    let html = `
        <div style="padding: 0; background: #f2f2f7; min-height: 100vh;">
            <div style="background: #ffffff; padding: 16px; border-bottom: 1px solid #e5e5ea;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #1c1c1e;">📅 Today - ${new Date().toLocaleDateString()}</h2>
            </div>
            <div id="tasksContainer" style="background: #ffffff;">
    `;

    if (todayTasks.length === 0) {
        html += `
            <div style="text-align: center; padding: 40px; color: #666;">
                <p>🎉 No tasks for today!</p>
                <button onclick="showAddTaskModal()" style="padding: 10px 20px; background: #007aff; color: white; border: none; border-radius: 8px; margin-top: 10px;">Add Task</button>
            </div>
        `;
    } else {
        // Create time slots like desktop version
        const timeSlots = {};
        const unscheduledTasks = [];

        // Group tasks by time
        todayTasks.forEach(task => {
            const taskTime = task.dueTime || task.time || '';
            if (taskTime) {
                if (!timeSlots[taskTime]) {
                    timeSlots[taskTime] = [];
                }
                timeSlots[taskTime].push(task);
            } else {
                unscheduledTasks.push(task);
            }
        });

        // Sort time slots
        const sortedTimes = Object.keys(timeSlots).sort();

        // Render time slots
        sortedTimes.forEach(time => {
            html += `
                <div style="margin-bottom: 0;">
                    <div style="background: #f2f2f7; padding: 12px 16px; font-size: 14px; font-weight: 500; color: #8e8e93; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${time}
                    </div>
            `;

            timeSlots[time].forEach(task => {
                const taskText = task.text || task.title || task.content || task.description || 'Untitled Task';
                
                html += `
                    <div class="time-slot-task" style="margin: 0; padding: 12px 16px; background: #ffffff; border-bottom: 1px solid #e5e5ea; display: flex; align-items: center; justify-content: space-between; min-height: 44px; width: 100%; box-sizing: border-box;">
                        <div style="flex: 1; margin-right: 12px; min-width: 0;">
                            <div style="font-weight: 400; font-size: 17px; line-height: 1.4; color: #1c1c1e; word-wrap: break-word;">${taskText}</div>
                        </div>
                        <div style="display: flex; gap: 6px; flex-shrink: 0;">
                            <button onclick="toggleTask('${task.id}')" style="padding: 4px 8px; background: #34c759; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; min-width: 24px; height: 28px;">✓</button>
                            <button onclick="editTask('${task.id}')" style="padding: 4px 10px; background: #007aff; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; min-width: 40px; height: 28px;">Edit</button>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        });

        // Render unscheduled tasks
        if (unscheduledTasks.length > 0) {
            html += `
                <div style="margin-bottom: 0;">
                    <div style="background: #f2f2f7; padding: 12px 16px; font-size: 14px; font-weight: 500; color: #8e8e93; text-transform: uppercase; letter-spacing: 0.5px;">
                        UNSCHEDULED
                    </div>
            `;

            unscheduledTasks.forEach(task => {
                const taskText = task.text || task.title || task.content || task.description || 'Untitled Task';
                
                html += `
                    <div class="time-slot-task" style="margin: 0; padding: 12px 16px; background: #ffffff; border-bottom: 1px solid #e5e5ea; display: flex; align-items: center; justify-content: space-between; min-height: 44px; width: 100%; box-sizing: border-box;">
                        <div style="flex: 1; margin-right: 12px; min-width: 0;">
                            <div style="font-weight: 400; font-size: 17px; line-height: 1.4; color: #1c1c1e; word-wrap: break-word;">${taskText}</div>
                        </div>
                        <div style="display: flex; gap: 6px; flex-shrink: 0;">
                            <button onclick="toggleTask('${task.id}')" style="padding: 4px 8px; background: #34c759; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; min-width: 24px; height: 28px;">✓</button>
                            <button onclick="editTask('${task.id}')" style="padding: 4px 10px; background: #007aff; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; min-width: 40px; height: 28px;">Edit</button>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }
    }

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
    console.log('✅ Today view rendered with time slots and', todayTasks.length, 'tasks');
}

// Toggle task completion
function toggleTask(taskId) {
    const task = window.tasks.find(t => t.id === taskId);
    if (task) {
        task.isCompleted = !task.isCompleted;
        saveTasksToLocalStorage();
        renderTodayView();
        console.log('✅ Task toggled:', taskId);
    }
}

// Save tasks to localStorage
function saveTasksToLocalStorage() {
    try {
        localStorage.setItem('gtd_tasks', JSON.stringify(window.tasks));
        console.log('💾 Tasks saved to localStorage');
    } catch (error) {
        console.error('Error saving tasks:', error);
    }
}

// Show add task modal (placeholder)
function showAddTaskModal() {
    alert('Add task functionality coming soon!');
}

// Edit task (placeholder)
function editTask(taskId) {
    alert('Edit task functionality coming soon!');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOM loaded, initializing...');
    
    // Wait a bit for the page to fully load
    setTimeout(() => {
        // Debug - show all available containers
        const allContainers = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
        console.log('📦 Available containers:', allContainers);
        
        // Load tasks and render
        loadTasksFromLocalStorage();
        renderTodayView();
        
        // Debug info
        console.log('📊 Debug info:');
        console.log('- Total tasks:', window.tasks.length);
        console.log('- Container found:', !!document.getElementById('todaySchedule'));
        console.log('- Current date:', new Date().toISOString().split('T')[0]);
    }, 500);
});

// Export functions globally
window.loadTasksFromLocalStorage = loadTasksFromLocalStorage;
window.renderTodayView = renderTodayView;
window.toggleTask = toggleTask;
window.saveTasksToLocalStorage = saveTasksToLocalStorage;
window.showAddTaskModal = showAddTaskModal;
window.editTask = editTask;

// Error handling
window.addEventListener('error', function(e) {
    console.error('❌ JavaScript Error:', e.message, 'at line', e.lineno);
    document.body.innerHTML += `
        <div style="position: fixed; top: 0; left: 0; right: 0; background: red; color: white; padding: 10px; z-index: 9999;">
            ERROR: ${e.message} at line ${e.lineno}
        </div>
    `;
});

console.log('✅ HyperFiler Pro JavaScript loaded successfully');

// Remove all debugging overlays completely
document.addEventListener('DOMContentLoaded', function() {
    // Remove immediately and repeatedly to ensure cleanup
    const cleanupDebugOverlays = () => {
        document.querySelectorAll('div').forEach(div => {
            if (div.innerHTML && (
                div.innerHTML.includes('MOBILE TASK DEBUG') ||
                div.innerHTML.includes('CONTAINER STATUS') ||
                div.innerHTML.includes('PAGE STATUS') ||
                div.innerHTML.includes('JAVASCRIPT ERROR') ||
                div.innerHTML.includes('Found:') ||
                div.innerHTML.includes('Main content:') ||
                div.innerHTML.includes('Tasks loaded:') ||
                (div.style.position === 'fixed' && div.style.zIndex > 9000)
            )) {
                div.remove();
                console.log('🧹 Removed debug overlay');
            }
        });
    };
    
    // Clean up multiple times to catch all overlays
    setTimeout(cleanupDebugOverlays, 50);
    setTimeout(cleanupDebugOverlays, 200);
    setTimeout(cleanupDebugOverlays, 500);
    setTimeout(cleanupDebugOverlays, 1000);
    setTimeout(cleanupDebugOverlays, 2000);
});
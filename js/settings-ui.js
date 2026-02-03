/**
 * Settings and UI Functions for HyperFiler Pro
 */

// Missing core functions
function saveTasks() {
    if (window.tasks) {
        localStorage.setItem('gtd_tasks', JSON.stringify(window.tasks));
        console.log('💾 Tasks saved to localStorage');
    }
}
function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
}
function clearTaskModalTimeout() {
    if (window.taskModalTimeout) {
        clearTimeout(window.taskModalTimeout);
        window.taskModalTimeout = null;
    }
}
function setTaskModalTimeout() {
    clearTaskModalTimeout();
    window.taskModalTimeout = setTimeout(() => {
        // Auto-save or cleanup logic
    }, 5000);
}

// Mobile interface functions
function openAddTaskModalMobile(dateStr) {
    console.log('📱 Mobile Add Task clicked - opening Things-style interface');
    
    // Check if we're on mobile
    if (window.innerWidth > 768) {
        if (typeof openAddTaskModal === 'function') {
            openAddTaskModal(dateStr);
        }
        return;
    }
    
    // For mobile, use the same modal but with mobile-optimized behavior
    if (typeof openAddTaskModal === 'function') {
        openAddTaskModal(dateStr);
        
        // Focus and scroll to modal for mobile
        setTimeout(() => {
            const modal = document.getElementById('taskModal');
            if (modal) {
                modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
}
function provideFeedback(element, type = 'success') {
    if (!element) return;
    
    // Scale feedback
    element.style.transform = 'scale(0.95)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 150);
    
    // Add a subtle highlight
    const originalBackground = element.style.background;
    element.style.background = type === 'success' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)';
    setTimeout(() => {
        element.style.background = originalBackground;
    }, 300);
}

function openBulkTimeModal() {
    if (selectedTasks.size === 0) {
        alert('Please select tasks first');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'bulkTimeModal';
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h3>⏰ Set Time for Selected Tasks</h3>
            <div style="margin: 20px 0;">
                <label>Time:</label>
                <input type="time" id="bulkTimeInput" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="closeBulkTimeModal()" class="btn btn-secondary">Cancel</button>
                <button onclick="applyBulkTime()" class="btn btn-primary">Apply</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}
function closeBulkTimeModal() {
    const modal = document.getElementById('bulkTimeModal');
    if (modal) {
        modal.remove();
    }
}
function applyBulkTime() {
    const timeInput = document.getElementById('bulkTimeInput');
    if (!timeInput || !timeInput.value) {
        alert('Please select a time');
        return;
    }
    
    const newTime = timeInput.value;
    const tasksToUpdate = Array.from(selectedTasks);
    
    tasksToUpdate.forEach(taskId => {
        const task = tasks.find(t => t.id == taskId);
        if (task) {
            task.dueTime = newTime;
            task.updatedAt = new Date().toISOString();
        }
    });
    
    // Save and refresh
    if (typeof saveTasksToLocalStorage === 'function') {
        saveTasksToLocalStorage();
    }
    if (typeof renderCurrentView === 'function') {
        renderCurrentView();
    }
    
    closeBulkTimeModal();
    selectedTasks.clear();
}
// Image and template functions
function triggerImageUpload() {
    const input = document.getElementById('imageUpload');
    if (input) {
        input.click();
    }
}
function handleImageUpload(event) {
    console.log('Image upload functionality currently disabled');
    // Placeholder for image upload functionality
}

function resetTaskTitle() {
    const titleInput = document.getElementById('editTaskTitle');
    if (titleInput) {
        titleInput.value = '';
        titleInput.focus();
    }
}
function toggleSidebarLanguage() {
    console.log('🌐 toggleSidebarLanguage called');
    var lang = (localStorage.getItem('preferredLanguage') || 'en') === 'en' ? 'es' : 'en';
    console.log('🌐 Switching to:', lang);

    // Update all possible currentLanguage references
    window.currentLanguage = lang;
    if (typeof currentLanguage !== 'undefined') currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);

    // --- data-translate dictionary ---
    var dict = {
        "Today": "Hoy", "Add": "Crear", "Week": "Semana", "Lists": "Listas",
        "More": "Mas", "Month": "Mes", "General": "General", "Data": "Datos",
        "Trash": "Papelera", "Backup": "Respaldo", "Shortcuts": "Atajos",
        "Cancel": "Cancelar", "Import": "Importar", "Enable": "Activar",
        "Quick Backup": "Respaldo Rapido", "Quick Backup JSON": "Respaldo Rapido JSON",
        "Import JSON Backup": "Importar Respaldo JSON", "Import Data": "Importar Datos",
        "Export Data": "Exportar Datos", "Delete All Tasks": "Eliminar Todas las Tareas",
        "+ Add Task": "+ Nueva Tarea", "+ Add": "+ Nueva",
        "Quick filters": "Filtros rapidos:", "TODAY": "HOY", "MONTH": "MES", "WEEK": "SEMANA",
        "Recent Changes (Last 10)": "Cambios Recientes (Ultimos 10)",
        "Press Ctrl+Z to undo or click any item to undo up to that point": "Pulsa Ctrl+Z para deshacer o haz clic en cualquier elemento",
        "No Actions to Undo": "Sin Acciones para Deshacer",
        "Make some changes to see undo history here": "Haz cambios para ver el historial aqui",
        "Create Manual Backup": "Crear Respaldo Manual", "Import Tasks": "Importar Tareas",
        "Paste your tasks below (one per line):": "Pega tus tareas abajo (una por linea):",
        "Mobile UI Version": "Version Movil",
        "Text Files": "Archivos de Texto",
        "Enable Automatic Backups": "Habilitar Respaldos Automaticos",
        "Automatically create backups based on your schedule": "Crear respaldos automaticamente segun tu horario",
        "Choose Backup Types:": "Elegir Tipos de Respaldo:",
        "Daily Backups": "Respaldos Diarios", "Weekly Backups": "Respaldos Semanales",
        "Monthly Backups": "Respaldos Mensuales",
        "Select which automatic backups you want to enable": "Selecciona que respaldos automaticos quieres habilitar",
        "View Backup Stats": "Ver Estadisticas de Respaldo",
        "Delete all tasks permanently - this cannot be undone": "Eliminar todas las tareas permanentemente",
        "Quick Import": "Importacion Rapida",
        "Choose the type of file you want to import:": "Elige el tipo de archivo a importar:",
        "Import Backup": "Importar Respaldo", "Import TXT File": "Importar Archivo TXT",
        "Supported formats: .json, .txt": "Formatos: .json, .txt"
    };
    document.querySelectorAll('[data-translate]').forEach(function(el) {
        var key = el.getAttribute('data-translate');
        // Extract leading emoji from current content
        var currentText = el.textContent.trim();
        var emojiMatch = currentText.match(/^([\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]+\s*)/u);
        var emoji = emojiMatch ? emojiMatch[1] : '';
        if (lang === 'es' && dict[key]) {
            el.textContent = emoji + dict[key];
        } else if (lang === 'en') {
            el.textContent = emoji + key;
        }
    });

    // --- Button translations (with emoji prefix) ---
    var btnMap = {
        '← Prev': '← Ant.', 'Next →': 'Sig. →', '📥 Bulk': '📥 Lote',
        '🕐 Now': '🕐 Ahora', '🔥 Today': '🔥 Hoy',
        '💾 Quick Backup': '💾 Respaldo Rapido',
        '📥 Import JSON': '📥 Importar JSON',
        '✖ Clear': '✖ Borrar',
        '📊 Review': '📊 Revisar',
        '📂 Expand All': '📂 Expandir Todo',
        '📁 Collapse All': '📁 Colapsar Todo',
        '📄 Export Results': '📄 Exportar Resultados',
        '+ New Section': '+ Nueva Seccion',
        '📁 Toggle All': '📁 Alternar Todo',
        '📋 Import TXT': '📋 Importar TXT',
        '📤 Export Data': '📤 Exportar Datos',
        '📥 Import Data': '📥 Importar Datos',
        'Clear All': 'Borrar Todo',
        '↶ Undo Last': '↶ Deshacer',
        'Delete All Data': 'Borrar Todos los Datos',
        '📤 Export JSON': '📤 Exportar JSON',
        '📥 Import JSON': '📥 Importar JSON',
        '💾 Create Backup': '💾 Crear Respaldo',
        '🔄 Refresh': '🔄 Actualizar',
        '🔄 Refresh Status': '🔄 Actualizar Estado',
        '🗑️ Empty Trash': '🗑️ Vaciar Papelera',
        '+ Add Item': '+ Nuevo Elemento',
        '🗑️ Delete': '🗑️ Eliminar',
        'Close': 'Cerrar',
        'Save Task': 'Guardar Tarea',
        'Delete': 'Eliminar',
        'Reset': 'Reiniciar',
        'Add': 'Crear',
        'Apply': 'Aplicar',
        'Save': 'Guardar',
        'Save Changes': 'Guardar Cambios',
        'Tomorrow': 'Manana',
        '+1W': '+1S',
        'Complete': 'Completar',
        'Next Week': 'Proxima Semana'
    };
    var btnMapReverse = {};
    Object.keys(btnMap).forEach(function(k) { btnMapReverse[btnMap[k]] = k; });
    document.querySelectorAll('button:not(.nav-btn)').forEach(function(btn) {
        var t = btn.textContent.trim();
        if (lang === 'es' && btnMap[t]) {
            btn.textContent = btnMap[t];
        } else if (lang === 'en' && btnMapReverse[t]) {
            btn.textContent = btnMapReverse[t];
        }
    });

    // --- Headings (h3, h4, h5) ---
    var headingMap = {
        '🔍 Search Tasks': '🔍 Buscar Tareas',
        '📋 All Tasks': '📋 Todas las Tareas',
        '🔄 Repeat Management': '🔄 Gestion de Repeticiones',
        '📝 Lists Management': '📝 Gestion de Listas',
        '⚙️ Settings & Statistics': '⚙️ Ajustes y Estadisticas',
        '↶ Undo Management': '↶ Gestion de Deshacer',
        '✏️ Edit Task': '✏️ Editar Tarea',
        '📅 Select Date & Time': '📅 Seleccionar Fecha y Hora',
        '⌨️ Keyboard Shortcuts': '⌨️ Atajos de Teclado',
        '🗑️ Trash': '🗑️ Papelera',
        '📋 List Items': '📋 Elementos de Lista',
        '🚀 Quick Actions': '🚀 Acciones Rapidas',
        '⚠️ Danger Zone': '⚠️ Zona Peligrosa',
        '💾 Backup Status': '💾 Estado de Respaldos',
        '📅 Last Backup Dates': '📅 Ultimas Fechas de Respaldo',
        '📤 Import / Export JSON Backup': '📤 Importar / Exportar Respaldo JSON',
        '📁 Recent Backup Files (Latest 3 of each type)': '📁 Archivos Recientes (Ultimos 3 de cada tipo)',
        '🔧 Backup Management': '🔧 Gestion de Respaldos',
        '📈 Productivity Insights': '📈 Productividad',
        '📊 Task Completion Analysis': '📊 Analisis de Tareas',
        '⚙️ Application Settings': '⚙️ Ajustes de Aplicacion',
        '🖨️ Auto-Print Settings': '🖨️ Impresion Automatica',
        '☁️ Sync Settings': '☁️ Ajustes de Sincronizacion',
        '👤 Account Information': '👤 Informacion de Cuenta',
        '🔧 Advanced Settings': '🔧 Ajustes Avanzados',
        '💾 Backup Settings': '💾 Ajustes de Respaldo',
        '📋 Advanced Import/Export': '📋 Importar/Exportar Avanzado',
        '📤 Export Formats:': '📤 Formatos de Exportacion:'
    };
    var headingMapReverse = {};
    Object.keys(headingMap).forEach(function(k) { headingMapReverse[headingMap[k]] = k; });
    document.querySelectorAll('h3, h4, h5').forEach(function(el) {
        var t = el.textContent.trim();
        if (lang === 'es' && headingMap[t]) {
            el.textContent = headingMap[t];
        } else if (lang === 'en' && headingMapReverse[t]) {
            el.textContent = headingMapReverse[t];
        }
    });

    // --- Settings tabs ---
    var tabMap = {
        '📊 Overview': '📊 Resumen',
        '💾 Backups': '💾 Respaldos',
        '📈 Analytics': '📈 Analiticas',
        '⚙️ Settings': '⚙️ Ajustes',
        '🎛️ General': '🎛️ General',
        '💾 Data': '💾 Datos',
        '🗑️ Trash': '🗑️ Papelera',
        '🛡️ Backup': '🛡️ Respaldo',
        '⌨️ Shortcuts': '⌨️ Atajos'
    };
    var tabMapReverse = {};
    Object.keys(tabMap).forEach(function(k) { tabMapReverse[tabMap[k]] = k; });

    // --- Statistics labels ---
    var statMap = {
        'Total Tasks': 'Total Tareas', 'Completed': 'Completadas', 'Pending': 'Pendientes',
        'Overdue': 'Atrasadas', 'Due Today': 'Para Hoy', 'Critical Tasks': 'Tareas Criticas',
        'Daily Backups': 'Respaldos Diarios', 'Weekly Backups': 'Respaldos Semanales',
        'Monthly Backups': 'Respaldos Mensuales', 'Manual Exports': 'Exportaciones Manuales'
    };
    var statMapReverse = {};
    Object.keys(statMap).forEach(function(k) { statMapReverse[statMap[k]] = k; });

    // --- Labels ---
    var labelMap = {
        'Date Format:': 'Formato de Fecha:',
        'Time Format:': 'Formato de Hora:',
        'Week Starts On:': 'Semana Empieza:',
        'Sync Period:': 'Periodo de Sincronizacion:',
        'Email:': 'Correo:',
        'Language / Idioma': 'Idioma / Language',
        'Select date & time...': 'Seleccionar fecha y hora...',
        'Deleted tasks are stored here': 'Las tareas eliminadas se guardan aqui',
        'No Items Yet': 'Sin Elementos',
        'Add your first item to get started.': 'Agrega tu primer elemento.',
        'No Tasks Yet!': 'Sin Tareas!',
        'Add Your First Task': 'Crea Tu Primera Tarea',
        'No Sections Yet!': 'Sin Secciones!',
        'Create First Section': 'Crear Primera Seccion',
        'Download all tasks as JSON file': 'Descargar todas las tareas como JSON',
        'Upload JSON backup file': 'Subir archivo de respaldo JSON',
        'HyperFiler Pro': 'HyperFiler Pro'
    };
    var labelMapReverse = {};
    Object.keys(labelMap).forEach(function(k) { labelMapReverse[labelMap[k]] = k; });

    // --- Keyboard shortcuts section ---
    var kbMap = {
        '📱 Navigation': '📱 Navegacion', '⚡ Actions': '⚡ Acciones',
        'Today View': 'Vista Hoy', 'Week View': 'Vista Semana', 'Month View': 'Vista Mes',
        'All Tasks + Search': 'Todas las Tareas + Buscar',
        'Repeat View': 'Vista Repeticiones', 'Undo View': 'Vista Deshacer',
        'Lists View': 'Vista Listas', 'Statistics View': 'Vista Estadisticas',
        'New Task': 'Nueva Tarea', 'Search in Current View': 'Buscar en Vista Actual',
        'Filter Navigation': 'Navegacion Filtros',
        'Time Dropdown (Selected Task)': 'Hora (Tarea Seleccionada)',
        'Open Trash': 'Abrir Papelera', 'Undo (up to 10 steps)': 'Deshacer (hasta 10 pasos)',
        'Export All Data (text file)': 'Exportar Todos los Datos (texto)'
    };
    var kbMapReverse = {};
    Object.keys(kbMap).forEach(function(k) { kbMapReverse[kbMap[k]] = k; });

    // --- Review format options ---
    var reviewMap = {
        '📄 HTML Report': '📄 Informe HTML', '📝 Plain Text': '📝 Texto Plano',
        '📄 PDF Document': '📄 Documento PDF', '📋 Org-mode': '📋 Org-mode'
    };
    var reviewMapReverse = {};
    Object.keys(reviewMap).forEach(function(k) { reviewMapReverse[reviewMap[k]] = k; });

    // --- Mobile task options ---
    var mobileMap = {
        'Complete': 'Completar', 'Tomorrow': 'Manana', 'Next Week': 'Proxima Semana', 'Delete': 'Eliminar'
    };
    var mobileMapReverse = {};
    Object.keys(mobileMap).forEach(function(k) { mobileMapReverse[mobileMap[k]] = k; });

    // --- Day headers ---
    var dayMap = { 'Su': 'Do', 'Mo': 'Lu', 'Tu': 'Ma', 'We': 'Mi', 'Th': 'Ju', 'Fr': 'Vi', 'Sa': 'Sa' };
    var dayMapReverse = {};
    Object.keys(dayMap).forEach(function(k) { dayMapReverse[dayMap[k]] = k; });

    // Merge all maps for span/label/small/p/div text translation
    var allMaps = [tabMap, statMap, labelMap, kbMap, reviewMap, mobileMap];
    var allReverse = [tabMapReverse, statMapReverse, labelMapReverse, kbMapReverse, reviewMapReverse, mobileMapReverse];

    // Translate all generic text elements
    try {
        document.querySelectorAll('span, small, p, label').forEach(function(el) {
            if (el.children.length > 0 && el.tagName !== 'LABEL') return;
            var t = el.textContent.trim();
            if (!t || t.length > 200) return;
            for (var i = 0; i < allMaps.length; i++) {
                if (lang === 'es' && allMaps[i][t]) {
                    el.textContent = allMaps[i][t];
                    return;
                } else if (lang === 'en' && allReverse[i][t]) {
                    el.textContent = allReverse[i][t];
                    return;
                }
            }
        });
    } catch(e) { console.error('Translation error:', e); }

    // --- Settings tabs (buttons with class settings-tab) ---
    document.querySelectorAll('.settings-tab').forEach(function(btn) {
        var t = btn.textContent.trim();
        if (lang === 'es' && tabMap[t]) btn.textContent = tabMap[t];
        else if (lang === 'en' && tabMapReverse[t]) btn.textContent = tabMapReverse[t];
    });

    // --- Stat labels (div.stat-label) ---
    document.querySelectorAll('.stat-label').forEach(function(el) {
        var t = el.textContent.trim();
        if (lang === 'es' && statMap[t]) el.textContent = statMap[t];
        else if (lang === 'en' && statMapReverse[t]) el.textContent = statMapReverse[t];
    });

    // --- Paragraphs with specific text ---
    var paraMap = {
        'This action cannot be undone. All your tasks, settings, and data will be permanently deleted.':
            'Esta accion no se puede deshacer. Todas tus tareas, ajustes y datos se eliminaran permanentemente.',
        'Deleted tasks are stored here': 'Las tareas eliminadas se guardan aqui',
        'Add your first item to get started.': 'Agrega tu primer elemento para empezar.'
    };
    var paraMapReverse = {};
    Object.keys(paraMap).forEach(function(k) { paraMapReverse[paraMap[k]] = k; });
    document.querySelectorAll('p').forEach(function(el) {
        var t = el.textContent.trim();
        if (lang === 'es' && paraMap[t]) el.textContent = paraMap[t];
        else if (lang === 'en' && paraMapReverse[t]) el.textContent = paraMapReverse[t];
    });

    // Translate day headers in calendar
    document.querySelectorAll('.day-header, .calendar-day-header').forEach(function(el) {
        var t = el.textContent.trim();
        if (lang === 'es' && dayMap[t]) el.textContent = dayMap[t];
        else if (lang === 'en' && dayMapReverse[t]) el.textContent = dayMapReverse[t];
    });

    // --- Comprehensive text replacement for ALL remaining elements ---
    var allText = {
        // Settings Preferences tab
        'Enable auto-print for today\'s tasks': 'Activar impresion automatica de tareas de hoy',
        'When enabled, today\'s tasks will be automatically printed': 'Cuando esta activado, las tareas de hoy se imprimiran automaticamente',
        'Sync Status:': 'Estado de Sincronizacion:',
        'Sync Period:': 'Periodo de Sincronizacion:',
        'Last 30 days': 'Ultimos 30 dias',
        'Last 60 days': 'Ultimos 60 dias',
        'Last 90 days': 'Ultimos 90 dias',
        'Last 6 months': 'Ultimos 6 meses',
        'Last year': 'Ultimo ano',
        'All data': 'Todos los datos',
        'Email:': 'Correo:',
        'Plan:': 'Plan:',
        'Switch Version': 'Cambiar Version',
        'Save Settings': 'Guardar Ajustes',
        'Bulk Import': 'Importar en Lote',
        'Toggle between different mobile interface versions for optimal experience on your device.':
            'Alternar entre versiones de interfaz movil para mejor experiencia en tu dispositivo.',
        'Configure automatic backup preferences and backup frequency settings.':
            'Configurar preferencias de respaldo automatico y frecuencia.',
        'Advanced import options for bulk data migration and specialized export formats.':
            'Opciones avanzadas de importacion masiva y formatos de exportacion.',
        '🚪 Logout': '🚪 Cerrar Sesion',
        'Loading...': 'Cargando...',
        '✅ Connected': '✅ Conectado',
        // Sync info bullets
        '• New devices sync only recent data': '• Los dispositivos nuevos sincronizan solo datos recientes',
        '• Old tasks (90+ days) won\'t upload to cloud': '• Las tareas antiguas (+90 dias) no suben a la nube',
        '• Existing synced devices work normally': '• Los dispositivos sincronizados funcionan normalmente',
        // Backups tab
        'Download all tasks as JSON file': 'Descargar todas las tareas como archivo JSON',
        'Upload JSON backup file': 'Subir archivo de respaldo JSON',
        // Undo
        '🔄 Refresh': '🔄 Actualizar',
        '🔍 Search Tasks': '🔍 Buscar Tareas',
        'Recent Actions': 'Acciones Recientes',
        'recent actions': 'acciones recientes',
        'Deleted Task': 'Tarea Eliminada',
        'Restore All Deleted': 'Restaurar Eliminadas',
        'Delete All': 'Eliminar Todo',
        'Dark': 'Oscuro',
        'Light': 'Claro',
        'Due:': 'Vence:',
        'at': 'a las',
        'Restore': 'Restaurar',
        'Settings': 'Ajustes',
        'GTD Reviews': 'Revisiones GTD',
        'Generate task reviews following Getting Things Done methodology':
            'Generar revisiones de tareas siguiendo la metodologia Getting Things Done',
        'Daily Review': 'Revision Diaria',
        'Weekly Review': 'Revision Semanal',
        'Projects': 'Proyectos',
        'Choose export formats in the popup': 'Elige formatos de exportacion en el popup',
        'Display Options': 'Opciones de Visualizacion',
        'Monday': 'Lunes', 'Tuesday': 'Martes', 'Wednesday': 'Miercoles',
        'Thursday': 'Jueves', 'Friday': 'Viernes', 'Saturday': 'Sabado', 'Sunday': 'Domingo',
        'English': 'English', 'Español': 'Español',
        'Import/Export': 'Importar/Exportar',
        'Export Tasks': 'Exportar Tareas',
        'Import Tasks': 'Importar Tareas',
        'Export Today HTML': 'Exportar Hoy HTML',
        'Export Week HTML': 'Exportar Semana HTML',
        'Export Month HTML': 'Exportar Mes HTML',
        'Keyboard & Advanced': 'Teclado y Avanzado',
        'Hide mouse buttons, show only keyboard shortcuts': 'Ocultar botones del raton, mostrar solo atajos de teclado',
        'Switch Mobile UI': 'Cambiar a UI Movil',
        'Save Backup Settings': 'Guardar Ajustes de Respaldo',
        'Recent Actions': 'Acciones Recientes',
        'Deleted Task': 'Tarea Eliminada',
        'Refresh': 'Actualizar',
        'recent actions': 'acciones recientes'
    };
    var allTextReverse = {};
    Object.keys(allText).forEach(function(k) { allTextReverse[allText[k]] = k; });

    // Scan all text nodes in the document
    function translateElements(selector) {
        document.querySelectorAll(selector).forEach(function(el) {
            // Only process leaf elements or elements with simple text
            var t = el.textContent.trim();
            if (!t || t.length > 300) return;

            // Check direct text content match
            if (lang === 'es' && allText[t]) {
                el.textContent = allText[t];
            } else if (lang === 'en' && allTextReverse[t]) {
                el.textContent = allTextReverse[t];
            } else {
                // Try stripping leading emoji prefix
                var emojiMatch = t.match(/^([\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]+\s*)/u);
                if (emojiMatch) {
                    var stripped = t.slice(emojiMatch[1].length).trim();
                    if (lang === 'es' && allText[stripped]) {
                        el.textContent = emojiMatch[1] + allText[stripped];
                    } else if (lang === 'en' && allTextReverse[stripped]) {
                        el.textContent = emojiMatch[1] + allTextReverse[stripped];
                    }
                }
            }
        });
    }
    translateElements('h2, h3, h4, h5, p, strong, span, div.stat-label, button, option, label');

    // For div elements with description text, translate if matches
    document.querySelectorAll('div').forEach(function(el) {
        if (el.children.length > 0) return;
        var t = el.textContent.trim();
        if (lang === 'es' && allText[t]) el.textContent = allText[t];
        else if (lang === 'en' && allTextReverse[t]) el.textContent = allTextReverse[t];
    });

    // --- Dynamic text with numbers (regex-based) ---
    document.querySelectorAll('h2, h3, h4, span, div, button').forEach(function(el) {
        if (el.children.length > 1) return;
        var t = el.textContent.trim();
        var m;
        if (lang === 'es') {
            // "Recent Actions" heading
            if (t === 'Recent Actions') el.textContent = 'Acciones Recientes';
            // "439 recent actions"
            m = t.match(/^(\d+)\s+recent actions$/);
            if (m) el.textContent = m[1] + ' acciones recientes';
            // "Restore All Deleted (439)"
            m = t.match(/^Restore All Deleted\s*\((\d+)\)$/);
            if (m) el.textContent = 'Restaurar Eliminadas (' + m[1] + ')';
            // "Delete All (439)"
            m = t.match(/^Delete All\s*\((\d+)\)$/);
            if (m) el.textContent = 'Eliminar Todo (' + m[1] + ')';
            // "Deleted Task"
            if (t === 'Deleted Task') el.textContent = 'Tarea Eliminada';
            // "Dark" / "Light" theme toggle
            if (t === '🌙 Dark') el.textContent = '🌙 Oscuro';
            if (t === '☀️ Light') el.textContent = '☀️ Claro';
            // "Undo Management" heading
            if (t === '↶ Undo Management') el.textContent = '↶ Gestion de Deshacer';
            // "Recent Changes" with emoji
            if (t === '⏮️ Recent Actions' || t === '⏮ Recent Actions') el.textContent = '⏮️ Acciones Recientes';
        } else {
            if (t === 'Acciones Recientes') el.textContent = 'Recent Actions';
            m = t.match(/^(\d+)\s+acciones recientes$/);
            if (m) el.textContent = m[1] + ' recent actions';
            m = t.match(/^Restaurar Eliminadas\s*\((\d+)\)$/);
            if (m) el.textContent = 'Restore All Deleted (' + m[1] + ')';
            m = t.match(/^Eliminar Todo\s*\((\d+)\)$/);
            if (m) el.textContent = 'Delete All (' + m[1] + ')';
            if (t === 'Tarea Eliminada') el.textContent = 'Deleted Task';
            if (t === '🌙 Oscuro') el.textContent = '🌙 Dark';
            if (t === '☀️ Claro') el.textContent = '☀️ Light';
            if (t === '↶ Gestion de Deshacer') el.textContent = '↶ Undo Management';
            if (t === '⏮️ Acciones Recientes' || t === '⏮ Acciones Recientes') el.textContent = '⏮️ Recent Actions';
        }
    });

    // --- Search placeholders ---
    document.querySelectorAll('input[placeholder]').forEach(function(input) {
        var p = input.placeholder;
        if (lang === 'es') {
            if (p === '🔍 Day') input.placeholder = '🔍 Dia';
            else if (p === '🔍 Week') input.placeholder = '🔍 Semana';
            else if (p === '🔍 Month') input.placeholder = '🔍 Mes';
            else if (p.includes('Search by title')) input.placeholder = '🔍 Buscar por titulo, notas o fecha...';
            else if (p.includes('Search tasks')) input.placeholder = '🔍 Buscar tareas...';
            else if (p === 'Select date & time...') input.placeholder = 'Seleccionar fecha y hora...';
            else if (p.includes('Search actions')) input.placeholder = '🔍 Buscar acciones...';
        } else {
            if (p === '🔍 Dia') input.placeholder = '🔍 Day';
            else if (p === '🔍 Semana') input.placeholder = '🔍 Week';
            else if (p === '🔍 Mes') input.placeholder = '🔍 Month';
            else if (p.includes('Buscar por titulo')) input.placeholder = '🔍 Search by title, notes, or date...';
            else if (p.includes('Buscar tareas')) input.placeholder = '🔍 Search tasks...';
            else if (p === 'Seleccionar fecha y hora...') input.placeholder = 'Select date & time...';
            else if (p.includes('Buscar acciones')) input.placeholder = '🔍 Search actions...';
        }
    });

    // Translate nav buttons (emoji + text + shortcut key)
    var navMap = {
        'nav-today':          { icon: '📋', en: 'Today',    es: 'Hoy',      key: 'D' },
        'nav-week':           { icon: '📊', en: 'Week',     es: 'Semana',   key: 'W' },
        'nav-calendar':       { icon: '📆', en: 'Month',    es: 'Mes',      key: 'M' },
        'nav-all':            { icon: '🔍', en: 'Search',   es: 'Buscar',   key: 'S' },
        'nav-lists':          { icon: '📂', en: 'Lists',    es: 'Listas',   key: 'L' },
        'nav-repeat':         { icon: '🔄', en: 'Repeat',   es: 'Repetir',  key: 'R' },
        'nav-recent-actions': { icon: '⏮️', en: 'Undo',     es: 'Deshacer', key: 'U' },
        'nav-settings':       { icon: '⚙️', en: 'Settings', es: 'Ajustes',  key: 'X' }
    };
    Object.keys(navMap).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
            var n = navMap[id];
            var text = lang === 'es' ? n.es : n.en;
            el.innerHTML = n.icon + ' ' + text + ' <span style="opacity: 0.7; font-size: 11px; color: #666;">' + n.key + '</span>';
        }
    });

    var btn = document.getElementById('sidebarLangToggle');
    if (btn) {
        btn.textContent = lang === 'en' ? '🇪🇸 ES' : '🇬🇧 EN';
    }
    console.log('🌐 Language switched to:', lang);
}
window.toggleSidebarLanguage = toggleSidebarLanguage;
function saveAutoPrintTime() {
    const select = document.getElementById('autoPrintTimeSelect');
    if (select) {
        localStorage.setItem('autoPrintTime', select.value);
        console.log('Auto print time saved:', select.value);
    }
}
function updateSyncPeriod() {
    const select = document.getElementById('syncPeriodSelect');
    if (select) {
        localStorage.setItem('syncPeriod', select.value);
        console.log('Sync period updated:', select.value);
    }
}
// Load settings values into settings view
function loadSettingsValues() {
    try {
        console.log('Loading settings values...');
        
        // Load date format
        const dateFormat = localStorage.getItem('dateFormat') || 'default';
        const dateFormatElement = document.getElementById('dateFormatSelect');
        if (dateFormatElement) {
            dateFormatElement.value = dateFormat;
        }
        
        // Load time format
        const timeFormat = localStorage.getItem('timeFormat') || '12';
        const timeFormatElement = document.getElementById('timeFormatSelect');
        if (timeFormatElement) {
            timeFormatElement.value = timeFormat;
        }
        
        // Load week start day
        const weekStartDay = localStorage.getItem('weekStartDay') || '1';
        const weekStartElement = document.getElementById('weekStartSelect');
        if (weekStartElement) {
            weekStartElement.value = weekStartDay;
        }
        
        // Load auto-print settings (default to false/unchecked)
        const autoPrintEnabled = localStorage.getItem('autoPrintEnabled') === 'true';
        const autoPrintEnabledElement = document.getElementById('autoPrintEnabled');
        if (autoPrintEnabledElement) {
            autoPrintEnabledElement.checked = autoPrintEnabled;
        }
        
        const autoPrintTime = localStorage.getItem('autoPrintTime');
        const autoPrintTimeElement = document.getElementById('autoPrintTime');
        if (autoPrintTime && autoPrintTimeElement && autoPrintTime !== 'disabled') {
            autoPrintTimeElement.value = autoPrintTime;
        }
        
        // Initialize auto-print controls visibility
        if (typeof toggleAutoPrint === 'function') {
            toggleAutoPrint();
        }
        
        // Load tab display mode setting (default to 'both' for icon + text)
        let tabDisplayMode = localStorage.getItem('tabDisplayMode') || 'both';
        if (!localStorage.getItem('tabDisplayMode')) {
            localStorage.setItem('tabDisplayMode', 'both');
            tabDisplayMode = 'both';
        }
        const tabDisplayElement = document.getElementById('tabDisplaySelect');
        if (tabDisplayElement) {
            tabDisplayElement.value = tabDisplayMode;
        }
        
        // Apply tab display mode with delay
        setTimeout(() => {
            if (typeof applyTabDisplayMode === 'function') {
                applyTabDisplayMode(tabDisplayMode);
                console.log('🎨 Tab display mode applied:', tabDisplayMode);
            }
        }, 100);
        
        // Load mobile UI version setting (default to 'm1')
        let mobileUIVersion = localStorage.getItem('mobileUIVersion') || 'm1';
        if (!localStorage.getItem('mobileUIVersion')) {
            localStorage.setItem('mobileUIVersion', 'm1');
            mobileUIVersion = 'm1';
        }
        const mobileUIElement = document.getElementById('mobileUIVersion');
        if (mobileUIElement) {
            mobileUIElement.value = mobileUIVersion;
        }
        
        // Apply mobile UI version immediately
        if (typeof applyMobileUIVersion === 'function') {
            applyMobileUIVersion(mobileUIVersion);
            console.log('📱 Mobile UI version applied:', mobileUIVersion);
        }
        
        // Load backup settings
        setTimeout(() => {
            if (typeof getBackupSettings === 'function') {
                const backupSettings = getBackupSettings();
                console.log('📥 Loading backup settings:', backupSettings);
                
                const autoBackupElement = document.getElementById('autoBackupEnabled');
                const dailyBackupElement = document.getElementById('dailyBackupEnabled');
                const weeklyBackupElement = document.getElementById('weeklyBackupEnabled'); 
                const monthlyBackupElement = document.getElementById('monthlyBackupEnabled');
                
                if (autoBackupElement) {
                    autoBackupElement.checked = backupSettings.enabled || false;
                }
                if (dailyBackupElement) {
                    dailyBackupElement.checked = backupSettings.daily || false;
                }
                if (weeklyBackupElement) {
                    weeklyBackupElement.checked = backupSettings.weekly || false;
                }
                if (monthlyBackupElement) {
                    monthlyBackupElement.checked = backupSettings.monthly || false;
                }
            }
        }, 100);
        
    } catch (error) {
        console.error('Error loading settings values:', error);
    }
}
function openSettings() {
    if (typeof showView === 'function') {
        showView('settings');
    }
}

// Settings helper functions
function applyTabDisplayMode(mode) {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        const icon = tab.querySelector('.nav-icon');
        const text = tab.querySelector('.nav-text');
        
        switch(mode) {
            case 'icons':
                if (icon) icon.style.display = 'inline';
                if (text) text.style.display = 'none';
                break;
            case 'text':
                if (icon) icon.style.display = 'none';
                if (text) text.style.display = 'inline';
                break;
            case 'both':
            default:
                if (icon) icon.style.display = 'inline';
                if (text) text.style.display = 'inline';
                break;
        }
    });
    console.log('Tab display mode applied:', mode);
}
function toggleMobileUIVersion() {
    var select = document.getElementById('mobileUIVersion');
    if (select) {
        var version = select.value;
        localStorage.setItem('mobileUIVersion', version);
        applyMobileUIVersion(version);
        console.log('📱 Mobile UI version changed to:', version);
        if (typeof showInlineNotification === 'function') {
            showInlineNotification('📱 Mobile interface updated', 'success');
        }
    } else {
        // Toggle between m1 and m2 if no select element
        var current = localStorage.getItem('mobileUIVersion') || 'm1';
        var next = current === 'm1' ? 'm2' : 'm1';
        localStorage.setItem('mobileUIVersion', next);
        applyMobileUIVersion(next);
        console.log('📱 Mobile UI toggled to:', next);
        if (typeof showInlineNotification === 'function') {
            showInlineNotification('📱 Mobile UI: ' + next, 'success');
        }
    }
}
function applyMobileUIVersion(version) {
    document.body.classList.remove('mobile-v1', 'mobile-v2');
    if (version === 'm1') {
        document.body.classList.add('mobile-v1');
    } else if (version === 'm2') {
        document.body.classList.add('mobile-v2');
    }
    console.log('Mobile UI version applied:', version);
}
function toggleAutoPrint() {
    const checkbox = document.getElementById('autoPrintEnabled');
    const timeSelect = document.getElementById('autoPrintTime');
    
    if (checkbox && timeSelect) {
        timeSelect.style.display = checkbox.checked ? 'block' : 'none';
        localStorage.setItem('autoPrintEnabled', checkbox.checked);
    }
}
// Return task ID as-is (IDs are strings in the tasks array)
function parseTaskId(raw) {
    return raw;
}

function saveDateFormat() {
    const select = document.getElementById('dateFormatSelect');
    if (select) {
        localStorage.setItem('dateFormat', select.value);
        console.log('Date format saved:', select.value);
    }
}
function saveTimeFormat() {
    const select = document.getElementById('timeFormatSelect');
    if (select) {
        localStorage.setItem('timeFormat', select.value);
        console.log('Time format saved:', select.value);
    }
}
function saveWeekStart() {
    const select = document.getElementById('weekStartSelect');
    if (select) {
        localStorage.setItem('weekStartDay', select.value);
        console.log('Week start day saved:', select.value);
        
        // Refresh week and calendar views if they're currently displayed
        if (window.currentView === 'week' && typeof renderWeekView === 'function') {
            renderWeekView();
        } else if (window.currentView === 'calendar' && typeof renderCalendar === 'function') {
            renderCalendar();
        }
    }
}
function getWeekStartDay() {
    const saved = localStorage.getItem('weekStartDay');
    return saved !== null ? parseInt(saved) : 1; // Default to Monday (1)
}
function getBackupSettings() {
    return {
        enabled: localStorage.getItem('autoBackupEnabled') === 'true',
        daily: localStorage.getItem('dailyBackupEnabled') === 'true',
        weekly: localStorage.getItem('weeklyBackupEnabled') === 'true',
        monthly: localStorage.getItem('monthlyBackupEnabled') === 'true'
    };
}

// URL hash handling for direct actions
function handleUrlHash() {
    const hash = window.location.hash.slice(1); // Remove the #
    
    if (hash === 'new') {
        // Open the add task modal
        setTimeout(() => {
            if (typeof openAddTaskModal === 'function') {
                openAddTaskModal();
                console.log('🔗 Opened add task modal from URL hash #new');
            }
        }, 1000); // Delay to ensure page and scripts are fully loaded
        
        // Clear the hash to prevent repeated triggers
        window.history.replaceState(null, null, window.location.pathname + window.location.search);
    }
}

window.addEventListener('load', handleUrlHash);
window.addEventListener('hashchange', handleUrlHash);
// Utility function for HTML escaping
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Render template buttons in the Add Task modal
function renderTemplateButtons() {
    console.log('🔧 [missing-functions.js] renderTemplateButtons called - THE REAL ONE');
    console.log('📋 window.customTemplates:', window.customTemplates);
    console.log('📋 window.customTemplates length:', window.customTemplates?.length);
    
    const container = document.getElementById('templateButtons');
    if (!container) {
        console.log('❌ templateButtons container not found');
        return;
    }
    
    console.log('✅ templateButtons container found');
    container.innerHTML = '';
    
    if (!window.customTemplates || window.customTemplates.length === 0) {
        console.log('❌ No templates found');
        container.innerHTML = '<span style="color: #999; font-size: 12px;">No templates created yet</span>';
        return;
    }
    
    console.log(`🎨 About to render ${window.customTemplates.length} templates`);
    window.customTemplates.forEach((template, index) => {
        console.log(`🔄 Processing template ${index + 1}/${window.customTemplates.length}: "${template}"`);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'template-btn';
        button.textContent = template;
        button.title = `Left-click to add "${template}" to task • Right-click or long-press to delete`;
        
        let touchStartTime = 0;
        let touchTimer = null;
        
        // Touch start for mobile long-press
        button.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchTimer = setTimeout(async () => {
                e.preventDefault();
                button.classList.add('deleting');
                if (confirm(`Delete template "${template}"?`)) {
                    await deleteTemplate(template);
                } else {
                    button.classList.remove('deleting');
                }
            }, 800);
        });
        
        // Touch end to cancel long-press timer
        button.addEventListener('touchend', (e) => {
            clearTimeout(touchTimer);
            const touchDuration = Date.now() - touchStartTime;
            if (touchDuration < 800) {
                insertTemplateToTask(template);
            }
            button.classList.remove('deleting');
        });
        
        // Left click: insert template (for desktop)
        button.addEventListener('click', (e) => {
            if (!('ontouchstart' in window)) {
                insertTemplateToTask(template);
            }
        });
        
        // Right click: delete template (for desktop)
        button.addEventListener('contextmenu', async (e) => {
            e.preventDefault();
            await deleteTemplate(template);
        });
        
        console.log(`➕ Adding button for template "${template}" to container`);
        container.appendChild(button);
        console.log(`✅ Button added. Container now has ${container.children.length} buttons`);
    });
    
    console.log(`🏁 renderTemplateButtons completed. Final button count: ${container.children.length}`);
    console.log('🔍 Final container children:', Array.from(container.children).map(btn => btn.textContent));
}
// Insert template into task title input
function insertTemplateToTask(template) {
    console.log('🏷️ [missing-functions.js] insertTemplateToTask called with:', template);
    const titleInput = document.getElementById('editTaskTitle');
    const notesInput = document.getElementById('editTaskNotes');
    
    if (!notesInput) {
        console.error('❌ editTaskNotes input not found');
        return;
    }
    
    // Check which element has focus
    const activeElement = document.activeElement;
    console.log('🎯 Active element:', activeElement?.id || 'none');
    
    const currentNotes = notesInput.value.trim();
    console.log('📝 Current notes value before insertion:', currentNotes);
    console.log('📝 Template to insert:', template);
    
    // Add template to notes field, templates on same line separated by spaces
    if (currentNotes) {
        notesInput.value = currentNotes + ' ' + template;
        console.log('✅ Appended template to existing notes');
    } else {
        notesInput.value = template;
        console.log('✅ Set template as initial notes');
    }
    
    console.log('✅ New notes value after insertion:', notesInput.value);
    
    // Force focus back to notes input
    notesInput.focus();
    notesInput.setSelectionRange(notesInput.value.length, notesInput.value.length);
    
    // Trigger change event for any listeners
    notesInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('🎯 Multiple template support - templates accumulate in notes field inline');
}

window.insertTemplateToTask = insertTemplateToTask;
// Delete template
async function deleteTemplate(template) {
    console.log('🗑️ [ULTRA-DEBUG] deleteTemplate called for:', template);
    console.log('🗑️ [ULTRA-DEBUG] window.customTemplates before deletion:', window.customTemplates);
    console.log('🗑️ [ULTRA-DEBUG] localStorage before deletion:', localStorage.getItem('gtdTemplates'));
    
    if (!window.customTemplates) {
        console.log('🗑️ [ULTRA-DEBUG] No window.customTemplates found, returning');
        return;
    }
    
    // Filter out the template
    const beforeLength = window.customTemplates.length;
    window.customTemplates = window.customTemplates.filter(t => t !== template);
    const afterLength = window.customTemplates.length;
    
    console.log('🗑️ [ULTRA-DEBUG] Templates before deletion:', beforeLength);
    console.log('🗑️ [ULTRA-DEBUG] Templates after deletion:', afterLength);
    console.log('🗑️ [ULTRA-DEBUG] Remaining templates:', window.customTemplates);
    
    // Save templates - use same key as tasks.js
    const templatesJSON = JSON.stringify(window.customTemplates);
    localStorage.setItem('gtdTemplates', templatesJSON);
    console.log('🗑️ [ULTRA-DEBUG] Saved to localStorage:', templatesJSON);
    
    // Set persistent protection flag that survives page reload
    const protectionData = {
        flag: true,
        timestamp: Date.now(),
        action: 'template_deletion',
        deletedTemplate: template
    };
    localStorage.setItem('templateProtection', JSON.stringify(protectionData));
    window.justModifiedTemplates = true;
    console.log('🗑️ [ULTRA-DEBUG] Set protection flag in localStorage and memory');
    
    // Upload to server with detailed logging
    if (typeof uploadAllTemplates === 'function') {
        console.log('🗑️ [ULTRA-DEBUG] Starting uploadAllTemplates...');
        try {
            await uploadAllTemplates();
            console.log('🗑️ [ULTRA-DEBUG] uploadAllTemplates completed successfully');
        } catch (error) {
            console.error('🗑️ [ULTRA-DEBUG] uploadAllTemplates failed:', error);
        }
    } else {
        console.error('🗑️ [ULTRA-DEBUG] uploadAllTemplates function not found!');
    }
    
    // Clear memory flag after delay, but keep localStorage protection longer
    setTimeout(() => {
        window.justModifiedTemplates = false;
        console.log('🗑️ [ULTRA-DEBUG] Cleared memory justModifiedTemplates flag');
    }, 10000);
    
    // Clear localStorage protection after longer delay
    setTimeout(() => {
        localStorage.removeItem('templateProtection');
        console.log('🗑️ [ULTRA-DEBUG] Cleared localStorage templateProtection flag');
    }, 30000); // 30-second protection
    
    // Re-render template buttons
    console.log('🗑️ [ULTRA-DEBUG] Re-rendering template buttons...');
    renderTemplateButtons();
    console.log('🗑️ [ULTRA-DEBUG] deleteTemplate completed');
}
// Open Add Task Modal
function openAddTaskModal(dateStr) {
    // Clear the form for new task
    const titleInput = document.getElementById('editTaskTitle');
    const notesInput = document.getElementById('editTaskNotes');
    const eventCheckbox = document.getElementById('editTaskIsEvent');
    
    if (titleInput) titleInput.value = '';
    if (notesInput) notesInput.value = '';
    if (eventCheckbox) eventCheckbox.checked = false;
    
    // Set the date
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const dateToUse = dateStr || currentDate;
    
    const dateInput = document.getElementById('editTaskDate');
    const timeInput = document.getElementById('editTaskTime');
    
    if (dateInput) dateInput.value = dateToUse;
    if (timeInput) timeInput.value = '';
    
    // Change modal title
    const modalTitle = document.querySelector('#taskModal h3');
    if (modalTitle) {
        modalTitle.textContent = '➕ Add New Task';
    }
    
    // Set global variable to indicate we're adding, not editing
    window.currentEditTaskId = null;
    
    // Render template buttons
    renderTemplateButtons();
    
    // Show the modal
    const modal = document.getElementById('taskModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Focus on title input
        setTimeout(() => {
            if (titleInput) titleInput.focus();
        }, 100);
    }
}

function exportRepeatHtml() {
    console.log('Exporting repeat tasks as HTML...');
    // Placeholder for repeat tasks HTML export
}
function printSearchResults() {
    window.print();
}
function openTrash() {
    console.log('🗑️ Opening trash view...');
    if (typeof showView === 'function') {
        showView('trash');
    }
}

const ACTION_ICONS = {
    create: '➕', edit: '✏️', delete: '🗑️', complete: '✅',
    delay: '⏭️', duplicate: '📋'
};
const ACTION_LABELS = {
    create: 'Created', edit: 'Edited', delete: 'Deleted', complete: 'Completed',
    delay: 'Delayed', duplicate: 'Duplicated'
};
const ACTION_COLORS = {
    create: '#28a745', edit: '#007bff', delete: '#dc3545', complete: '#6f42c1',
    delay: '#f59e0b', duplicate: '#17a2b8'
};

function renderRecentActionsView(searchTerm) {
    console.log('📋 Rendering action registry view...');
    var tasksView = document.getElementById('tasks-view');
    if (!tasksView) return;

    var registry = window.actionRegistry || JSON.parse(localStorage.getItem('actionRegistry') || '[]');
    // Show newest first
    var actions = registry.slice().reverse();

    // Filter by search
    if (searchTerm) {
        var term = searchTerm.toLowerCase();
        actions = actions.filter(function(a) {
            return (a.taskTitle || '').toLowerCase().includes(term) ||
                   (a.type || '').toLowerCase().includes(term) ||
                   (ACTION_LABELS[a.type] || '').toLowerCase().includes(term);
        });
    }

    var countText = actions.length + ' action' + (actions.length !== 1 ? 's' : '');
    if (searchTerm) countText += ' matching "' + searchTerm + '"';

    var html = '<div class="section-header"><h3>📋 Registry</h3><div class="view-controls">' +
        '<input type="text" id="recentActionsSearchInput" placeholder="Search actions..." value="' + (searchTerm || '') + '" style="padding:6px 12px;border:2px solid #e1e5e9;border-radius:4px;font-size:11px;width:200px;margin-right:8px;" oninput="searchRecentActions()">' +
        '</div></div>';

    html += '<div style="padding:16px 20px;background:linear-gradient(135deg,#6f42c1,#563d7c);color:white;border-radius:12px;margin-bottom:16px;">' +
        '<h2 style="margin:0;font-size:20px;font-weight:700;">📋 Action Registry</h2>' +
        '<p style="margin:4px 0 0;opacity:0.9;font-size:14px;">' + countText + '</p></div>';

    if (actions.length === 0) {
        html += '<div style="text-align:center;padding:40px;color:#666;">' +
            '<div style="font-size:48px;margin-bottom:16px;">📋</div>' +
            '<h3>No Actions Recorded</h3>' +
            '<p style="color:#999;">Actions will appear here as you create, edit, delete, or delay tasks.</p></div>';
    } else {
        html += '<div style="display:grid;gap:8px;">';
        actions.forEach(function(action) {
            var icon = ACTION_ICONS[action.type] || '📝';
            var label = ACTION_LABELS[action.type] || action.type;
            var color = ACTION_COLORS[action.type] || '#6c757d';
            var d = new Date(action.timestamp);
            var timeStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

            html += '<div style="background:#fff;border:1px solid #e9ecef;border-left:4px solid ' + color + ';border-radius:8px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">' +
                '<div style="flex:1;min-width:0;">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">' +
                '<span style="font-size:16px;">' + icon + '</span>' +
                '<span style="font-weight:600;font-size:13px;color:' + color + ';">' + label + '</span>' +
                '<span style="font-size:13px;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (action.taskTitle || '') + '</span>' +
                '</div>' +
                '<div style="font-size:11px;color:#999;">' + timeStr + '</div>' +
                '</div>' +
                '<button onclick="revertAction(\'' + action.id + '\')" style="background:' + color + ';color:white;border:none;padding:6px 12px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:600;white-space:nowrap;margin-left:8px;">Revert</button>' +
                '</div>';
        });
        html += '</div>';
    }

    tasksView.innerHTML = html;

    // Re-focus search
    if (searchTerm) {
        var si = document.getElementById('recentActionsSearchInput');
        if (si) { si.focus(); si.setSelectionRange(si.value.length, si.value.length); }
    }
}

function restoreAllTasksUI() {
    // No longer needed - All Tasks view renders complete HTML structure
    // This function kept for compatibility
}
// Keyboard support for collapse/expand functionality
function setupCollapseExpandKeyboardSupport() {
    document.addEventListener('keydown', function(e) {
        // Only handle keyboard events when no input/textarea is focused
        if (document.activeElement && 
            (document.activeElement.tagName === 'INPUT' || 
             document.activeElement.tagName === 'TEXTAREA' ||
             document.activeElement.isContentEditable)) {
            return;
        }
        
        // Handle keyboard shortcuts for collapse/expand
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'e':
                    e.preventDefault();
                    console.log('🎹 Keyboard: Expand all groups');
                    if (typeof expandAllGroups === 'function') {
                        expandAllGroups();
                    }
                    break;
                case 'c':
                    e.preventDefault();
                    console.log('🎹 Keyboard: Collapse all groups');
                    if (typeof collapseAllGroups === 'function') {
                        collapseAllGroups();
                    }
                    break;
                case 't':
                    e.preventDefault();
                    console.log('🎹 Keyboard: Toggle all time slots');
                    if (typeof toggleAllTimeSlots === 'function') {
                        toggleAllTimeSlots();
                    }
                    break;
                case 'z':
                    e.preventDefault();
                    console.log('🎹 Keyboard: Revert last action');
                    if (typeof revertAction === 'function') {
                        performUndo();
                    }
                    break;
            }
        }
        
        // Individual arrow navigation with arrow keys
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const focusedElement = document.activeElement;
            if (focusedElement && focusedElement.classList.contains('group-arrow')) {
                e.preventDefault();
                const timeKey = focusedElement.id.replace('arrow-', '');
                if (timeKey && typeof toggleTimeBlock === 'function') {
                    toggleTimeBlock(timeKey);
                }
            }
        }
    });
    
    console.log('🎹 Keyboard shortcuts initialized: Ctrl+E (expand), Ctrl+C (collapse), Ctrl+T (toggle time blocks), Ctrl+Z (undo)');
}

window.openAddTaskModalMobile = openAddTaskModalMobile;
window.provideFeedback = provideFeedback;

function refreshRecentActionsView() {
    renderRecentActionsView();
}

window.refreshRecentActionsView = refreshRecentActionsView;

window.openBulkTimeModal = openBulkTimeModal;

window.triggerImageUpload = triggerImageUpload;
window.handleImageUpload = handleImageUpload;
window.resetTaskTitle = resetTaskTitle;

window.saveAutoPrintTime = saveAutoPrintTime;
window.updateSyncPeriod = updateSyncPeriod;
window.openSettings = openSettings;

window.exportRepeatHtml = exportRepeatHtml;
window.printSearchResults = printSearchResults;
window.openTrash = openTrash;

function initiateDeleteAllData() {
    console.log('🚨 Delete All Data initiated - showing first confirmation');
    
    // First confirmation
    const firstConfirmation = confirm(
        "⚠️ WARNING: This will permanently delete ALL your data!\n\n" +
        "This includes:\n" +
        "• All tasks and events\n" +
        "• All lists and sections\n" +
        "• All templates and settings\n" +
        "• All backup data\n\n" +
        "This action CANNOT be undone.\n\n" +
        "Are you absolutely sure you want to continue?"
    );
    
    if (!firstConfirmation) {
        console.log('❌ Delete All Data cancelled at first confirmation');
        return;
    }
    
    // Show phrase confirmation modal
    showDeleteConfirmationModal();
}
function showDeleteConfirmationModal() {
    console.log('🔒 Showing phrase confirmation modal');
    
    // Create modal HTML
    const modalHTML = `
        <div id="deleteConfirmationModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        ">
            <div style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                border: 3px solid #dc3545;
            ">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                    <h3 style="margin: 0 0 10px 0; color: #dc3545; font-size: 20px;">FINAL WARNING</h3>
                    <p style="margin: 0; color: #666; font-size: 14px;">This action will destroy all your data permanently</p>
                </div>
                
                <div style="background: #fff5f5; padding: 20px; border-radius: 8px; border: 1px solid #fecaca; margin-bottom: 20px;">
                    <p style="margin: 0 0 15px 0; color: #7f1d1d; font-size: 14px; line-height: 1.5;">
                        To confirm deletion, please type the exact phrase below:
                    </p>
                    <div style="background: white; padding: 12px; border-radius: 6px; border: 2px solid #dc3545; margin-bottom: 15px;">
                        <strong style="color: #dc3545; font-family: monospace; font-size: 16px;">DELETE ALL MY DATA</strong>
                    </div>
                    <input type="text" id="deleteConfirmationInput" placeholder="Type the phrase exactly..." 
                           style="width: 100%; padding: 12px; border: 2px solid #e1e5e9; border-radius: 6px; font-size: 14px; font-family: monospace;">
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button onclick="cancelDeleteAllData()" 
                            style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                        Cancel
                    </button>
                    <button onclick="confirmDeleteAllData()" 
                            style="background: #dc3545; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                        Delete Everything
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Focus the input
    setTimeout(() => {
        const input = document.getElementById('deleteConfirmationInput');
        if (input) {
            input.focus();
            // Allow Enter key to submit
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    confirmDeleteAllData();
                }
            });
        }
    }, 100);
}
function cancelDeleteAllData() {
    console.log('❌ Delete All Data cancelled at phrase confirmation');
    const modal = document.getElementById('deleteConfirmationModal');
    if (modal) {
        modal.remove();
    }
}
function confirmDeleteAllData() {
    const input = document.getElementById('deleteConfirmationInput');
    const enteredPhrase = input ? input.value.trim() : '';
    const requiredPhrase = 'DELETE ALL MY DATA';
    
    console.log('🔍 Checking phrase:', enteredPhrase, 'vs required:', requiredPhrase);
    
    if (enteredPhrase !== requiredPhrase) {
        // Shake the input and show error
        input.style.borderColor = '#dc3545';
        input.style.background = '#fff5f5';
        input.style.animation = 'shake 0.5s';
        
        // Add shake animation if not exists
        if (!document.querySelector('#shakeStyle')) {
            const style = document.createElement('style');
            style.id = 'shakeStyle';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        alert('❌ Incorrect phrase. Please type exactly: DELETE ALL MY DATA');
        input.select();
        return;
    }
    
    // Phrase is correct - proceed with deletion
    console.log('🚨 Phrase confirmed - proceeding with data deletion');
    executeDeleteAllData();
}
function executeDeleteAllData() {
    console.log('🗑️ Executing complete data deletion...');
    
    try {
        // Clear all localStorage data
        const keysToDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => {
            localStorage.removeItem(key);
            console.log('🗑️ Deleted localStorage key:', key);
        });
        
        // Clear all sessionStorage data
        sessionStorage.clear();
        console.log('🗑️ Cleared sessionStorage');
        
        // Reset global variables
        if (typeof window.tasks !== 'undefined') {
            window.tasks = [];
        }
        if (typeof window.undoStack !== 'undefined') {
            window.undoStack = [];
        }
        if (typeof window.eventTaskIds !== 'undefined') {
            window.eventTaskIds = new Set();
        }
        
        // Close modal
        const modal = document.getElementById('deleteConfirmationModal');
        if (modal) {
            modal.remove();
        }
        
        // Show success message and reload
        alert('✅ All data has been permanently deleted.\n\nThe page will now reload to reset the application.');
        
        console.log('🔄 Reloading page after data deletion');
        window.location.reload();
        
    } catch (error) {
        console.error('❌ Error during data deletion:', error);
        alert('❌ An error occurred during deletion. Please try again or contact support.');
    }
}

window.initiateDeleteAllData = initiateDeleteAllData;
window.cancelDeleteAllData = cancelDeleteAllData;
window.confirmDeleteAllData = confirmDeleteAllData;

// ========== TIMEZONE SETTINGS FOR AUTOMATIC TASK ORGANIZATION ==========

// Load timezone options from API
async function loadTimezoneOptions() {
    const select = document.getElementById('timezoneSelect');
    const statusDiv = document.getElementById('timezoneStatus');

    if (!select) {
        console.log('⏰ Timezone select not found');
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('⏰ No auth token, skipping timezone load');
            return;
        }

        const response = await fetch(`${window.API_BASE_URL || 'https://hyperfiler-api.joanmanelferrera-400.workers.dev'}/auth/timezone`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('⏰ Failed to load timezone options');
            return;
        }

        const data = await response.json();
        console.log('⏰ Timezone data:', data);

        // Clear existing options (except the disabled option)
        select.innerHTML = '<option value="">-- Disabled (no automatic organization) --</option>';

        // Add timezone options (sorted by city name)
        const sortedOptions = (data.options || []).sort((a, b) => a.city.localeCompare(b.city));
        sortedOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.timezone;
            option.textContent = opt.city;
            if (opt.timezone === data.timezone) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        // Update status
        if (statusDiv) {
            if (data.isEnabled) {
                statusDiv.innerHTML = `<span style="color: #28a745;">✅ Enabled - Tasks organized daily at 1am ${data.city}</span>`;
            } else {
                statusDiv.innerHTML = `<span style="color: #6c757d;">⏸️ Disabled - Select your city to enable</span>`;
            }
        }

    } catch (error) {
        console.error('⏰ Error loading timezone:', error);
    }
}

// Update user's timezone setting
async function updateTimezone() {
    const select = document.getElementById('timezoneSelect');
    const statusDiv = document.getElementById('timezoneStatus');

    if (!select) return;

    const timezone = select.value || null;
    const selectedOption = select.options[select.selectedIndex];
    const cityName = selectedOption ? selectedOption.textContent : '';

    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Please log in to change timezone settings');
            return;
        }

        const response = await fetch(`${window.API_BASE_URL || 'https://hyperfiler-api.joanmanelferrera-400.workers.dev'}/auth/timezone`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ timezone })
        });

        if (!response.ok) {
            const error = await response.json();
            alert('Failed to update timezone: ' + (error.error || 'Unknown error'));
            return;
        }

        const data = await response.json();
        console.log('⏰ Timezone updated:', data);

        // Update status
        if (statusDiv) {
            if (timezone) {
                statusDiv.innerHTML = `<span style="color: #28a745;">✅ Enabled - Tasks organized daily at 1am ${cityName}</span>`;
            } else {
                statusDiv.innerHTML = `<span style="color: #6c757d;">⏸️ Disabled - Automatic organization turned off</span>`;
            }
        }

        // Show notification
        if (typeof showInlineNotification === 'function') {
            showInlineNotification(data.message, 'success');
        }

    } catch (error) {
        console.error('⏰ Error updating timezone:', error);
        alert('Failed to update timezone. Please try again.');
    }
}

window.loadTimezoneOptions = loadTimezoneOptions;
window.updateTimezone = updateTimezone;

// Load timezone for Overview tab (duplicate for visibility)
async function loadTimezoneOptionsOverview() {
    const select = document.getElementById('timezoneSelectOverview');
    const statusDiv = document.getElementById('timezoneStatusOverview');

    if (!select) return;

    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch(`${window.API_BASE_URL || 'https://hyperfiler-api.joanmanelferrera-400.workers.dev'}/auth/timezone`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) return;

        const data = await response.json();

        select.innerHTML = '<option value="">-- Disabled --</option>';
        const sortedOptions = (data.options || []).sort((a, b) => a.city.localeCompare(b.city));
        sortedOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.timezone;
            option.textContent = opt.city;
            if (opt.timezone === data.timezone) option.selected = true;
            select.appendChild(option);
        });

        if (statusDiv) {
            statusDiv.innerHTML = data.isEnabled
                ? `<span style="color: #28a745;">✅ Enabled - Tasks organized at 1am ${data.city}</span>`
                : `<span style="color: #6c757d;">⏸️ Disabled</span>`;
        }
    } catch (error) {
        console.error('⏰ Error loading timezone:', error);
    }
}

async function updateTimezoneFromOverview() {
    const select = document.getElementById('timezoneSelectOverview');
    const statusDiv = document.getElementById('timezoneStatusOverview');
    if (!select) return;

    const timezone = select.value || null;
    const cityName = select.options[select.selectedIndex]?.textContent || '';

    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Please log in to change settings');
            return;
        }

        const response = await fetch(`${window.API_BASE_URL || 'https://hyperfiler-api.joanmanelferrera-400.workers.dev'}/auth/timezone`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ timezone })
        });

        if (!response.ok) {
            alert('Failed to update');
            return;
        }

        const data = await response.json();

        if (statusDiv) {
            statusDiv.innerHTML = timezone
                ? `<span style="color: #28a745;">✅ Enabled - Tasks organized at 1am ${cityName}</span>`
                : `<span style="color: #6c757d;">⏸️ Disabled</span>`;
        }

        // Sync with preferences tab select if it exists
        const prefSelect = document.getElementById('timezoneSelect');
        if (prefSelect) prefSelect.value = timezone || '';

        if (typeof showInlineNotification === 'function') {
            showInlineNotification(data.message, 'success');
        }
    } catch (error) {
        console.error('⏰ Error:', error);
        alert('Failed to update');
    }
}

window.loadTimezoneOptionsOverview = loadTimezoneOptionsOverview;
window.updateTimezoneFromOverview = updateTimezoneFromOverview;

// Load timezone for General tab in second settings view
async function loadTimezoneOptionsGeneral() {
    const select = document.getElementById('timezoneSelectGeneral');
    const statusSpan = document.getElementById('timezoneStatusGeneral');
    if (!select) return;

    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch(`${window.API_BASE_URL || 'https://hyperfiler-api.joanmanelferrera-400.workers.dev'}/auth/timezone`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return;

        const data = await response.json();
        select.innerHTML = '<option value="">-- Disabled --</option>';
        (data.options || []).sort((a, b) => a.city.localeCompare(b.city)).forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.timezone;
            option.textContent = opt.city;
            if (opt.timezone === data.timezone) option.selected = true;
            select.appendChild(option);
        });

        if (statusSpan) {
            statusSpan.innerHTML = data.isEnabled ? `✅ Active` : '';
        }
    } catch (e) { console.error('⏰ Error:', e); }
}

async function updateTimezoneFromGeneral() {
    const select = document.getElementById('timezoneSelectGeneral');
    const statusSpan = document.getElementById('timezoneStatusGeneral');
    if (!select) return;

    const timezone = select.value || null;
    try {
        const token = localStorage.getItem('authToken');
        if (!token) { alert('Please log in'); return; }

        const response = await fetch(`${window.API_BASE_URL || 'https://hyperfiler-api.joanmanelferrera-400.workers.dev'}/auth/timezone`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ timezone })
        });
        if (!response.ok) { alert('Failed'); return; }

        if (statusSpan) statusSpan.innerHTML = timezone ? '✅ Active' : '';

        // Sync other selects
        ['timezoneSelect', 'timezoneSelectOverview'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = timezone || '';
        });

        if (typeof showInlineNotification === 'function') {
            showInlineNotification(timezone ? 'Automation enabled' : 'Automation disabled', 'success');
        }
    } catch (e) { console.error('⏰ Error:', e); alert('Failed'); }
}

window.loadTimezoneOptionsGeneral = loadTimezoneOptionsGeneral;
window.updateTimezoneFromGeneral = updateTimezoneFromGeneral;

// Load timezone for Main settings view (desktop)
async function loadTimezoneOptionsMain() {
    const select = document.getElementById('timezoneSelectMain');
    const statusSpan = document.getElementById('timezoneStatusMain');
    if (!select) return;

    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch(`${window.API_BASE_URL || 'https://hyperfiler-api.joanmanelferrera-400.workers.dev'}/auth/timezone`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return;

        const data = await response.json();

        // Set selected value
        if (data.timezone) {
            select.value = data.timezone;
        }

        if (statusSpan) {
            statusSpan.innerHTML = data.isEnabled ? '✅ Active' : '';
        }
    } catch (e) { console.error('⏰ Error:', e); }
}

async function updateTimezoneFromMain() {
    const select = document.getElementById('timezoneSelectMain');
    const statusSpan = document.getElementById('timezoneStatusMain');
    if (!select) return;

    const timezone = select.value || null;
    try {
        const token = localStorage.getItem('authToken');
        if (!token) { alert('Please log in'); return; }

        const response = await fetch(`${window.API_BASE_URL || 'https://hyperfiler-api.joanmanelferrera-400.workers.dev'}/auth/timezone`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ timezone })
        });
        if (!response.ok) { alert('Failed to save'); return; }

        if (statusSpan) statusSpan.innerHTML = timezone ? '✅ Active' : '';

        // Sync other selects
        ['timezoneSelect', 'timezoneSelectOverview', 'timezoneSelectGeneral'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = timezone || '';
        });

        if (typeof showInlineNotification === 'function') {
            showInlineNotification(timezone ? 'Automation enabled' : 'Automation disabled', 'success');
        }
    } catch (e) { console.error('⏰ Error:', e); alert('Failed'); }
}

window.loadTimezoneOptionsMain = loadTimezoneOptionsMain;
window.updateTimezoneFromMain = updateTimezoneFromMain;

// Toggle auto-organize checkbox - shows/hides city selector
function toggleAutoOrganize(enabled) {
    const container = document.getElementById('timezoneSelectContainerMain');
    const statusSpan = document.getElementById('timezoneStatusMain');

    if (container) {
        container.style.display = enabled ? 'block' : 'none';
    }

    if (!enabled) {
        // Disable automation by clearing timezone
        const select = document.getElementById('timezoneSelectMain');
        if (select) select.value = '';

        // Save to server
        const token = localStorage.getItem('authToken');
        if (token) {
            fetch(`${window.API_BASE_URL || 'https://hyperfiler-api.joanmanelferrera-400.workers.dev'}/auth/timezone`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ timezone: null })
            }).catch(e => console.error('Error disabling timezone:', e));
        }

        if (statusSpan) statusSpan.innerHTML = '';
    }
}

// Load auto-organize checkbox state
async function loadAutoOrganizeState() {
    const checkbox = document.getElementById('autoOrganizeEnabledMain');
    const container = document.getElementById('timezoneSelectContainerMain');
    const select = document.getElementById('timezoneSelectMain');
    const statusSpan = document.getElementById('timezoneStatusMain');

    if (!checkbox) return;

    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch(`${window.API_BASE_URL || 'https://hyperfiler-api.joanmanelferrera-400.workers.dev'}/auth/timezone`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return;

        const data = await response.json();

        if (data.timezone) {
            checkbox.checked = true;
            if (container) container.style.display = 'block';
            if (select) select.value = data.timezone;
            if (statusSpan) statusSpan.innerHTML = '✅ Active';
        } else {
            checkbox.checked = false;
            if (container) container.style.display = 'none';
            if (statusSpan) statusSpan.innerHTML = '';
        }
    } catch (e) { console.error('Error loading auto-organize state:', e); }
}

window.toggleAutoOrganize = toggleAutoOrganize;
window.loadAutoOrganizeState = loadAutoOrganizeState;

// Load timezone when settings view is shown
const originalLoadSettingsValues = window.loadSettingsValues || loadSettingsValues;
window.loadSettingsValues = function() {
    originalLoadSettingsValues();
    loadTimezoneOptions();
    loadTimezoneOptionsOverview();
    loadTimezoneOptionsGeneral();
    loadTimezoneOptionsMain();
    loadAutoOrganizeState();
};

// ========== PAST EVENTS MANAGEMENT ==========

// Get all past events (events with date before today)
function getPastEvents() {
    if (!window.tasks) return [];

    const today = typeof getLocalDateString === 'function'
        ? getLocalDateString(new Date())
        : new Date().toISOString().slice(0, 10);

    return window.tasks.filter(task => {
        if (task.status === 'deleted') return false;
        if (!task.isEvent) return false;
        if (!task.dueDate) return false;
        return task.dueDate < today;
    }).sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
}

// Update the badge on Events nav button
function updateEventsBadge() {
    const pastEvents = getPastEvents();
    const badge = document.getElementById('pastEventsBadge');

    if (!badge) return;

    if (pastEvents.length > 0) {
        badge.textContent = pastEvents.length;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// Check and show past events banner
function checkPastEvents() {
    const pastEvents = getPastEvents();
    const existingBanner = document.getElementById('pastEventsBanner');

    // Update badge on nav button
    updateEventsBadge();

    // Remove existing banner if no past events
    if (pastEvents.length === 0) {
        if (existingBanner) existingBanner.remove();
        return;
    }

    // Create or update banner
    if (!existingBanner) {
        const banner = document.createElement('div');
        banner.id = 'pastEventsBanner';
        banner.style.cssText = `
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            padding: 10px 16px;
            border-radius: 8px;
            margin: 10px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
            animation: pulse 2s infinite;
        `;
        banner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">⚠️</span>
                <span><strong>${pastEvents.length}</strong> evento${pastEvents.length > 1 ? 's' : ''} pasado${pastEvents.length > 1 ? 's' : ''}</span>
            </div>
            <span style="font-size: 14px;">Ver Eventos →</span>
        `;
        banner.onclick = () => {
            if (typeof showView === 'function') {
                showView('events');
            }
        };

        // Add pulse animation
        if (!document.getElementById('pastEventsPulseStyle')) {
            const style = document.createElement('style');
            style.id = 'pastEventsPulseStyle';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.85; }
                }
            `;
            document.head.appendChild(style);
        }

        // Insert at top of tasks view
        const tasksView = document.getElementById('tasks-view');
        if (tasksView && tasksView.firstChild) {
            tasksView.insertBefore(banner, tasksView.firstChild);
        }
    } else {
        // Update count
        const countSpan = existingBanner.querySelector('span:nth-of-type(2)');
        if (countSpan) {
            countSpan.innerHTML = `<strong>${pastEvents.length}</strong> evento${pastEvents.length > 1 ? 's' : ''} pasado${pastEvents.length > 1 ? 's' : ''}`;
        }
    }
}

// Open modal to manage past events
function openPastEventsModal() {
    const pastEvents = getPastEvents();

    // Remove existing modal
    const existing = document.getElementById('pastEventsModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'pastEventsModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    let eventsHTML = '';
    if (pastEvents.length === 0) {
        eventsHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay eventos pasados</p>';
    } else {
        eventsHTML = pastEvents.map(event => `
            <div style="background: #f8f9fa; border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 4px solid #ff6b35;">
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 10px;">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; color: #333; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${escapeHtml(event.title || 'Sin título')}
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            📅 ${event.dueDate}${event.dueTime ? ' ⏰ ' + event.dueTime : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px; flex-shrink: 0;">
                        <button onclick="movePastEventToToday('${event.id}')"
                                style="background: #28a745; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;"
                                title="Mover a hoy">
                            📆 Hoy
                        </button>
                        <button onclick="changePastEventDate('${event.id}')"
                                style="background: #007bff; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;"
                                title="Cambiar fecha">
                            📅 Fecha
                        </button>
                        <button onclick="deletePastEvent('${event.id}')"
                                style="background: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;"
                                title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 18px;">📅 Eventos Pasados (${pastEvents.length})</h3>
                <button onclick="closePastEventsModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; line-height: 1;">×</button>
            </div>
            <div style="padding: 16px; max-height: 60vh; overflow-y: auto;">
                ${eventsHTML}
            </div>
            <div style="padding: 12px 16px; border-top: 1px solid #e9ecef; display: flex; gap: 10px; justify-content: center;">
                <button onclick="deleteAllPastEvents()"
                        style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;"
                        ${pastEvents.length === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    🗑️ Eliminar Todos
                </button>
                <button onclick="closePastEventsModal()"
                        style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    Cerrar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closePastEventsModal();
    });
}

function closePastEventsModal() {
    const modal = document.getElementById('pastEventsModal');
    if (modal) modal.remove();
}

// Move past event to today
function movePastEventToToday(eventId) {
    const task = window.tasks.find(t => t.id === eventId);
    if (!task) return;

    const today = typeof getLocalDateString === 'function'
        ? getLocalDateString(new Date())
        : new Date().toISOString().slice(0, 10);

    task.dueDate = today;
    task.due_date = today;
    task.updatedAt = new Date().toISOString();

    // Save changes
    if (typeof saveTasks === 'function') saveTasks();
    if (typeof uploadAllTasks === 'function') uploadAllTasks();

    // Refresh modal and view
    openPastEventsModal();
    checkPastEvents();
    if (typeof renderTodayView === 'function') renderTodayView();

    console.log(`📅 Event "${task.title}" moved to today`);
}

// Change past event date
function changePastEventDate(eventId) {
    const task = window.tasks.find(t => t.id === eventId);
    if (!task) return;

    const newDate = prompt('Nueva fecha (YYYY-MM-DD):', task.dueDate);
    if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
        if (newDate !== null) alert('Formato inválido. Usa YYYY-MM-DD');
        return;
    }

    task.dueDate = newDate;
    task.due_date = newDate;
    task.updatedAt = new Date().toISOString();

    // Save changes
    if (typeof saveTasks === 'function') saveTasks();
    if (typeof uploadAllTasks === 'function') uploadAllTasks();

    // Refresh modal and view
    openPastEventsModal();
    checkPastEvents();
    if (typeof renderTodayView === 'function') renderTodayView();

    console.log(`📅 Event "${task.title}" date changed to ${newDate}`);
}

// Delete past event
function deletePastEvent(eventId) {
    const task = window.tasks.find(t => t.id === eventId);
    if (!task) return;

    if (!confirm(`¿Eliminar "${task.title}"?`)) return;

    task.status = 'deleted';
    task.isDeleted = true;
    task.deletedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    // Save changes
    if (typeof saveTasks === 'function') saveTasks();
    if (typeof uploadAllTasks === 'function') uploadAllTasks();

    // Refresh modal and view
    openPastEventsModal();
    checkPastEvents();

    console.log(`🗑️ Event "${task.title}" deleted`);
}

// Delete all past events
function deleteAllPastEvents() {
    const pastEvents = getPastEvents();
    if (pastEvents.length === 0) return;

    if (!confirm(`¿Eliminar ${pastEvents.length} evento${pastEvents.length > 1 ? 's' : ''} pasado${pastEvents.length > 1 ? 's' : ''}?`)) return;

    pastEvents.forEach(event => {
        event.status = 'deleted';
        event.isDeleted = true;
        event.deletedAt = new Date().toISOString();
        event.updatedAt = new Date().toISOString();
    });

    // Save changes
    if (typeof saveTasks === 'function') saveTasks();
    if (typeof uploadAllTasks === 'function') uploadAllTasks();

    // Refresh
    closePastEventsModal();
    checkPastEvents();

    console.log(`🗑️ All ${pastEvents.length} past events deleted`);
}

// Export functions
window.getPastEvents = getPastEvents;
window.checkPastEvents = checkPastEvents;
window.updateEventsBadge = updateEventsBadge;
window.openPastEventsModal = openPastEventsModal;
window.closePastEventsModal = closePastEventsModal;
window.movePastEventToToday = movePastEventToToday;
window.changePastEventDate = changePastEventDate;
window.deletePastEvent = deletePastEvent;
window.deleteAllPastEvents = deleteAllPastEvents;

// Auto-check for past events when app loads
setTimeout(() => {
    checkPastEvents();
    updateEventsBadge();
}, 2000);

// Also update badge periodically in case tasks change
setInterval(() => {
    updateEventsBadge();
}, 30000); // Every 30 seconds

// ========== EVENTS VIEW ==========

// Get week number and year from date
function getWeekInfo(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return { week: weekNumber, year: date.getFullYear() };
}

// Get week start date (Monday)
function getWeekStart(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().slice(0, 10);
}

// Group events by week
function groupEventsByWeek(events) {
    const groups = {};
    events.forEach(event => {
        if (!event.dueDate) return;
        const weekStart = getWeekStart(event.dueDate);
        if (!groups[weekStart]) {
            groups[weekStart] = [];
        }
        groups[weekStart].push(event);
    });
    return groups;
}

// Format week label - simple month + day range
function formatWeekLabel(weekStart) {
    const start = new Date(weekStart + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = start.toLocaleDateString('es-ES', { month: 'long' });
    const endMonth = end.toLocaleDateString('es-ES', { month: 'long' });

    // Capitalize first letter
    const capMonth = s => s.charAt(0).toUpperCase() + s.slice(1);

    if (startMonth === endMonth) {
        return `${capMonth(startMonth)} ${startDay}-${endDay}`;
    } else {
        return `${capMonth(startMonth)} ${startDay} - ${capMonth(endMonth)} ${endDay}`;
    }
}

function renderEventsView() {
    console.log('📅 renderEventsView v20260203-weeks');
    const container = document.getElementById('tasks-view');
    if (!container) return;

    const today = typeof getLocalDateString === 'function'
        ? getLocalDateString(new Date())
        : new Date().toISOString().slice(0, 10);

    // Get all events (not deleted)
    const allEvents = (window.tasks || []).filter(t => t.isEvent && t.status !== 'deleted');

    // Categorize events
    const pastEvents = allEvents.filter(e => e.dueDate < today).sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
    const todayEvents = allEvents.filter(e => e.dueDate === today).sort((a, b) => (a.dueTime || '').localeCompare(b.dueTime || ''));
    const futureEvents = allEvents.filter(e => e.dueDate > today).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

    // Group by week
    const pastByWeek = groupEventsByWeek(pastEvents);
    const futureByWeek = groupEventsByWeek(futureEvents);
    console.log('📅 Week groups - Past:', Object.keys(pastByWeek), 'Future:', Object.keys(futureByWeek));

    const renderEventCard = (event, isPast) => {
        const bgColor = isPast ? '#fff5f5' : '#f8f9fa';
        const borderColor = isPast ? '#dc3545' : (event.dueDate === today ? '#28a745' : '#007bff');
        const dayName = new Date(event.dueDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });

        return `
            <div style="background: ${bgColor}; border-radius: 8px; padding: 10px 12px; margin-bottom: 6px; border-left: 4px solid ${borderColor};">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; color: #333; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${escapeHtml(event.title || 'Sin título')}
                        </div>
                        <div style="font-size: 11px; color: #666; margin-top: 2px;">
                            ${dayName}${event.dueTime ? ' · ' + event.dueTime : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 4px; flex-shrink: 0;">
                        ${isPast ? `
                            <button onclick="movePastEventToToday('${event.id}')"
                                    style="background: #28a745; color: white; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;"
                                    title="Mover a hoy">
                                Hoy
                            </button>
                        ` : ''}
                        <button onclick="event.stopPropagation(); openIOSDateTimePicker('${event.id}', '${event.dueDate || ''}', '${event.dueTime || ''}', this)"
                                style="background: none; border: 1px solid #dee2e6; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 14px;"
                                title="Cambiar fecha">
                            📅
                        </button>
                        <button onclick="deleteEventFromView('${event.id}')"
                                style="background: none; border: 1px solid #dee2e6; color: #dc3545; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 14px;"
                                title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    const renderWeekGroup = (weekStart, events, isPast, color) => {
        console.log('📅 renderWeekGroup called:', weekStart, events.length, 'events');
        const weekLabel = formatWeekLabel(weekStart);
        return `
            <div style="margin-bottom: 16px; border: 2px dashed ${color}; padding: 8px;">
                <div style="font-size: 14px; font-weight: 700; color: ${color}; margin-bottom: 10px; padding: 6px 10px; background: ${isPast ? '#fff5f5' : '#e8f4fd'}; border-radius: 6px; border-left: 4px solid ${color};">
                    📆 ${weekLabel} (${events.length})
                </div>
                ${events.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')).map(e => renderEventCard(e, isPast)).join('')}
            </div>
        `;
    };

    const renderSection = (title, eventsByWeek, isPast, color) => {
        const weeks = Object.keys(eventsByWeek).sort((a, b) => isPast ? b.localeCompare(a) : a.localeCompare(b));
        if (weeks.length === 0) return '';

        const totalCount = weeks.reduce((sum, w) => sum + eventsByWeek[w].length, 0);

        return `
            <div style="margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid ${color};">
                    <span style="font-size: 16px; font-weight: 700; color: ${color};">${title}</span>
                    <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600;">${totalCount}</span>
                    ${isPast ? `
                        <button onclick="deleteAllPastEvents()" style="margin-left: auto; background: #dc3545; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            Eliminar todos
                        </button>
                    ` : ''}
                </div>
                ${weeks.map(w => renderWeekGroup(w, eventsByWeek[w], isPast, color)).join('')}
            </div>
        `;
    };

    // Today section (no week grouping needed)
    const renderTodaySection = () => {
        if (todayEvents.length === 0) return '';
        return `
            <div style="margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #28a745;">
                    <span style="font-size: 16px; font-weight: 700; color: #28a745;">📍 Hoy</span>
                    <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600;">${todayEvents.length}</span>
                </div>
                ${todayEvents.map(e => renderEventCard(e, false)).join('')}
            </div>
        `;
    };

    container.innerHTML = `
        <div style="padding: 16px 20px; background: linear-gradient(135deg, #6f42c1, #563d7c); color: white; border-radius: 12px; margin-bottom: 16px;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 700;">📅 Events</h2>
            <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">${allEvents.length} evento${allEvents.length !== 1 ? 's' : ''} total</p>
        </div>

        ${pastEvents.length > 0 ? `
            <div style="background: #fff5f5; border: 1px solid #f5c6cb; border-radius: 8px; padding: 12px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">⚠️</span>
                <div>
                    <strong style="color: #721c24;">${pastEvents.length} evento${pastEvents.length > 1 ? 's' : ''} pasado${pastEvents.length > 1 ? 's' : ''}</strong>
                    <div style="font-size: 12px; color: #856404;">Revisa y actualiza o elimina</div>
                </div>
            </div>
        ` : ''}

        ${renderSection('⚠️ Pasados', pastByWeek, true, '#dc3545')}
        ${renderTodaySection()}
        ${renderSection('🔮 Futuros', futureByWeek, false, '#007bff')}

        ${allEvents.length === 0 ? `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 16px;">📅</div>
                <h3>No hay eventos</h3>
                <p style="color: #999;">Los eventos se crean marcando "Es un evento" al crear una tarea</p>
            </div>
        ` : ''}
    `;
}

// Open date picker for event
function openEventDatePicker(eventId) {
    const task = window.tasks.find(t => t.id === eventId);
    if (!task) return;

    const newDate = prompt('Nueva fecha (YYYY-MM-DD):', task.dueDate);
    if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
        if (newDate !== null) alert('Formato inválido. Usa YYYY-MM-DD');
        return;
    }

    task.dueDate = newDate;
    task.due_date = newDate;
    task.updatedAt = new Date().toISOString();

    if (typeof saveTasks === 'function') saveTasks();
    if (typeof uploadAllTasks === 'function') uploadAllTasks();

    renderEventsView();
    checkPastEvents();
}

// Delete event from events view
function deleteEventFromView(eventId) {
    const task = window.tasks.find(t => t.id === eventId);
    if (!task) return;

    if (!confirm(`¿Eliminar "${task.title}"?`)) return;

    task.status = 'deleted';
    task.isDeleted = true;
    task.deletedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    if (typeof saveTasks === 'function') saveTasks();
    if (typeof uploadAllTasks === 'function') uploadAllTasks();

    renderEventsView();
    checkPastEvents();
}

window.renderEventsView = renderEventsView;
window.openEventDatePicker = openEventDatePicker;
window.deleteEventFromView = deleteEventFromView;

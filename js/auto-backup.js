// Auto-Backup System using IndexedDB
// Automatic local snapshots every 5 minutes, pre-sync safety backups, manual backups

const BACKUP_DB_NAME = 'HyperFilerBackups';
const BACKUP_DB_VERSION = 1;
const BACKUP_STORE = 'snapshots';
const MAX_SNAPSHOTS = 30;
const AUTO_BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

let _backupDB = null;
let _autoBackupTimer = null;
let _lastDataHash = null;

// ── IndexedDB Setup ──

function openBackupDB() {
    return new Promise((resolve, reject) => {
        if (_backupDB) { resolve(_backupDB); return; }
        const req = indexedDB.open(BACKUP_DB_NAME, BACKUP_DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(BACKUP_STORE)) {
                const store = db.createObjectStore(BACKUP_STORE, { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('reason', 'reason', { unique: false });
            }
        };
        req.onsuccess = (e) => { _backupDB = e.target.result; resolve(_backupDB); };
        req.onerror = (e) => { console.error('Failed to open backup DB:', e); reject(e); };
    });
}

// ── Snapshot Data Collection ──

function _collectSnapshotData() {
    const data = {};
    const keys = ['gtd_tasks', 'gtd_list_sections', 'gtd_custom_templates', 'gtd_settings', 'gtd_preferences'];
    for (const key of keys) {
        const val = localStorage.getItem(key);
        if (val !== null) data[key] = val;
    }
    // Also grab any date-keyed task keys
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('tasks_') || k.startsWith('gtd_'))) {
            if (!(k in data)) data[k] = localStorage.getItem(k);
        }
    }
    return data;
}

function _hashData(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + ch;
        hash |= 0;
    }
    return hash;
}

// ── Core Functions ──

async function createSnapshot(reason = 'manual') {
    try {
        const db = await openBackupDB();
        const data = _collectSnapshotData();
        const serialized = JSON.stringify(data);
        const snapshot = {
            timestamp: Date.now(),
            reason: reason,
            data: serialized,
            size: serialized.length,
            taskCount: _countTasks(data)
        };

        await new Promise((resolve, reject) => {
            const tx = db.transaction(BACKUP_STORE, 'readwrite');
            const store = tx.objectStore(BACKUP_STORE);
            store.add(snapshot);
            tx.oncomplete = resolve;
            tx.onerror = (e) => reject(e);
        });

        // Prune old snapshots beyond MAX_SNAPSHOTS
        await _pruneSnapshots(db);

        // Update hash
        _lastDataHash = _hashData(data);

        console.log(`💾 Backup created (${reason}): ${(snapshot.size / 1024).toFixed(1)}KB, ${snapshot.taskCount} tasks`);
        return true;
    } catch (err) {
        console.error('Failed to create snapshot:', err);
        return false;
    }
}

function _countTasks(data) {
    try {
        const tasksStr = data['gtd_tasks'];
        if (tasksStr) {
            const tasks = JSON.parse(tasksStr);
            return Array.isArray(tasks) ? tasks.length : Object.keys(tasks).length;
        }
    } catch (e) {}
    return 0;
}

async function _pruneSnapshots(db) {
    const all = await listSnapshots();
    if (all.length <= MAX_SNAPSHOTS) return;

    const toDelete = all.slice(MAX_SNAPSHOTS);
    const tx = db.transaction(BACKUP_STORE, 'readwrite');
    const store = tx.objectStore(BACKUP_STORE);
    for (const snap of toDelete) {
        store.delete(snap.id);
    }
    await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = reject;
    });
    console.log(`🗑️ Pruned ${toDelete.length} old backup(s)`);
}

async function listSnapshots() {
    try {
        const db = await openBackupDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(BACKUP_STORE, 'readonly');
            const store = tx.objectStore(BACKUP_STORE);
            const req = store.getAll();
            req.onsuccess = () => {
                const results = req.result || [];
                results.sort((a, b) => b.timestamp - a.timestamp);
                resolve(results);
            };
            req.onerror = (e) => reject(e);
        });
    } catch (err) {
        console.error('Failed to list snapshots:', err);
        return [];
    }
}

async function restoreSnapshot(id) {
    try {
        const db = await openBackupDB();
        const snapshot = await new Promise((resolve, reject) => {
            const tx = db.transaction(BACKUP_STORE, 'readonly');
            const store = tx.objectStore(BACKUP_STORE);
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e);
        });

        if (!snapshot) { alert('Snapshot not found'); return false; }

        // Create a safety backup before restoring
        await createSnapshot('pre-restore');

        const data = JSON.parse(snapshot.data);

        // Clear relevant localStorage keys first
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('tasks_') || k.startsWith('gtd_'))) {
                keysToRemove.push(k);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        // Restore snapshot data
        for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, value);
        }

        console.log('✅ Snapshot restored, reloading...');
        location.reload();
        return true;
    } catch (err) {
        console.error('Failed to restore snapshot:', err);
        alert('Failed to restore backup: ' + err.message);
        return false;
    }
}

async function deleteSnapshot(id) {
    try {
        const db = await openBackupDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(BACKUP_STORE, 'readwrite');
            const store = tx.objectStore(BACKUP_STORE);
            store.delete(id);
            tx.oncomplete = resolve;
            tx.onerror = reject;
        });
        return true;
    } catch (err) {
        console.error('Failed to delete snapshot:', err);
        return false;
    }
}

async function deleteAllSnapshots() {
    try {
        const db = await openBackupDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(BACKUP_STORE, 'readwrite');
            const store = tx.objectStore(BACKUP_STORE);
            store.clear();
            tx.oncomplete = resolve;
            tx.onerror = reject;
        });
        return true;
    } catch (err) {
        console.error('Failed to delete all snapshots:', err);
        return false;
    }
}

// ── Auto-Backup Timer ──

function startAutoBackup() {
    stopAutoBackup();
    _autoBackupTimer = setInterval(async () => {
        const data = _collectSnapshotData();
        const hash = _hashData(data);
        if (hash === _lastDataHash) {
            console.log('⏭️ Auto-backup skipped (no changes)');
            return;
        }
        await createSnapshot('auto');
    }, AUTO_BACKUP_INTERVAL);
    console.log('🔄 Auto-backup started (every 5 min)');
}

function stopAutoBackup() {
    if (_autoBackupTimer) {
        clearInterval(_autoBackupTimer);
        _autoBackupTimer = null;
        console.log('⏹️ Auto-backup stopped');
    }
}

function isAutoBackupEnabled() {
    return localStorage.getItem('autoBackupIndexedDB') !== 'false';
}

function setAutoBackupEnabled(enabled) {
    localStorage.setItem('autoBackupIndexedDB', enabled ? 'true' : 'false');
    if (enabled) startAutoBackup();
    else stopAutoBackup();
}

// ── Stats ──

async function getBackupStats() {
    const snapshots = await listSnapshots();
    let totalSize = 0;
    for (const s of snapshots) totalSize += (s.size || 0);
    return { count: snapshots.length, totalSize };
}

// ── UI Rendering for Settings Tab ──

async function renderBackupSnapshotList() {
    const container = document.getElementById('indexeddb-backup-list');
    if (!container) return;

    const snapshots = await listSnapshots();
    const stats = await getBackupStats();

    if (snapshots.length === 0) {
        container.innerHTML = '<p style="color: #6c757d; text-align: center; padding: 20px;">No backups yet. Create one manually or wait for auto-backup.</p>';
        return;
    }

    const reasonLabels = { auto: '🔄 Auto', 'pre-sync': '🔒 Pre-Sync', manual: '✋ Manual', 'pre-restore': '🛡️ Pre-Restore' };

    let html = `<div style="margin-bottom: 10px; color: #6c757d; font-size: 13px;">${snapshots.length} backup(s) &middot; ${(stats.totalSize / 1024).toFixed(1)} KB total</div>`;
    html += '<div style="display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto;">';

    for (const snap of snapshots) {
        const date = new Date(snap.timestamp);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const sizeStr = (snap.size / 1024).toFixed(1) + ' KB';
        const label = reasonLabels[snap.reason] || snap.reason;

        html += `
        <div style="display: flex; align-items: center; justify-content: space-between; background: #f8f9fa; padding: 10px 12px; border-radius: 6px; gap: 8px;">
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; font-size: 13px; color: #333;">${dateStr}</div>
                <div style="font-size: 12px; color: #6c757d;">${label} &middot; ${sizeStr} &middot; ${snap.taskCount || '?'} tasks</div>
            </div>
            <div style="display: flex; gap: 6px; flex-shrink: 0;">
                <button onclick="if(confirm('Restore this backup? Current data will be saved first.')){restoreSnapshot(${snap.id})}"
                    style="background: #007bff; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">Restore</button>
                <button onclick="if(confirm('Delete this backup?')){deleteSnapshot(${snap.id}).then(()=>renderBackupSnapshotList())}"
                    style="background: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button>
            </div>
        </div>`;
    }

    html += '</div>';
    html += `<div style="margin-top: 12px; display: flex; gap: 8px;">
        <button onclick="createSnapshot('manual').then(()=>renderBackupSnapshotList())"
            style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600;">💾 Create Backup Now</button>
        <button onclick="if(confirm('Delete ALL local backups?')){deleteAllSnapshots().then(()=>renderBackupSnapshotList())}"
            style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px;">🗑️ Delete All</button>
    </div>`;

    container.innerHTML = html;
}

// ── Initialize ──

function initAutoBackup() {
    if (isAutoBackupEnabled()) {
        startAutoBackup();
        // Take initial hash
        _lastDataHash = _hashData(_collectSnapshotData());
    }
    console.log('💾 Auto-backup system initialized');
}

// Export to window
window.openBackupDB = openBackupDB;
window.createSnapshot = createSnapshot;
window.listSnapshots = listSnapshots;
window.restoreSnapshot = restoreSnapshot;
window.deleteSnapshot = deleteSnapshot;
window.deleteAllSnapshots = deleteAllSnapshots;
window.startAutoBackup = startAutoBackup;
window.stopAutoBackup = stopAutoBackup;
window.isAutoBackupEnabled = isAutoBackupEnabled;
window.setAutoBackupEnabled = setAutoBackupEnabled;
window.getBackupStats = getBackupStats;
window.renderBackupSnapshotList = renderBackupSnapshotList;
window.initAutoBackup = initAutoBackup;

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoBackup);
} else {
    initAutoBackup();
}

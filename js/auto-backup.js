// Auto-Backup System using IndexedDB
// Automatic local snapshots every 5 minutes, pre-sync safety backups, manual backups

const BACKUP_DB_NAME = 'HyperFilerBackups';
const BACKUP_DB_VERSION = 1;
const BACKUP_STORE = 'snapshots';
const MAX_ROLLING_SNAPSHOTS = 12; // rolling auto/manual/pre-sync (1 hour at 5min)
const MAX_HOURLY_SNAPSHOTS = 24;
const MAX_DAILY_SNAPSHOTS = 7;
const MAX_WEEKLY_SNAPSHOTS = 4;
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
    const keys = ['gtd_tasks', 'gtd_list_sections', 'gtd_custom_templates', 'gtd_settings', 'gtd_preferences', 'actionRegistry'];
    for (const key of keys) {
        const val = localStorage.getItem(key);
        if (val !== null) data[key] = val;
    }
    // Also grab any date-keyed task keys
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('tasks_') || k.startsWith('gtd_') || k === 'actionRegistry')) {
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
            const arr = Array.isArray(tasks) ? tasks : Object.values(tasks);
            return arr.filter(t => !t.isDeleted && t.status !== 'deleted').length;
        }
    } catch (e) {}
    return 0;
}

function _countTasksDetailed(data) {
    try {
        const tasksStr = data['gtd_tasks'];
        if (tasksStr) {
            const tasks = JSON.parse(tasksStr);
            const arr = Array.isArray(tasks) ? tasks : Object.values(tasks);
            const total = arr.length;
            const deleted = arr.filter(t => t.isDeleted || t.status === 'deleted').length;
            const active = total - deleted;
            return { active, deleted, total };
        }
    } catch (e) {}
    return { active: 0, deleted: 0, total: 0 };
}

async function _pruneSnapshots(db) {
    const all = await listSnapshots(); // sorted newest-first

    const tiers = {
        weekly:  { snaps: [], max: MAX_WEEKLY_SNAPSHOTS },
        daily:   { snaps: [], max: MAX_DAILY_SNAPSHOTS },
        hourly:  { snaps: [], max: MAX_HOURLY_SNAPSHOTS },
    };
    const rolling = [];

    for (const s of all) {
        if (tiers[s.reason]) tiers[s.reason].snaps.push(s);
        else rolling.push(s);
    }

    const toDelete = [];

    // Prune each tier
    for (const tier of Object.values(tiers)) {
        if (tier.snaps.length > tier.max) {
            toDelete.push(...tier.snaps.slice(tier.max));
        }
    }

    // Prune rolling (auto, manual, pre-sync, pre-restore)
    if (rolling.length > MAX_ROLLING_SNAPSHOTS) {
        toDelete.push(...rolling.slice(MAX_ROLLING_SNAPSHOTS));
    }

    if (toDelete.length === 0) return;

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

async function getSnapshotById(id) {
    const db = await openBackupDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(BACKUP_STORE, 'readonly');
        const store = tx.objectStore(BACKUP_STORE);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e);
    });
}

function getSnapshotPreview(snapshot) {
    const data = JSON.parse(snapshot.data);
    const currentData = _collectSnapshotData();
    const snapDetail = _countTasksDetailed(data);
    const currentDetail = _countTasksDetailed(currentData);
    const diff = snapDetail.active - currentDetail.active;
    const diffStr = diff === 0 ? 'same count' : (diff > 0 ? `+${diff} more` : `${diff} fewer`);
    const hasLists = !!data['gtd_list_sections'];
    const hasTemplates = !!data['gtd_custom_templates'];
    return { snapDetail, currentDetail, diffStr, keyCount: Object.keys(data).length, hasLists, hasTemplates };
}

async function restoreSnapshot(id) {
    try {
        const snapshot = await getSnapshotById(id);
        if (!snapshot) { alert('Snapshot not found'); return false; }

        // Create a safety backup before restoring
        await createSnapshot('pre-restore');

        const data = JSON.parse(snapshot.data);

        // Clear relevant localStorage keys first
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('tasks_') || k.startsWith('gtd_') || k === 'actionRegistry')) {
                keysToRemove.push(k);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        // Restore snapshot data
        for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, value);
        }

        // Flag for post-restore banner
        localStorage.setItem('_backupJustRestored', JSON.stringify({
            timestamp: snapshot.timestamp,
            reason: snapshot.reason
        }));

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

async function _checkTimedBackups() {
    const now = new Date();
    const currentHour = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    const currentDay = now.toISOString().slice(0, 10);  // YYYY-MM-DD
    const currentWeek = currentDay + '-W' + _getWeekNumber(now);

    // Hourly
    if (localStorage.getItem('lastHourlyBackup') !== currentHour) {
        await createSnapshot('hourly');
        localStorage.setItem('lastHourlyBackup', currentHour);
        console.log(`⏰ Hourly backup created for ${currentHour}`);
    }

    // Daily
    if (localStorage.getItem('lastDailyBackupDate') !== currentDay) {
        await createSnapshot('daily');
        localStorage.setItem('lastDailyBackupDate', currentDay);
        console.log(`📅 Daily backup created for ${currentDay}`);
    }

    // Weekly
    if (localStorage.getItem('lastWeeklyBackup') !== currentWeek) {
        await createSnapshot('weekly');
        localStorage.setItem('lastWeeklyBackup', currentWeek);
        console.log(`📆 Weekly backup created for ${currentWeek}`);
    }
}

function _getWeekNumber(d) {
    const oneJan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - oneJan) / 86400000 + oneJan.getDay() + 1) / 7);
}

function startAutoBackup() {
    stopAutoBackup();
    // Check timed backups on start
    _checkTimedBackups().catch(e => console.warn('Timed backup check failed:', e));

    _autoBackupTimer = setInterval(async () => {
        // Check hourly/daily/weekly each interval
        await _checkTimedBackups().catch(() => {});

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

const REASON_LABELS = { auto: '🔄 Auto', hourly: '⏰ Hourly', daily: '📅 Daily', weekly: '📆 Weekly', 'pre-sync': '🔒 Pre-Sync', manual: '✋ Manual', 'pre-restore': '🛡️ Pre-Restore' };

const TIER_ORDER = [
    { key: 'weekly', title: '📆 Weekly Backups', reasons: ['weekly'] },
    { key: 'daily', title: '📅 Daily Backups', reasons: ['daily'] },
    { key: 'hourly', title: '⏰ Hourly Backups', reasons: ['hourly'] },
    { key: 'rolling', title: '🔄 Rolling Backups', reasons: ['auto', 'manual', 'pre-sync', 'pre-restore'] },
];

function _renderSnapshotRow(snap) {
    const date = new Date(snap.timestamp);
    const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sizeStr = ((snap.size || 0) / 1024).toFixed(1) + ' KB';
    const label = REASON_LABELS[snap.reason] || snap.reason;
    const rowId = `backup-row-${snap.id}`;
    const previewId = `backup-preview-${snap.id}`;

    return `
    <div id="${rowId}" style="background: #f8f9fa; border-radius: 6px; overflow: hidden; border: 1px solid #e9ecef;">
        <div onclick="toggleBackupPreview(${snap.id})" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; cursor: pointer; gap: 8px;">
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; font-size: 13px; color: #333;">${dateStr}</div>
                <div style="font-size: 12px; color: #6c757d;">${label} &middot; ${sizeStr} &middot; ${snap.taskCount || '?'} tasks</div>
            </div>
            <div style="color: #aaa; font-size: 16px; flex-shrink: 0;" id="backup-chevron-${snap.id}">&#9654;</div>
        </div>
        <div id="${previewId}" style="display: none; padding: 0 12px 12px 12px;">
            <div id="backup-preview-content-${snap.id}" style="background: #fff; border: 1px solid #dee2e6; border-radius: 4px; padding: 10px; margin-bottom: 10px; font-size: 13px; color: #495057;">
                Loading preview...
            </div>
            <div style="display: flex; gap: 6px;">
                <button onclick="event.stopPropagation(); restoreSnapshot(${snap.id})"
                    style="background: #007bff; color: white; border: none; padding: 8px 14px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600;">Restore This Backup</button>
                <button onclick="event.stopPropagation(); if(confirm('Delete this backup?')){deleteSnapshot(${snap.id}).then(()=>renderBackupSnapshotList())}"
                    style="background: #dc3545; color: white; border: none; padding: 8px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button>
            </div>
        </div>
    </div>`;
}

async function toggleBackupPreview(id) {
    const preview = document.getElementById(`backup-preview-${id}`);
    const chevron = document.getElementById(`backup-chevron-${id}`);
    if (!preview) return;

    const isOpen = preview.style.display !== 'none';
    if (isOpen) {
        preview.style.display = 'none';
        if (chevron) chevron.innerHTML = '&#9654;';
        return;
    }

    preview.style.display = 'block';
    if (chevron) chevron.innerHTML = '&#9660;';

    // Load preview content
    const contentEl = document.getElementById(`backup-preview-content-${id}`);
    if (!contentEl) return;

    try {
        const snap = await getSnapshotById(id);
        if (!snap) { contentEl.textContent = 'Snapshot not found'; return; }

        const info = getSnapshotPreview(snap);
        const age = _formatAge(Date.now() - snap.timestamp);
        const includes = [info.hasLists ? 'Lists' : '', info.hasTemplates ? 'Templates' : ''].filter(Boolean).join(', ') || 'None';

        contentEl.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div><strong>Active tasks:</strong> ${info.snapDetail.active}</div>
                <div><strong>Current active:</strong> ${info.currentDetail.active}</div>
                <div><strong>Deleted in backup:</strong> ${info.snapDetail.deleted}</div>
                <div><strong>Difference:</strong> <span style="color: ${info.snapDetail.active !== info.currentDetail.active ? '#e67e22' : '#28a745'}">${info.diffStr}</span></div>
                <div><strong>Age:</strong> ${age}</div>
                <div><strong>Size:</strong> ${((snap.size || 0) / 1024).toFixed(1)} KB</div>
                <div><strong>Includes:</strong> ${includes}</div>
                <div><strong>Data keys:</strong> ${info.keyCount}</div>
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d;">
                A safety backup will be created automatically before restoring.
            </div>`;
    } catch (e) {
        contentEl.textContent = 'Failed to load preview: ' + e.message;
    }
}

function toggleBackupTier(sectionId) {
    const section = document.getElementById(sectionId);
    const chevron = document.getElementById(sectionId + '-chevron');
    if (!section) return;
    const isHidden = section.style.display === 'none';
    section.style.display = isHidden ? 'flex' : 'none';
    if (chevron) chevron.innerHTML = isHidden ? '&#9660;' : '&#9654;';
}

function _formatAge(ms) {
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
}

async function renderBackupListMain() {
    const toggle = document.getElementById('autoBackupToggleMain');
    if (toggle) toggle.checked = isAutoBackupEnabled();
    await renderBackupSnapshotList('indexeddb-backup-list-main');
}

async function renderBackupSnapshotList(containerId) {
    containerId = containerId || 'indexeddb-backup-list';
    const container = document.getElementById(containerId);
    if (!container) return;

    const snapshots = await listSnapshots();
    const stats = await getBackupStats();

    if (snapshots.length === 0) {
        container.innerHTML = '<p style="color: #6c757d; text-align: center; padding: 20px;">No backups yet. Create one manually or wait for auto-backup.</p>';
        return;
    }

    // Group by tier
    const grouped = {};
    for (const tier of TIER_ORDER) grouped[tier.key] = [];
    for (const snap of snapshots) {
        const tier = TIER_ORDER.find(t => t.reasons.includes(snap.reason));
        if (tier) grouped[tier.key].push(snap);
        else grouped['rolling'].push(snap); // fallback
    }

    let html = `<div style="margin-bottom: 12px; color: #6c757d; font-size: 13px;">${snapshots.length} backup(s) &middot; ${(stats.totalSize / 1024).toFixed(1)} KB total</div>`;

    for (const tier of TIER_ORDER) {
        const snaps = grouped[tier.key];
        if (snaps.length === 0) continue;

        const sectionId = `backup-tier-${tier.key}`;
        const isCollapsed = tier.key === 'rolling' || tier.key === 'hourly'; // collapse verbose tiers by default

        html += `<div style="margin-bottom: 16px;">
            <div onclick="toggleBackupTier('${sectionId}')" style="font-weight: 700; font-size: 14px; color: #333; padding-bottom: 4px; border-bottom: 1px solid #dee2e6; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none;">
                <span>${tier.title} <span style="font-weight: 400; color: #999; font-size: 12px;">(${snaps.length})</span></span>
                <span style="color: #aaa; font-size: 14px;" id="${sectionId}-chevron">${isCollapsed ? '&#9654;' : '&#9660;'}</span>
            </div>
            <div id="${sectionId}" style="display: ${isCollapsed ? 'none' : 'flex'}; flex-direction: column; gap: 6px; margin-top: 8px;">`;

        for (const snap of snaps) {
            html += _renderSnapshotRow(snap);
        }

        html += '</div></div>';
    }

    html += `<div style="margin-top: 8px; display: flex; gap: 8px;">
        <button onclick="createSnapshot('manual').then(()=>renderBackupSnapshotList())"
            style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600;">💾 Create Backup Now</button>
        <button onclick="if(confirm('Delete ALL local backups?')){deleteAllSnapshots().then(()=>renderBackupSnapshotList())}"
            style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px;">🗑️ Delete All</button>
    </div>`;

    container.innerHTML = html;
}

// ── Post-Restore Banner ──

function _checkRestoreBanner() {
    const flag = localStorage.getItem('_backupJustRestored');
    if (!flag) return;
    localStorage.removeItem('_backupJustRestored');

    try {
        const info = JSON.parse(flag);
        const date = new Date(info.timestamp);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const banner = document.createElement('div');
        banner.id = 'restore-banner';
        banner.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; z-index: 99999; background: #1E4FE6; color: white; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);';
        banner.innerHTML = `
            <span>Restored from ${dateStr} backup (${REASON_LABELS[info.reason] || info.reason})</span>
            <div style="display: flex; gap: 8px; align-items: center;">
                <button onclick="_undoRestore()" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.4); padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600;">Undo</button>
                <button onclick="document.getElementById('restore-banner').remove()" style="background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 18px; padding: 4px;">&times;</button>
            </div>`;
        document.body.prepend(banner);
    } catch (e) {
        console.warn('Failed to show restore banner:', e);
    }
}

async function _undoRestore() {
    // Find the most recent pre-restore snapshot and restore it
    const snapshots = await listSnapshots();
    const preRestore = snapshots.find(s => s.reason === 'pre-restore');
    if (!preRestore) {
        alert('No pre-restore backup found to undo with.');
        return;
    }
    // Remove the flag so we don't show banner again on this undo-restore
    localStorage.removeItem('_backupJustRestored');
    await restoreSnapshot(preRestore.id);
}

// ── Initialize ──

function initAutoBackup() {
    if (isAutoBackupEnabled()) {
        startAutoBackup();
        // Take initial hash
        _lastDataHash = _hashData(_collectSnapshotData());
    }
    // Check if we just restored
    _checkRestoreBanner();
    console.log('💾 Auto-backup system initialized');
}

// Export to window
window.openBackupDB = openBackupDB;
window.createSnapshot = createSnapshot;
window.listSnapshots = listSnapshots;
window.getSnapshotById = getSnapshotById;
window.getSnapshotPreview = getSnapshotPreview;
window.restoreSnapshot = restoreSnapshot;
window.deleteSnapshot = deleteSnapshot;
window.deleteAllSnapshots = deleteAllSnapshots;
window.startAutoBackup = startAutoBackup;
window.stopAutoBackup = stopAutoBackup;
window.isAutoBackupEnabled = isAutoBackupEnabled;
window.setAutoBackupEnabled = setAutoBackupEnabled;
window.getBackupStats = getBackupStats;
window.toggleBackupPreview = toggleBackupPreview;
window.toggleBackupTier = toggleBackupTier;
window.renderBackupSnapshotList = renderBackupSnapshotList;
window.renderBackupListMain = renderBackupListMain;
window._undoRestore = _undoRestore;
window.initAutoBackup = initAutoBackup;

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoBackup);
} else {
    initAutoBackup();
}

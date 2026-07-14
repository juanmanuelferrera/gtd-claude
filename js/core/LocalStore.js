/**
 * LocalStore — capa de almacenamiento local unificada (Fase 0 del plan de sync).
 *
 * Decisión de producto: WEB-ONLY (PWA). Un solo almacén cliente. Este módulo
 * es el ÚNICO punto por el que pasa la persistencia de las colecciones
 * sincronizables (tareas/listas), para poder cambiar el backend sin tocar la app:
 *   - LocalStorageAdapter  → comportamiento ACTUAL (fachada síncrona; drop-in).
 *   - IndexedDBAdapter     → producción web (Fase 1; async).
 * El backend de servidor será un Durable Object por usuario (SQLite) — Fase 1+.
 *
 * Modelo local-first + perfect sync (ver plan en Kavya):
 *   1. El almacén local es la ÚNICA fuente de verdad; el array en memoria de la
 *      app es un espejo de lectura.
 *   2. Write-through por item cuando llegue el sync (Fase 1); ahora, snapshot.
 *   3. subscribe(onChange): el sync remoto emitirá eventos → UI se re-renderiza.
 *
 * Metadatos de sync por registro: id, updatedAt, deleted, seq, dirty.
 *
 * ESTILO: script clásico (no ES module) — igual que el resto de js/*.js:
 * define todo y lo cuelga de window.LocalStore, con module.exports para tests.
 *
 * Fase 0.2 (actual): las funciones saveTasksToLocalStorage()/
 * loadTasksFromLocalStorage() de js/tasks.js pasan por aquí SIN cambio de
 * comportamiento (fachada síncrona sobre la misma clave `gtdTasks`).
 */
(function (global) {
  'use strict';

  /** Colecciones sincronizables (las prefs del dispositivo NO van aquí). */
  var COLLECTIONS = Object.freeze({ TASKS: 'tasks', LISTS: 'lists' });

  /** Claves heredadas en localStorage (compatibilidad total). */
  var LEGACY_KEY = {
    tasks: 'gtdTasks',
    lists: 'gtd_list_sections',
  };

  var META_KEY = '__localstore_meta__';

  /* --------------------------- utilidades --------------------------- */

  function newId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  /** Sella metadatos de sync sobre un item entrante del usuario. */
  function stampLocal(item) {
    return Object.assign({}, item, {
      id: item.id || newId(),
      updatedAt: new Date().toISOString(),
      deleted: item.deleted === true,
      seq: item.seq != null ? item.seq : null,
      dirty: true,
    });
  }

  /** LWW: ¿debe `incoming` reemplazar a `current`? */
  function incomingWins(current, incoming) {
    if (!current) return true;
    var a = Date.parse(incoming.updatedAt || 0);
    var b = Date.parse(current.updatedAt || 0);
    if (a !== b) return a > b;
    return (incoming.seq != null ? incoming.seq : -1) >= (current.seq != null ? current.seq : -1);
  }

  /* ----------------------- bus de eventos --------------------------- */

  var _subscribers = new Set();

  /** subscribe(fn) → devuelve función para cancelar. */
  function subscribe(fn) {
    _subscribers.add(fn);
    return function () { _subscribers.delete(fn); };
  }

  /** Emite {collection, source:'local'|'sync'} a los suscriptores. */
  function emitChange(collection, source) {
    var evt = { collection: collection, source: source || 'local' };
    _subscribers.forEach(function (fn) {
      try { fn(evt); } catch (e) { console.error('LocalStore subscriber error:', e); }
    });
  }

  /* ------------------------------------------------------------------ *
   * Fachada SÍNCRONA (Fase 0.2). Reemplaza los accesos directos a
   * localStorage de tasks.js SIN cambiar el formato almacenado.
   * ------------------------------------------------------------------ */

  function _key(collection) { return LEGACY_KEY[collection] || 'ls_' + collection; }

  // Registro de ids YA sincronizados, SEPARADO del objeto tarea. Así, aunque un
  // writer directo (que escribe gtdTasks a pelo) borre el `seq` de las tareas,
  // seguimos sabiendo que ya se subieron → evita el bucle de re-push.
  function _syncedKey(collection) { return 'ls_synced_' + collection; }
  function _readSyncedSet(collection) {
    try { var o = JSON.parse(localStorage.getItem(_syncedKey(collection)) || '{}'); return (o && typeof o === 'object') ? o : {}; } catch (e) { return {}; }
  }
  function _addSynced(collection, ids) {
    if (!ids || !ids.length) return;
    var m = _readSyncedSet(collection), any = false;
    ids.forEach(function (id) { if (id != null && !m[id]) { m[id] = 1; any = true; } });
    if (any) { try { localStorage.setItem(_syncedKey(collection), JSON.stringify(m)); } catch (e) {} }
  }

  /** Lee la colección completa RAW (incluye tombstones). Uso interno/sync. */
  function readCollectionSync(collection) {
    try {
      var raw = localStorage.getItem(_key(collection));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('LocalStore.readCollectionSync error:', e);
      return [];
    }
  }

  /** Lee solo los items ACTIVOS (sin tombstones). Es lo que usa la app. */
  function readActiveSync(collection) {
    return readCollectionSync(collection).filter(function (x) { return x && x.deleted !== true; });
  }

  /** Clave de comparación de contenido (sin metadatos de sync). */
  function _cmpKey(item) {
    var c = Object.assign({}, item);
    delete c.dirty; delete c.seq; delete c.updatedAt; delete c.deleted; delete c.collection;
    try {
      var keys = Object.keys(c).sort();
      return JSON.stringify(c, keys);
    } catch (e) { return String(Math.random()); }
  }

  function _persist(collection, arr) {
    try {
      localStorage.setItem(_key(collection), JSON.stringify(arr));
    } catch (e) {
      try {
        var replacer = function (key, value) {
          if (key.startsWith('_') || typeof value === 'function') return undefined;
          return value;
        };
        localStorage.setItem(_key(collection), JSON.stringify(arr, replacer));
      } catch (fallbackError) {
        console.error('LocalStore persist failed:', fallbackError);
        return false;
      }
    }
    return true;
  }

  /**
   * Guarda la colección desde el array ACTIVO de la app y produce los
   * metadatos de sync: marca `dirty` los items nuevos/cambiados, preserva
   * `seq`/`dirty` de los que no cambian, y crea TOMBSTONES para los que la app
   * ya no incluye (borrados) → así el sync propaga las eliminaciones.
   */
  function writeCollectionSync(collection, incoming) {
    incoming = incoming || [];
    var storedRaw = readCollectionSync(collection);
    var storedById = {};
    storedRaw.forEach(function (x) { if (x && x.id != null) storedById[x.id] = x; });

    var nowIso = new Date().toISOString();
    var result = [];
    var seen = {};

    incoming.forEach(function (item) {
      if (!item) return;
      if (item.id == null) item = Object.assign({}, item, { id: newId() });
      seen[item.id] = true;
      var prev = storedById[item.id];
      if (!prev) {
        result.push(Object.assign({}, item, { deleted: false, updatedAt: item.updatedAt || nowIso, seq: null, dirty: true }));
      } else if (prev.deleted === true || _cmpKey(prev) !== _cmpKey(item)) {
        // cambiado (o "resucitado" de un tombstone)
        result.push(Object.assign({}, item, { deleted: false, updatedAt: nowIso, seq: prev.seq != null ? prev.seq : null, dirty: true }));
      } else {
        // sin cambios: conserva metadatos previos
        result.push(Object.assign({}, item, { deleted: false, updatedAt: prev.updatedAt || nowIso, seq: prev.seq != null ? prev.seq : null, dirty: prev.dirty === true }));
      }
    });

    // Tombstones: lo que estaba y ya no viene.
    storedRaw.forEach(function (x) {
      if (!x || x.id == null || seen[x.id]) return;
      if (x.deleted === true) result.push(x); // conserva tombstone
      else result.push(Object.assign({}, x, { deleted: true, updatedAt: nowIso, dirty: true }));
    });

    var okw = _persist(collection, result);
    emitChange(collection, 'local');
    return okw;
  }

  /* ------------------------------------------------------------------ *
   * Interfaz ASYNC (para el motor de sync — Fase 1+). El adapter de
   * localStorage la cumple resolviendo de inmediato. IndexedDBAdapter
   * la implementará de verdad en Fase 1.
   * ------------------------------------------------------------------ */

  function LocalStorageAdapter() {}
  LocalStorageAdapter.prototype = {
    getAll: function (c) { return Promise.resolve(readCollectionSync(c)); },
    getActive: function (c) {
      return this.getAll(c).then(function (xs) { return xs.filter(function (x) { return x && x.deleted !== true; }); });
    },
    get: function (c, id) {
      return this.getAll(c).then(function (xs) { return xs.find(function (x) { return x.id === id; }) || null; });
    },
    upsert: function (c, item) {
      var stamped = stampLocal(item);
      var items = readCollectionSync(c);
      var i = items.findIndex(function (x) { return x.id === stamped.id; });
      if (i >= 0) items[i] = stamped; else items.push(stamped);
      writeCollectionSync(c, items);
      return Promise.resolve(stamped);
    },
    remove: function (c, id) {
      var items = readCollectionSync(c);
      var i = items.findIndex(function (x) { return x.id === id; });
      if (i >= 0) {
        items[i] = Object.assign({}, items[i], { deleted: true, updatedAt: new Date().toISOString(), dirty: true });
        writeCollectionSync(c, items);
      }
      return Promise.resolve();
    },
    /** Aplicado desde sync: NO marca dirty; respeta LWW; source='sync'. */
    bulkUpsert: function (c, incomingItems) {
      var items = readCollectionSync(c);
      var byId = new Map(items.map(function (x) { return [x.id, x]; }));
      var changed = false, syncedIds = [];
      incomingItems.forEach(function (incoming) {
        if (incoming && incoming.id != null) syncedIds.push(incoming.id); // vino del server → ya sincronizado
        var current = byId.get(incoming.id);
        if (incomingWins(current, incoming)) {
          byId.set(incoming.id, Object.assign({}, incoming, { dirty: false }));
          changed = true;
        }
      });
      _addSynced(c, syncedIds);
      if (changed) {
        try { localStorage.setItem(_key(c), JSON.stringify(Array.from(byId.values()))); } catch (e) {}
        emitChange(c, 'sync');
      }
      return Promise.resolve();
    },
    getPending: function (c) {
      var synced = _readSyncedSet(c);
      // Pendiente = editado (dirty), O nunca sincronizado (sin seq y sin registro).
      return this.getAll(c).then(function (xs) { return xs.filter(function (x) { return x && (x.dirty === true || (x.seq == null && !synced[x.id])); }); });
    },
    markSynced: function (c, id, seq) {
      _addSynced(c, [id]);
      var items = readCollectionSync(c);
      var i = items.findIndex(function (x) { return x.id === id; });
      if (i >= 0) { items[i] = Object.assign({}, items[i], { seq: seq, dirty: false });
        try { localStorage.setItem(_key(c), JSON.stringify(items)); } catch (e) {} }
      return Promise.resolve();
    },
    _meta: function () { try { return JSON.parse(localStorage.getItem(META_KEY) || '{}'); } catch (e) { return {}; } },
    getCursor: function (c) { var m = this._meta()[c]; return Promise.resolve(m && m.cursor != null ? m.cursor : 0); },
    setCursor: function (c, seq) {
      var meta = this._meta();
      meta[c] = Object.assign({}, meta[c] || {}, { cursor: seq });
      localStorage.setItem(META_KEY, JSON.stringify(meta));
      return Promise.resolve();
    },
    clear: function (c) { localStorage.removeItem(_key(c)); return Promise.resolve(); },
  };

  /* ------------------------------------------------------------------ *
   * IndexedDBAdapter — PRODUCCIÓN web. Mismo interfaz async. Un object
   * store por colección + store 'meta' para cursores de sync.
   * ------------------------------------------------------------------ */

  function IndexedDBAdapter(dbName) {
    this.dbName = dbName || 'hyperfiler_sync';
    this._dbPromise = null;
  }
  IndexedDBAdapter.STORES = ['tasks', 'lists', 'meta'];
  IndexedDBAdapter.prototype = {
    _open: function () {
      var self = this;
      if (this._dbPromise) return this._dbPromise;
      this._dbPromise = new Promise(function (resolve, reject) {
        var req = global.indexedDB.open(self.dbName, 1);
        req.onupgradeneeded = function (e) {
          var db = e.target.result;
          IndexedDBAdapter.STORES.forEach(function (s) {
            if (!db.objectStoreNames.contains(s)) {
              db.createObjectStore(s, { keyPath: s === 'meta' ? 'k' : 'id' });
            }
          });
        };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
      return this._dbPromise;
    },
    _store: function (name, mode) {
      return this._open().then(function (db) { return db.transaction(name, mode).objectStore(name); });
    },
    _reqP: function (req) {
      return new Promise(function (resolve, reject) {
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    },
    getAll: function (c) {
      var self = this;
      return this._store(c, 'readonly').then(function (os) { return self._reqP(os.getAll()); });
    },
    getActive: function (c) {
      return this.getAll(c).then(function (xs) { return xs.filter(function (x) { return x && x.deleted !== true; }); });
    },
    get: function (c, id) {
      var self = this;
      return this._store(c, 'readonly').then(function (os) { return self._reqP(os.get(id)); })
        .then(function (r) { return r || null; });
    },
    upsert: function (c, item) {
      var self = this;
      var stamped = stampLocal(item);
      return this._store(c, 'readwrite').then(function (os) { return self._reqP(os.put(stamped)); })
        .then(function () { emitChange(c, 'local'); return stamped; });
    },
    remove: function (c, id) {
      var self = this;
      return this.get(c, id).then(function (cur) {
        if (!cur) return;
        var tomb = Object.assign({}, cur, { deleted: true, updatedAt: new Date().toISOString(), dirty: true });
        return self._store(c, 'readwrite').then(function (os) { return self._reqP(os.put(tomb)); })
          .then(function () { emitChange(c, 'local'); });
      });
    },
    bulkUpsert: function (c, incomingItems) {
      var self = this;
      if (!incomingItems || !incomingItems.length) return Promise.resolve();
      return this.getAll(c).then(function (items) {
        var byId = {};
        items.forEach(function (x) { byId[x.id] = x; });
        var toPut = [];
        incomingItems.forEach(function (incoming) {
          if (incomingWins(byId[incoming.id], incoming)) toPut.push(Object.assign({}, incoming, { dirty: false }));
        });
        if (!toPut.length) return;
        return self._open().then(function (db) {
          return new Promise(function (resolve, reject) {
            var tx = db.transaction(c, 'readwrite');
            var os = tx.objectStore(c);
            toPut.forEach(function (it) { os.put(it); });
            tx.oncomplete = function () { emitChange(c, 'sync'); resolve(); };
            tx.onerror = function () { reject(tx.error); };
          });
        });
      });
    },
    getPending: function (c) {
      return this.getAll(c).then(function (xs) { return xs.filter(function (x) { return x && (x.dirty === true || x.seq == null); }); });
    },
    markSynced: function (c, id, seq) {
      var self = this;
      return this.get(c, id).then(function (cur) {
        if (!cur) return;
        var upd = Object.assign({}, cur, { seq: seq, dirty: false });
        return self._store(c, 'readwrite').then(function (os) { return self._reqP(os.put(upd)); });
      });
    },
    getCursor: function (c) {
      var self = this;
      return this._store('meta', 'readonly').then(function (os) { return self._reqP(os.get('cursor:' + c)); })
        .then(function (r) { return r ? r.v : 0; });
    },
    setCursor: function (c, seq) {
      var self = this;
      return this._store('meta', 'readwrite').then(function (os) { return self._reqP(os.put({ k: 'cursor:' + c, v: seq })); });
    },
    clear: function (c) {
      var self = this;
      return this._store(c, 'readwrite').then(function (os) { return self._reqP(os.clear()); });
    },
  };

  var _instance = null;

  /** Elige backend. Web-only → IndexedDB en producción; localStorage de fallback. */
  function pickAdapter() {
    try {
      if (typeof global.indexedDB !== 'undefined' && global.indexedDB) return new IndexedDBAdapter();
    } catch (e) { /* sin IndexedDB */ }
    return new LocalStorageAdapter();
  }

  function getStore() { if (!_instance) _instance = pickAdapter(); return _instance; }
  function setStore(adapter) { _instance = adapter; }

  /* ----------------------------- export ----------------------------- */

  var LocalStore = {
    COLLECTIONS: COLLECTIONS,
    newId: newId,
    stampLocal: stampLocal,
    incomingWins: incomingWins,
    subscribe: subscribe,
    emitChange: emitChange,
    // Fachada síncrona (Fase 0.2)
    readCollectionSync: readCollectionSync,
    readActiveSync: readActiveSync,
    writeCollectionSync: writeCollectionSync,
    // Interfaz async (Fase 1+)
    LocalStorageAdapter: LocalStorageAdapter,
    IndexedDBAdapter: IndexedDBAdapter,
    getStore: getStore,
    setStore: setStore,
  };

  global.LocalStore = LocalStore;
  if (typeof module !== 'undefined' && module.exports) module.exports = LocalStore;
})(typeof window !== 'undefined' ? window : this);

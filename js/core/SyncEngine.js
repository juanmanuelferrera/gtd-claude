/**
 * SyncEngine — motor de sync del cliente contra el UserSyncDO.
 *
 * Local-first: la app trabaja siempre sobre LocalStore (offline). Este motor
 * empuja los cambios `dirty`, trae los remotos, y mantiene un WebSocket abierto
 * para recibir en vivo lo que cambie en OTROS dispositivos de la misma cuenta.
 *
 * Protocolo (ver SYNC_DO_INTEGRATION.md):
 *   POST {baseUrl}/push  {collection, since, changes}  → {applied, remote, serverSeq}
 *   GET  {baseUrl}/pull?collection&since               → {items, serverSeq}
 *   WS   {baseUrl}/ws?token=...   ↔  {type:'push'|'pull'} / {type:'ack'|'changes'|'pull'}
 *
 * Uso:
 *   const engine = new SyncEngine({
 *     store: LocalStore.getStore(),
 *     baseUrl: 'https://tu-worker.workers.dev/sync',
 *     getToken: () => localStorage.getItem('authToken'),
 *     collections: ['tasks', 'lists'],
 *   });
 *   engine.start();
 *
 * ESTILO: script clásico → window.SyncEngine (+ module.exports para tests).
 */
(function (global) {
  'use strict';

  function SyncEngine(opts) {
    opts = opts || {};
    this.store = opts.store || (global.LocalStore && global.LocalStore.getStore());
    this.baseUrl = (opts.baseUrl || '/sync').replace(/\/$/, '');
    this.getToken = opts.getToken || function () { return null; };
    this.collections = opts.collections || ['tasks', 'lists'];
    this.ws = null;
    this._started = false;
    this._reconnectDelay = 1000;
    this._pushTimers = {};
    this._unsub = null;
    this._online = true;
  }

  SyncEngine.prototype = {

    /* ------------------------------- ciclo ------------------------------- */

    start: function () {
      if (this._started) return;
      this._started = true;
      var self = this;

      // Reacciona a cambios LOCALES → agenda push (debounced). Ignora los que
      // vienen del propio sync (source='sync') para no hacer bucle.
      if (global.LocalStore && global.LocalStore.subscribe) {
        this._unsub = global.LocalStore.subscribe(function (evt) {
          if (evt.source === 'local') self._schedulePush(evt.collection);
        });
      }

      // Al recuperar conexión, reconciliar.
      if (global.addEventListener) {
        global.addEventListener('online', function () { self._online = true; self.syncNow(); self._connectWS(); });
        global.addEventListener('offline', function () { self._online = false; });
        // Al volver a esta pestaña/ventana → sincroniza YA. Robusto frente al
        // throttling de setInterval en pestañas de fondo y a un WebSocket caído:
        // en cuanto miras un navegador, trae lo último del DO.
        global.addEventListener('focus', function () { if (self._started && self._online) self.syncNow(); });
      }
      if (global.document && global.document.addEventListener) {
        global.document.addEventListener('visibilitychange', function () {
          if (!global.document.hidden && self._started && self._online) self.syncNow();
        });
      }

      // Pull periódico de RESERVA (cada 30s). El WebSocket es la vía instantánea;
      // esto solo cubre el caso de que el WS caiga. Además hay focus-pull (al enfocar
      // la pestaña sincroniza al momento), así que 30s de reserva es de sobra.
      if (this._pollTimer) clearInterval(this._pollTimer);
      this._pollTimer = setInterval(function () {
        if (self._started && self._online) self.syncNow();
      }, 30000);

      // Arranque: pull + push de cada colección, luego WebSocket.
      return this.syncNow().then(function () { self._connectWS(); });
    },

    stop: function () {
      this._started = false;
      if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
      if (this._unsub) { this._unsub(); this._unsub = null; }
      if (this.ws) { try { this.ws.close(); } catch (e) {} this.ws = null; }
    },

    /** Reconciliación completa (pull + push) de todas las colecciones. */
    syncNow: function () {
      var self = this;
      return Promise.all(this.collections.map(function (c) {
        // pushPending SIEMPRE corre, aunque el pull falle. Antes un pull con error
        // se comía el push encadenado → dejaban de subir los cambios locales.
        return self.pull(c).catch(function (e) { console.warn('pull error:', e); })
          .then(function () { return self.pushPending(c).catch(function (e) { console.warn('push error:', e); }); });
      }));
    },

    /* ------------------------------- HTTP -------------------------------- */

    _headers: function () {
      var h = { 'Content-Type': 'application/json' };
      var t = this.getToken();
      if (t) h['Authorization'] = 'Bearer ' + t;
      return h;
    },

    pull: function (collection) {
      var self = this;
      return this.store.getCursor(collection).then(function (cursor) {
        var url = self.baseUrl + '/pull?collection=' + encodeURIComponent(collection) + '&since=' + (cursor || 0);
        return fetch(url, { headers: self._headers() })
          .then(function (r) { if (!r.ok) throw new Error('pull ' + r.status); return r.json(); })
          .then(function (data) { return self._applyRemote(collection, data.items, data.serverSeq); });
      });
    },

    pushPending: function (collection) {
      var self = this;
      return Promise.all([
        this.store.getPending(collection),
        this.store.getCursor(collection),
      ]).then(function (arr) {
        var pending = arr[0], cursor = arr[1] || 0;
        if (!pending.length) return;
        var body = JSON.stringify({ collection: collection, since: cursor, changes: pending });
        return fetch(self.baseUrl + '/push', { method: 'POST', headers: self._headers(), body: body })
          .then(function (r) { if (!r.ok) throw new Error('push ' + r.status); return r.json(); })
          .then(function (res) {
            var chain = Promise.resolve();
            (res.applied || []).forEach(function (a) {
              chain = chain.then(function () { return self.store.markSynced(collection, a.id, a.seq); });
            });
            return chain.then(function () { return self._applyRemote(collection, res.remote, res.serverSeq); });
          });
      });
    },

    /** Aplica items remotos + avanza el cursor al serverSeq (o al máximo seq). */
    _applyRemote: function (collection, items, serverSeq) {
      var self = this;
      items = items || [];
      var maxSeq = serverSeq || 0;
      items.forEach(function (it) { if (it.seq > maxSeq) maxSeq = it.seq; });
      return this.store.bulkUpsert(collection, items).then(function () {
        if (maxSeq) return self.store.setCursor(collection, maxSeq);
      });
    },

    /* ---------------------------- WebSocket ------------------------------ */

    _wsUrl: function () {
      var base = this.baseUrl.replace(/^http/, 'ws');
      var t = this.getToken();
      return base + '/ws' + (t ? '?token=' + encodeURIComponent(t) : '');
    },

    _connectWS: function () {
      var WS = global.WebSocket || (typeof WebSocket !== 'undefined' ? WebSocket : null);
      if (!this._started || this.ws || !WS) return;
      var self = this;
      var ws;
      try { ws = new WS(this._wsUrl()); } catch (e) { return this._scheduleReconnect(); }
      this.ws = ws;

      ws.onopen = function () { self._reconnectDelay = 1000; };
      ws.onmessage = function (ev) {
        var data;
        try { data = JSON.parse(ev.data); } catch (e) { return; }
        if (data.type === 'changes') {
          // Cambios en vivo desde otro dispositivo → aplícalos por colección.
          self._applyLiveItems(data.items);
        } else if (data.type === 'ack') {
          var chain = Promise.resolve();
          (data.applied || []).forEach(function (a) {
            // No sabemos la colección aquí; markSynced busca por id en cada una.
            self.collections.forEach(function (c) {
              chain = chain.then(function () { return self.store.markSynced(c, a.id, a.seq); });
            });
          });
        }
      };
      ws.onclose = function () { self.ws = null; self._scheduleReconnect(); };
      ws.onerror = function () { try { ws.close(); } catch (e) {} };
    },

    _applyLiveItems: function (items) {
      var self = this;
      if (!items || !items.length) return;
      // Agrupa por colección (cada item trae su `collection`).
      var byColl = {};
      items.forEach(function (it) {
        var c = it.collection || 'tasks';
        (byColl[c] = byColl[c] || []).push(it);
      });
      Object.keys(byColl).forEach(function (c) { self._applyRemote(c, byColl[c], 0); });
    },

    _scheduleReconnect: function () {
      if (!this._started || !this._online) return;
      var self = this;
      var delay = this._reconnectDelay;
      this._reconnectDelay = Math.min(delay * 2, 30000);
      setTimeout(function () { self._connectWS(); }, delay);
    },

    /* ----------------------------- push debounce ------------------------- */

    _schedulePush: function (collection) {
      var self = this;
      if (this._pushTimers[collection]) clearTimeout(this._pushTimers[collection]);
      this._pushTimers[collection] = setTimeout(function () {
        self._pushTimers[collection] = null;
        self.pushPending(collection).catch(function (e) { console.warn('push error:', e); });
      }, 400);
    },
  };

  global.SyncEngine = SyncEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = SyncEngine;
})(typeof window !== 'undefined' ? window : this);

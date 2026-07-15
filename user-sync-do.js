/**
 * UserSyncDO — Durable Object por usuario (backend de "perfect sync").
 *
 * Un objeto por cuenta: `env.USER_SYNC.idFromName(userId)`. Todos los
 * dispositivos de esa cuenta pasan por este único actor monohilo → las
 * escrituras se serializan (no hay carreras entre dispositivos, que era el
 * fallo de D1), hay una sola fuente de verdad y difusión en vivo por WebSocket.
 *
 * Almacén: SQLite integrado del DO (this.ctx.storage.sql) — transaccional,
 * con Point-in-Time Recovery. Esquema espejo del cliente (LocalStore):
 *   items(id, collection, updated_at, deleted, seq, payload)
 *   sync_meta(k, v)   -- guarda el contador monótono `seq`
 *
 * Protocolo (ver plan en Kavya):
 *   POST /sync/push  { collection, since, changes:[{id,updatedAt,deleted,...}] }
 *        → aplica LWW, asigna seq nuevos, devuelve { applied, remote, serverSeq }
 *   GET  /sync/pull?collection=&since=<seq>
 *        → { items:[...], serverSeq }
 *   GET  /sync/ws     (Upgrade: websocket) → empuja {type:'changes', items} en vivo
 *
 * Seguridad: el Worker valida el JWT y enruta por userId ANTES de llegar aquí;
 * el DO confía en ese userId (nunca lo toma del cliente).
 */
export class UserSyncDO {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.sql = ctx.storage.sql;
    this._initSchema();
  }

  _initSchema() {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id          TEXT PRIMARY KEY,
        collection  TEXT NOT NULL,
        updated_at  TEXT NOT NULL,
        deleted     INTEGER NOT NULL DEFAULT 0,
        seq         INTEGER NOT NULL,
        payload     TEXT NOT NULL
      );
    `);
    this.sql.exec(`CREATE INDEX IF NOT EXISTS idx_items_seq ON items(seq);`);
    this.sql.exec(`CREATE INDEX IF NOT EXISTS idx_items_coll_seq ON items(collection, seq);`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS sync_meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);`);
  }

  /* ---------------------------- seq counter ---------------------------- */

  _getSeq() {
    const row = this.sql.exec(`SELECT v FROM sync_meta WHERE k='seq'`).toArray()[0];
    return row ? Number(row.v) : 0;
  }

  _setSeq(n) {
    this.sql.exec(
      `INSERT INTO sync_meta (k, v) VALUES ('seq', ?)
       ON CONFLICT(k) DO UPDATE SET v = excluded.v`,
      String(n)
    );
  }

  /* ----------------------- migración perezosa D1 → DO ------------------ */

  _rememberUser(uid) {
    if (!uid) return;
    this._userId = uid;
    const row = this.sql.exec(`SELECT v FROM sync_meta WHERE k='user_id'`).toArray()[0];
    if (!row) {
      this.sql.exec(
        `INSERT INTO sync_meta (k, v) VALUES ('user_id', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v`,
        String(uid)
      );
    }
  }

  _getUserId() {
    if (this._userId) return this._userId;
    const row = this.sql.exec(`SELECT v FROM sync_meta WHERE k='user_id'`).toArray()[0];
    return row ? row.v : null;
  }

  _isMigrated() {
    const row = this.sql.exec(`SELECT v FROM sync_meta WHERE k='migrated'`).toArray()[0];
    return row && row.v === '1';
  }

  /**
   * Siembra el SQLite del DO desde `user_tasks` de D1 la primera vez.
   * Idempotente (memoizado) y no pisa items que el cliente ya haya subido.
   */
  _ensureMigrated() {
    if (this._migPromise) return this._migPromise;
    if (this._isMigrated()) return (this._migPromise = Promise.resolve());

    const self = this;
    this._migPromise = (async () => {
      const uid = self._getUserId();
      if (!uid || !self.env || !self.env.DB) {
        // Sin userId o sin D1: no marcamos migrado (se reintenta cuando lleguen).
        self._migPromise = null;
        return;
      }
      try {
        const res = await self.env.DB.prepare('SELECT * FROM user_tasks WHERE user_id = ?').bind(uid).all();
        const rows = (res && res.results) || [];

        // Modelo BLOB vs por-filas: si una fila es el envoltorio 'JSON_TASKS_DATA',
        // las tareas reales están dentro de task_data (array JSON, claves camelCase).
        // Las expandimos. El resto de filas son tareas por-fila (snake_case).
        const tasks = [];
        for (const r of rows) {
          if (r && r.task_data != null) {
            const arr = _safeParse(r.task_data, null);
            if (Array.isArray(arr)) { for (const t of arr) tasks.push(t); continue; }
          }
          if (r && r.title === 'JSON_TASKS_DATA') continue; // envoltorio vacío/no-array
          tasks.push(r);
        }

        let seq = self._getSeq();
        for (const t of tasks) {
          if (!t || t.id == null) continue;
          if (self._getItem(t.id)) continue; // el cliente ya lo tiene: no lo pises
          const deleted = (t.status === 'deleted' || t.isDeleted === true || t.is_deleted === 1 || t.is_deleted === true) ? 1 : 0;
          const updatedAt = t.updatedAt || t.updated_at || t.createdAt || t.created_at || new Date().toISOString();
          // Payload = tarea en el formato ORIGINAL de la app (camelCase: dueDate, isEvent…)
          // para que el round-trip DO→app sea SIN PÉRDIDAS y la app la renderice bien.
          const payload = Object.assign({}, t, { updatedAt: updatedAt, deleted: deleted === 1 });
          seq += 1;
          self.sql.exec(
            `INSERT INTO items (id, collection, updated_at, deleted, seq, payload)
             VALUES (?, 'tasks', ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`,
            String(t.id), updatedAt, deleted, seq, JSON.stringify(payload)
          );
        }
        // Listas y plantillas: cada colección se sincroniza como UN item-blob
        // (id fijo) que envuelve todo el bloque. LWW sobre el bloque entero.
        const blobs = [['lists', 'user_lists', 'list_data'], ['templates', 'user_templates', 'templates_data']];
        for (const [coll, table, col] of blobs) {
          const itemId = '__' + coll + '__';
          if (self._getItem(itemId)) continue;
          try {
            const r2 = await self.env.DB
              .prepare('SELECT ' + col + ' AS d, updated_at AS u FROM ' + table + ' WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1')
              .bind(uid).first();
            if (r2 && r2.d != null) {
              const data = _safeParse(r2.d, null);
              if (data != null) {
                const updatedAt = r2.u || new Date().toISOString();
                seq += 1;
                self.sql.exec(
                  `INSERT INTO items (id, collection, updated_at, deleted, seq, payload)
                   VALUES (?, ?, ?, 0, ?, ?) ON CONFLICT(id) DO NOTHING`,
                  itemId, coll, updatedAt, seq,
                  JSON.stringify({ id: itemId, data: data, updatedAt: updatedAt, deleted: false })
                );
              }
            }
          } catch (e) { console.error('UserSyncDO seed ' + coll + ' error:', e); }
        }

        self._setSeq(seq);
        self.sql.exec(
          `INSERT INTO sync_meta (k, v) VALUES ('migrated', '1') ON CONFLICT(k) DO UPDATE SET v='1'`
        );
      } catch (e) {
        console.error('UserSyncDO migration error:', e);
        self._migPromise = null; // permite reintento
      }
    })();
    return this._migPromise;
  }

  /* ------------------------------ helpers ------------------------------ */

  _rowToItem(row) {
    const payload = JSON.parse(row.payload);
    return Object.assign({}, payload, {
      id: row.id,
      collection: row.collection,
      updatedAt: row.updated_at,
      deleted: row.deleted === 1,
      seq: row.seq,
    });
  }

  _getItem(id) {
    const row = this.sql.exec(`SELECT * FROM items WHERE id = ?`, id).toArray()[0];
    return row || null;
  }

  /** LWW: ¿el entrante gana al actual (fila SQLite)? */
  _incomingWins(currentRow, incoming) {
    if (!currentRow) return true;
    const a = Date.parse(incoming.updatedAt || 0);
    const b = Date.parse(currentRow.updated_at || 0);
    if (a !== b) return a > b;
    return true; // empate: el push más reciente gana (ya está serializado)
  }

  /* ------------------------------ core sync ---------------------------- */

  /**
   * Aplica los cambios del cliente (LWW), asigna seq nuevos y devuelve
   * también los cambios remotos que el cliente aún no tiene (since).
   */
  _applyPush(collection, since, changes) {
    let seq = this._getSeq();
    const applied = [];

    for (const change of changes || []) {
      if (!change || !change.id) continue;
      if (change.title === 'JSON_TASKS_DATA') continue; // fila-envoltorio del blob: nunca es una tarea
      const current = this._getItem(change.id);
      if (!this._incomingWins(current, change)) continue;

      seq += 1;
      const deleted = change.deleted === true ? 1 : 0;
      const payload = JSON.stringify(change);
      this.sql.exec(
        `INSERT INTO items (id, collection, updated_at, deleted, seq, payload)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           collection = excluded.collection,
           updated_at = excluded.updated_at,
           deleted    = excluded.deleted,
           seq        = excluded.seq,
           payload    = excluded.payload`,
        change.id, collection || change.collection || 'tasks',
        change.updatedAt || new Date().toISOString(), deleted, seq, payload
      );
      applied.push({ id: change.id, seq: seq });
    }

    if (applied.length) this._setSeq(seq);

    // Cambios remotos que el cliente aún no vio (excluye los recién aplicados).
    const appliedIds = new Set(applied.map((a) => a.id));
    const remote = this._pull(collection, since).items.filter((it) => !appliedIds.has(it.id));

    return { applied, remote, serverSeq: seq };
  }

  _pull(collection, since) {
    since = Number(since) || 0;
    let rows;
    if (collection) {
      rows = this.sql
        .exec(`SELECT * FROM items WHERE collection = ? AND seq > ? ORDER BY seq`, collection, since)
        .toArray();
    } else {
      rows = this.sql.exec(`SELECT * FROM items WHERE seq > ? ORDER BY seq`, since).toArray();
    }
    return { items: rows.map((r) => this._rowToItem(r)), serverSeq: this._getSeq() };
  }

  /* --------------------------- WebSocket live -------------------------- */

  _broadcast(items, exceptWs) {
    if (!items.length) return;
    const msg = JSON.stringify({ type: 'changes', items: items });
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exceptWs) continue;
      try { ws.send(msg); } catch (e) { /* socket cerrado */ }
    }
  }

  async webSocketMessage(ws, message) {
    let data;
    try { data = JSON.parse(message); } catch (e) { return; }

    await this._ensureMigrated();

    if (data.type === 'push') {
      const res = this._applyPush(data.collection, data.since, data.changes);
      // Confirma al emisor y difunde a los demás dispositivos de la cuenta.
      ws.send(JSON.stringify({ type: 'ack', applied: res.applied, serverSeq: res.serverSeq }));
      const appliedItems = res.applied
        .map((a) => this._getItem(a.id))
        .filter(Boolean)
        .map((r) => this._rowToItem(r));
      this._broadcast(appliedItems, ws);
      if (res.remote.length) ws.send(JSON.stringify({ type: 'changes', items: res.remote }));
    } else if (data.type === 'pull') {
      ws.send(JSON.stringify(Object.assign({ type: 'pull' }, this._pull(data.collection, data.since))));
    }
  }

  async webSocketClose(ws, code, reason, wasClean) {
    try { ws.close(code, reason); } catch (e) {}
  }

  /* ------------------------------- fetch ------------------------------- */

  async fetch(request) {
    const url = new URL(request.url);

    // El Worker inyecta X-User-Id desde el JWT verificado.
    const uid = request.headers.get('X-User-Id');
    if (uid) this._rememberUser(uid);

    // Upgrade a WebSocket (con hibernación). La migración corre en el 1er mensaje.
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    // Reseed SIN borrar: limpia solo el flag 'migrated' y re-corre la migración,
    // que SALTA los items ya presentes (tareas) y siembra los nuevos (listas/plantillas).
    // Así no se pierden las tareas del DO (el blob de D1 está obsoleto tras el corte).
    if (url.pathname.endsWith('/sync/reseed')) {
      this.sql.exec(`DELETE FROM sync_meta WHERE k = 'migrated'`);
      this._migPromise = null;
      await this._ensureMigrated();
      return Response.json({ ok: true, reseeded: true, serverSeq: this._getSeq() });
    }

    // Reseed: limpia el almacén del DO y re-migra desde D1 (ya autenticado por el Worker).
    if (url.pathname.endsWith('/sync/reset')) {
      this.sql.exec(`DELETE FROM items`);
      this.sql.exec(`DELETE FROM sync_meta WHERE k IN ('migrated','seq')`);
      this._migPromise = null;
      await this._ensureMigrated();
      return Response.json({ ok: true, reseeded: true, serverSeq: this._getSeq() });
    }

    await this._ensureMigrated();

    if (url.pathname.endsWith('/sync/push') && request.method === 'POST') {
      const body = await request.json();
      const res = this._applyPush(body.collection, body.since, body.changes);
      // Difunde a los WebSockets abiertos de esta cuenta.
      const appliedItems = res.applied
        .map((a) => this._getItem(a.id))
        .filter(Boolean)
        .map((r) => this._rowToItem(r));
      this._broadcast(appliedItems, null);
      return Response.json(res);
    }

    if (url.pathname.endsWith('/sync/pull') && request.method === 'GET') {
      const collection = url.searchParams.get('collection') || null;
      const since = url.searchParams.get('since') || 0;
      return Response.json(this._pull(collection, since));
    }

    return new Response('Not found', { status: 404 });
  }
}

/** Parse JSON tolerante para columnas D1 (images, etc.). */
function _safeParse(v, fallback) {
  if (v == null) return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch (e) { return fallback; }
}

/** Normaliza una tarea (fila D1 snake_case o item de blob camelCase) al payload del DO. */
function _normalizeTask(t) {
  // El frontend marca borrados con status==='deleted' (sin campo isDeleted).
  // También aceptamos isDeleted/is_deleted por compatibilidad con otros formatos.
  const isDeleted = t.is_deleted === 1 || t.is_deleted === true || t.isDeleted === true || t.status === 'deleted';
  return {
    id: t.id,
    title: t.title ?? '',
    notes: t.notes ?? '',
    images: _safeParse(t.images, []),
    due_date: t.due_date ?? t.dueDate ?? null,
    due_time: t.due_time ?? t.dueTime ?? null,
    status: t.status ?? 'pending',
    repeat_type: t.repeat_type ?? t.repeatType ?? t.repeat ?? null,
    template: t.template ?? null,
    is_event: t.is_event === 1 || t.is_event === true || t.isEvent === true,
    created_at: t.created_at ?? t.createdAt ?? null,
    updatedAt: t.updated_at || t.updatedAt || t.created_at || t.createdAt || new Date().toISOString(),
    deleted: isDeleted,
  };
}

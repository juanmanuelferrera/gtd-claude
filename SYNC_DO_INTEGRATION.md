# Sync en tiempo real con Durable Objects (estado final)

Sync multi-dispositivo **instantáneo** para tareas, listas y plantillas, mediante
un Durable Object por usuario. Reemplaza al sync viejo por polling (blob a
`/tasks|lists|templates/sync` en `hyperfiler-api`), que queda **neutralizado** en
el frontend.

## Arquitectura

- **Worker aislado `hyperfiler-sync`** (`sync-worker.mjs`) — NO se integró en el
  worker principal `hyperfiler-api` (para no arriesgar auth/Stripe). Hospeda el DO
  y enruta `/sync/*` al DO de cada usuario.
- **`UserSyncDO`** (`user-sync-do.js`) — un objeto por cuenta
  (`env.USER_SYNC.idFromName(userId)`). Almacén SQLite integrado:
  `items(id, collection, updated_at, deleted, seq, payload)`. LWW por `updatedAt`,
  `seq` monótono, y **broadcast por WebSocket** a los dispositivos abiertos.
- **Auth por delegación (Service Binding)** — el worker de sync NO comparte el
  `JWT_SECRET`. Valida el token llamando internamente (`env.API`) a
  `hyperfiler-api` (`GET /tasks/{userId}` → 200 = token válido). Caché de 60s.
- **Mismo origen** — routes `hyperfiler.pro/sync/*` y `www.hyperfiler.pro/sync/*`
  apuntan al worker `hyperfiler-sync`. Así el WebSocket **no es cross-site**
  (evita el bloqueo de Safari/ITP) → conecta y entrega al instante. El frontend
  usa `SYNC_BASE = location.origin + '/sync'`.

## Protocolo (`/sync/*`)

- `POST /push  { collection, since, changes:[{id,updatedAt,deleted,...}] }` → `{applied, remote, serverSeq}`
- `GET  /pull?collection=&since=<seq>` → `{items, serverSeq}`
- `WS   /ws?token=...` → empuje en vivo `{type:'changes', items}`
- `POST /reset`  → borra el almacén del DO y re-migra desde D1 (¡pierde cambios no reflejados en D1!).
- `POST /reseed` → limpia solo el flag `migrated` y re-siembra colecciones nuevas SIN borrar lo existente.

## Cliente (`js/core/`)

- **`LocalStore.js`** — almacén local-first. `items` con metadatos de sync
  (`dirty`, `seq`). Registro `synced` **separado** del objeto tarea, para que los
  writers directos de la app (que escriben `gtdTasks`/`gtd_list_sections`/
  `gtdTemplates` sin metadata) no rompan el push. `getPending` = `dirty` o
  `seq==null && !synced`. `_cmpKey` compara el contenido COMPLETO (JSON).
- **`SyncEngine.js`** — pull+push por colección, WebSocket para live, pull de
  reserva (30s) + `focus`/`visibilitychange` (sincroniza al enfocar la pestaña).

## Colecciones

- **`tasks`** — un item por tarea (formato camelCase de la app), LWW por-tarea.
- **`lists`** / **`templates`** — no encajan en el modelo plano (listas = árbol de
  secciones; plantillas = array de strings), así que se sincronizan como **un
  item-blob** por colección (`__lists__` / `__templates__`) que envuelve todo el
  bloque; LWW sobre el bloque entero. Un **bridge** en `hyperfiler-pro.html`
  reconcilia el localStorage de la app (`gtd_list_sections`/`gtdTemplates`, que la
  app escribe directo) con esos item-blob: sondeo de 2.5s para subir + subscribe
  `'sync'` para bajar y re-renderizar.

## Migración

`UserSyncDO.seedFromD1` (primera vez) siembra el SQLite del DO desde D1:
- tareas: desde el blob `user_tasks.task_data` (fila `JSON_TASKS_DATA`), expandido
  a items individuales.
- listas/plantillas: desde `user_lists.list_data` / `user_templates.templates_data`
  como item-blob.

## Deploy

```bash
wrangler deploy --config wrangler.sync-worker.toml         # worker hyperfiler-sync + routes
wrangler pages deploy . --project-name=hyperfiler --branch=master   # frontend
```

Los secrets del sync-worker: ninguno propio (usa el Service Binding a
`hyperfiler-api`). Tras cualquier deploy del frontend → **hard-refresh** en cada
navegador (cachea el JS).

# Integración del UserSyncDO en el Worker

Archivos nuevos:
- `user-sync-do.js` — la clase Durable Object (SQLite + push/pull + WebSocket).
- `wrangler.sync.toml` — binding `USER_SYNC` + migración SQLite (fusionar con tu config real).
- `js/core/LocalStore.js` — capa cliente (ya creada; se conecta en la fase de cliente).

## 1. Exportar el DO desde el Worker (2 líneas en `worker.js`)

Al principio de `worker.js`:

```js
import { UserSyncDO } from './user-sync-do.js';
```

Y junto al `export default { ... }`, re-exporta la clase:

```js
export { UserSyncDO };
export default { /* ...tu fetch handler actual... */ };
```

## 2. Enrutar las peticiones de sync al DO del usuario

Dentro de tu `fetch(request, env)`, antes o donde despachas rutas:

```js
if (url.pathname.startsWith('/sync/')) {
  // 1) Autenticación: saca el userId del JWT (ya lo haces con env.JWT_SECRET)
  const userId = await getUserIdFromJWT(request, env);   // tu helper existente
  if (!userId) return new Response('Unauthorized', { status: 401 });

  // 2) Enruta al Durable Object de ESA cuenta (mismo objeto para todos sus
  //    dispositivos, en cualquier equipo del mundo)
  const id = env.USER_SYNC.idFromName(userId);
  const stub = env.USER_SYNC.get(id);

  // 3) Reenvía la petición tal cual (incluye Upgrade de WebSocket)
  return stub.fetch(request);
}
```

Clave de seguridad: el `userId` sale del **JWT verificado en el Worker**, nunca del
cliente. Así un usuario solo puede tocar su propio DO.

## 3. Protocolo (cliente ↔ DO)

- `POST /sync/push`  body `{ collection, since, changes:[{id,updatedAt,deleted,...}] }`
  → `{ applied:[{id,seq}], remote:[items], serverSeq }`
- `GET  /sync/pull?collection=tasks&since=<seq>`
  → `{ items:[...], serverSeq }`
- `GET  /sync/ws`  (Upgrade: websocket)
  - enviar `{type:'push', collection, since, changes}` → recibe `{type:'ack',...}` y
    los demás dispositivos reciben `{type:'changes', items}` en vivo.
  - enviar `{type:'pull', collection, since}` → recibe `{type:'pull', items, serverSeq}`.

El cliente guarda `serverSeq` como cursor y avanza con cada respuesta. Conflictos:
LWW por `updatedAt` (la serialización del DO ya elimina las carreras).

## 4. Migración D1 → DO (perezosa, más adelante)

La primera vez que un usuario sincroniza, el Worker puede sembrar el SQLite de su
DO desde `user_tasks` de D1 (endpoint interno tipo `/sync/seed`) y marcarlo migrado.
No hace falta big-bang; se hace usuario a usuario.

## 5. Desplegar

El DO vive en el Worker (no en Pages). Deploy del Worker con la config fusionada:

```bash
wrangler deploy --config wrangler.sync.toml
```

La primera vez aplica la migración `v1` (crea la clase SQLite `UserSyncDO`).

## Estado

- [x] `UserSyncDO` (SQLite, push/pull, cursor seq, LWW, WebSocket + hibernación).
- [x] `wrangler.sync.toml` (binding + migración).
- [ ] Exportar/enrutar en `worker.js` (pasos 1-2 arriba).
- [ ] Cliente: `IndexedDBAdapter` + motor de sync que hable este protocolo.
- [ ] Migración perezosa D1 → DO.

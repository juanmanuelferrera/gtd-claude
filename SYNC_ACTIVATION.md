# Activación del sync en producción (web-only)

Requisitos previos:
- Worker desplegado con el DO: `wrangler deploy --config wrangler.sync.toml`
  (antes rellena `database_id` en el toml; `wrangler d1 list`).
- `js/tasks.js` ya enruta la persistencia por `LocalStore` (hecho, con fallback).

## 1. Cargar los módulos en `hyperfiler-pro.html`

Añade DESPUÉS de los scripts de core (junto a `js/core/*.js`) y ANTES de `js/tasks.js`:

```html
<script src="js/core/LocalStore.js?v=20260714-sync1"></script>
<script src="js/core/SyncEngine.js?v=20260714-sync1"></script>
```

(Recuerda subir el `?v=` al desplegar — regla de cache-busting del repo.)

## 2. Arrancar el motor tras el login

Pega este bloque al final del arranque de la app (cuando ya hay token). Es
idempotente y seguro: si falta algo, no rompe la app.

```html
<script>
(function () {
  // URL del Worker con el DO (ajústala a tu backend real):
  var SYNC_BASE = 'https://hyperfiler-sync.joanmanelferrera-400.workers.dev/sync';

  if (typeof LocalStore === 'undefined' || typeof SyncEngine === 'undefined') return;

  // IMPORTANTE: el engine usa el MISMO almacén que tasks.js (localStorage
  // 'gtdTasks'), no IndexedDB, para que compartan datos.
  var store = new LocalStore.LocalStorageAdapter();

  var engine = null;
  function tokenNow() { return localStorage.getItem('authToken'); }

  window.startSync = function () {
    if (engine || !tokenNow()) return;
    engine = new SyncEngine({
      store: store,
      baseUrl: SYNC_BASE,
      getToken: tokenNow,
      collections: ['tasks'],   // añade 'lists' cuando enrutes las listas por LocalStore
    });
    engine.start();
    console.log('🔄 SyncEngine iniciado');
  };
  window.stopSync = function () {
    if (engine) { engine.stop(); engine = null; console.log('⏹️ SyncEngine parado'); }
  };

  // Reactividad: cuando llega un cambio de OTRO dispositivo, refresca la UI.
  LocalStore.subscribe(function (evt) {
    if (evt.source === 'sync' && evt.collection === 'tasks') {
      if (typeof loadTasksFromLocalStorage === 'function') loadTasksFromLocalStorage();
      if (typeof renderCurrentView === 'function') renderCurrentView();
    }
  });

  // Arranca si ya hay sesión.
  if (tokenNow()) window.startSync();
})();
</script>
```

## 3. Enganchar login / logout

- Tras un **login** exitoso, llama a `window.startSync()`.
- En **logout**, llama a `window.stopSync()` (y opcionalmente limpia el almacén).

## Cómo queda el flujo

1. Editas una tarea → `saveTasksToLocalStorage()` → `LocalStore` marca el item `dirty`
   (y crea tombstones al borrar).
2. `LocalStore.subscribe(source:'local')` → el engine agenda un `push` (debounce 400ms).
3. El DO aplica (LWW), asigna `seq`, y **difunde por WebSocket** al resto de tus dispositivos.
4. En el otro dispositivo, el engine recibe `changes` → `bulkUpsert` en `gtdTasks` →
   emite `source:'sync'` → tu handler recarga y re-renderiza. **Sync en vivo.**

## Notas

- **Un solo almacén:** el engine y `tasks.js` comparten `localStorage['gtdTasks']`.
  No mezclar con IndexedDB todavía (sería un almacén distinto → desincronía).
  IndexedDB es una mejora futura que exige mover también `tasks.js` al modelo async.
- **CORS:** el Worker ya añade CORS a `/sync/*`. Si tu app corre en un origen no
  listado, añádelo a `allowedOrigins` en `worker.js`.
- **`hyperfiler-pro.html` local vs prod:** tu copia local está desincronizada
  (le faltan 7 `<script>`). Aplica estos cambios sobre la versión que de verdad
  despliegas, no sobre una copia obsoleta.
- **Listas:** hoy solo se sincroniza `tasks`. Para sincronizar listas, enruta su
  persistencia por `LocalStore` (colección `lists`) igual que hicimos con tareas,
  y añade `'lists'` a `collections`.

## Verificación rápida (2 dispositivos / 2 pestañas)

1. Abre la app en dos navegadores con la MISMA cuenta.
2. Crea una tarea en A → debe aparecer en B en 1-2 s (WebSocket).
3. Edítala en B → cambia en A.
4. Bórrala en A → desaparece en B.
5. Pon uno offline, edita, vuelve online → concilia.

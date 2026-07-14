/**
 * sync-worker.mjs — Worker DEDICADO al sync (Durable Object por usuario).
 *
 * Aislado del Worker principal (auth/Stripe) → desplegarlo NO toca producción.
 * Solo hace: verificar el JWT (mismo JWT_SECRET que el backend) y enrutar
 * /sync/* al UserSyncDO de esa cuenta.
 *
 * Deploy:  wrangler deploy --config wrangler.sync-worker.toml
 * Secreto: wrangler secret put JWT_SECRET   (mismo valor que el backend)
 */
import { UserSyncDO } from './user-sync-do.js';
export { UserSyncDO };

const ALLOWED = [
  'https://hyperfiler.pro',
  'https://www.hyperfiler.pro',
  'https://hyperfiler.pages.dev',
  'https://gtd-claude.pages.dev',
  'http://localhost:8000',
  'http://localhost:8010',
];

function corsFor(request) {
  const origin = request.headers.get('Origin');
  const ok = ALLOWED.includes(origin) || (origin && /^https:\/\/[a-f0-9]{8}\.hyperfiler\.pages\.dev$/.test(origin));
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'https://hyperfiler.pro',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function getAuthToken(request) {
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.substring(7);
  try { const t = new URL(request.url).searchParams.get('token'); if (t) return t; } catch (e) {}
  return null;
}

// Validación del token DELEGADA al backend (que tiene el JWT_SECRET real).
// Decodifica el payload localmente (userId + exp) y confirma que el token es
// genuino llamando a un endpoint autenticado y ligero del backend
// (GET /sync/info/{userId} → 200 solo si la firma es válida y el userId coincide).
// Así hyperfiler-sync NO necesita compartir el JWT_SECRET.
const DEFAULT_API_BASE = 'https://hyperfiler-api.joanmanelferrera-400.workers.dev';
const _tokCache = new Map(); // token -> { payload, until }  (caché corta por isolate)
async function verifyToken(token, env) {
  if (!token) return null;
  const now = Date.now();
  const hit = _tokCache.get(token);
  if (hit && hit.until > now) return hit.payload;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    var b = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    const payload = JSON.parse(atob(b));
    if (!payload || !payload.userId) return null;
    if (payload.exp && payload.exp < now / 1000) return null;
    const apiBase = (env && env.API_BASE) || DEFAULT_API_BASE;
    // Confirma que el token es genuino contra un endpoint autenticado del backend
    // (que tiene el JWT_SECRET real). /tasks/{userId} → 200 solo si el token es válido.
    // Vía Service Binding (env.API) → llamada interna que NO pasa por el edge/WAF.
    const doFetch = (env && env.API && env.API.fetch) ? env.API.fetch.bind(env.API) : fetch;
    const res = await doFetch(apiBase + '/tasks/' + encodeURIComponent(payload.userId), {
      headers: {
        'Authorization': 'Bearer ' + token,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://hyperfiler.pro',
      },
    });
    if (res.status !== 200) return null;
    _tokCache.set(token, { payload: payload, until: now + 60000 }); // 60 s
    return payload;
  } catch (e) { return null; }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsFor(request);

    if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });

    if (!url.pathname.startsWith('/sync/')) {
      return new Response('hyperfiler-sync ok', { headers: cors });
    }
    if (!env.USER_SYNC) {
      return new Response(JSON.stringify({ error: 'USER_SYNC binding missing' }), { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const payload = await verifyToken(getAuthToken(request), env);
    if (!payload || !payload.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const stub = env.USER_SYNC.get(env.USER_SYNC.idFromName(String(payload.userId)));
    const fwd = new Request(request, { headers: new Headers(request.headers) });
    fwd.headers.set('X-User-Id', String(payload.userId));

    if (request.headers.get('Upgrade') === 'websocket') return stub.fetch(fwd);

    const res = await stub.fetch(fwd);
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(cors)) out.headers.set(k, v);
    return out;
  },
};

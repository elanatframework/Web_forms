/* WebForms Core Technology - Module: Service Worker */

const STATIC_ASSETS = ["/index.html", "/assets/styles/main.css", "/assets/scripts/web-forms.js"];
const STATIC_CACHE = "sw-static-v1";
const DYNAMIC_CACHE = "sw-dynamic-v1";
const META_CACHE = "sw-meta-v1";
let ROUTES = [];
let ALIASES = []; // { from, to }
const DEFAULT_NOTIFICATION_ICON = "/icon.png";
const DEFAULT_NOTIFICATION_BADGE = "/badge.png";
const DEFAULT_NOTIFICATION_URL = '/';

// IndexedDB
function idbOpen()
{
    return new Promise((resolve, reject) =>
    {
        const r = indexedDB.open("SW_DB", 1);
        r.onupgradeneeded = () =>
        {
            const db = r.result;
            if (!db.objectStoreNames.contains("routes"))
                db.createObjectStore("routes", { keyPath: "pattern" });

            if (!db.objectStoreNames.contains("aliases"))
                db.createObjectStore("aliases", { keyPath: "from" });
        };
        r.onerror = () => reject(r.error);
        r.onsuccess = () => resolve(r.result);
    });
}

async function idbPut(store, value)
{
    const db = await idbOpen();
    return new Promise((resolve, reject) =>
    {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).put(value);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function idbGetAll(store)
{
    const db = await idbOpen();
    return new Promise((resolve, reject) =>
    {
        const tx = db.transaction(store, "readonly");
        const req = tx.objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function idbDelete(store, key)
{
    const db = await idbOpen();
    return new Promise((resolve, reject) =>
    {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Helpers
const pathOf = req => { try { return new URL(req.url).pathname } catch (e) { return req.url } };

function matchPattern(pattern, path)
{
    if (!pattern)
        return false;

    if (pattern.startsWith('re:'))
    {
        const re = new RegExp(pattern.slice(3));
        return re.test(path);
    }

    if (pattern === path)
        return true;

    if (pattern.endsWith('*'))
        return path.startsWith(pattern.slice(0, -1));

    return false;
}

function findRoute(req)
{
    const p = pathOf(req);

    for (const r of ROUTES)
        if (matchPattern(r.pattern, p))
            return r;

    for (const a of ALIASES)
        if (matchPattern(a.from, p))
            return { type: "alias", target: a.to };

    return null;
}

// TTL helpers using META_CACHE
async function setMeta(url, meta)
{
    const c = await caches.open(META_CACHE);
    await c.put(url, new Response(JSON.stringify(meta), { headers: { "Content-Type": "application/json" } }));
}

async function getMeta(url)
{
    const c = await caches.open(META_CACHE);
    const r = await c.match(url);

    if (!r)
        return null;

    try
    {
        return await r.json();
    }
    catch (e)
    {
        return null;
    }
}

async function delMeta(url)
{
    const c = await caches.open(META_CACHE);
    await c.delete(url);
}

// Strategies (do not auto-cache unless route.cacheDynamic true)
async function cacheFirst(req)
{
    const cached = await caches.match(req);
    return cached || fetch(req).catch(() => cached);
}

async function networkFirst(req)
{
    try
    {
        const r = await fetch(req);
        return r.ok ? r : (await caches.match(req)) || r
    }
    catch (e)
    {
        return (await caches.match(req)) || Response.error();
    }
}

async function networkOnly(req)
{
    return fetch(req);
}

async function cacheOnly(req)
{
    return (await caches.match(req)) || new Response("Not in cache", { status: 404 });
}
async function staleWhileRevalidate(req)
{
    const cached = await caches.match(req);
    const network = fetch(req).then(r =>
    {
        if (r && r.ok) {/* optional: handled by route.cacheDynamic */ }
        return r;
    }).catch(() => null);
    return cached || (await network) || new Response("Not found", { status: 404 });
}

// Lifecycle
self.addEventListener("install", e =>
{
    e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(STATIC_ASSETS)));
    self.skipWaiting();
});

self.addEventListener("activate", e =>
{
    e.waitUntil((async () =>
    {
        const keys = await caches.keys();
        await Promise.all(
            keys.filter(k => ![STATIC_CACHE, DYNAMIC_CACHE, META_CACHE].includes(k))
                .map(k => caches.delete(k))
        );

        ROUTES = (await idbGetAll("routes")) || [];
        ALIASES = (await idbGetAll("aliases")) || [];

        self.clients.claim();
    })());
});

// fetch handling with alias, TTL enforcement
self.addEventListener("fetch", event =>
{
    const req = event.request;

    if (req.method !== "GET" || req.headers.has("Post-Back"))
        return event.respondWith(fetch(req)); // non-GET passthrough

    const route = findRoute(req);

    event.respondWith((async () =>
    {
        if (route && route.type === "alias")
        {
            let targetUrl = route.target;
            if (route.from && route.from.startsWith("re:"))
            {
                try
                {
                    const re = new RegExp(route.from.slice(3));
                    targetUrl = pathOf(req).replace(re, route.target);
                } catch (e)
                {
                    targetUrl = route.target;
                    console.warn("[Service Worker] Invalid regex in alias:", route.from, e);
                }
            }
            else if (targetUrl.includes('*'))
            {
                const wildcardPart = pathOf(req).slice(route.from.indexOf('*'));
                targetUrl = targetUrl.replace('*', wildcardPart);
            }

            const targetReq = new Request(targetUrl, { method: "GET", headers: req.headers });

            let resp = await caches.match(targetReq);

            if (!resp)
            {
                try
                {
                    resp = await fetch(targetReq);
                }
                catch (e)
                {
                    return new Response("Alias target not found", { status: 404 });
                }
            }

            return resp;
        }

        if (route)
        {
            let res;
            switch (route.type)
            {
                case "cachefirst": res = await cacheFirst(req); break;
                case "networkfirst": res = await networkFirst(req); break;
                case "cacheonly": res = await cacheOnly(req); break;
                case "networkonly": res = await networkOnly(req); break;
                case "stalerevalidate": res = await staleWhileRevalidate(req); break;
                default: res = await networkOnly(req);
            }
            // TTL check if from dynamic cache
            const meta = await getMeta(req.url);
            if (meta && meta.ttl)
            {
                const age = (Date.now() - (meta.ts || 0)) / 1000;
                if (age > meta.ttl)
                {
                    // expired: remove and refetch
                    const dc = await caches.open(DYNAMIC_CACHE);
                    await dc.delete(req);
                    await delMeta(req.url);
                    try
                    {
                        const fresh = await fetch(req);
                        if (fresh && fresh.ok && route.cacheDynamic)
                        {
                            const clone = fresh.clone();
                            (await caches.open(DYNAMIC_CACHE)).put(req, clone);
                            await setMeta(req.url, { ts: Date.now(), ttl: meta.ttl });
                        }
                        return fresh;
                    }
                    catch (e)
                    {
                        return res || Response.error();
                    }
                }
            }

            // if route requests caching of successful network responses, store
            if (route.cacheDynamic && res && res.ok && res.type !== "opaque")
            {
                const c = await caches.open(DYNAMIC_CACHE);
                c.put(req, res.clone());
                // if no meta exists, no TTL set; user can set TTL later
            }
            // fallback to static cache if nothing
            if (!res)
            {
                const s = await caches.match(req);
                if (s)
                    return s;
            }
            return res;
        }

        // default: serve static if exists else network
        return (await caches.match(req)) || fetch(req);
    })());
});

// Message RPC handlers
const handlers = {
    "skip-waiting": async () => { self.skipWaiting(); return { ok: true } },

    "route-set": async ({ pattern, type, cacheDynamic }) =>
    {
        ROUTES = ROUTES.filter(r => r.pattern !== pattern);
        const obj = { pattern, type, cacheDynamic: !!cacheDynamic };
        ROUTES.push(obj);

        await idbPut("routes", obj);
        return { ok: true };
    },

    "route-remove": async ({ pattern }) =>
    {
        await idbDelete("routes", pattern);
        ROUTES = ROUTES.filter(r => r.pattern !== pattern);
        return { ok: true };
    },

    "route-clear": async () =>
    {
        ROUTES = [];
        ALIASES = [];

        const db = await idbOpen();
        const tx = db.transaction(["routes", "aliases"], "readwrite");
        tx.objectStore("routes").clear();
        tx.objectStore("aliases").clear();

        return { ok: true };
    },

    "route-alias": async ({ from, to }) =>
    {
        ALIASES = ALIASES.filter(a => a.from !== from);
        const obj = { from, to };
        ALIASES.push(obj);

        await idbPut("aliases", obj);
        return { ok: true };
    },

    "route-remove-alias": async ({ from } = {}) =>
    {
        if (!from)
        {
            ALIASES = [];
            const db = await idbOpen();
            const tx = db.transaction("aliases", "readwrite");
            tx.objectStore("aliases").clear();
            return { ok: true, removedAll: true };
        }

        ALIASES = ALIASES.filter(a => a.from !== from);
        await idbDelete("aliases", from);
        return { ok: true, removed: from };
    },

    "cache-add": async ({ url, ttl }) =>
    {
        const path = new URL(url, location.origin).pathname;

        const route = ROUTES.find(r => matchPattern(r.pattern, path));
        if (!route)
            throw new Error("[Service Worker] Route not found: " + url);

        const res = await fetch(url);
        if (!res || !res.ok)
            throw new Error("[Service Worker] Fetch failed: " + url);

        const c = await caches.open(DYNAMIC_CACHE);
        await c.put(url, res.clone());

        if (ttl)
            await setMeta(url, { ts: Date.now(), ttl });

        return { ok: true };
    },

    "cache-remove": async ({ url }) =>
    {
        const c = await caches.open(DYNAMIC_CACHE);
        const removed = await c.delete(url);
        await delMeta(url);
        return { ok: true, removed };
    },

    "cache-has": async ({ url }) =>
    {
        const c = await caches.open(DYNAMIC_CACHE);
        const m = await c.match(url);
        return { ok: true, has: !!m };
    },

    "cache-list": async () =>
    {
        const c = await caches.open(DYNAMIC_CACHE);
        const keys = await c.keys();
        return { ok: true, urls: keys.map(k => k.url) };
    },

    "cache-clear": async () =>
    {
        await caches.delete(DYNAMIC_CACHE);
        await caches.open(DYNAMIC_CACHE);
        await caches.delete(META_CACHE);
        await caches.open(META_CACHE);
        return { ok: true };
    },

    "static-precache": async ({ assets }) =>
    {
        if (!Array.isArray(assets))
            throw new Error("[Service Worker] Assets must be array");

        const c = await caches.open(STATIC_CACHE);
        await c.addAll(assets);
        return { ok: true };
    },

    "static-list": async () => { const c = await caches.open(STATIC_CACHE); const keys = await c.keys(); return { ok: true, urls: keys.map(k => k.url) }; },

    "set-ttl": async ({ url, ttl }) =>
    {
        if (!url)
            throw new Error("[Service Worker] No url");
        await setMeta(url, { ts: Date.now(), ttl });
        return { ok: true };
    }
};

function respond(port, id, payload)
{
    port.postMessage({ id, result: payload });
}

self.addEventListener("message", event =>
{
    const data = event.data || {}; const id = data.id; const action = data.action; const payload = data.payload || {};
    const port = (event.ports && event.ports[0]) || { postMessage: () => { } };

    if (!action || !handlers[action])
        return respond(port, id, { ok: false, error: "unknown" });

    handlers[action](payload).then(r => respond(port, id, { ok: true, data: r })).catch(err => respond(port, id, { ok: false, error: err && err.message }));
});

// Receive Push messages from the server
self.addEventListener("push", event =>
{
    let data = {};
    try
    {
        data = event.data.json();
    }
    catch
    {

    }

    event.waitUntil(
        self.registration.showNotification(data.title || "Notification", {
            body: data.body || "",
            icon: data.icon || DEFAULT_NOTIFICATION_ICON,
            badge: data.badge || DEFAULT_NOTIFICATION_BADGE,
            actions: data.actions || []
        })
    );
});

// Notification click management
self.addEventListener("notificationclick", event =>
{
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window" }).then(clientsArr =>
        {
            if (clientsArr.length > 0)
                clients.openWindow(data.url || DEFAULT_NOTIFICATION_URL)
            else
                clients.openWindow(DEFAULT_NOTIFICATION_URL);
        })
    );

});

// What's It To Me? service worker (round eight, point 18: the installable web app step).
// Pages: always fetched fresh; a copy of each page you open is kept so it still opens with no signal (on polling
// day, in a queue). Files that never change (scripts, fonts, images): served from the copy.
// Nothing about you is stored here beyond the pages you opened, on your own device. To switch this off everywhere,
// publish a sw.js that only calls self.registration.unregister().
const VERSION = "v1";
const PAGES = `pages-${VERSION}`, FILES = `files-${VERSION}`;
const MAX_PAGES = 40;
const NEVER = /^\/(review|api|candidates\/submit|\.netlify)/;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== PAGES && k !== FILES).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trim() {
  const c = await caches.open(PAGES); const keys = await c.keys();
  for (const r of keys.slice(0, Math.max(0, keys.length - MAX_PAGES))) await c.delete(r);
}

const esc = (s) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

// With no signal and no copy of the page asked for: a plain page, built here, listing the pages this device has kept.
async function offlinePage() {
  const c = await caches.open(PAGES); const items = [];
  for (const req of (await c.keys()).reverse()) {
    const res = await c.match(req); if (!res) continue;
    const m = (await res.text()).match(/<title>([^<]*)<\/title>/);
    const u = new URL(req.url);
    items.push(`<li><a href="${esc(u.pathname + u.search)}">${m ? m[1] : esc(u.pathname)}</a></li>`);
  }
  const body = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>You're offline · What's It To Me?</title>
<style>body{font:17px/1.5 system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 16px;color:#16161a;background:#fff}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}a{color:#fff}}li{margin:.5rem 0}.m{color:#666;font-size:.9rem}</style></head>
<body><h1>You&rsquo;re offline</h1><p>There&rsquo;s no connection right now, and that page hasn&rsquo;t been opened on this device before.</p>
${items.length ? `<p>These pages were kept on this device and still open:</p><ul>${items.join("")}</ul>` : "<p>No pages have been kept yet. Once you&rsquo;re online, open your ballot and it will be kept here.</p>"}
<p class="m">Each is a copy from when you last opened it. Candidate lists can change; check again when you&rsquo;re back online.</p></body></html>`;
  return new Response(body, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

self.addEventListener("fetch", (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || NEVER.test(url.pathname) || url.searchParams.has("_rsc")) return;
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok && res.type === "basic" && (res.headers.get("Content-Type") || "").includes("text/html")) {
          const copy = res.clone(); e.waitUntil(caches.open(PAGES).then(async (c) => { await c.delete(req); await c.put(req, copy); }).then(trim));
        }
        return res;
      } catch {
        return (await caches.match(req, { cacheName: PAGES })) || offlinePage();
      }
    })());
    return;
  }
  if (/^\/(_next\/static|fonts|brand|icons|vendor)\//.test(url.pathname)) {
    e.respondWith(caches.open(FILES).then(async (c) => {
      const hit = await c.match(req); if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) e.waitUntil(c.put(req, res.clone()).then(async () => { const k = await c.keys(); for (const r of k.slice(0, Math.max(0, k.length - 300))) await c.delete(r); }));
      return res;
    }));
  }
});

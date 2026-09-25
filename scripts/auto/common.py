"""Shared helpers for the automatic refresh jobs in scripts/auto/.

Every job reads public sources, writes through the Supabase service role, and records one row in job_runs so that
/status and the weekly review can say what ran, when, and whether it worked. Without SUPABASE_SERVICE_ROLE_KEY a job
runs as a dry run: it reads through the public key and prints what it would write.
"""
import contextlib, datetime, hashlib, html, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SUPABASE_URL = (os.environ.get("SUPABASE_URL") or "https://urufvcutpksjppbjxouc.supabase.co").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
PUBLIC_KEY = "sb_publishable_DYz0KZAckWIg4Cf_34ACSg_gXJihTW8"
DRY = not SERVICE_KEY
NAMED_UA = "What's It To Me? (whatsittome.org) data refresh; hello@whatsittome.org"
BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch(url: str, browser: bool = False, timeout: int = 60, tries: int = 3, data: bytes | None = None,
          headers: dict | None = None, method: str | None = None) -> tuple[int, bytes, dict]:
    """GET (or POST) a URL. Returns (status, body, headers); never raises for HTTP errors, only after repeated network failure."""
    h = {"User-Agent": BROWSER_UA if browser else NAMED_UA, "Accept": "*/*"}
    h.update(headers or {})
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=h, method=method), timeout=timeout) as r:
                return r.status, r.read(), dict(r.headers)
        except urllib.error.HTTPError as ex:
            if ex.code in (429, 502, 503, 504) and i < tries - 1:
                time.sleep(5 * (i + 1)); continue
            return ex.code, ex.read() if ex.fp else b"", dict(ex.headers or {})
        except Exception as ex:  # timeouts, resets
            last = ex
            if i < tries - 1: time.sleep(5 * (i + 1))
    raise RuntimeError(f"{url}: {last}")


def get_json(url: str, **kw):
    status, body, _ = fetch(url, **kw)
    if status != 200: raise RuntimeError(f"{url}: HTTP {status}")
    return json.loads(body.decode("utf-8", "replace"))


# ---------- database ----------
def _db(path: str, method: str = "GET", body=None, prefer: str | None = None):
    key = SERVICE_KEY or PUBLIC_KEY
    h = {"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json"}
    if prefer: h["Prefer"] = prefer
    req = urllib.request.Request(SUPABASE_URL + "/rest/v1" + path, data=json.dumps(body, default=str).encode() if body is not None else None, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            raw = r.read()
            return json.loads(raw) if raw and r.headers.get("Content-Type", "").startswith("application/json") else None
    except urllib.error.HTTPError as ex:
        raise SystemExit(f"Database refused {method} {path.split('?')[0]}: HTTP {ex.code} {ex.read().decode()[:500]}")


def select(path: str) -> list:
    """Read every row (pages of 1,000)."""
    out, off = [], 0
    sep = "&" if "?" in path else "?"
    while True:
        rows = _db(f"{path}{sep}limit=1000&offset={off}") or []
        out += rows
        if len(rows) < 1000: return out
        off += 1000


def write(table: str, rows: list, on_conflict: str | None = None):
    if not rows: return
    if DRY:
        print(f"[dry run] would write {len(rows)} rows to {table}; first: {json.dumps(rows[0], default=str)[:300]}"); return
    q = f"?on_conflict={on_conflict}" if on_conflict else ""
    prefer = ("resolution=merge-duplicates," if on_conflict else "") + "return=minimal"
    for i in range(0, len(rows), 500):
        _db(f"/{table}{q}", "POST", rows[i:i + 500], prefer)


def remove(table: str, filt: str):
    if DRY:
        print(f"[dry run] would delete from {table} where {filt}"); return
    _db(f"/{table}?{filt}", "DELETE", prefer="return=minimal")


def patch(table: str, filt: str, body: dict):
    if DRY:
        print(f"[dry run] would update {table} where {filt}: {body}"); return
    _db(f"/{table}?{filt}", "PATCH", body, "return=minimal")


@contextlib.contextmanager
def job(name: str):
    """Record the run in job_runs. The body sets state['rows'] and state['note']; an exception marks the run failed."""
    started = now_iso(); state = {"rows": None, "note": None}
    print(f"== {name} started {started}{' (dry run)' if DRY else ''}", flush=True)
    try:
        yield state
    except BaseException as ex:
        msg = f"{type(ex).__name__}: {ex}"[:900]
        print(f"== {name} FAILED: {msg}", flush=True)
        if not DRY: _db("/job_runs", "POST", [{"job": name, "started_at": started, "ok": False, "rows": state["rows"], "note": msg}], "return=minimal")
        raise
    print(f"== {name} ok: {state['rows']} rows. {state['note'] or ''}", flush=True)
    if not DRY: _db("/job_runs", "POST", [{"job": name, "started_at": started, "ok": True, "rows": state["rows"], "note": state["note"]}], "return=minimal")


# ---------- councils ----------
def councils() -> list:
    return json.load(open(os.path.join(ROOT, "lib", "councils.json")))["councils"]


# ---------- text ----------
def page_text(body: bytes, content_type: str = "") -> str:
    """Readable text from HTML or PDF, for checking that a quotation is still present."""
    if body[:5] == b"%PDF-" or "pdf" in content_type.lower():
        try:
            import io
            from pdfminer.high_level import extract_text
            return extract_text(io.BytesIO(body))
        except Exception as ex:
            return f"__pdf_unreadable__ {ex}"
    t = body.decode("utf-8", "replace")
    t = re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", t)
    t = re.sub(r"(?s)<[^>]+>", " ", t)
    return html.unescape(t)


def norm(t: str) -> str:
    t = t.lower().replace("­", "")
    t = re.sub(r"[‘’‛′`]", "'", t)
    t = re.sub(r"[“”″]", '"', t)
    t = re.sub(r"[‐-―−]", "-", t)
    t = re.sub(r"[^a-z0-9£%]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def quote_found(quote: str, text_norm: str) -> bool:
    q = norm(quote)
    if not q: return True
    if q in text_norm: return True
    # Long quotations split across PDF lines or page furniture: accept if every 8-word window is present.
    words = q.split()
    if len(words) < 12: return False
    windows = [" ".join(words[i:i + 8]) for i in range(0, len(words) - 7, 4)]
    return all(w in text_norm for w in windows)


def sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

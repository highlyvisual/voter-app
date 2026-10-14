import { Directory, File, Paths } from 'expo-file-system';
import type { AppReceiptSetRef, BallotResponse, ElectionsResponse, MetaResponse, ReceiptSetResponse, TopicsResponse } from '@/lib/appApi';

// Everything the app shows comes from whatsittome.org through /api/app/v1 (contract: lib/appApi.ts). The app holds no
// content of its own. Replies are kept on the phone so the last ballot opened still reads offline.
export const SITE = 'https://whatsittome.org';
export const API = `${SITE}/api/app/v1`;

type Ok<T> = Extract<T, { ok: true }>;
export type Loaded<T> = { data: T; fromCache: boolean; savedAt: string | null };

const dir = new Directory(Paths.cache, 'whatsittome');
function cacheFile(name: string) {
  if (!dir.exists) dir.create({ idempotent: true, intermediates: true });
  return new File(dir, name.replace(/[^A-Za-z0-9._-]/g, '_'));
}
async function readCache<T>(name: string): Promise<{ data: T; savedAt: string } | null> {
  try {
    const f = cacheFile(name);
    if (!f.exists) return null;
    return JSON.parse(await f.text()) as { data: T; savedAt: string };
  } catch {
    return null;
  }
}
function writeCache(name: string, data: unknown) {
  try {
    const f = cacheFile(name);
    if (f.exists) f.delete();
    f.create();
    f.write(JSON.stringify({ data, savedAt: new Date().toISOString() }));
  } catch {
    // A full disk or a read-only cache only costs the offline copy.
  }
}

export class OfflineError extends Error {}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) });
  } catch {
    throw new OfflineError("We couldn't reach What's It To Me?. Check your connection and try again.");
  }
  try {
    return (await r.json()) as T;
  } catch {
    throw new Error('The website sent something we could not read. Please try again in a minute.');
  }
}

// Network first; if that fails, the copy kept from last time, marked as such.
async function cached<T extends { ok: boolean }>(name: string, url: string): Promise<Loaded<Ok<T>>> {
  try {
    const j = await getJson<T>(url);
    if (!j.ok) throw new Error((j as unknown as { message?: string }).message ?? 'Something went wrong.');
    writeCache(name, j);
    return { data: j as Ok<T>, fromCache: false, savedAt: null };
  } catch (e) {
    const c = await readCache<Ok<T>>(name);
    if (c && e instanceof OfflineError) return { data: c.data, fromCache: true, savedAt: c.savedAt };
    throw e;
  }
}

export function lookupElections(postcode: string) {
  return getJson<ElectionsResponse>(`${API}/elections`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postcode }) });
}

export function loadMeta() {
  return getJson<MetaResponse>(`${API}/meta`);
}

export function loadTopics() {
  return cached<TopicsResponse>('topics.json', `${API}/topics`);
}

export function loadBallot(id: string) {
  return cached<BallotResponse>(`ballot-${id}.json`, `${API}/ballot/${encodeURIComponent(id)}`);
}

// A reform set is the same for everyone and versioned by its URL, so once downloaded it is reused until the version
// changes. The household's own row is looked up on the phone (lib/household.ts gridKey); its answers are never sent.
const sets = new Map<string, Ok<ReceiptSetResponse>>();
export async function loadReceiptSet(ref: AppReceiptSetRef): Promise<Ok<ReceiptSetResponse>> {
  const name = `set-${ref.id}-${ref.url.split('?v=')[1] ?? ''}.json`;
  const mem = sets.get(name);
  if (mem) return mem;
  const c = await readCache<Ok<ReceiptSetResponse>>(name);
  if (c) { sets.set(name, c.data); return c.data; }
  const j = await getJson<ReceiptSetResponse>(ref.url);
  if (!j.ok) throw new Error(j.message);
  writeCache(name, j);
  sets.set(name, j);
  return j;
}

export function savedAtText(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

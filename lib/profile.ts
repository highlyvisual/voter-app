import { PERSONAL_KEYS } from "@/lib/personal";
// The user's profile lives on their own device only (localStorage). It is never sent to us or stored on a server;
// it is only ever turned into URL parameters for pages the user opens, exactly as if they had chosen the bands by hand.
export type Profile = Record<string, string> & { postcode?: string };
const KEY = "tsm-profile";
export function readProfile(): Profile | null {
  try { const s = localStorage.getItem(KEY); return s ? (JSON.parse(s) as Profile) : null; } catch { return null; }
}
export function writeProfile(p: Profile) {
  try { const clean = Object.fromEntries(Object.entries(p).filter(([, v]) => v)); localStorage.setItem(KEY, JSON.stringify(clean)); window.dispatchEvent(new Event("profile-changed")); } catch {}
}
export function clearProfile() {
  try { localStorage.removeItem(KEY); window.dispatchEvent(new Event("profile-changed")); } catch {}
}
export const HOUSEHOLD_KEYS = ["age_band", "household", "children", "tenure", "income_band", "employment", "student", "disability", "carer", "visa", "benefits", "drives", "veteran"];
export function profileQuery(p: Profile | null): string {
  if (!p) return "";
  const q = new URLSearchParams();
  for (const k of HOUSEHOLD_KEYS) if (p[k]) q.set(k, p[k]);
  return q.toString();
}

// Answers about the person (lib/personal.ts): kept with the saved profile if there is one, otherwise only for this
// browser session. Never part of profileQuery, so never in a page address, and never sent to us.
const SESSION_KEY = "tsm-personal";
export function readPersonal(): Record<string, string> | null {
  const out: Record<string, string> = {};
  const p = readProfile();
  if (p) for (const k of PERSONAL_KEYS) if (p[k]) out[k] = p[k];
  if (!Object.keys(out).length) { try { const s = sessionStorage.getItem(SESSION_KEY); if (s) Object.assign(out, JSON.parse(s)); } catch {} }
  return Object.keys(out).length ? out : null;
}
export function writeSessionPersonal(v: Record<string, string>) {
  try { const clean = Object.fromEntries(Object.entries(v).filter(([k, x]) => x && (PERSONAL_KEYS as string[]).includes(k))); if (Object.keys(clean).length) sessionStorage.setItem(SESSION_KEY, JSON.stringify(clean)); else sessionStorage.removeItem(SESSION_KEY); window.dispatchEvent(new Event("profile-changed")); } catch {}
}
export function clearPersonal() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    const p = readProfile(); if (p) { const next = { ...p }; for (const k of PERSONAL_KEYS) delete next[k]; localStorage.setItem(KEY, JSON.stringify(next)); }
    window.dispatchEvent(new Event("profile-changed"));
  } catch {}
}

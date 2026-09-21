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

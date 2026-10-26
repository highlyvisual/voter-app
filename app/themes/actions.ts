"use server";

import { redirect } from "next/navigation";
import { listBallots } from "@/lib/data";
import { ballotsForPostcode } from "@/lib/democracyclub";
import { constituencySlug, isHomeSub } from "@/lib/homeTopics";
import { HOUSEHOLD_KEYS } from "@/lib/profile";

// The postcode box on a Your Home page, for someone this browser doesn't know yet. A POST, so the postcode never appears
// in an address, a log or a redirect (as app/find/actions.ts). Only what the page needs travels on: the outward code,
// a point rounded to about 100 m, the constituency (to find who stood there in 2024) and, if there is one we cover, the
// ballot for the next election at that address.
export async function homePostcode(formData: FormData) {
  const raw = String(formData.get("postcode") ?? "").replace(/\s+/g, "").toUpperCase();
  const sub = String(formData.get("sub") ?? "");
  const base = `/themes/your-home/${isHomeSub(sub) ? sub : "renting"}`;
  const keep = new URLSearchParams();
  for (const k of [...HOUSEHOLD_KEYS, "as", "profile"]) { const v = String(formData.get(k) ?? "").trim(); if (v && /^[a-z0-9_]{1,30}$/.test(v)) keep.set(k, v); }
  const fail = (m: string): never => { keep.set("error", m); redirect(`${base}?${keep.toString()}#compare`); };
  if (!/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(raw)) fail("That doesn't look like a UK postcode. Check it and try again, for example WC1H 9JE.");

  type Pio = { latitude: number | null; longitude: number | null; country?: string; parliamentary_constituency?: string | null };
  let pio: Pio | null = null;
  let missing = false;
  try {
    const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(raw)}`, { signal: AbortSignal.timeout(6000), next: { revalidate: 86400 } });
    if (r.ok) pio = ((await r.json()) as { result?: Pio }).result ?? null;
    else if (r.status === 404) missing = true;
  } catch { pio = null; }
  if (!pio) fail(missing ? "We can't find that postcode. Please check it and try again." : "We couldn't look up that postcode just now. Please try again in a minute.");
  if (pio!.latitude == null || !["England", "Scotland", "Wales", "Northern Ireland"].includes(pio!.country ?? "")) fail("That postcode is outside the UK. This site covers England, Scotland, Wales and Northern Ireland.");

  keep.set("pc", raw.slice(0, -3));
  keep.set("loc", `${Number(pio!.latitude).toFixed(3)},${Number(pio!.longitude).toFixed(3)}`);
  if (pio!.parliamentary_constituency) keep.set("con", constituencySlug(pio!.parliamentary_constituency));
  // The next election at this address that we cover, from Democracy Club (as the home page's lookup).
  const [dc, ours] = await Promise.all([ballotsForPostcode(raw), listBallots().catch(() => [])]);
  const covered = new Set(ours.map((b) => b.ballot_paper_id));
  const hit = (dc ?? []).filter((b) => covered.has(b.ballot_paper_id)).sort((x, y) => x.election_date.localeCompare(y.election_date))[0];
  if (hit) keep.set("ballot", hit.ballot_paper_id);
  redirect(`${base}?${keep.toString()}#compare`);
}

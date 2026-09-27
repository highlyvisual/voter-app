"use server";

import { redirect } from "next/navigation";
import { listBallots } from "@/lib/data";
import { ballotsForPostcode } from "@/lib/democracyclub";

// Postcode -> ballot, as a POST so the postcode never appears in a URL, log or redirect.
// Primary: Democracy Club for_postcode (all election levels). Fallback: postcodes.io constituency name.
function householdQuery(formData: FormData): string {
  const keys = ["age_band", "household", "children", "tenure", "income_band", "employment", "student", "disability", "carer", "visa", "benefits", "drives", "veteran"];
  const q = new URLSearchParams();
  for (const k of keys) { const v = String(formData.get(k) ?? "").trim(); if (v) q.set(k, v); }
  return q.toString();
}

export async function findElection(formData: FormData) {
  const raw = String(formData.get("postcode") ?? "").replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(raw)) redirect(`/?error=${encodeURIComponent("That doesn't look like a UK postcode.")}`);

  const ours = await listBallots();
  const covered = new Set(ours.map((b) => b.ballot_paper_id));

  // postcodes.io: a rounded location (about 100 m) for the place panel (Romily's decision, 19 Sept 2026), and the official
  // area codes for this postcode, used as a fallback below. Never stored.
  type Pio = { latitude: number; longitude: number; parliamentary_constituency?: string; codes?: Record<string, string | undefined> };
  let pio: Pio | null = null;
  let pioMissing = false;
  try {
    const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(raw)}`, { signal: AbortSignal.timeout(6000), next: { revalidate: 86400 } });
    if (r.ok) pio = ((await r.json()) as { result?: Pio }).result ?? null;
    else if (r.status === 404) pioMissing = true;
  } catch { pio = null; }
  const outcode = raw.slice(0, -3);
  const loc = pio ? `${Number(pio.latitude).toFixed(3)},${Number(pio.longitude).toFixed(3)}` : "";
  const hq = householdQuery(formData);
  const toBallot = (id: string, approx = false) => redirect(`/ballot/${encodeURIComponent(id)}/area?pc=${encodeURIComponent(outcode)}${loc ? `&loc=${loc}` : ""}${approx ? "&approx=1" : ""}${hq ? `&${hq}` : ""}`);
  const toPlace = () => redirect(`/place?pc=${encodeURIComponent(outcode)}${loc ? `&loc=${loc}` : ""}`);

  // Primary: Democracy Club, which knows every election at the address and handles postcodes split between areas.
  const dc = await ballotsForPostcode(raw);
  if (dc) {
    // Only the outward code (e.g. NW1) travels to the page, to place an approximate circle on the map. The full postcode is discarded here.
    const hits = dc.filter((b) => covered.has(b.ballot_paper_id)).sort((x, y) => x.election_date.localeCompare(y.election_date));
    if (hits.length) toBallot(hits[0].ballot_paper_id);
    // No covered election here: show the place, the next vote and current representatives instead of an error (Romily, round 5, q7).
    toPlace();
  }

  // Fallback, for when Democracy Club is unreachable or its daily allowance is used up (polling day): match the official
  // area codes of the postcode's centre (constituency, ward, county division) against the ballots we hold. A postcode that
  // straddles a boundary can be matched to the wrong side, so the page says the match is approximate.
  if (!pio) redirect(`/?error=${encodeURIComponent(pioMissing ? "We can't find that postcode. Please check it and try again." : "We couldn't look up that postcode just now. Please try again in a minute.")}`);
  const codes = new Set(Object.values(pio!.codes ?? {}).filter((v): v is string => typeof v === "string" && /^[EWSN]\d{8}$/.test(v)));
  const byCode = ours.filter((b) => b.area_gss && codes.has(b.area_gss)).sort((x, y) => x.poll_date.localeCompare(y.poll_date));
  if (byCode.length) toBallot(byCode[0].ballot_paper_id, true);
  const constituency = pio!.parliamentary_constituency ?? null;
  const byName = constituency ? ours.find((b) => b.area_name.toLowerCase() === constituency.toLowerCase()) : undefined;
  if (byName) toBallot(byName.ballot_paper_id, true);
  toPlace();
}

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

  // postcodes.io for a rounded location (about 100 m) for the place panel; Romily's decision, 19 Sept 2026. Never stored.
  let pio: { latitude: number; longitude: number; parliamentary_constituency?: string } | null = null;
  try {
    const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(raw)}`, { next: { revalidate: 86400 } });
    if (r.ok) pio = ((await r.json()) as { result?: { latitude: number; longitude: number; parliamentary_constituency?: string } }).result ?? null;
  } catch { pio = null; }

  const dc = await ballotsForPostcode(raw);
  if (dc) {
    const hit = dc.find((b) => covered.has(b.ballot_paper_id));
    // Only the outward code (e.g. NW1) travels to the page, to place an approximate circle on the map. The full postcode is discarded here.
    const outcode = raw.slice(0, -3);
    const loc = pio ? `${Number(pio.latitude).toFixed(3)},${Number(pio.longitude).toFixed(3)}` : "";
    if (hit) { const hq = householdQuery(formData); redirect(`/ballot/${encodeURIComponent(hit.ballot_paper_id)}/area?pc=${encodeURIComponent(outcode)}${loc ? `&loc=${loc}` : ""}${hq ? `&${hq}` : ""}`); }
    if (dc.length) {
      const names = [...new Set(dc.map((b) => `${b.post_label} (${b.election_name}, ${b.election_date})`))].slice(0, 3).join("; ");
      redirect(`/?error=${encodeURIComponent(`Not covered yet: ${names}. We add every by-election as nominations close, and every seat in the country for the May 2027 local elections. Meanwhile, WhoCanIVoteFor lists your candidates: https://whocanivotefor.co.uk/. We don't keep a record of your search, so we can't tell you when it's added; the elections list on this page updates daily.`)}`);
    }
    redirect(`/?error=${encodeURIComponent("No election is scheduled at that postcode at the moment, which usually means there is simply nothing to vote in there until May 2027. Check you are registered at gov.uk/register-to-vote, and open any election on this page to see how it works.")}`);
  }

  const constituency: string | null = pio?.parliamentary_constituency ?? null;
  if (!constituency) redirect(`/?error=${encodeURIComponent("We couldn't look up that postcode just now. Please try again in a minute.")}`);
  const match = ours.find((b) => b.area_name.toLowerCase() === constituency!.toLowerCase());
  if (match) { const hq = householdQuery(formData); redirect(`/ballot/${encodeURIComponent(match.ballot_paper_id)}/area?pc=${encodeURIComponent(raw.slice(0, -3))}${pio ? `&loc=${Number(pio.latitude).toFixed(3)},${Number(pio.longitude).toFixed(3)}` : ""}${hq ? `&${hq}` : ""}`); }
  redirect(`/?error=${encodeURIComponent(`That postcode is in ${constituency}. No election there is covered yet: we add each by-election as its nominations close, and every seat for May 2027. WhoCanIVoteFor (whocanivotefor.co.uk) lists candidates for any postcode today.`)}`);
}

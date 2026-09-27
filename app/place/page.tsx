import Link from "next/link";
import { Suspense } from "react";
import AreaMap from "@/components/AreaMap";
import AreaPanel from "@/components/AreaPanel";
import Layers from "@/components/Layers";
import PlacePanel from "@/components/PlacePanel";
import NextElections from "@/components/NextElections";
import { listBallots } from "@/lib/data";

export const metadata = { title: "Your area", description: "Who represents you, when you next vote, and what is happening around you.", alternates: { canonical: "/place" } };
export const dynamic = "force-dynamic";

// Shown when a postcode has no election running. Most of the country is in that position most of the time, and
// "nothing here" is a poor answer: the representatives, the next scheduled elections and the local record all exist.
export default async function Place({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const outcode = typeof sp.pc === "string" && /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(sp.pc) ? sp.pc.toUpperCase() : null;
  const m = typeof sp.loc === "string" ? sp.loc.match(/^(-?\d{1,2}\.\d{1,3}),(-?\d{1,3}\.\d{1,3})$/) : null;
  const loc = m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
  let area: { constituency: string | null; gss: string | null; district: string | null; country: string | null } = { constituency: null, gss: null, district: null, country: null };
  if (loc) {
    try {
      const r = await fetch(`https://api.postcodes.io/postcodes?lon=${loc.lng}&lat=${loc.lat}&limit=1&radius=600`, { signal: AbortSignal.timeout(5000), next: { revalidate: 604800 } }).then((x) => x.json());
      const p = r?.result?.[0];
      if (p) area = { constituency: p.parliamentary_constituency, gss: p.codes?.parliamentary_constituency ?? null, district: p.admin_district, country: p.country };
    } catch { /* optional */ }
  }
  const ballots = await listBallots();
  const soonest = ballots.filter((b) => b.poll_date >= new Date().toISOString().slice(0, 10)).slice(0, 3);
  return (
    <>
      <p className="eyebrow">Your area{outcode ? ` · ${outcode}` : ""}</p>
      <h1>No election here right now — but plenty is happening</h1>
      <p className="lede">There is no election running at that postcode today. Most of the UK has none until May 2027. Here is who makes decisions where you live, when you next get a vote, and what the public record says about the ground around you.</p>

      <Suspense fallback={<p className="meta">Looking up your next elections…</p>}>
        <NextElections lat={loc?.lat ?? null} lng={loc?.lng ?? null} />
      </Suspense>

      {loc ? (
        <>
          <Suspense fallback={<p className="meta">Working out who makes decisions for this postcode…</p>}>
            <Layers lat={loc.lat} lng={loc.lng} electionCouncil={null} />
          </Suspense>
          <h2>The ground around you</h2>
          <AreaMap areaName={area.constituency ?? outcode ?? "your area"} lat={loc.lat} lng={loc.lng} outcode={outcode} levelLabel="constituency" loc={loc} />
          <Suspense fallback={null}><PlacePanel lat={loc.lat} lng={loc.lng} /></Suspense>
          <Suspense fallback={null}>
            <AreaPanel areaName={area.constituency ?? "your constituency"} level="parliamentary" lat={loc.lat} lng={loc.lng} pointNote={null} gss={area.gss} loc={loc} />
          </Suspense>
        </>
      ) : null}

      <h2>See how an election looks here</h2>
      <p>Open any election running now and you will see exactly what this site does when your turn comes: every candidate, in ballot-paper order, with what they have published and where it came from.</p>
      <ul className="small">
        {soonest.map((b) => <li key={b.ballot_paper_id}><Link href={`/ballot/${encodeURIComponent(b.ballot_paper_id)}`}>{b.area_name}</Link> — {new Date(b.poll_date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}</li>)}
      </ul>
      <p className="meta">Not registered, or not sure? <a href="https://www.gov.uk/register-to-vote" rel="noopener">Register to vote</a> takes about five minutes, and you need photo ID at a polling station in Great Britain. <Link href="/learn">How voting works</Link> · <Link href="/status">Is this data up to date?</Link></p>
    </>
  );
}

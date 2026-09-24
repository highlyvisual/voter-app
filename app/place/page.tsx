import { Suspense } from "react";
import Link from "next/link";
import AreaMap from "@/components/AreaMap";
import Layers from "@/components/Layers";
import PlacePanel from "@/components/PlacePanel";
import { SCHEDULED } from "@/lib/scheduled";
export const dynamic = "force-dynamic";

// A postcode with no covered election (Romily, round 5, question 7: "both"). Instead of an error, the person sees
// their next vote and everyone who represents them now, on a map of where they live. The full postcode never reaches
// this page: only the outward code, a rounded location, and the names and dates of any elections Democracy Club lists.
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function Place({ searchParams }: Props) {
  const sp = await searchParams;
  const locm = typeof sp.loc === "string" ? sp.loc.match(/^(-?\d{1,2}\.\d{1,3}),(-?\d{1,3}\.\d{1,3})$/) : null;
  const loc = locm ? { lat: Number(locm[1]), lng: Number(locm[2]) } : null;
  const outcode = typeof sp.pc === "string" && /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(sp.pc) ? sp.pc.toUpperCase() : null;
  const area = typeof sp.area === "string" ? sp.area.slice(0, 80) : null;
  // Elections Democracy Club lists at this postcode that we do not cover yet: "label|date" pairs, at most three.
  const next = (typeof sp.next === "string" ? sp.next.split(";") : []).map((s) => s.split("|")).filter((p) => p.length === 2 && /^\d{4}-\d{2}-\d{2}$/.test(p[1])).slice(0, 3) as [string, string][];
  const today = new Date().toISOString().slice(0, 10);
  const scheduled = SCHEDULED.filter((s) => s.date >= today).slice(0, 2);
  if (!loc && !outcode) {
    return (<><h1>Where do you live?</h1><p>Enter a postcode on the <Link href="/">home page</Link> and this page shows your next vote and who represents you now.</p></>);
  }
  return (
    <>
      <p className="eyebrow">{outcode ? `Around ${outcode}` : "Your area"}{area ? ` · ${area}` : ""}</p>
      <h1>Nothing to vote in here right now. Here is what there is.</h1>
      <p className="lede">No election at this postcode is covered yet. That is normal: most of the country has nothing to vote in until May 2027. What you can see now is your next vote, and everyone who already represents you.</p>

      <section className="next-vote" aria-labelledby="next-vote">
        <h2 id="next-vote">Your next vote</h2>
        {next.length ? (
          <ul>
            {next.map(([label, date]) => <li key={label + date}><strong>{label}</strong> — {fmt(date)}. <span className="meta">Listed by Democracy Club; we add it as candidates are confirmed.</span></li>)}
          </ul>
        ) : null}
        {scheduled.map((s) => (
          <p key={s.id}><strong>{s.title}</strong> — {s.when}. {s.detail} <span className="meta">{s.certainty}; {s.sources.map(([t, u], i) => <span key={u}>{i ? ", " : ""}<a href={u} rel="noopener">{t}</a></span>)}.</span></p>
        ))}
        <p className="meta">We add every by-election as its nominations close, and every seat in the country for the May 2027 local elections. Check you are registered at <a href="https://www.gov.uk/register-to-vote" rel="noopener">gov.uk/register-to-vote</a>.</p>
      </section>

      <section id="map" aria-label="Map of where you live" style={{ scrollMarginTop: "6rem" }}>
        <AreaMap ballotId="" areaName={area ?? outcode ?? "your area"} lat={loc?.lat ?? null} lng={loc?.lng ?? null} outcode={outcode} levelLabel="area" loc={loc} />
      </section>
      {loc ? <Suspense fallback={<p className="meta">Working out who represents this postcode…</p>}><Layers lat={loc.lat} lng={loc.lng} electionCouncil={null} /></Suspense> : null}
      {loc ? <Suspense fallback={null}><PlacePanel lat={loc.lat} lng={loc.lng} /></Suspense> : null}

      <p><Link href="/start" className="button">Build my profile</Link> <span className="meta">Kept on this device only, so your ballot page is ready the moment your election appears.</span></p>
      <p className="meta">Meanwhile you can look at any election we cover, whether or not you live there: <Link href="/#elections">what's coming up</Link>.</p>
    </>
  );
}

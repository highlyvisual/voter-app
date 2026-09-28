import { ballotPageTitle } from "@/lib/meta";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Journey, { JourneyNext } from "@/components/Journey";
import AreaMap from "@/components/AreaMap";
import AreaPanel from "@/components/AreaPanel";
import PlacePanel from "@/components/PlacePanel";
import Representatives from "@/components/Representatives";
import WardHistory from "@/components/WardHistory";
import Layers from "@/components/Layers";
import ProfileApply from "@/components/ProfileApply";
import Link from "next/link";
import { getBallot } from "@/lib/data";
import { councilSlugFor } from "@/lib/councils";
import WriteToThem from "@/components/WriteToThem";
import AgeNote from "@/components/AgeNote";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) { return ballotPageTitle((await params).id, "Your area", "/area"); }

export default async function Area({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params; const sp = await searchParams; const ballotId = decodeURIComponent(id);
  const ballot = await getBallot(ballotId); if (!ballot) notFound();
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]).toString();
  const locm = typeof sp.loc === "string" ? sp.loc.match(/^(-?\d{1,2}\.\d{1,3}),(-?\d{1,3}\.\d{1,3})$/) : null;
  const loc = locm ? { lat: Number(locm[1]), lng: Number(locm[2]) } : null;
  const outcode = typeof sp.pc === "string" && /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(sp.pc) ? sp.pc.toUpperCase() : null;
  // The council whose area this ballot sits in: named in the ballot for council elections; found from the area point for a parliamentary one.
  let councilName: string | null = ballot.level === "local" ? ballot.area_name.split(":")[0] : null;
  if (!councilName && ballot.area_lat && ballot.area_lng) {
    try { councilName = (await fetch(`https://api.postcodes.io/postcodes?lon=${ballot.area_lng}&lat=${ballot.area_lat}&limit=1&radius=1000`, { signal: AbortSignal.timeout(5000), next: { revalidate: 604800 } }).then((r) => r.json()))?.result?.[0]?.admin_district ?? null; } catch { councilName = null; }
  }
  const councilSlug = await councilSlugFor(councilName);
  return (
    <>
      <Suspense fallback={null}><ProfileApply /></Suspense>
      <Journey ballotId={ballotId} current="area" qs={qs} />
      <p className="eyebrow">{ballot.level === "local" ? "Council by-election" : "UK Parliament election"} · {ballot.area_name} · {new Date(ballot.poll_date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" })}</p>
      <h1>This is where politics meets your life.</h1>
      <p className="lede">Before anyone asks for your vote: what the official record says about the area around {outcode ? `your postcode, ${outcode}` : "this area"}, from planning to local statistics, and who represents you now.</p>
      <AgeNote ageBand={typeof sp.age_band === "string" ? sp.age_band : undefined} ballot={ballot} />
      <p><Link className="button" href={`/ballot/${encodeURIComponent(ballotId)}${qs ? `?${qs}` : ""}#ballot-paper`}>See who is standing &rarr;</Link></p>
      {sp.approx === "1" ? <p className="notice small">We matched your postcode from its centre point because our usual lookup wasn&rsquo;t available. If your postcode sits on a boundary, check your poll card or your council&rsquo;s website to confirm which election you&rsquo;re in.</p> : null}
      <AreaMap ballotId={ballotId} areaName={ballot.area_name} lat={ballot.area_lat} lng={ballot.area_lng} outcode={outcode} levelLabel={ballot.level === "local" ? "ward" : "constituency"} loc={loc} />
      <Suspense fallback={<p className="meta">Looking up who represents you…</p>}><Representatives areaName={ballot.area_name} level={ballot.level} /></Suspense>
      <WriteToThem />
      {councilSlug ? <p className="small"><Link href={`/council/${councilSlug}`}>What&rsquo;s happening at {councilName} council &rarr;</Link> <span className="meta">{ballot.level === "parliamentary" ? "Council business is kept off this page because this is a vote for an MP; the council has its own page." : "Housing, transport, council tax, environment and schools, from the council\u2019s own papers."}</span></p> : null}
      {loc ? <Suspense fallback={<p className="meta">Working out who represents this postcode…</p>}><Layers lat={loc.lat} lng={loc.lng} electionCouncil={ballot.level === "local" ? ballot.area_name.split(":")[0] : null} /></Suspense> : null}
      {loc ? <Suspense fallback={null}><PlacePanel lat={loc.lat} lng={loc.lng} /></Suspense> : null}
      <Suspense fallback={null}><AreaPanel areaName={ballot.area_name} level={ballot.level} lat={ballot.area_lat} lng={ballot.area_lng} pointNote={ballot.area_point_note} hpiRegion={ballot.hpi_region} gss={ballot.area_gss} loc={loc} /></Suspense>
      {ballot.level === "local" ? <Suspense fallback={null}><WardHistory ballotId={ballotId} /></Suspense> : null}
      <JourneyNext ballotId={ballotId} current="area" qs={qs} />
    </>
  );
}

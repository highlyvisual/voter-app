import { notFound } from "next/navigation";
import { Suspense } from "react";
import Journey, { JourneyNext } from "@/components/Journey";
import AreaMap from "@/components/AreaMap";
import AreaPanel from "@/components/AreaPanel";
import PlacePanel from "@/components/PlacePanel";
import Representatives from "@/components/Representatives";
import ProfileApply from "@/components/ProfileApply";
import { getBallot } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function Area({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params; const sp = await searchParams; const ballotId = decodeURIComponent(id);
  const ballot = await getBallot(ballotId); if (!ballot) notFound();
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]).toString();
  const locm = typeof sp.loc === "string" ? sp.loc.match(/^(-?\d{1,2}\.\d{1,3}),(-?\d{1,3}\.\d{1,3})$/) : null;
  const loc = locm ? { lat: Number(locm[1]), lng: Number(locm[2]) } : null;
  const outcode = typeof sp.pc === "string" && /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(sp.pc) ? sp.pc.toUpperCase() : null;
  return (
    <>
      <Suspense fallback={null}><ProfileApply /></Suspense>
      <Journey ballotId={ballotId} current="area" qs={qs} />
      <p className="eyebrow">{ballot.area_name}</p>
      <h1>This is where politics meets your life.</h1>
      <p className="lede">Before anyone asks for your vote: what the official record says about the ground around {outcode ? `your postcode, ${outcode}` : "this area"} — housing sites, schools, protected areas, air quality — and who represents you now.</p>
      <AreaMap ballotId={ballotId} areaName={ballot.area_name} lat={ballot.area_lat} lng={ballot.area_lng} outcode={outcode} levelLabel={ballot.level === "local" ? "ward" : "constituency"} loc={loc} />
      <Suspense fallback={<p className="meta">Looking up who represents you…</p>}><Representatives areaName={ballot.area_name} level={ballot.level} /></Suspense>
      {loc ? <Suspense fallback={null}><PlacePanel lat={loc.lat} lng={loc.lng} /></Suspense> : null}
      <Suspense fallback={null}><AreaPanel areaName={ballot.area_name} level={ballot.level} lat={ballot.area_lat} lng={ballot.area_lng} pointNote={ballot.area_point_note} hpiRegion={ballot.hpi_region} /></Suspense>
      <JourneyNext ballotId={ballotId} current="area" qs={qs} />
    </>
  );
}

import { notFound } from "next/navigation";
import Journey, { JourneyNext } from "@/components/Journey";
import OfficeExplainer from "@/components/OfficeExplainer";
import SystemExplainer from "@/components/SystemExplainer";
import Deadlines from "@/components/Deadlines";
import { getBallot, listCandidates } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function Office({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params; const sp = await searchParams; const ballotId = decodeURIComponent(id);
  const ballot = await getBallot(ballotId); if (!ballot) notFound();
  const candidates = await listCandidates(ballotId);
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]).toString();
  const parties = [...new Map(candidates.filter((c) => c.parties?.name && c.party_ec_id !== "ynmp-party:2").map((c) => [c.party_ec_id!, { ec_id: c.party_ec_id!, name: c.parties!.name, colour: c.parties!.colour_hex }])).values()];
  return (
    <>
      <Journey ballotId={ballotId} current="office" qs={qs} />
      <p className="eyebrow">{ballot.area_name} · {new Date(ballot.poll_date + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}</p>
      <h1>What you're voting for.</h1>
      <p className="lede">The single biggest source of confusion in politics is crediting or blaming people for things their job doesn't control. Thirty seconds on what this one does.</p>
      <OfficeExplainer level={ballot.level} areaName={ballot.area_name} seats={ballot.winner_count} generalElection={ballot.level === "parliamentary" && !ballotId.includes(".by.")} parties={parties} />
      <SystemExplainer system={ballot.voting_system} seats={ballot.winner_count} />
      {!ballot.archived ? <Deadlines pollDate={ballot.poll_date} noticeUrl={ballot.official_sopn_url} gss={ballot.area_gss} level={ballot.level} /> : null}
      <JourneyNext ballotId={ballotId} current="office" qs={qs} />
    </>
  );
}

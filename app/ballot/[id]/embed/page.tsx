import { notFound } from "next/navigation";
import { getBallot, listCandidates } from "@/lib/data";
export const dynamic = "force-dynamic";
// WP-A14: minimal embed — candidate list in ballot order, no household inputs.
export default async function Embed({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ballotId = decodeURIComponent(id);
  const ballot = await getBallot(ballotId); if (!ballot) notFound();
  const candidates = await listCandidates(ballotId);
  return (
    <div className="embed">
      <style>{`.site-header,.imprint,.skip{display:none !important} main{padding:0.5rem 0.75rem 1rem}`}</style>
      <p className="eyebrow">{ballot.area_name} · {ballot.poll_date}</p>
      <ol className="election-list" style={{ gridTemplateColumns: "1fr" }}>
        {candidates.map((c, i) => <li key={c.id}><span className="meta">{i + 1}</span> <strong>{c.name}</strong> <span className="muted">{c.party_description_on_ballot && c.party_description_on_ballot !== "[blank]" ? c.party_description_on_ballot : c.party_name_on_ballot}</span></li>)}
      </ol>
      <p className="meta">Ballot-paper order · <a href={`/ballot/${encodeURIComponent(ballotId)}`} target="_top">See full detail on Hustings</a>.</p>
    </div>
  );
}

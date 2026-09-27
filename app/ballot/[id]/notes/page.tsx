import { ballotPageTitle } from "@/lib/meta";
import Link from "next/link";
import { notFound } from "next/navigation";
import NotesSheet from "@/components/NotesSheet";
import { getBallot, listCandidates } from "@/lib/data";
export const dynamic = "force-dynamic";
// WP-A12: printable notes, ballot order, free text per candidate in localStorage only. No favourites, ticks, counts or ordering.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) { return ballotPageTitle((await params).id, "My notes", "/notes"); }

export default async function Notes({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ballotId = decodeURIComponent(id);
  const ballot = await getBallot(ballotId); if (!ballot) notFound();
  const candidates = await listCandidates(ballotId);
  return (
    <>
      <p className="eyebrow no-print"><Link href={`/ballot/${encodeURIComponent(ballotId)}`}>{ballot.area_name}</Link> · notes</p>
      <h1>{ballot.area_name}: my notes</h1>
      <p className="meta">Polling day {new Date(ballot.poll_date + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}. Candidates in ballot-paper order. Notes stay in this browser only; print with your browser's print command.</p>
      <NotesSheet ballotId={ballotId} candidates={candidates.map((c) => ({ id: c.id, name: c.name, party: c.party_description_on_ballot && c.party_description_on_ballot !== "[blank]" ? c.party_description_on_ballot : c.party_name_on_ballot }))} />
    </>
  );
}

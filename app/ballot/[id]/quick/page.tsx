import Link from "next/link";
import { notFound } from "next/navigation";
import { claimsFor } from "@/components/CandidateCard";
import { TOPICS, getBallot, listCandidates, listVerifiedClaims } from "@/lib/data";
import { img } from "@/lib/site";

export const dynamic = "force-dynamic";

// Quick mode: "I have two minutes." Same evidence as the full page, less of it. Ballot-paper order, no ranking.
export default async function Quick({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ballotId = decodeURIComponent(id);
  const ballot = await getBallot(ballotId); if (!ballot) notFound();
  const [candidates, claims] = await Promise.all([listCandidates(ballotId), listVerifiedClaims(ballotId)]);
  const days = Math.round((new Date(ballot.poll_date + "T00:00:00Z").getTime() - new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime()) / 86400000);
  const label = Object.fromEntries(TOPICS);
  return (
    <>
      <p className="eyebrow">Two-minute guide</p>
      <h1>{ballot.area_name}</h1>
      <ul className="keypoints">
        <li><b>{days >= 0 ? days : 0}</b>days until polling day, {new Date(ballot.poll_date + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}</li>
        <li><b>{candidates.length}</b>candidates{ballot.winner_count > 1 ? ` for ${ballot.winner_count} seats` : " for one seat"}, in the order they appear on the paper</li>
        <li><b>{ballot.level === "parliamentary" ? "MP" : ballot.level === "local" ? "Councillor" : "Representative"}</b>{ballot.level === "parliamentary" ? "national laws, tax, NHS, immigration" : "planning, bins, council tax, local services"}</li>
      </ul>
      <p className="lede">Each candidate below, with the topics they have published something on. Tap any name for their words and sources.</p>
      <ol className="quick-list">
        {candidates.map((c, i) => {
          const mine = claimsFor(c, claims);
          const topics = TOPICS.map(([k]) => k).filter((k) => mine.some((cl) => cl.topic === k));
          return (
            <li key={c.id}>
              <Link href={`/ballot/${encodeURIComponent(ballotId)}/candidate/${c.id}`} className="quick-row">
                {c.photo_url ? <img className="avatar photo" src={img(c.photo_url)} alt="" loading="lazy" width={54} height={54} style={{ borderColor: c.parties?.colour_hex ?? undefined }} /> : <span className="avatar" aria-hidden>{c.name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).map((w) => w[0]).slice(0, 2).join("")}</span>}
                <span>
                  <strong>{i + 1}. {c.name}</strong><br />
                  <span className="meta">{c.party_description_on_ballot && c.party_description_on_ballot !== "[blank]" ? c.party_description_on_ballot : c.party_name_on_ballot}</span><br />
                  <span className="small">{topics.length ? `Published on: ${topics.map((k) => label[k]).join(", ")}` : "Nothing published that we could source yet"}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <p><Link href={`/ballot/${encodeURIComponent(ballotId)}`} className="button">Open the full ballot page</Link></p>
      <p className="meta">Same evidence as the full page, less of it. Nothing here is ranked or recommended.</p>
    </>
  );
}

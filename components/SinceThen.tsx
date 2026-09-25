import { publicClient, type Claim } from "@/lib/data";
import { layerKey } from "@/lib/claims";

// "Since then" on an archive page (Romily's decision, 19 Sept 2026): the enacted record of the party that won, drawn from the live
// ballot that succeeded this one, clearly separated and dated. It never rewrites the archive; it sits beside it.
export default async function SinceThen({ archiveId, winnerParty }: { archiveId: string; winnerParty: string | null }) {
  if (!winnerParty) return null;
  const db = publicClient();
  const { data: successors } = await db.from("ballots").select("ballot_paper_id").eq("previous_ballot_paper_id", archiveId);
  const ids = (successors ?? []).map((b) => b.ballot_paper_id);
  if (!ids.length) return null;
  const { data: party } = await db.from("parties").select("ec_id, name").ilike("name", `%${winnerParty.split(" ")[0]}%`).limit(1).maybeSingle();
  if (!party) return null;
  const { data } = await db.from("current_claims").select("*, sources(id, title, url, publisher, published_on, retrieved_at, layer, archive_url)").in("ballot_paper_id", ids).eq("party_ec_id", party.ec_id).eq("status", "verified").is("candidate_id", null);
  const enacted = ((data ?? []) as Claim[]).filter((c) => layerKey(c) === "enacted_record");
  if (!enacted.length) return null;
  return (
    <section className="area since-then" aria-labelledby="since-heading">
      <h2 id="since-heading">Since then: what {party.name} did in office</h2>
      <p className="meta">The archive above shows what was said at the time. This section is separate: the enacted record afterwards, each entry dated and sourced. It is a record, not a verdict on whether pledges were kept; the two do not line up one-to-one.</p>
      <ul className="small">
        {enacted.map((c) => (
          <li key={c.id} style={{ marginBottom: "0.5rem" }}>
            <span className="chip layer-chip">Enacted record</span> {c.claim_text} <span className="meta">— {c.sources?.publisher}{c.sources?.published_on ? `, ${c.sources.published_on}` : ""}: <a href={c.sources?.url} rel="noopener">{c.sources?.title}</a></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { claimsFor } from "@/components/CandidateCard";
import { TOPICS, effectivePartyId, getBallot, listCandidates, listVerifiedClaims } from "@/lib/data";
const SHORT: Record<string, string> = { money_and_cost_of_living: "Money", housing_and_property: "Housing", healthcare_and_social_care: "Health", education_and_universities: "Education", environment_climate_and_energy: "Environment", immigration_and_borders: "Immigration", crime_policing_and_justice: "Crime", defence_foreign_affairs_and_eu: "Defence & EU", equality_and_rights: "Equality" };

export const dynamic = "force-dynamic";

// WP-A2: how much sourced material exists per party and topic. Plain counts, identically computed, no colour scale, zeros shown as 0.
export default async function Coverage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ballotId = decodeURIComponent(id);
  const ballot = await getBallot(ballotId);
  if (!ballot) notFound();
  const [candidates, claims] = await Promise.all([listCandidates(ballotId), listVerifiedClaims(ballotId)]);
  const parties = [...new Map(candidates.map((c) => [effectivePartyId(c) ?? `ind-${c.id}`, c])).values()];
  return (
    <>
      <p className="eyebrow"><Link href={`/ballot/${encodeURIComponent(ballotId)}`}>{ballot.area_name}</Link> · coverage</p>
      <h1>How much sourced material we found</h1>
      <p className="lede">Count of published, sourced positions by party (or independent candidate) and topic. It measures how much we found, not how good anyone is. Zero means nothing published that we could source, not nothing to say.</p>
      <div className="scroll" tabIndex={0} aria-label="Coverage table, scrolls sideways">
        <table className="plain coverage-grid">
          <thead><tr><th>Party / candidate</th>{TOPICS.map(([k, l]) => <th key={k} title={l}>{SHORT[k]}</th>)}<th>Total</th></tr></thead>
          <tbody>
            {parties.map((rep) => {
              const mine = claimsFor(rep, claims);
              const counts = TOPICS.map(([k]) => mine.filter((c) => c.topic === k).length);
              const label = rep.party_ec_id === "ynmp-party:2" ? `${rep.name} (Independent)` : rep.parties?.name ?? rep.party_name_on_ballot;
              return (<tr key={rep.id}><th scope="row">{label}</th>{counts.map((n, i) => <td key={i}>{n}</td>)}<td>{counts.reduce((a, b) => a + b, 0)}</td></tr>);
            })}
          </tbody>
        </table>
      </div>
      <p className="meta">Computed identically for every row from the public ledger. Party-level positions count for every candidate of that party on this ballot; candidate statements count for that candidate only. Independents are listed individually.</p>
    </>
  );
}

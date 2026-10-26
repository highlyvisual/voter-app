import { ballotPageTitle } from "@/lib/meta";
import { TOPICS as TOPIC_LIST } from "@/lib/data";
import Link from "next/link";
import { notFound } from "next/navigation";
import { claimsFor } from "@/components/CandidateCard";
import BlindRead from "@/components/BlindRead";
import ViewMode from "@/components/ViewMode";
import HouseholdForm from "@/components/HouseholdForm";
import { TOPICS, getBallot, listCandidates, listResources, listVerifiedClaims, type Topic } from "@/lib/data";
import FurtherReading from "@/components/FurtherReading";
import { claimApplies, householdComplete, householdFromParams } from "@/lib/household";
import { splitForHousehold } from "@/lib/claims";
import { partyVars } from "@/lib/partyColour";
import ClaimLayers, { whenText } from "@/components/ClaimLayers";
import { SourceTagKey } from "@/components/SourceTag";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string; topic: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: { params: Promise<{ id: string; topic: string }> }) { const p = await params; const t = TOPIC_LIST.find(([k]) => k === p.topic)?.[1] ?? "Topic"; return ballotPageTitle(p.id, t, `/topic/${p.topic}`); }

export default async function TopicPage({ params, searchParams }: Props) {
  const { id, topic } = await params;
  const sp = await searchParams;
  const ballotId = decodeURIComponent(id);
  const label = TOPICS.find(([k]) => k === topic)?.[1];
  const ballot = await getBallot(ballotId);
  if (!ballot || !label) notFound();
  const household = householdFromParams(sp);
  const complete = householdComplete(household);
  const [candidates, claims, resources] = await Promise.all([listCandidates(ballotId), listVerifiedClaims(ballotId), listResources(topic)]);
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]).toString();

  return (
    <>
      <p className="eyebrow"><Link href={`/ballot/${encodeURIComponent(ballotId)}${qs ? `?${qs}` : ""}`}>{ballot.area_name}</Link> · by topic</p>
      <h1>{label}</h1>
      <p className="lede">Every candidate, in ballot-paper order.</p>

      {/* Romily, round ten, q2: "a bit less busy". The other topics and the household filter fold away; the positions
          come first, each in the same card as on the candidate pages. */}
      <details className="topic-switch">
        <summary>Another topic</summary>
        <nav className="topic-nav" aria-label="Topics">
          {TOPICS.map(([k, l]) => (
            <Link prefetch={false} key={k} href={`/ballot/${encodeURIComponent(ballotId)}/topic/${k}${qs ? `?${qs}` : ""}`} aria-current={k === topic ? "page" : undefined}>{l}</Link>
          ))}
        </nav>
        <p className="meta" style={{ margin: 0 }}><Link href={`/ballot/${encodeURIComponent(ballotId)}/compare${qs ? `?${qs}` : ""}`}>All ten topics side by side</Link></p>
      </details>
      <HouseholdForm household={household} complete={complete} optional />
      <div className="claims-tools"><ViewMode /><BlindRead /><SourceTagKey /></div>

      <ol className="topic-list">
        {candidates.map((c, i) => {
          const mine = claimsFor(c, claims).filter((cl) => cl.topic === (topic as Topic));
          const { shown, hidden } = splitForHousehold(mine, household, complete, claimApplies);
          const partyLabel = c.party_description_on_ballot && c.party_description_on_ballot !== "[blank]" ? c.party_description_on_ballot : c.party_name_on_ballot;
          return (
            <li key={c.id} className="topic-row party-scope" style={partyVars(c.parties?.colour_hex)}>
              <div className="who">
                <span className="meta">{i + 1}</span>
                <span className="name blindable" data-blind={`Candidate ${i + 1}`}>{c.name}</span>
                <span className="party blindable" data-blind="party hidden">{partyLabel}</span>
              </div>
              <div className="what">
                {shown.length === 0 ? (
                  <p className="empty">{mine.length === 0 ? "Nothing published that we could source on this topic." : `${mine.length} published ${mine.length === 1 ? "position" : "positions"}; none applies to this household.`}</p>
                ) : shown.slice(0, 3).map((cl) => (
                  <div className="claim" key={cl.id}><ClaimLayers c={cl} blind applies={complete && Boolean(whenText(cl.applies_if))} /></div>
                ))}
                {shown.length > 3 ? (
                  <details className="more">
                    <summary className="meta">{shown.length - 3} more</summary>
                    {shown.slice(3).map((cl) => (
                      <div className="claim" key={cl.id}><ClaimLayers c={cl} blind applies={complete && Boolean(whenText(cl.applies_if))} /></div>
                    ))}
                  </details>
                ) : null}
                {hidden.length ? <p className="meta">{hidden.length} other {hidden.length === 1 ? "position applies" : "positions apply"} only to different households.</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="meta">Each summary is a reading aid; the exact quotation under &ldquo;Sourced&rdquo; is the record. <Link href={`/ballot/${encodeURIComponent(ballotId)}${qs ? `?${qs}` : ""}`}>Back to all candidates</Link>.</p>
      <FurtherReading resources={resources} heading={`Go deeper on ${label.toLowerCase()}: independent sources`} />
    </>
  );
}

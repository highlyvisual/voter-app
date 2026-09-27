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
import { conditionText, layerOf, splitForHousehold } from "@/lib/claims";

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
      <p className="lede">Every candidate's published position on this one topic, side by side, in ballot-paper order.</p>

      <p className="meta" style={{ margin: "0 0 0.5rem" }}><Link href={`/ballot/${encodeURIComponent(ballotId)}/compare${qs ? `?${qs}` : ""}`}>All nine topics side by side</Link></p>
      <nav className="topic-nav" aria-label="Topics">
        {TOPICS.map(([k, l]) => (
          <Link prefetch={false} key={k} href={`/ballot/${encodeURIComponent(ballotId)}/topic/${k}${qs ? `?${qs}` : ""}`} aria-current={k === topic ? "page" : undefined}>{l}</Link>
        ))}
      </nav>

      <HouseholdForm household={household} complete={complete} optional />
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", margin: "0.3rem 0 0.8rem" }}><ViewMode /><BlindRead /></div>

      <ol className="topic-list">
        {candidates.map((c, i) => {
          const mine = claimsFor(c, claims).filter((cl) => cl.topic === (topic as Topic));
          const { shown, hidden } = splitForHousehold(mine, household, complete, claimApplies);
          const partyLabel = c.party_description_on_ballot && c.party_description_on_ballot !== "[blank]" ? c.party_description_on_ballot : c.party_name_on_ballot;
          return (
            <li key={c.id} className="topic-row" style={{ borderLeft: `4px solid ${c.parties?.colour_hex ?? "var(--rule)"}`, paddingLeft: "0.8rem" }}>
              <div className="who">
                <span className="meta">{i + 1}</span>
                <span className="name blindable" data-blind={`Candidate ${i + 1}`}>{c.name}</span>
                <span className="party blindable" data-blind="party hidden">{partyLabel}</span>
              </div>
              <div className="what">
                {shown.length === 0 ? (
                  <p className="empty">{mine.length === 0 ? "Nothing published that we could source on this topic." : `${mine.length} published ${mine.length === 1 ? "position" : "positions"}; none applies to this household.`}</p>
                ) : shown.slice(0, 3).map((cl) => (
                  <div className="claim" key={cl.id}>
                    <p className="meta" style={{ margin: "0 0 0.2rem" }}>
                      <span className="blindable" data-blind={layerOf(cl)}>{layerOf(cl)}</span>
                      {cl.sources ? <> · <span className="blindable" data-blind="source hidden">{cl.sources.publisher}{cl.sources.published_on ? `, ${cl.sources.published_on}` : ""}</span> · <a className="blindable" data-blind="link" href={cl.sources.url} rel="noopener">{cl.sources.title}</a></> : null}
                    </p>
                    <blockquote className="quote view-verbatim">{cl.source_quote}</blockquote>
                    <p className="summary view-summary">{cl.claim_text}</p>
                    {conditionText(cl.applies_if) ? <p className="meta" style={{ margin: "0.2rem 0 0" }}>{conditionText(cl.applies_if)}.</p> : null}
                  </div>
                ))}
                {shown.length > 3 ? (
                  <details className="more">
                    <summary className="meta">{shown.length - 3} more</summary>
                    {shown.slice(3).map((cl) => (
                      <div className="claim" key={cl.id}>
                        <p className="meta" style={{ margin: "0 0 0.2rem" }}><span className="blindable" data-blind={layerOf(cl)}>{layerOf(cl)}</span>{cl.sources ? <> · <span className="blindable" data-blind="source hidden">{cl.sources.publisher}{cl.sources.published_on ? `, ${cl.sources.published_on}` : ""}</span></> : null}</p>
                        <blockquote className="quote view-verbatim">{cl.source_quote}</blockquote>
                        <p className="summary view-summary">{cl.claim_text}</p>
                      </div>
                    ))}
                  </details>
                ) : null}
                {hidden.length ? <p className="meta">{hidden.length} other {hidden.length === 1 ? "position applies" : "positions apply"} only to different households.</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="meta">Each position is quoted exactly from its source; the line beneath is a reading aid, not the record. <Link href={`/ballot/${encodeURIComponent(ballotId)}${qs ? `?${qs}` : ""}`}>Back to all candidates</Link>.</p>
      <FurtherReading resources={resources} heading={`Go deeper on ${label.toLowerCase()}: independent sources`} />
    </>
  );
}

import { ballotPageTitle } from "@/lib/meta";
import Link from "next/link";
import { notFound } from "next/navigation";
import { claimsFor } from "@/components/CandidateCard";
import BlindRead from "@/components/BlindRead";
import ScrollHint from "@/components/ScrollHint";
import ViewMode from "@/components/ViewMode";
import { topicsForHousehold } from "@/lib/topicOrder";
import HouseholdForm from "@/components/HouseholdForm";
import { TOPICS, getBallot, listCandidates, listVerifiedClaims } from "@/lib/data";
import { claimApplies, householdComplete, householdFromParams, FIELD_KEYS } from "@/lib/household";
import { layerOf, splitForHousehold, LEGEND } from "@/lib/claims";
import { partyVars } from "@/lib/partyColour";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const SHORT_LAYER: Record<string, string> = { "Candidate's own statement": "Own words", "In government (enacted or announced)": "In government", "Party announcement": "Announcement", "Party position": "Party", "Party manifesto": "Manifesto" };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) { return ballotPageTitle((await params).id, "Compare the candidates", "/compare"); }

export default async function ComparePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const ballotId = decodeURIComponent(id);
  const ballot = await getBallot(ballotId);
  if (!ballot) notFound();
  const household = householdFromParams(sp);
  const complete = householdComplete(household);
  const [candidates, claims] = await Promise.all([listCandidates(ballotId), listVerifiedClaims(ballotId)]);

  // Which candidates to show: ?c=id,id,… ; default = everyone with at least one published position, in ballot order.
  const requested = typeof sp.c === "string" ? sp.c.split(",").map(Number).filter(Boolean) : [];
  const withAny = candidates.filter((c) => claimsFor(c, claims).length > 0).map((c) => c.id);
  const chosen = requested.length ? requested : candidates.map((c) => c.id); // every candidate by default (WP-A1)
  const topicTab = typeof sp.topic === "string" && TOPICS.some(([k]) => k === sp.topic) ? sp.topic : "";
  const rowsToShow = topicTab ? TOPICS.filter(([k]) => k === topicTab) : TOPICS;
  const tabQs = (t: string) => { const q = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]); t ? q.set("topic", t) : q.delete("topic"); const s2 = q.toString(); return s2 ? `?${s2}` : ""; };
  const cols = candidates.filter((c) => chosen.includes(c.id));
  const hh = Object.fromEntries(FIELD_KEYS.filter((k) => household[k]).map((k) => [k, household[k] as string]));
  const hhQs = new URLSearchParams(hh).toString();
  const partyLabel = (c: (typeof candidates)[number]) => (c.party_description_on_ballot && c.party_description_on_ballot !== "[blank]" ? c.party_description_on_ballot : c.party_name_on_ballot);

  return (
    <>
      <p className="eyebrow"><Link href={`/ballot/${encodeURIComponent(ballotId)}${hhQs ? `?${hhQs}` : ""}`}>{ballot.area_name}</Link> · side by side</p>
      <h1>Compare candidates</h1>
      <p className="lede">Candidates across, the ten topics down. Each cell is the short version; open a topic for the exact quotations and sources.</p>

      <details className="household">
        <summary><span className="summary-line"><b>Showing {cols.length} of {candidates.length} {candidates.length === 1 ? "candidate" : "candidates"}.</b>{cols.length < candidates.length ? <> <Link href={`/ballot/${encodeURIComponent(ballotId)}/compare${hhQs ? `?${hhQs}` : ""}`}>Show all</Link>.</> : " Everyone on the ballot, in ballot-paper order."}</span><span className="change">Pick 2 to 4 to compare closely</span></summary>
        <form method="get">
          {Object.entries(hh).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))" }}>
            {candidates.map((c) => (
              <label key={c.id} className="small" style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
                <input type="checkbox" name="c" value={c.id} defaultChecked={chosen.includes(c.id)} />
                <span><b>{c.name}</b> <span className="muted">{partyLabel(c)}</span>{claimsFor(c, claims).length === 0 ? <span className="muted"> · nothing published</span> : null}</span>
              </label>
            ))}
          </div>
          <div className="actions"><button type="submit">Compare selected</button><span className="meta">Order stays as on the ballot paper.</span></div>
        </form>
      </details>

      <HouseholdForm household={household} complete={complete} optional />
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", margin: "0.3rem 0 0.8rem" }}><ViewMode /><BlindRead /></div>

      <nav className="topic-tabs" aria-label="Compare one topic at a time">
        <Link prefetch={false} href={`/ballot/${encodeURIComponent(ballotId)}/compare${tabQs("")}`} aria-current={!topicTab ? "page" : undefined}>All topics</Link>
        {topicsForHousehold(household).all.map(({ topic: k, label: l, reason }) => <Link prefetch={false} key={k} href={`/ballot/${encodeURIComponent(ballotId)}/compare${tabQs(k)}`} aria-current={topicTab === k ? "page" : undefined} title={reason ? `First ${reason}` : undefined}>{l.split(",")[0].replace(" and cost of living", "")}</Link>)}
      </nav>
      <p className="meta">No winner, no score, no match. Switch topics and decide for yourself which differences matter.</p>
      <ScrollHint>
        <table className="compare">
          <caption className="sr-only">Published positions: one row per topic, one column per candidate in ballot-paper order. Each topic heading links to that topic on its own page.</caption>
          <thead>
            <tr>
              <th scope="col" className="corner">Topic</th>
              {cols.map((c, i) => (
                <th scope="col" key={c.id} className="party-scope" style={{ ...partyVars(c.parties?.colour_hex), borderTop: `8px solid ${c.parties?.colour_hex ?? "var(--rule)"}` }}>
                  <span className="meta">{candidates.indexOf(c) + 1}</span>
                  <span className="name blindable" data-blind={`Candidate ${candidates.indexOf(c) + 1}`}>{c.name}</span>
                  <span className="party blindable" data-blind="party hidden">{partyLabel(c)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowsToShow.map(([key, label]) => (
              <tr key={key}>
                <th scope="row" id={`row-${key}`}><Link href={`/ballot/${encodeURIComponent(ballotId)}/topic/${key}${hhQs ? `?${hhQs}` : ""}`}>{label}</Link></th>
                {cols.map((c) => {
                  const mine = claimsFor(c, claims).filter((cl) => cl.topic === key);
                  const { shown, hidden } = splitForHousehold(mine, household, complete, claimApplies);
                  return (
                    <td key={c.id} data-candidate={`${candidates.indexOf(c) + 1}. ${c.name} — ${c.parties?.name ?? c.party_name_on_ballot}`}>
                      {shown.length === 0 ? (
                        <span className="empty">{mine.length ? `${mine.length} only for other households` : "—"}</span>
                      ) : (
                        <ul>
                          {shown.slice(0, 3).map((cl) => (
                            <li key={cl.id}>
                              <details className="cell">
                                <summary><span className="meta layer">{SHORT_LAYER[layerOf(cl)] ?? layerOf(cl)}</span>{" "}<span className="view-summary">{cl.claim_text.replace(/\s*\((relevant to|enacted policy)[^)]*\)/gi, "").trim()}</span>{" "}<span className="view-verbatim">{cl.source_quote}</span></summary>
                                <blockquote className="quote view-summary">{cl.source_quote}</blockquote>
                                {cl.sources ? <p className="meta">{cl.sources.publisher}{cl.sources.published_on ? `, ${cl.sources.published_on}` : ""} · <a href={cl.sources.url} rel="noopener">{cl.sources.title}</a></p> : null}
                              </details>
                            </li>
                          ))}
                          {shown.length > 3 ? <li className="meta"><Link href={`/ballot/${encodeURIComponent(ballotId)}/topic/${key}${hhQs ? `?${hhQs}` : ""}`}>{shown.length - 3} more</Link></li> : null}
                          {hidden.length ? <li className="meta">{hidden.length} only for other households</li> : null}
                        </ul>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollHint>
      <p className="meta">Short versions are reading aids; the quotation and its source are the record. {LEGEND} Columns are in ballot-paper order; nothing is ranked.</p>
    </>
  );
}

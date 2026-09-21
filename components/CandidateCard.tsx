import { TOPICS, effectivePartyId, type Candidate, type Claim, type ReceiptRow } from "@/lib/data";
import { claimApplies, type Household } from "@/lib/household";
import { conditionText, layerOf, precisionLabel, splitForHousehold, LEGEND } from "@/lib/claims";
import { interestsFor, parliamentRecord } from "@/lib/parliament";
import ParliamentaryRecordView from "@/components/ParliamentaryRecord";
import ActionBlock from "@/components/ActionBlock";
import ExplainThis from "@/components/ExplainThis";
import ReadAloud from "@/components/ReadAloud";
import { layerKey } from "@/lib/claims";
import { ballotLabel, type InvitationStatus, type Leaflet, type PreviousCandidacy } from "@/lib/data";
import { SITE, img } from "@/lib/site";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const SHORT: Record<string, string> = {
  money_and_cost_of_living: "Money", housing_and_property: "Housing", healthcare_and_social_care: "Health",
  education_and_universities: "Education", environment_climate_and_energy: "Environment",
  immigration_and_borders: "Immigration", crime_policing_and_justice: "Crime", defence_foreign_affairs_and_eu: "Defence & EU", equality_and_rights: "Equality",
};

function ClaimView({ c }: { c: Claim }) {
  const s = c.sources;
  const level = layerOf(c);
  const cond = conditionText(c.applies_if);
  return (
    <div className="claim">
      <p className="meta" style={{ margin: "0 0 0.25rem" }}>
        <span className="chip layer-chip">{level}</span>
        {s ? <> · {s.publisher}{s.published_on ? `, ${s.published_on}` : ""} · <a href={s.url} rel="noopener">{s.title}</a></> : null}
        {c.tier === "computed" ? <span className="tier">Computed</span> : null}
        {precisionLabel(c) ? <span className="tier">{precisionLabel(c)}</span> : null}
      </p>
      <p className="layer-label">Their position</p>
      <blockquote className="quote">{c.source_quote}</blockquote>
      <p className="layer-label view-summary">What that means</p>
      <p className="summary view-summary">{c.claim_text}</p>
      <ExplainThis text={`${c.source_quote} ${c.claim_text}`} />
      <p className="meta" style={{ margin: "0.2rem 0 0" }}>{cond ? `${cond}. ` : ""}{s ? `Retrieved ${s.retrieved_at.slice(0, 10)}.` : ""}{c.party_ec_id === "PP53" && c.candidate_id === null && level === "Manifesto" ? <> Delivery tracked independently by <a href="https://fullfact.org/government-tracker/" rel="noopener">Full Fact's Government Tracker</a> (states: Achieved · On track · Signs of progress · Wait and see · Unclear).</> : null}</p>
    </div>
  );
}

function Receipt({ rows, partyEcId, verifiedSourceIds, baselineId }: { rows: ReceiptRow[]; partyEcId: string | null; verifiedSourceIds: Set<number>; baselineId: string }) {
  const baseline = rows.find((r) => r.reform_set_id === baselineId);
  // A party's modelled pledge is shown only when a published claim cites the same source the model was built from.
  // Only a reform set computed under the same law year as the baseline is comparable.
  const year = baselineId === "baseline" ? "2026" : baselineId.replace("baseline-", "");
  const party = partyEcId
    ? rows.find((r) => r.party_ec_id === partyEcId && String(r.results._year ?? "2026") === year && ((r.results._source_ids as unknown as number[]) ?? []).some((id) => verifiedSourceIds.has(id)))
    : undefined;
  if (!baseline || !party) return null;
  const label = typeof party.results._label === "string" ? party.results._label : "Modelled pledge";
  const keys = ["income_tax", "national_insurance", "universal_credit", "child_benefit", "household_net_income"] as const;
  const labels: Record<string, string> = { income_tax: "Income tax", national_insurance: "National Insurance", universal_credit: "Universal Credit", child_benefit: "Child Benefit", household_net_income: "Net income" };
  const a0 = Number(baseline.results.household_net_income ?? 0), b0 = Number(party.results.household_net_income ?? 0);
  const maxV = Math.max(a0, b0, 1), delta = b0 - a0;
  return (
    <div className="receipt scroll">
      <p className="meta" style={{ margin: "0.4rem 0 0.2rem" }}>Modelled: {label}</p>
      <div className="bars" aria-label={`Net income: current law ${gbp.format(a0)}, under this pledge ${gbp.format(b0)}`}>
        <div className="bar-row"><span className="bar-label">Current law</span><span className="bar"><span style={{ width: `${(100 * a0) / maxV}%` }} /></span><span className="bar-val">{gbp.format(a0)}</span></div>
        <div className="bar-row"><span className="bar-label">Under this pledge</span><span className="bar"><span style={{ width: `${(100 * b0) / maxV}%` }} /></span><span className="bar-val">{gbp.format(b0)}</span></div>
        <p className="meta" style={{ margin: "0.2rem 0 0.4rem" }}>Net income after tax and benefits: {delta === 0 ? "no change" : `${delta > 0 ? "+" : "\u2212"}${gbp.format(Math.abs(delta))} a year`} for a household like this one. Whether that is good or bad depends on what the money is for; that judgement is yours.</p>
      </div>
      <table>
        <thead><tr><th>Per year</th><th className="num">Current law</th><th className="num">Under this pledge</th><th className="num">Change</th></tr></thead>
        <tbody>
          {keys.map((k) => { const a = Number(baseline.results[k] ?? 0), b = Number(party.results[k] ?? 0); return (
            <tr key={k}><td>{labels[k]}</td><td className="num">{gbp.format(a)}</td><td className="num">{gbp.format(b)}</td><td className="num">{b - a >= 0 ? "+" : "\u2212"}{gbp.format(Math.abs(b - a))}</td></tr>
          ); })}
        </tbody>
      </table>
      <p className="meta" style={{ marginTop: "0.4rem" }}>PolicyEngine UK {party.policyengine_version}, {party.computed_at.slice(0, 10)}, from the sourced pledge above, for a representative household in these bands.</p>
    </div>
  );
}

export function claimsFor(candidate: Candidate, claims: Claim[]) {
  const party = effectivePartyId(candidate);
  return claims.filter((c) => c.candidate_id === candidate.id || (c.candidate_id === null && c.party_ec_id === party));
}

export default async function CandidateCard({
  candidate, position, claims, receipts, household, complete, baselineId = "baseline", invitation = null, level = "parliamentary", areaName = "", councilSiteUrl = null, leaflets = [], pollDate = null, showPhotos = SITE.photos === "any", stoodBefore = [],
}: { candidate: Candidate; position: number; claims: Claim[]; receipts: ReceiptRow[]; household: Household; complete: boolean; baselineId?: string; invitation?: InvitationStatus | null; level?: string; areaName?: string; councilSiteUrl?: string | null; leaflets?: Leaflet[]; pollDate?: string | null; showPhotos?: boolean; stoodBefore?: PreviousCandidacy[] }) {
  const campaignStart = pollDate ? new Date(new Date(pollDate + "T00:00:00Z").getTime() - 60 * 86400000).toISOString().slice(0, 10) : null;
  const current = leaflets.filter((l) => campaignStart && (l.date_uploaded ?? "") >= campaignStart);
  const earlier = leaflets.filter((l) => !(campaignStart && (l.date_uploaded ?? "") >= campaignStart));
  const fmtD = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const invLine = !invitation || invitation.submission_status === "not_invited"
    ? "Not yet invited to submit a statement: we have no contact address. If you are this candidate, use the link below."
    : invitation.submission_status === "invited" ? `Invited to submit a statement on ${fmtD(invitation.invited_at)}. No response yet.`
    : invitation.submission_status === "received" ? `Statement received ${invitation.responded_at ? fmtD(invitation.responded_at) : ""}, being checked.`
    : `Statement published${invitation.responded_at ? ` (received ${fmtD(invitation.responded_at)})` : ""}.`;
  const hhQs = new URLSearchParams(Object.entries(household).filter(([k, v]) => k !== "postcode" && typeof v === "string") as [string, string][]).toString();
  const record = candidate.parliament_member_id ? await parliamentRecord(candidate.parliament_member_id) : null;
  if (record && candidate.parliament_member_id) { const ints = await interestsFor(candidate.parliament_member_id); if (ints) { record.interests = ints.items; record.interestsTotal = ints.total; } }
  const mine = claimsFor(candidate, claims);
  const verifiedSourceIds = new Set(mine.map((c) => c.sources?.id).filter((x): x is number => typeof x === "number"));
  const partyColour = candidate.parties?.colour_hex ?? null; // only ever here, on this candidate's own panel
  const partyLabel = candidate.party_description_on_ballot && candidate.party_description_on_ballot !== "[blank]" ? candidate.party_description_on_ballot : candidate.party_name_on_ballot;
  const perTopic = TOPICS.map(([key]) => {
    const relevant = mine.filter((c) => c.topic === key);
    const { shown, hidden } = splitForHousehold(relevant, household, complete, claimApplies);
    return { key, relevant, applying: shown, hidden };
  });
  const total = perTopic.reduce((n, t) => n + t.applying.length, 0);

  return (
    <details className="candidate" id={`c-${candidate.id}`}>
      <summary aria-label={`${candidate.name}, ${partyLabel}, ${total} ${total === 1 ? "position" : "positions"}`}>
        <div className="who">
          {showPhotos && candidate.photo_url ? (
            <img className="avatar photo" src={img(candidate.photo_url)} alt="" loading="lazy" width={52} height={52} style={partyColour ? { boxShadow: `0 0 0 2px ${partyColour}` } : undefined} />
          ) : (
            <span className="avatar" aria-hidden style={partyColour ? { boxShadow: `inset 0 0 0 3px ${partyColour}`, background: "#fff", color: "var(--ink)" } : undefined}>{candidate.name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
          )}
          <div>
            <h3 className="name" data-pos={position}><span className="meta" style={{ marginRight: "0.5rem" }}>{position}</span>{candidate.name}</h3>
            <p className="party">
              {candidate.parties?.emblem_url ? <img className="emblem" src={img(candidate.parties.emblem_url)} alt="" loading="lazy" width={36} height={24} /> : null}
              <span className="party-pill" style={partyColour ? { borderColor: partyColour, background: partyColour + "33" } : undefined}>{partyLabel}</span>
            </p>
          </div>
        </div>
        <span className="disclosure"><span className="closed">Show</span><span className="opened">Hide</span></span>
        <div className="strip" aria-label="Positions by topic">
          {perTopic.map((t) => (
            t.applying.length ? (
              <span key={t.key} className="chip" title={`${SHORT[t.key]}: ${t.applying.length} ${t.applying.length === 1 ? "position" : "positions"}`}>
                {SHORT[t.key]} {t.applying.length}
              </span>
            ) : (
              <span key={t.key} className="chip none" title={`${SHORT[t.key]}: no published position`}>{SHORT[t.key]} —</span>
            )
          ))}
          <span className="chip none">{total} in total</span>
        </div>
      </summary>
      <div className="body">
        <div className="links">
          {candidate.dc_person_url ? <a href={candidate.dc_person_url.replace("/api/next/people/", "/person/")} rel="noopener">Democracy Club profile</a> : null}
          {candidate.homepage_url ? <a href={candidate.homepage_url} rel="noopener">Candidate's own site</a> : null}
          {candidate.parties?.official_site_url ? <a href={candidate.parties.official_site_url} rel="noopener">Party site</a> : null}
        </div>

        <section className="slot statement">
          <h4>In their own words</h4>
          {candidate.statement_to_voters ? (
            <>
              {candidate.statement_to_voters.split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)}
              <p className="meta">Statement to voters supplied by the candidate to Democracy Club{candidate.statement_retrieved_at ? `, retrieved ${candidate.statement_retrieved_at.slice(0, 10)}` : ""}. Reproduced unedited.</p>
            </>
          ) : (
            <p className="empty">No statement to voters supplied to Democracy Club.</p>
          )}
        </section>

        {stoodBefore.length ? (
          <section className="slot">
            <h4>Stood before</h4>
            <ul className="small" style={{ paddingLeft: "1.1rem", margin: "0.2rem 0" }}>
              {stoodBefore.slice(0, 6).map((p) => <li key={p.id}>{ballotLabel(p.ballot_paper_id)}{p.election_date ? `, ${new Date(p.election_date + "T00:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}` : ""}{p.party ? ` (${p.party})` : ""}{p.elected === true ? " — elected" : p.elected === false ? " — not elected" : ""}</li>)}
              {stoodBefore.length > 6 ? <li className="meta">and {stoodBefore.length - 6} more; full history on their Democracy Club profile</li> : null}
            </ul>
            <p className="meta">Previous candidacies from Democracy Club. A record of standing, not a judgement.</p>
          </section>
        ) : null}
        {record ? <ParliamentaryRecordView rec={record} note={candidate.parliament_match_note} /> : null}

        {leaflets.length ? (
          <section className="slot">
            <h4>Campaign leaflets archived</h4>
            {current.length ? <div className="leaflets">{current.map((l) => <a key={l.id} href={l.url} rel="noopener" className="leaflet"><img src={img(l.thumb_url)} alt={`Leaflet archived ${l.date_uploaded ?? ""}`} loading="lazy" width={110} height={147} /><span className="meta">This campaign · {l.date_uploaded}</span></a>)}</div> : <p className="empty">None archived yet for this campaign.</p>}
            {earlier.length ? <details className="more"><summary className="meta">{earlier.length} from this candidate's earlier campaigns</summary><div className="leaflets" style={{ marginTop: "0.4rem" }}>{earlier.map((l) => <a key={l.id} href={l.url} rel="noopener" className="leaflet"><img src={img(l.thumb_url)} alt={`Leaflet archived ${l.date_uploaded ?? ""}`} loading="lazy" width={110} height={147} /><span className="meta">Earlier campaign · {l.date_uploaded}</span></a>)}</div></details> : null}
            <p className="meta">From electionleaflets.org (Democracy Club). Leaflets are the party's own material, published as delivered; we check they are real, not that they are true. Earlier leaflets are from previous contests and may not reflect current positions.</p>
          </section>
        ) : null}

        <p className="row-actions"><a className="button" href={`/ballot/${encodeURIComponent(candidate.ballot_paper_id)}/candidate/${candidate.id}${hhQs ? `?${hhQs}` : ""}`}>Open {candidate.name.split(" ")[0]}'s page →</a> <ReadAloud selector={`#c-${candidate.id} .body`} label="Read aloud" /></p>

        <section className="slot">
          <h4>Where this information comes from</h4>
          <p className="small" style={{ margin: 0 }}>Positions are quoted from the candidate's or party's own published material and official records, each with its source. Candidates and their agents can also submit sourced statements, published as written once we confirm they appear at the cited address. <span className="meta">{invLine}</span> <a href="/candidates/submit">Submit a statement</a>.</p>
        </section>

        <section className="slot">
          <h4>Published positions on the nine topics{complete ? ", for this household" : ""}</h4>
          {total > 0 ? <p className="meta" style={{ margin: "0 0 0.4rem" }}>{LEGEND} Switch between summaries and exact quotations with the control above the list.</p> : null}
          {total === 0 && perTopic.every((t) => t.relevant.length === 0) ? (
            <ActionBlock level={level} areaName={areaName} councilSiteUrl={councilSiteUrl} partySiteUrl={candidate.parties?.official_site_url} />
          ) : (
            <div className="topics">{TOPICS.map(([key, label]) => {
              const t = perTopic.find((x) => x.key === key)!;
              return (
                <div className="topic" key={key} data-topic={key}>
                  <h5>{label}</h5>
                  {t.relevant.length === 0 ? (
                    <p className="empty">Nothing published on this yet.</p>
                  ) : t.applying.length === 0 ? (
                    <p className="empty">{t.relevant.length} published {t.relevant.length === 1 ? "position" : "positions"}; none applies to this household.</p>
                  ) : (
                    <>
                      {([["own", "What this candidate says"], ["record", "What was done in office"], ["party", "What their party says"]] as [string, string][]).map(([g, gl]) => {
                        const inGroup = t.applying.filter((c) => (c.candidate_id !== null ? "own" : layerKey(c) === "enacted_record" ? "record" : "party") === g);
                        if (!inGroup.length) return null;
                        return (
                          <div key={g} className="claim-group">
                            <p className="group-label">{gl}</p>
                            {inGroup.slice(0, 3).map((c) => <ClaimView key={c.id} c={c} />)}
                            {inGroup.length > 3 ? (
                              <details className="more">
                                <summary className="meta">{inGroup.length - 3} more</summary>
                                {inGroup.slice(3).map((c) => <ClaimView key={c.id} c={c} />)}
                              </details>
                            ) : null}
                          </div>
                        );
                      })}
                      {t.hidden.length ? <p className="meta">{t.hidden.length} other {t.hidden.length === 1 ? "position applies" : "positions apply"} only to different households.</p> : null}
                    </>
                  )}
                  {key === "money_and_cost_of_living" && complete ? <Receipt rows={receipts} partyEcId={effectivePartyId(candidate)} verifiedSourceIds={verifiedSourceIds} baselineId={baselineId} /> : null}
                </div>
              );
            })}</div>
          )}
        </section>
      </div>
    </details>
  );
}

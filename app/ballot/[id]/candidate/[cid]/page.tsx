import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ExplainThis from "@/components/ExplainThis";
import ProfileApply from "@/components/ProfileApply";
import ReadAloud from "@/components/ReadAloud";
import CiteThis from "@/components/CiteThis";
import { claimsFor } from "@/components/CandidateCard";
import { TOPICS, getBallot, listCandidates, listVerifiedClaims, listPreviousCandidacies, ballotLabel, type Claim } from "@/lib/data";
import { claimApplies, householdComplete, householdFromParams } from "@/lib/household";
import { layerKey, layerOf, conditionText } from "@/lib/claims";
import { img } from "@/lib/site";
export const dynamic = "force-dynamic";

// A candidate's own page (Romily §10): short factual introduction, then large topic cards. Each card opens into
// the four layers — their position, what that means, who it applies to, the source — so a person can stop at ten
// seconds, one minute or five. Every candidate's page has exactly the same structure, whatever they have published.
const BIG: [string, string][] = [["money_and_cost_of_living", "Money"], ["housing_and_property", "Housing"], ["healthcare_and_social_care", "Health"], ["education_and_universities", "Education"], ["environment_climate_and_energy", "Climate"]];

function Layered({ c }: { c: Claim }) {
  const cond = conditionText(c.applies_if);
  return (
    <article className="claim">
      <p className="meta" style={{ margin: "0 0 0.3rem" }}><span className="chip layer-chip">{badge(c)}</span>{c.sources?.published_on ? ` · published ${c.sources.published_on}` : ""}</p>
      <p className="layer-label">Their position</p>
      <blockquote className="quote">{c.source_quote}</blockquote>
      <p className="layer-label">What that means</p>
      <p className="summary">{c.claim_text}</p>
      <ExplainThis text={`${c.source_quote} ${c.claim_text}`} />
      {cond ? <><p className="layer-label">Who it applies to</p><p className="small">{cond}.</p></> : null}
      <p className="layer-label">The source</p>
      <p className="small">{c.sources ? <><a href={c.sources.url} rel="noopener">{c.sources.title}</a> — {c.sources.publisher}. Retrieved {c.sources.retrieved_at?.slice(0, 10)}.</> : "Source unavailable."}</p>
    </article>
  );
}
function badge(c: Claim): string {
  const k = layerKey(c);
  if (k === "enacted_record") return "Public record";
  if (k === "candidate_statement") return "Candidate's own words";
  if (k === "third_party_analysis") return "Third-party report";
  if (k === "campaign_leaflet") return "Campaign leaflet";
  return layerOf(c);
}

export default async function CandidatePage({ params, searchParams }: { params: Promise<{ id: string; cid: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id, cid } = await params; const sp = await searchParams; const ballotId = decodeURIComponent(id);
  const ballot = await getBallot(ballotId); if (!ballot) notFound();
  const [candidates, claims, stood] = await Promise.all([listCandidates(ballotId), listVerifiedClaims(ballotId), listPreviousCandidacies(ballotId)]);
  const idx = candidates.findIndex((c) => c.id === Number(cid)); if (idx < 0) notFound();
  const c = candidates[idx];
  const h = householdFromParams(sp); const complete = householdComplete(h);
  const mine = claimsFor(c, claims);
  const applying = complete ? mine.filter((cl) => claimApplies(cl.applies_if, h)) : mine;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]).toString();
  const colour = c.parties?.colour_hex ?? null;
  const party = c.party_description_on_ballot && c.party_description_on_ballot !== "[blank]" ? c.party_description_on_ballot : c.party_name_on_ballot;
  const own = mine.filter((cl) => cl.candidate_id !== null);
  const prev = candidates[idx - 1], next = candidates[idx + 1];
  const nav = (x: typeof c) => `/ballot/${encodeURIComponent(ballotId)}/candidate/${x.id}${qs ? `?${qs}` : ""}`;
  const statement = c.statement_to_voters ?? "";
  const topicLabel = Object.fromEntries(TOPICS);
  return (
    <>
      <Suspense fallback={null}><ProfileApply /></Suspense>
      <p className="eyebrow"><Link href={`/ballot/${encodeURIComponent(ballotId)}${qs ? `?${qs}` : ""}#ballot-paper`}>{ballot.area_name}</Link> · number {idx + 1} of {candidates.length} on the ballot paper</p>
      <div className="cand-hero" id="cand">
        {c.photo_url ? <img src={img(c.photo_url)} alt="" width={120} height={120} className="cand-photo" style={{ borderColor: colour ?? "var(--ink)" }} /> : <span className="cand-photo initials" style={{ borderColor: colour ?? "var(--ink)" }}>{c.name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).map((w) => w[0]).slice(0, 2).join("")}</span>}
        <div>
          <h1 style={{ margin: "0 0 0.3rem" }}>{c.name}</h1>
          <p className="party"><span className="party-pill" style={colour ? { borderColor: colour, background: colour + "33" } : undefined}>{party}</span></p>
          <p className="small" style={{ margin: "0.4rem 0 0" }}>Standing for {ballot.level === "parliamentary" ? "Parliament" : "the council"} in {ballot.area_name}, polling day {new Date(ballot.poll_date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}. {stood.filter((s) => s.candidate_id === c.id).length ? `Has stood ${stood.filter((s) => s.candidate_id === c.id).length} time${stood.filter((s) => s.candidate_id === c.id).length === 1 ? "" : "s"} before.` : ""}</p>
        </div>
      </div>

      {statement ? (
        <details className="statement-intro">
          <summary><span className="layer-label" style={{ display: "block" }}>In their own words</span>{statement.slice(0, 220)}{statement.length > 220 ? "…" : ""}</summary>
          <div className="statement">{statement.split(/\n+/).map((para, i) => <p key={i}>{para}</p>)}</div>
          <p className="meta">Statement supplied by the candidate to Democracy Club, reproduced unedited.</p>
        </details>
      ) : <p className="meta">No statement to voters supplied.</p>}

      <h2>What could their policies mean for {complete ? "your profile" : "you"}?</h2>
      <p className="meta">{complete ? "Counting what applies to a household like yours." : <>Showing everything they have published. <Link href="/start">Add your profile</Link> to see only what applies to you.</>} Tap a card to open it: position, what it means, who it applies to, the source.</p>
      <div className="topic-cards">
        {BIG.map(([k, t]) => {
          const list = applying.filter((cl) => cl.topic === k);
          return (
            <details key={k} className={`topic-card${list.length ? "" : " empty"}`}>
              <summary><span className="tc-title">{t}</span><span className="tc-n">{list.length}</span><span className="tc-unit">{list.length === 1 ? "position" : "positions"}</span></summary>
              <div className="tc-body">{list.length ? list.map((cl) => <Layered key={cl.id} c={cl} />) : <p className="small">Nothing published that we could source on {topicLabel[k].toLowerCase()}. That means nothing found, not nothing to say.</p>}</div>
            </details>
          );
        })}
        <details className={`topic-card${own.length ? "" : " empty"}`}>
          <summary><span className="tc-title">Your area</span><span className="tc-n">{own.length}</span><span className="tc-unit">in their own words</span></summary>
          <div className="tc-body">{own.length ? own.map((cl) => <Layered key={cl.id} c={cl} />) : <p className="small">No local positions of their own that we could source.</p>}<p className="small"><Link href={`/ballot/${encodeURIComponent(ballotId)}/area${qs ? `?${qs}` : ""}`}>See local issues on the map →</Link></p></div>
        </details>
      </div>
      <h3 className="section-lead" style={{ fontSize: "1.3rem" }}>Other topics</h3>
      <div className="topic-cards small-cards">
        {TOPICS.filter(([k]) => !BIG.some(([b]) => b === k)).map(([k, t]) => {
          const list = applying.filter((cl) => cl.topic === k);
          return (
            <details key={k} className={`topic-card${list.length ? "" : " empty"}`}>
              <summary><span className="tc-title">{t}</span><span className="tc-n">{list.length}</span></summary>
              <div className="tc-body">{list.length ? list.map((cl) => <Layered key={cl.id} c={cl} />) : <p className="small">Nothing published that we could source.</p>}</div>
            </details>
          );
        })}
      </div>

      <p><ReadAloud selector="main" label="Read this page aloud" /></p>
      <CiteThis title={`${c.name}: candidate in ${ballot.area_name}, polling day ${ballot.poll_date}`} />
      <nav className="cand-nav" aria-label="Other candidates, in ballot-paper order">
        {prev ? <Link href={nav(prev)} className="button secondary-link">← {idx}. {prev.name}</Link> : <span />}
        <Link href={`/ballot/${encodeURIComponent(ballotId)}/compare${qs ? `?${qs}` : ""}`} className="quiet-link">Compare side by side</Link>
        {next ? <Link href={nav(next)} className="button secondary-link">{idx + 2}. {next.name} →</Link> : <span />}
      </nav>
      <p className="meta">Every candidate's page has the same structure and the same cards, in the same order. Previous candidacies: {stood.filter((s) => s.candidate_id === c.id).slice(0, 3).map((s) => ballotLabel(s.ballot_paper_id)).join("; ") || "none on record"}.</p>
    </>
  );
}

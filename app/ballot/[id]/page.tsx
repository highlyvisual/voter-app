import { img } from "@/lib/site";
import ExtLink from "@/components/ExtLink";
import { fixLink, linkFixes } from "@/lib/links";
import { longDate } from "@/lib/dates";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import CandidateCard, { claimsFor } from "@/components/CandidateCard";
import CurrentLaw from "@/components/CurrentLaw";
import Deadlines from "@/components/Deadlines";
import ExpandAll from "@/components/ExpandAll";
import BlindRead from "@/components/BlindRead";
import Link from "next/link";
import { TOPICS } from "@/lib/data";
import HouseholdForm from "@/components/HouseholdForm";
import LastTime from "@/components/LastTime";
import { baselineIdFor, bumpUsage, getBallot, getElectionDates, getReceipts, listCandidates, listCouncilPledges, listInvitationStatus, listLeaflets, listPreviousCandidacies, listResources, listVerifiedClaims } from "@/lib/data";
import CouncilPledges from "@/components/CouncilPledges";
import PlacePanel from "@/components/PlacePanel";
import SinceThen from "@/components/SinceThen";
import Journey from "@/components/Journey";
import CiteThis from "@/components/CiteThis";
import { topicsForHousehold } from "@/lib/topicOrder";
import CountUp from "@/components/CountUp";
import ProfileApply from "@/components/ProfileApply";
import FurtherReading from "@/components/FurtherReading";
import AreaPanel from "@/components/AreaPanel";
import AreaMap from "@/components/AreaMap";
import SectionNav from "@/components/SectionNav";
import BallotTools from "@/components/BallotTools";
import ViewMode from "@/components/ViewMode";
import TopicOrder from "@/components/TopicOrder";
import Feedback from "@/components/Feedback";
import SeatContext from "@/components/SeatContext";
import SystemExplainer from "@/components/SystemExplainer";
import OfficeExplainer from "@/components/OfficeExplainer";
import { previousResult } from "@/lib/democracyclub";
import { gridKey, householdComplete, householdFromParams } from "@/lib/household";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const b = await getBallot(decodeURIComponent(id));
  return { title: b ? `${b.area_name}, ${fmt(b.poll_date)}` : "Ballot", alternates: b ? { canonical: `/ballot/${encodeURIComponent(b.ballot_paper_id)}` } : undefined };
}

export default async function BallotPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const ballotId = decodeURIComponent(id);
  const ballot = await getBallot(ballotId);
  if (!ballot) notFound();

  const household = householdFromParams(sp);
  const isLocal = ballot.level === "local";
  const locm = typeof sp.loc === "string" ? sp.loc.match(/^(-?\d{1,2}\.\d{1,3}),(-?\d{1,3}\.\d{1,3})$/) : null;
  const loc = locm ? { lat: Number(locm[1]), lng: Number(locm[2]) } : null;
  const outcode = typeof sp.pc === "string" && /^[A-Z]{1,2}\d[A-Z\d]?$/.test(sp.pc.toUpperCase()) ? sp.pc.toUpperCase() : null;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]).toString();
  const complete = householdComplete(household);
  const key = gridKey(household);
  const prevId = ballot.previous_ballot_paper_id;
  const baselineId = baselineIdFor(ballot);
  const generalResources = await listResources("all").then((r) => r.filter((x) => x.topic === "all"));
  const council = ballot.level === "local" ? ballot.area_name.split(":")[0].trim() : null;
  const [invitations, electionDates, leaflets, pledges, stood] = await Promise.all([listInvitationStatus(ballotId), getElectionDates(ballotId), listLeaflets(ballotId), council ? listCouncilPledges(council) : Promise.resolve([]), listPreviousCandidacies(ballotId)]);
  const fx = await linkFixes();
  const councilSite = ballot.official_sopn_url ? (() => { try { return new URL(ballot.official_sopn_url!).origin; } catch { return null; } })() : null;
  const [candidates, claims, receipts, previous, ownResult] = await Promise.all([
    listCandidates(ballotId), listVerifiedClaims(ballotId), key ? getReceipts(key) : Promise.resolve([]),
    prevId ? previousResult(prevId) : Promise.resolve(null),
    ballot.archived ? previousResult(ballotId) : Promise.resolve(null),
  ]);
  const prevLabel = prevId ? (prevId.includes("2024-07-04") ? "general election, 4 July 2024" : `election of ${fmt(prevId.slice(-10))}`) : "";

  const covered = candidates.filter((c) => claimsFor(c, claims).length > 0).length;
  const topicOrder = topicsForHousehold(household);
  const qsTopic = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]).toString();
  const topicCounts: Record<number, Record<string, number>> = Object.fromEntries(candidates.map((c) => [c.id, Object.fromEntries(TOPICS.map(([k]) => [k, claimsFor(c, claims).filter((cl) => cl.topic === k).length]))]));
  void bumpUsage(ballotId);
  const year = ballot.poll_date.slice(0, 4);
  const verifiedSources = new Set(claims.map((c) => c.sources?.id));
  const anyModelled = receipts.some((r) => !r.reform_set_id.startsWith("baseline") && String(r.results._year ?? "2026") === ballot.poll_date.slice(0, 4).replace(/^202[5-9]$/, "2026") && ((r.results._source_ids as unknown as number[]) ?? []).some((id) => verifiedSources.has(id)));

  return (
    <>
      <p className="eyebrow">{ballot.level === "parliamentary" ? "UK Parliament" : ballot.level === "local" ? "Council" : ballot.level}{ballot.by_election_reason ? " by-election" : " election"} · {fmt(ballot.poll_date)}</p>
      <h1>{ballot.area_name}</h1>
      {ballot.archived ? (
        <div className="notice">
          <p><strong>Archive.</strong> This election has already happened. Everything below is shown as it stood at the time: the candidates, their published positions as of the campaign, and household figures under the law of {year}. Nothing here is a judgement of what happened afterwards.</p>
        </div>
      ) : null}
      <Suspense fallback={null}><ProfileApply /></Suspense>
      {!ballot.archived ? <Journey ballotId={ballotId} current="" qs={qs} /> : null}
      <div className="ballot-masthead">
        <div className="masthead-main">
          <p className="lede">{candidates.length} candidates{ballot.winner_count > 1 ? ` for ${ballot.winner_count} seats` : ""}. The same page for each of them, in the order you will see on the ballot paper. Read them all, or start with the one you have heard of.</p>
          <div className="overview" aria-label="This election at a glance">
            <div><b><CountUp value={candidates.length} /></b><span>candidates{ballot.winner_count > 1 ? ` for ${ballot.winner_count} seats` : " for one seat"}</span></div>
            <div><b><CountUp value={claims.length} /></b><span>sourced positions</span></div>
            <div><b><CountUp value={covered} /></b><span>with something published</span></div>
            <div><b><CountUp value={new Set(claims.map((c) => c.sources?.id).filter(Boolean)).size} /></b><span>named sources</span></div>
          </div>
          <ol className="name-strip" aria-label="Candidates in ballot-paper order">
            {candidates.map((c, i) => (
              <li key={c.id} className="peek-host"><a href={`#c-${c.id}`}><span className="meta">{i + 1}</span> {c.name}<span className="party-dot" aria-hidden style={{ background: c.parties?.colour_hex ?? "var(--rule)" }} /><span className="meta">{c.party_description_on_ballot && c.party_description_on_ballot !== "[blank]" ? c.party_description_on_ballot : c.party_name_on_ballot}</span></a>
                {/* Round five, q8 (Romily): no photos in lists, but "a hyperlink which opens a photo and some info". On a
                    computer, hovering or focusing a name shows this card; on a phone the name goes to the full card. */}
                <span className="peek" aria-hidden>
                  {c.photo_url ? <img src={img(c.photo_url)} alt="" width={72} height={72} loading="lazy" /> : <span className="peek-initials">{c.name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).map((w) => w[0]).slice(0, 2).join("")}</span>}
                  <span className="peek-text"><strong>{c.name}</strong><span>{c.party_name_on_ballot}</span><span>{claims.filter((cl) => cl.candidate_id === c.id).length} of their own published positions sourced · {stood.filter((p) => p.candidate_id === c.id).length ? `stood ${stood.filter((p) => p.candidate_id === c.id).length} time${stood.filter((p) => p.candidate_id === c.id).length === 1 ? "" : "s"} before` : "no previous candidacies on record"}</span><Link prefetch={false} href={`/ballot/${encodeURIComponent(ballotId)}/candidate/${c.id}${qs ? `?${qs}` : ""}`} tabIndex={-1}>Their page &rarr;</Link></span>
                </span>
              </li>
            ))}
          </ol>
          {ballot.uncontested ? <div className="notice"><p><strong>Uncontested: elected without a poll.</strong> The number of valid nominations did not exceed the seats, so the candidate{candidates.length > 1 ? "s" : ""} below {candidates.length > 1 ? "are" : "is"} returned without a vote.</p></div> : null}
          {ballot.postponed ? <div className="notice"><p><strong>Postponed.</strong> {ballot.postponed_note ?? "This poll has been postponed; the new date will appear here when the council publishes it."}</p></div> : null}
          {ballot.cancelled && !ballot.uncontested ? <div className="notice"><p><strong>Cancelled.</strong> The council has cancelled this poll.</p></div> : null}
          {!ballot.archived ? <SeatContext result={previous} label={prevLabel} seats={ballot.winner_count} /> : null}
          <p className="cta-row">
            <a href="#ballot-paper" className="button">See the {candidates.length} candidates</a>
            <Link href={`/ballot/${encodeURIComponent(ballotId)}/quick`} className="quiet-link">In a hurry? Two-minute guide →</Link>
          </p>
        </div>

        <aside className="masthead-rail" aria-label="Where and when">
          <section id="map" style={{ scrollMarginTop: "6rem" }}>
            <AreaMap ballotId={ballot.ballot_paper_id} areaName={ballot.area_name} lat={ballot.area_lat} lng={ballot.area_lng} outcode={outcode} levelLabel={isLocal ? "ward" : "constituency"} loc={loc} />
          </section>
          {!ballot.archived ? (
            <div id="dates" style={{ scrollMarginTop: "6rem" }}>
              <Deadlines pollDate={ballot.poll_date} noticeUrl={ballot.official_sopn_url} gss={ballot.area_gss} level={ballot.level} />
            </div>
          ) : null}
          <details className="rail-more">
            <summary>Official notices, boundaries and data</summary>
            {ballot.level === "parliamentary" ? <p className="meta">Every constituency in England was redrawn for the July 2024 general election under the 2023 Boundary Review; results before 2024 refer to the old boundaries. The map shows the current boundary.</p> : null}
            <p className="meta">
              Nominations {ballot.candidates_locked ? "closed and confirmed" : "not yet confirmed"}.
              {ballot.official_sopn_url ? <> <a href={fixLink(fx, ballot.official_sopn_url)?.href ?? ballot.official_sopn_url} rel="noopener">Official list</a>.</> : null} Candidate data: <a href="https://democracyclub.org.uk/" rel="noopener">Democracy Club</a>.
            </p>
            {!ballot.archived ? (
              <p className="meta">
                Find your polling station at <a href="https://wheredoivote.co.uk/" rel="noopener">WhereDoIVote</a> (you enter your postcode there; nothing leaves this page).
                {" "}Official notices: {electionDates?.notice_of_election_url ? <><a href={electionDates.notice_of_election_url} rel="noopener">Notice of Election</a> · </> : null}{(electionDates?.sopn_url || ballot.official_sopn_url) ? <><a href={electionDates?.sopn_url ?? ballot.official_sopn_url!} rel="noopener">Statement of Persons Nominated</a></> : null}{electionDates?.notice_of_poll_url ? <> · <a href={electionDates.notice_of_poll_url} rel="noopener">Notice of Poll</a></> : null}.
                {" "}Accepted photo ID: <a href="https://www.electoralcommission.org.uk/voting-and-elections/voter-id/accepted-forms-photo-id" rel="noopener">Electoral Commission list</a>.
              </p>
            ) : null}
          </details>
        </aside>
      </div>

      <SectionNav items={([["ballot-paper", "Candidates"], ["household", "Household"], ["compare", "Compare"], ["map", "Map"], ["area", "Area"], ["sources-heading", "Sources"]] as [string, string][]).filter(([id]) => !(ballot.archived && id === "area"))} />

      {ballot.archived && ownResult ? <SinceThen archiveId={ballotId} winnerParty={ownResult.rows[0]?.party ?? null} /> : null}
      {ballot.archived && ownResult ? <LastTime result={ownResult} label={`the result, ${fmt(ballot.poll_date)}`} open /> : null}


      <div id="household" className="household-zone" style={{ scrollMarginTop: "6rem" }}><div><HouseholdForm household={household} complete={complete} />
        <section className="topic-order" aria-label="Topics in the order shown for this household">
          {topicOrder.relevant.length ? (<>
            <p className="meta" style={{ margin: "0 0 0.3rem" }}>Shown first for you</p>
            <ul className="topic-first">{topicOrder.relevant.map((r) => <li key={r.topic}><Link href={`/ballot/${encodeURIComponent(ballotId)}/topic/${r.topic}${qsTopic ? `?${qsTopic}` : ""}`}>{r.label}</Link> <span className="meta">— {r.reason}</span></li>)}</ul>
          </>) : null}
          <p className="meta" style={{ margin: "0.5rem 0 0.3rem" }}>{topicOrder.relevant.length ? "Explore all topics" : "Explore by topic"}</p>
          <p className="topic-all">{topicOrder.all.map((r, i) => <span key={r.topic}>{i ? " · " : ""}<Link href={`/ballot/${encodeURIComponent(ballotId)}/topic/${r.topic}${qsTopic ? `?${qsTopic}` : ""}`}>{r.label.split(",")[0].replace(" and cost of living", "").replace(" and property", "").replace(" and social care", "").replace(" and universities", "").replace(" and borders", "")}</Link></span>)}</p>
          <p className="meta" style={{ margin: "0.5rem 0 0" }}>{topicOrder.relevant.length ? "The order changes only with what you told us about your household, never with anything political, and it never changes who is shown or any figure." : "Add your household and the topics that touch it come first, with the reason."}</p>
        </section>
        <TopicOrder /></div></div>

      {isLocal ? (
        <div className="notice small">
          <p className="meta" style={{ margin: "0 0 0.4rem" }}>In this ward {candidates.length} candidates from {new Set(candidates.map((c) => c.party_ec_id === "ynmp-party:2" ? `ind-${c.id}` : c.party_ec_id)).size} parties or independent slots are standing. Parties do not stand everywhere; <Link href="/about/parties-standing">here is how to find out whether yours stands nearby</Link>.</p>
          <p><strong>This is a council seat.</strong> A councillor's win changes what the council decides: council tax, housing repairs and allocations, planning, social care, schools admissions, parking, bins, libraries. It does not change national tax, benefits or NHS policy, so this page shows only positions published for this council election, and no national party pledges are implied.</p>
        </div>
      ) : null}
      {complete && !isLocal ? <CurrentLaw rows={receipts} complete={complete} anyModelled={anyModelled} baselineId={baselineId} year={ballot.archived ? year : undefined} /> : null}

      <div className="coverage" style={{ marginTop: "1.75rem" }} aria-label="Coverage">
        <span>Sourced positions found for {covered} of {candidates.length} candidates</span>
        <div className="bar" aria-hidden><span style={{ width: `${candidates.length ? (100 * covered) / candidates.length : 0}%` }} /></div>
      </div>
      {covered === 0 ? (
        <div className="notice small">
          <p>No sourced positions have been published for this ballot yet, so every candidate shows the same empty slots. Every claim that appears carries its source, date and exact quotation; see the <a href="/ledger">public ledger</a>.</p>
        </div>
      ) : null}

      <p id="compare" style={{ margin: "1.5rem 0 0.5rem", scrollMarginTop: "6rem" }}>
        <Link href={`/ballot/${encodeURIComponent(ballotId)}/compare${qs ? `?${qs}` : ""}`} className="button">Compare candidates side by side</Link>
      </p>
      <nav className="topic-nav" aria-label="Compare by topic">
        <span className="meta" style={{ marginRight: "0.4rem" }}>Or one topic at a time:</span>
        {TOPICS.map(([k, l]) => (
          <Link prefetch={false} key={k} href={`/ballot/${encodeURIComponent(ballotId)}/topic/${k}${qs ? `?${qs}` : ""}`}>{l}</Link>
        ))}
      </nav>
      <OfficeExplainer level={ballot.level} areaName={ballot.area_name} seats={ballot.winner_count} generalElection={ballot.level === "parliamentary" && !ballot.ballot_paper_id.includes(".by.")} parties={[...new Map(candidates.filter((c) => c.parties?.name && c.party_ec_id !== "ynmp-party:2").map((c) => [c.party_ec_id!, { ec_id: c.party_ec_id!, name: c.parties!.name, colour: c.parties!.colour_hex }])).values()]} />
      <SystemExplainer system={ballot.voting_system} seats={ballot.winner_count} />
      <div className="toolbar" id="ballot-paper" style={{ scrollMarginTop: "6rem" }}>
        <h2 style={{ margin: 0 }}>The ballot paper</h2>
        <ExpandAll />
      </div>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", margin: "0.3rem 0" }}><ViewMode /><BlindRead /></div>
      <BallotTools counts={topicCounts} total={candidates.length} />
      <p className="meta" style={{ margin: "0 0 0.75rem" }}>
        Numbered as on the ballot paper. Open a candidate to see their positions on the nine topics{complete ? " that apply to this household" : ""}, with sources.
        {!complete ? " Until a household is described, only positions that apply to everyone are counted." : ""}
      </p>
      {candidates.map((c, i) => (
        <Suspense key={c.id} fallback={<details className="candidate"><summary><div className="who"><span className="avatar" aria-hidden /><div><h3 className="name"><span className="meta" style={{ marginRight: "0.5rem" }}>{i + 1}</span>{c.name}</h3><p className="party">{c.party_name_on_ballot}</p></div></div><span className="disclosure">Loading</span></summary></details>}>
        <CandidateCard candidate={c} position={i + 1} claims={claims} receipts={receipts} household={household} complete={complete} baselineId={baselineId} invitation={invitations.find((v) => v.candidate_id === c.id) ?? null} level={ballot.level} areaName={ballot.area_name} councilSiteUrl={councilSite} leaflets={leaflets.filter((l) => l.candidate_id === c.id)} pollDate={ballot.poll_date} stoodBefore={stood.filter((p) => p.candidate_id === c.id)} />
        </Suspense>
      ))}

      <p className="meta">Photos appear only on each candidate's own page, so every candidate looks the same in this list. <Link href={`/coverage/${encodeURIComponent(ballotId)}`}>How much sourced material we found per party</Link>{isLocal ? <> · <Link href="/about/parties-standing">Why isn't my party standing here?</Link></> : null}</p>
      {previous && !ballot.archived ? <LastTime result={previous} label={prevLabel} /> : null}

      {loc && !ballot.archived ? (
        <Suspense fallback={<section className="area"><h2>Around this postcode: the planning record</h2><p className="meta">Loading the planning record…</p></section>}>
          <PlacePanel lat={loc.lat} lng={loc.lng} />
        </Suspense>
      ) : null}
      {pledges.length ? <CouncilPledges pledges={pledges} partyName={(ec) => candidates.find((c) => c.party_ec_id === ec)?.parties?.name ?? ec ?? "Council"} /> : null}
      {!ballot.archived ? <div id="area" style={{ scrollMarginTop: "6rem" }} /> : null}
      {!ballot.archived ? (
        <Suspense fallback={<section className="area"><h2>{ballot.area_name} in numbers</h2><p className="meta">Loading official figures for the area…</p></section>}>
          <AreaPanel areaName={ballot.area_name} level={ballot.level} lat={ballot.area_lat} lng={ballot.area_lng} pointNote={ballot.area_point_note} hpiRegion={ballot.hpi_region} gss={ballot.area_gss} loc={loc} />
        </Suspense>
      ) : null}

      <section id="feedback" style={{ scrollMarginTop: "6rem" }} className="household"><Feedback ballot={ballotId} /></section>
      <p className="meta"><Link href={`/ballot/${encodeURIComponent(ballotId)}/notes`}>Print my notes</Link> · <Link href="/share">Share or embed this page</Link></p>

      <FurtherReading resources={generalResources} heading="Go deeper: independent sources" />

      {claims.length ? (
        <section className="sources-index" aria-labelledby="sources-heading">
          <h2 id="sources-heading">Sources used on this page</h2>
          <ol>
            {[...new Map(claims.filter((c) => c.sources).map((c) => [c.sources!.id, c.sources!])).values()]
              .sort((a, b) => a.publisher.localeCompare(b.publisher) || (b.published_on ?? "").localeCompare(a.published_on ?? ""))
              .map((src) => (
                <li key={src.id}>
                  <ExtLink href={src.url}>{src.title}</ExtLink> — {src.publisher}{src.published_on ? `, ${longDate(src.published_on)}` : ", undated"}. Retrieved {longDate(src.retrieved_at)}. {claims.filter((c) => c.sources?.id === src.id).length} {claims.filter((c) => c.sources?.id === src.id).length === 1 ? "quotation" : "quotations"}.
                </li>
              ))}
          </ol>
          <p className="meta">Candidate lists and nominations: <a href="https://democracyclub.org.uk/" rel="noopener">Democracy Club</a> (CC BY 4.0). Tax and benefit figures: <a href="https://policyengine.org/uk" rel="noopener">PolicyEngine UK</a>, open source.</p>
        </section>
      ) : null}
      <CiteThis title={`${ballot.area_name}: ${ballot.level === "parliamentary" ? "UK Parliament" : "council"} election, ${fmt(ballot.poll_date)}`} />
    </>
  );
}

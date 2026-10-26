import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ClaimLayers, { whenText } from "@/components/ClaimLayers";
import ExtLink from "@/components/ExtLink";
import HomeProfileApply from "@/components/HomeProfileApply";
import HowThisPage from "@/components/HowThisPage";
import InfoTip from "@/components/InfoTip";
import PostcodeField from "@/components/PostcodeField";
import { SourceTagKey } from "@/components/SourceTag";
import ThemeIcon from "@/components/ThemeIcon";
import { homePostcode } from "@/app/themes/actions";
import { orderClaims } from "@/lib/claims";
import { councilBySlug, councilSlugFor } from "@/lib/councils";
import { getBallot, listCandidates, listVerifiedClaims, publicClient, type Ballot, type Candidate, type Claim } from "@/lib/data";
import { longDate } from "@/lib/dates";
import { decisionChain } from "@/lib/decisionChain";
import { ballotStood, type BallotStood } from "@/lib/democracyclub";
import { meansForYou, whoHasPower } from "@/lib/homeFacts";
import { billsFor, councilFor, type Happening } from "@/lib/homeNow";
import { HOME_SUBS, HOUSING_WORDS_SHOWN, NOW_LABEL, SUB_WORDS_SHOWN, TENURE_WORDS, becauseText, constituencySlug, ge2024Ballot, isHomeSub, matchesSub, sortNow, type HomeSub } from "@/lib/homeTopics";
import { claimApplies, householdFromParams, type Household } from "@/lib/household";
import { localStats, PLAIN } from "@/lib/localStats";
import { HOUSEHOLD_KEYS } from "@/lib/profile";
import wider from "@/lib/widerBodies.json";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ sub: string }> }) {
  const { sub } = await params;
  const s = HOME_SUBS.find((x) => x.key === sub);
  return { title: s ? `${s.title} · Your Home` : "Your Home", robots: { index: false } };
}

// Level three of Romily's three (round eleven q2), in her four parts (26 Oct, point 1): what's happening, what it means
// for you, what each party or candidate would do, and explore further; with "who has the power" (point 7) before the
// fold. Aim: "30 seconds on a topic and you've learnt something useful". Everything shown is sourced; where we have
// nothing, the page says so. The profile reaches the server only as address parameters (components/HomeProfileApply),
// as on the ballot pages; the full postcode never does.
type Pc = { country: string | null; admin_district: string | null; admin_county: string | null; parish: string | null; pfa: string | null; parliamentary_constituency: string | null; codes: { admin_district?: string; admin_county?: string; parish?: string } };
type Party = { ec_id: string; name: string; colour_hex: string | null; parent_party_ec_id: string | null };
type Wider = { combined_authority: Record<string, { code: string; name: string; mayor: boolean | null }>; gla: string[] };
const W = wider as unknown as Wider;
const INDEPENDENT = "ynmp-party:2";
const SHOW = 2;

export default async function HomeSubPage({ params, searchParams }: { params: Promise<{ sub: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { sub: subKey } = await params;
  if (!isHomeSub(subKey)) notFound();
  const sub: HomeSub = subKey;
  const meta = HOME_SUBS.find((s) => s.key === sub)!;
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const h: Household = householdFromParams(sp);
  const as = one("as") === "renter" || one("as") === "owner" ? one("as") : null;
  const outcode = /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(one("pc")) ? one("pc").toUpperCase() : null;
  const m = one("loc").match(/^(-?\d{1,2}\.\d{1,3}),(-?\d{1,3}\.\d{1,3})$/);
  const loc = m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
  const conParam = /^[a-z0-9-]{2,90}$/.test(one("con")) ? one("con") : null;
  const wantParties = one("mode") === "parties";
  const error = one("error").slice(0, 200) || null;

  // The place, from the rounded point (postcodes.io, ONS geography, Open Government Licence).
  let pc: Pc | null = null;
  if (loc) {
    try { pc = (await fetch(`https://api.postcodes.io/postcodes?lon=${loc.lng}&lat=${loc.lat}&limit=1&radius=600`, { signal: AbortSignal.timeout(5000), next: { revalidate: 604800 } }).then((r) => r.json()))?.result?.[0] ?? null; } catch { pc = null; }
  }
  const country = pc?.country ?? null;
  const lad = pc?.codes?.admin_district ?? null;
  const london = lad ? W.gla.includes(lad) : false;
  const ca = lad ? W.combined_authority[lad] ?? null : null;
  const chain = pc ? decisionChain({ country: pc.country ?? "England", admin_district: pc.admin_district, admin_county: pc.admin_county, parish: pc.parish, pfa: pc.pfa, codes: pc.codes ?? {} }) : [];
  const councilName = chain.find((l) => l.level === "council")?.body ?? null;
  const slug = await councilSlugFor(pc?.admin_district);
  const council = slug ? await councilBySlug(slug) : null;
  const conSlug = conParam ?? (pc?.parliamentary_constituency ? constituencySlug(pc.parliamentary_constituency) : null);
  const conFromPoint = !conParam && Boolean(conSlug);

  const ballotId = one("ballot");
  const ballot: Ballot | null = ballotId ? await getBallot(ballotId).catch(() => null) : null;
  const today = new Date().toISOString().slice(0, 10);
  const electionMode = Boolean(ballot) && !wantParties;

  const db = publicClient();
  const [{ data: partyRows }, { data: partyClaimRows }, bills, local, stats] = await Promise.all([
    db.from("parties").select("ec_id, name, colour_hex, parent_party_ec_id"),
    db.from("current_claims").select("*, sources(id, title, url, publisher, published_on, retrieved_at, layer, archive_url)").eq("status", "verified").eq("topic", "housing_and_property").is("candidate_id", null).not("party_ec_id", "is", null),
    billsFor(sub),
    slug ? councilFor(slug, councilName ?? `${pc?.admin_district} council`, sub) : Promise.resolve([] as Happening[]),
    pc?.codes?.admin_district && sub !== "renting" ? localStats(pc.codes.admin_district, sub === "owning" ? ["average-house-price", "housing-affordability-ratio"] : ["net-additions-housing-stock", "housing-affordability-ratio"]) : Promise.resolve([]),
  ]);
  const parties = new Map(((partyRows ?? []) as Party[]).map((p) => [p.ec_id, p]));
  const effective = (id: string | null) => (id ? parties.get(id)?.parent_party_ec_id ?? id : null);
  const onSub = (c: Claim) => matchesSub(`${c.claim_text} ${c.source_quote}`, sub);
  // Every party's own housing positions, across elections, one copy of each quotation, the most recent first.
  const seen = new Set<string>();
  const partyClaims = new Map<string, Claim[]>();
  for (const c of [...((partyClaimRows ?? []) as Claim[])].sort((a, b) => (b.sources?.published_on ?? "").localeCompare(a.sources?.published_on ?? ""))) {
    const p = effective(c.party_ec_id);
    if (!p) continue;
    const k = `${p}|${c.source_quote}`;
    if (seen.has(k)) continue; seen.add(k);
    partyClaims.set(p, [...(partyClaims.get(p) ?? []), c]);
  }
  const allPartyOnSub = (p: string | null) => (p ? orderClaims((partyClaims.get(p) ?? []).filter(onSub)) : []);

  // "What would each party or candidate do?"
  let candidates: Candidate[] = [];
  let ballotClaims: Claim[] = [];
  let stood: BallotStood | null = null;
  if (electionMode && ballot) {
    [candidates, ballotClaims] = await Promise.all([listCandidates(ballot.ballot_paper_id), listVerifiedClaims(ballot.ballot_paper_id)]);
    ballotClaims = ballotClaims.filter((c) => c.topic === "housing_and_property");
  } else if (conSlug) {
    stood = await ballotStood(ge2024Ballot(conSlug));
  }
  const held = ballot ? ballot.poll_date < today : false;

  const tenure = h.tenure;
  const applies = (c: Claim) => Boolean(whenText(c.applies_if)) && claimApplies(c.applies_if, h);
  // Looking "as someone else" (point 9): the example didn't tell us anything, so the reason is put in the third person.
  const appliesTo = as ? "Applies to this example" : "Applies to you";
  const third = (s: string) => (as ? s.replace(/^you told us you're /, "they're ").replace(/^you told us you /, "they ") : s);
  const because = (c: Claim) => { const b = becauseText(c.applies_if, tenure); return b ? third(b) : null; };

  // "What's happening?": items touching the profile first, then newest first (Romily, round eleven q7).
  const now = sortNow([...local, ...bills.filter((b) => b.kind === "bill")], tenure);
  const memberBills = sortNow(bills.filter((b) => b.kind === "member-bill"), tenure);
  const lines = meansForYou(sub, { country, london, mayor: ca?.mayor ? `Mayor of ${ca.name}` : null }, { tenure, benefits: h.benefits });
  const power = whoHasPower(sub, { country, london, mayor: ca?.mayor ? `Mayor of ${ca.name}` : null }, councilName);

  // The address of this page with some parameters changed, for the switch and the links.
  const keep = new URLSearchParams(Object.entries(sp).filter(([k, v]) => typeof v === "string" && k !== "error") as [string, string][]);
  const withParams = (set: Record<string, string | null>, path = `/themes/your-home/${sub}`) => {
    const q = new URLSearchParams(keep);
    for (const [k, v] of Object.entries(set)) { if (v === null) q.delete(k); else q.set(k, v); }
    const s = q.toString();
    return `${path}${s ? `?${s}` : ""}`;
  };
  const noHousehold = Object.fromEntries(HOUSEHOLD_KEYS.map((k) => [k, null]));
  const asLinks = [
    { key: "you", label: "You", href: withParams({ ...noHousehold, as: null, profile: null }) },
    { key: "renter", label: "A private renter", href: withParams({ ...noHousehold, as: "renter", profile: null, tenure: "private_rent" }) },
    { key: "owner", label: "A homeowner", href: withParams({ ...noHousehold, as: "owner", profile: null, tenure: "own_mortgage" }) },
  ];
  const forWords = as === "renter" ? "a private renter (an example, not you)" : as === "owner" ? "a homeowner with a mortgage (an example, not you)" : tenure && TENURE_WORDS[tenure] ? TENURE_WORDS[tenure] : "anyone (no profile)";
  const placeWords = pc?.admin_district ?? outcode ?? "no area chosen";
  const countMine = (list: Claim[]) => list.filter(applies).length;

  return (
    <>
      <Suspense fallback={null}><HomeProfileApply /></Suspense>
      <p className="eyebrow"><Link href="/themes">Parts of your life</Link> · <Link href="/themes/your-home">Your Home</Link></p>
      <h1 className="theme-h1"><ThemeIcon slug="your-home" size={36} /> {meta.title}</h1>

      {/* Romily, 26 Oct point 9 ("SIMPLIFIED"): the same page as someone else, one tap away. */}
      <div className="showing-for">
        <p><span className="meta">Showing this for:</span> <strong>{forWords}</strong> · {placeWords} · <Link href="/profile">Change</Link></p>
        <nav className="as-switch" aria-label="See it as someone else">
          <span className="meta">See it as:</span>
          {asLinks.map((a) => <Link key={a.key} href={a.href} aria-current={(as ?? "you") === a.key ? "true" : undefined} className={(as ?? "you") === a.key ? "on" : undefined} prefetch={false}>{a.label}</Link>)}
        </nav>
      </div>

      <section className="yh-sec" aria-labelledby="yh-now">
        <h2 id="yh-now">What&rsquo;s happening?</h2>
        {now.length ? (
          <ul className="now-items">
            {now.slice(0, 4).map((it) => <NowRow key={it.id} it={it} />)}
          </ul>
        ) : <p className="empty">Nothing on {meta.short.toLowerCase()} in Parliament&rsquo;s current bills{slug ? ` or ${councilName ?? "the council"}'s papers we read` : ""} right now.</p>}
        {now.length > 4 ? (
          <details className="more"><summary className="meta">{now.length - 4} more</summary><ul className="now-items">{now.slice(4).map((it) => <NowRow key={it.id} it={it} />)}</ul></details>
        ) : null}
        {memberBills.length ? (
          <details className="more">
            <summary className="meta">{memberBills.length} {memberBills.length === 1 ? "bill" : "bills"} from individual MPs and peers</summary>
            <ul className="now-items">{memberBills.map((it) => <NowRow key={it.id} it={it} />)}</ul>
          </details>
        ) : null}
        {!slug ? <p className="meta">{pc?.admin_district ? `We don't read ${pc.admin_district} council's meeting papers or consultations yet, so only Parliament is shown.` : "Add your postcode below to see what your council is doing too."}</p> : null}
      </section>

      <section className="yh-sec" aria-labelledby="yh-you">
        <h2 id="yh-you">What does this mean for you?</h2>
        <ul className="means">
          {lines.map((l) => (
            <li key={l.text} className={l.because ? "touches" : undefined}>
              {l.because ? <p className="applies-yes"><svg viewBox="0 0 24 24" aria-hidden><path d="M5 12l5 5 9-10" /></svg><span><strong>{appliesTo}</strong> because {third(l.because)}.</span></p> : null}
              <span>{l.text}</span> <span className="meta">Source: <a href={l.src.url} rel="noopener">{l.src.label}</a></span>
            </li>
          ))}
        </ul>
        {stats.length ? (
          <div className="yh-figures">
            <p className="meta">Life in {pc?.admin_district}: the official facts</p>
            <dl className="stat-list plain">
              {stats.map((s) => (
                <div key={s.slug}><dt>{PLAIN[s.slug]?.name ?? s.label}</dt><dd><b>{s.display}</b> <span className="meta">{s.period}{s.source ? <> · <a href={s.source.href} rel="noopener">{s.source.name}</a></> : null}</span><span className="meta sub">{PLAIN[s.slug]?.means ?? s.subtitle}</span></dd></div>
              ))}
            </dl>
            <p className="meta">From the ONS&rsquo;s Explore Local Statistics (Open Government Licence). They describe the area, not you.</p>
          </div>
        ) : sub === "renting" ? <p className="meta">We don&rsquo;t yet have an official rent figure for your area.</p> : null}
        {!tenure ? <p className="meta"><Link href="/start">Add your details</Link> and the lines that touch you are marked. They stay on this device.</p> : null}
      </section>

      <section className="yh-sec" id="compare" aria-labelledby="yh-compare">
        <h2 id="yh-compare">What would each {electionMode ? "candidate" : "party"} do?</h2>
        {electionMode && ballot ? (
          <>
            <p className="small">{held ? <>The {ballot.level === "parliamentary" ? "election" : "by-election"} in <strong>{ballot.area_name}</strong> on {longDate(ballot.poll_date)}, as it stood then. </> : <>Your next vote: <strong>{ballot.area_name}</strong>, {longDate(ballot.poll_date)}. </>}Every candidate, in ballot-paper order.</p>
            {ballot.level === "local" ? <p className="meta">A councillor doesn&rsquo;t make {sub === "renting" ? "renting law" : sub === "owning" ? "the law on buying and owning a home" : "national planning law"}; Parliament does. What the council itself decides is under &ldquo;Who has the power?&rdquo; below.</p> : null}
            <ol className="compare-grid">
              {candidates.map((c, i) => {
                const own = orderClaims(ballotClaims.filter((cl) => cl.candidate_id === c.id && onSub(cl)));
                const pid = effective(c.party_ec_id);
                const party = pid ? parties.get(pid) : undefined;
                const independent = !pid || pid === INDEPENDENT;
                const ballotParty = orderClaims(ballotClaims.filter((cl) => cl.candidate_id === null && effective(cl.party_ec_id) === pid && onSub(cl)));
                const policy = independent ? [] : ballotParty.length ? ballotParty : held ? [] : allPartyOnSub(pid);
                const partyName = c.party_name_on_ballot || party?.name || "";
                return (
                  <li key={c.id} className="compare-card">
                    <p className="cc-who"><span className="cc-n meta">{i + 1}</span> <strong>{c.name}</strong><span className="cc-party">{party?.colour_hex ? <span className="party-swatch" style={{ background: party.colour_hex }} aria-hidden /> : null}{partyName}</span></p>
                    {own.length ? <Entries list={own} applies={applies} because={because} appliesTo={appliesTo} /> : independent ? (
                      <p className="empty">No published position found yet.</p>
                    ) : (
                      <>
                        <p className="cc-none">{c.name} hasn&rsquo;t published anything themselves on {meta.short.toLowerCase()} that we could find.</p>
                        {policy.length ? (
                          <>
                            <p className="cc-label">{poss(party?.name ?? partyName)} national policy, not {poss(c.name)} own commitment</p>
                            <Entries list={policy} applies={applies} because={because} appliesTo={appliesTo} />
                          </>
                        ) : <p className="empty">We hold nothing {party?.name ?? partyName} has published on {meta.short.toLowerCase()}{held ? " for this election" : ""} either.</p>}
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
            {conSlug ? <p className="meta"><Link href={withParams({ mode: "parties" }) + "#compare"}>See the parties that stood here at the 2024 general election instead</Link></p> : null}
          </>
        ) : stood ? (
          <>
            <p className="small">No election we cover where you live right now, so here are the parties that stood in <strong>{stood.label || "your constituency"}</strong> at the general election on 4 July 2024, in alphabetical order.</p>
            <ol className="compare-grid">
              {[...stood.parties].sort((a, b) => (parties.get(a.ec_id)?.name ?? a.name).localeCompare(parties.get(b.ec_id)?.name ?? b.name)).map((p) => {
                const pid = effective(p.ec_id);
                const ours = pid ? parties.get(pid) : undefined;
                const list = allPartyOnSub(pid);
                const name = parties.get(p.ec_id)?.name ?? p.name;
                const colour = parties.get(p.ec_id)?.colour_hex ?? ours?.colour_hex ?? null;
                return (
                  <li key={p.ec_id} className="compare-card">
                    <p className="cc-who"><span className="cc-party solo">{colour ? <span className="party-swatch" style={{ background: colour }} aria-hidden /> : null}<strong>{name}</strong></span></p>
                    {list.length ? <Entries list={list} applies={applies} because={because} appliesTo={appliesTo} /> : <p className="empty">We hold nothing {name} has published on {meta.short.toLowerCase()}.</p>}
                  </li>
                );
              })}
            </ol>
            <MissingLine stood={stood} parties={[...parties.values()]} />
            <p className="meta">Who stood: <a href={stood.url} rel="noopener">Democracy Club</a> (CC BY 4.0).{conFromPoint ? " Your constituency was matched from a point near your postcode; if you live on a boundary, it may be the one next door." : ""}</p>
          </>
        ) : (
          <>
            <p className="small">{conSlug ? "We couldn't read who stood where you live just now. Please try again later." : "Tell us your postcode to see who stood where you live, or who is standing at your next vote."}</p>
            <form action={homePostcode} className="find-big yh-form" aria-label="Find who stood where you live">
              <label htmlFor="postcode">Your postcode</label>
              <div className="row"><PostcodeField errorId={error ? "yh-pc-error" : undefined} /><button type="submit">Show me</button></div>
              <input type="hidden" name="sub" value={sub} />
              {[...HOUSEHOLD_KEYS, "as", "profile"].map((k) => (one(k) ? <input key={k} type="hidden" name={k} value={one(k)} /> : null))}
              <p className="meta">Used once to find your constituency and your next election, via postcodes.io and Democracy Club. Never kept, and never in the page address.</p>
              {error ? <p className="notice small" id="yh-pc-error" role="alert">{error}</p> : null}
            </form>
          </>
        )}
        {(electionMode || stood) ? (
          <p className="meta">{countMine([...ballotClaims, ...[...partyClaims.values()].flat()].filter(onSub)) && tenure ? `Positions that name households like ${as ? "this one" : "yours"} are marked “${appliesTo}”. ` : ""}Nothing here is ranked or scored. {country && country !== "England" ? `Party positions are from UK-wide documents; most housing law in ${country} is made by the ${country === "Scotland" ? "Scottish Parliament" : country === "Wales" ? "Senedd" : "Northern Ireland Assembly"}.` : ""}</p>
        ) : null}
      </section>

      <section className="yh-sec" aria-labelledby="yh-power">
        <h2 id="yh-power">Who has the power?</h2>
        <ol className="power-row">
          {power.map((b) => (
            <li key={b.key} className={`power-box power-${b.key}`}>
              <p className="pw-title">{b.title}</p>
              <p className="pw-body">{b.body}</p>
              {b.lines.length ? (
                <ul>{b.lines.map((l) => <li key={l.text}>{l.text} <a className="meta" href={l.src.url} rel="noopener" aria-label={`Source: ${l.src.label}`}>source</a></li>)}</ul>
              ) : <p className="meta">Nothing on {meta.short.toLowerCase()} that we can source.</p>}
            </li>
          ))}
        </ol>
        <p className="meta"><Link href={`/explore/housing${loc ? `?loc=${loc.lat},${loc.lng}${outcode ? `&pc=${outcode}` : ""}` : ""}`}>Housing, from your front door to Parliament</Link>{council ? <> · <Link href={`/council/${council.slug}`}>Everything {council.name} is deciding</Link></> : null}</p>
      </section>

      <section className="yh-sec" aria-labelledby="yh-more">
        <h2 id="yh-more">Explore further</h2>
        <SourceTagKey />
        <HowThisPage label="How this page works, and its limits">
          <p><strong>What&rsquo;s happening</strong> lists bills in the current Parliament from the <a href="https://bills.parliament.uk/" rel="noopener">UK Parliament bills record</a> (Open Parliament Licence){slug ? <>, and {councilName}&rsquo;s agenda items from the last {90} days and next six weeks, the results read word for word from its minutes, and its open consultations</> : null}. Items that touch your profile come first, then the newest. A label appears only where the source says which: <b>{NOW_LABEL.decision}</b> for a bill that has received Royal Assent or a council result recorded in the minutes as agreed, carried or lost; <b>{NOW_LABEL.proposal}</b> for a Government Bill still going through Parliament, which Parliament describes as &ldquo;a formal proposal for a new law&rdquo;; <b>{NOW_LABEL.consultation}</b> for a consultation whose closing date has not passed. Bills from individual MPs and peers are folded away under their own heading.</p>
          <p><strong>What it means for you</strong> uses short lines written from the official pages they link to, and official figures for your council area. We don&rsquo;t calculate personal figures here.</p>
          <p><strong>What each would do</strong>: in an election we cover, every candidate in ballot-paper order, with what they published themselves. Where a candidate has published nothing on this, we say so and show their party&rsquo;s national policy, labelled as such. Outside an election, the parties that stood in your constituency at the 2024 general election, alphabetically, from Democracy Club. Each party&rsquo;s positions are from its own published documents, the same set used across the site.</p>
          <p><strong>How things are filed under {meta.short.toLowerCase()}</strong>: by these words only, in a position&rsquo;s summary or quotation, or a bill&rsquo;s, agenda item&rsquo;s or consultation&rsquo;s title.</p>
          <p className="word-list">{SUB_WORDS_SHOWN[sub].join(" · ")}</p>
          <p>A title from Parliament or a council must also contain one of these, so that it is about homes at all: {HOUSING_WORDS_SHOWN.join(" · ")}. The lists are fixed; changing one is a published decision.</p>
          <p><strong>Limits.</strong> Word lists miss things written differently, and can catch things that only mention a word. Parliament&rsquo;s bills mostly apply to England; housing is devolved in Scotland, Wales and Northern Ireland. We read meeting papers and consultations for some councils so far, not all. Housing figures come from the ONS and describe the council area as a whole.</p>
          <p>Sources: UK Parliament Bills API (Open Parliament Licence); council papers and consultation sites (each linked); Democracy Club candidates (CC BY 4.0); postcodes.io and the ONS (Open Government Licence); ONS Explore Local Statistics (Open Government Licence); GOV.UK and legislation.gov.uk (Open Government Licence); the Institute for Government (linked).</p>
        </HowThisPage>
        <p className="meta"><Link href="/positions?topic=housing_and_property">Every housing position from every party and candidate, including ones not filed under {meta.short.toLowerCase()}</Link></p>
      </section>

      <nav className="more-home" aria-label="More in Your Home">
        <p className="meta">More in Your Home</p>
        <ul className="sub-cards small">
          {HOME_SUBS.filter((s) => s.key !== sub).map((s) => (
            <li key={s.key} className="sub-card"><Link className="sub-link" href={withParams({ error: null }, `/themes/your-home/${s.key}`)}><span className="sub-title">{s.title}</span><span className="sub-blurb">{s.blurb}</span></Link></li>
          ))}
        </ul>
      </nav>
    </>
  );
}

// "Liberal Democrats' national policy", "Keir Starmer's own commitment".
const poss = (name: string) => (/s$/i.test(name) ? `${name}\u2019` : `${name}\u2019s`);

function NowRow({ it }: { it: Happening & { touches: boolean } }) {
  return (
    <li className="now-item">
      <p className="now-top">
        {it.label ? <span className={`now-label now-${it.label}`}>{NOW_LABEL[it.label]}</span> : null}
        <span className="now-where">{it.where}</span>
        {it.touches ? <InfoTip label="Why is this near the top?"><b>Why near the top?</b> Its title uses a word we file under the part of housing your profile points to. It says nothing about whether it is good or bad for you.</InfoTip> : null}
      </p>
      <p className="now-title"><ExtLink href={it.url}>{it.title}</ExtLink></p>
      <p className="meta now-detail">{it.dateWord} {longDate(it.date)}. {it.detail}</p>
    </li>
  );
}

function Entries({ list, applies, because, appliesTo }: { list: Claim[]; applies: (c: Claim) => boolean; because: (c: Claim) => string | null; appliesTo: string }) {
  const one = (c: Claim) => <div className="claim" key={c.id}><ClaimLayers c={c} applies={applies(c)} because={applies(c) ? because(c) : null} appliesTo={appliesTo} /></div>;
  return (
    <>
      {list.slice(0, SHOW).map(one)}
      {list.length > SHOW ? <details className="more"><summary className="meta">{list.length - SHOW} more</summary>{list.slice(SHOW).map(one)}</details> : null}
    </>
  );
}

// Romily, round eleven q5: "Make sure it is clear if some parties are missing so they know." Counted mechanically: the
// parties in our records, less the ones shown, less "Independent" and joint descriptions (which belong to a party shown
// or listed already).
function MissingLine({ stood, parties }: { stood: BallotStood; parties: Party[] }) {
  const shown = new Set(stood.parties.map((p) => p.ec_id));
  const shownParents = new Set(stood.parties.map((p) => parties.find((x) => x.ec_id === p.ec_id)?.parent_party_ec_id ?? p.ec_id));
  const others = parties.filter((p) => p.ec_id !== INDEPENDENT && !p.parent_party_ec_id && !shown.has(p.ec_id) && !shownParents.has(p.ec_id));
  return (
    <p className="missing-line">
      Only the parties that stood here in 2024 are shown. {others.length} other {others.length === 1 ? "party is" : "parties are"} in our records: <Link href="/parties">see every party</Link>.
      {stood.independents ? <> {stood.independents} independent {stood.independents === 1 ? "candidate" : "candidates"} also stood here; they have no party policy to show.</> : null}
    </p>
  );
}

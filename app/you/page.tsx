import Link from "next/link";
import { Suspense } from "react";
import AreaMap from "@/components/AreaMap";
import AreaNumbers from "@/components/AreaNumbers";
import AreaPanel from "@/components/AreaPanel";
import Layers from "@/components/Layers";
import NextElections from "@/components/NextElections";
import ProfileApply from "@/components/ProfileApply";
import StakeExplorer, { type Scale, type StakePosition } from "@/components/StakeExplorer";
import YouSummary from "@/components/YouSummary";
import { TOPICS, getBallot, listCandidates, publicClient } from "@/lib/data";
import { householdFromParams } from "@/lib/household";
import { topicsForHousehold } from "@/lib/topicOrder";
import { councilSlugFor, registerRows } from "@/lib/councils";
import { longDate } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your politics", robots: { index: false } };

// Round eight q6 (Romily, 29 Sept; agreed with Barny the same day): where the profile lands. Everything, catered to the
// person: what they are voting for, their area with the map and the official figures ("issues"), who decides what for
// them, and what is at stake from their street to the world in each party's own words ("what's at stake"), with the
// topics that touch them first. No verdicts, no ranking, no scores. Only the outward code and a rounded point travel in
// the address, as on the ballot pages; answers about the person never leave the browser (components/StakeExplorer).
type Row = { id: number; candidate_id: number | null; party_ec_id: string | null; topic: string; claim_text: string; source_quote: string; sources: { title: string; url: string; published_on: string | null } | null };

export default async function You({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const h = householdFromParams(sp);
  const outcode = /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(one("pc")) ? one("pc").toUpperCase() : null;
  const m = one("loc").match(/^(-?\d{1,2}\.\d{1,3}),(-?\d{1,3}\.\d{1,3})$/);
  const loc = m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
  const ballot = one("ballot") ? await getBallot(one("ballot")) : null;
  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => typeof v === "string" && k !== "ballot") as [string, string][]).toString();

  // The council and nation for this point (postcodes.io, rounded point only).
  let place: { district: string | null; districtGss: string | null; country: string | null; region: string | null } = { district: null, districtGss: null, country: null, region: null };
  if (loc) {
    try {
      const r = await fetch(`https://api.postcodes.io/postcodes?lon=${loc.lng}&lat=${loc.lat}&limit=1&radius=600`, { signal: AbortSignal.timeout(5000), next: { revalidate: 604800 } }).then((x) => x.json());
      const p = r?.result?.[0];
      if (p) place = { district: p.admin_district ?? null, districtGss: p.codes?.admin_district ?? null, country: p.country ?? null, region: p.region ?? null };
    } catch { /* optional */ }
  }
  const councilSlug = await councilSlugFor(place.district);
  const reg = place.districtGss ? (await registerRows()).find((r) => r.gss_code === place.districtGss || r.ons_gss_code === place.districtGss) : undefined;

  // Positions. National and world: what each party has published in its own documents (party-level claims), one list per
  // party in alphabetical order. Local: the candidates on this person's own council ballot, in ballot-paper order.
  const db = publicClient();
  const [{ data: partyRows }, { data: parties }] = await Promise.all([
    db.from("current_claims").select("id, candidate_id, party_ec_id, topic, claim_text, source_quote, sources(title, url, published_on)").eq("status", "verified").is("candidate_id", null).not("party_ec_id", "is", null),
    db.from("parties").select("ec_id, name, colour_hex"),
  ]);
  const partyName = new Map((parties ?? []).map((p) => [p.ec_id as string, p.name as string]));
  // Each party's own colour beside its own words (Romily, 29 Sept); candidates carry their party's.
  const colours: Record<string, string | null> = Object.fromEntries((parties ?? []).map((p) => [p.name as string, (p.colour_hex as string | null) ?? null]));
  const WORLD = new Set(["defence_foreign_affairs_and_eu", "environment_climate_and_energy"]);
  const seen = new Set<string>();
  const positions: StakePosition[] = [];
  for (const c of (partyRows ?? []) as unknown as Row[]) {
    const party = c.party_ec_id ? partyName.get(c.party_ec_id) : undefined;
    if (!party) continue;
    const k = `${party}|${c.topic}|${c.source_quote}`;
    if (seen.has(k)) continue; seen.add(k);
    positions.push({ id: c.id, scale: WORLD.has(c.topic) ? "world" : "uk", party, topic: c.topic, quote: c.source_quote, summary: c.claim_text, source: c.sources?.title ?? "", url: c.sources?.url ?? "", published: c.sources?.published_on ?? null });
  }
  const partyList = [...new Set(positions.map((p) => p.party))].sort((a, b) => a.localeCompare(b));

  let localWho: string[] = [];
  if (ballot && ballot.level === "local") {
    const cands = await listCandidates(ballot.ballot_paper_id);
    const label = new Map(cands.map((c) => [c.id, `${c.name}${c.party_name_on_ballot ? ` (${c.party_name_on_ballot})` : ""}`]));
    localWho = cands.map((c) => label.get(c.id)!);
    for (const c of cands) colours[label.get(c.id)!] = c.parties?.colour_hex ?? null;
    const { data: lc } = await db.from("current_claims").select("id, candidate_id, party_ec_id, topic, claim_text, source_quote, sources(title, url, published_on)").eq("status", "verified").eq("ballot_paper_id", ballot.ballot_paper_id).not("candidate_id", "is", null);
    for (const c of (lc ?? []) as unknown as Row[]) {
      const who = c.candidate_id ? label.get(c.candidate_id) : undefined;
      if (who) positions.push({ id: c.id, scale: "local", party: who, topic: c.topic, quote: c.source_quote, summary: c.claim_text, source: c.sources?.title ?? "", url: c.sources?.url ?? "", published: c.sources?.published_on ?? null });
    }
  }

  const order = topicsForHousehold(h);
  const topics = order.all.map((t) => ({ key: t.topic as string, label: t.label, reason: t.reason }));
  const allTopics = TOPICS.map(([k]) => k as string);
  const nation = place.country;
  const devolved = nation === "Scotland" ? "the Scottish Parliament" : nation === "Wales" ? "the Senedd" : nation === "Northern Ireland" ? "the Northern Ireland Assembly" : null;
  const scales: Scale[] = [
    {
      key: "local", title: "Your council", who: localWho,
      intro: ballot?.level === "local"
        ? `${ballot.area_name} votes on ${longDate(ballot.poll_date)}. What each candidate has put in writing, in ballot-paper order. Your council decides bins, planning, local roads, parking, libraries and council tax${place.district ? `; ${place.district} council's own papers show what it is deciding now.` : "."}`
        : `${place.district ? `${place.district} council` : "Your council"} decides bins, planning, local roads, parking, libraries and council tax. There is no council election here right now, so there are no candidates' promises to show; the council's own papers show what it is deciding.`,
      topics: ballot?.level === "local" ? allTopics : [],
      ...(councilSlug ? { extra: { text: `What ${place.district} council is deciding`, href: `/council/${councilSlug}` } } : {}),
    },
    {
      key: "nation", title: devolved ? `${nation}` : "Your region", who: [],
      intro: devolved
        ? `In ${nation}, ${devolved} decides ${nation === "Wales" ? "health, schools, housing and transport (policing stays with the UK Parliament)" : "health, schools, housing, transport and policing"}. ${nation === "Scotland" ? "It was elected in May 2026; its next election is due in 2031." : nation === "Wales" ? "It was elected in May 2026; its next election is due in May 2030." : "Its next election is expected in May 2027."} Party positions for it will appear here once candidates are confirmed.`
        : `In England most regional decisions are made by councils or, where there is one, a mayor and combined authority (transport, skills, housing money). ${reg?.combined_authority ? `You are in the ${reg.combined_authority} combined authority.` : ""} The chain above shows who covers your address.`,
      topics: [],
      extra: { text: "Who decides what, in plain English", href: "/learn/who-decides" },
    },
    { key: "uk", title: "The UK", who: partyList, intro: "What each party has published in its own national documents (manifestos and policy pages), in its own words, topic by topic. The topics that touch something you told us come first, with the reason; the rest follow in a fixed order.", topics: allTopics.filter((t) => !WORLD.has(t)) },
    { key: "world", title: "The world", who: partyList, intro: "Defence, foreign affairs, Europe, and climate and energy: what each party has published, in its own words.", topics: allTopics.filter((t) => WORLD.has(t)) },
  ];

  const days = ballot ? Math.round((Date.parse(ballot.poll_date + "T00:00:00Z") - Date.parse(new Date().toISOString().slice(0, 10) + "T00:00:00Z")) / 86400000) : null;
  const bq = qs ? `?${qs}` : "";
  return (
    <>
      <Suspense fallback={null}><ProfileApply /></Suspense>
      <p className="eyebrow">Your politics{outcode ? ` · ${outcode}` : ""}</p>
      <h1>Here&rsquo;s what&rsquo;s at stake for you.</h1>
      <p className="lede">Built from your answers: what you&rsquo;re voting for, your area, who decides what for you, and what every party has put in writing, with the parts that touch your life first. Nothing is ranked and nobody tells you how to vote.</p>
      <YouSummary />

      <nav className="you-nav" aria-label="On this page">
        <a href="#you-vote">What you&rsquo;re voting for</a><a href="#you-area">Your area</a><a href="#you-decides">Who decides</a><a href="#you-stake">What&rsquo;s at stake</a>
      </nav>

      <section id="you-vote" className="you-sec" aria-labelledby="you-vote-h">
        <h2 id="you-vote-h">What you&rsquo;re voting for</h2>
        {ballot ? (
          <div className="you-ballot">
            <p className="you-when">{days === 0 ? "Polling day is today" : days === 1 ? "Polling day is tomorrow" : days !== null && days > 0 ? `In ${days} days` : "Held"} &middot; {longDate(ballot.poll_date)}</p>
            <p className="you-what"><strong>{ballot.area_name}</strong>: {ballot.level === "parliamentary" ? "a UK Parliament by-election, choosing the MP" : "a council by-election, choosing a councillor"}.</p>
            {one("approx") === "1" ? <p className="notice small">We matched your postcode from its centre point. If it sits on a boundary, check your poll card.</p> : null}
            <p className="you-links">
              <Link className="button" href={`/ballot/${encodeURIComponent(ballot.ballot_paper_id)}${bq}#ballot-paper`}>See who is standing &rarr;</Link>
              <Link href={`/ballot/${encodeURIComponent(ballot.ballot_paper_id)}/office${bq}`}>What this job controls</Link>
              <Link href={`/ballot/${encodeURIComponent(ballot.ballot_paper_id)}/stakes${bq}`}>How the candidates&rsquo; policies could affect a household like yours</Link>
            </p>
          </div>
        ) : (
          <Suspense fallback={<p className="meta">Looking up your next elections…</p>}><NextElections lat={loc?.lat ?? null} lng={loc?.lng ?? null} /></Suspense>
        )}
        <p className="meta"><Link href="/next">Every election coming up, with a calendar and a map &rarr;</Link></p>
      </section>

      {loc ? (
        <section id="you-area" className="you-sec" aria-labelledby="you-area-h">
          <h2 id="you-area-h">Your area</h2>
          <p>The map shows what is around your postcode: recorded crime, schools, land for new homes, green belt and conservation areas, flood risk, air quality and storm overflows. Tap a dot for the official record, or use the key to switch layers on and off.</p>
          <AreaMap ballotId={ballot?.ballot_paper_id} areaName={ballot?.area_name ?? place.district ?? outcode ?? "your area"} lat={loc.lat} lng={loc.lng} outcode={outcode} levelLabel={ballot?.level === "local" ? "ward" : "constituency"} loc={loc} />
          <h3>Issues where you live: the official figures</h3>
          {place.districtGss ? <Suspense fallback={<p className="meta">Loading official figures…</p>}><AreaNumbers gss={reg?.ons_gss_code ?? place.districtGss} name={place.district ?? "your council area"} region={reg?.region ?? place.region} /></Suspense> : null}
          <Suspense fallback={null}><AreaPanel areaName={ballot?.area_name ?? place.district ?? "your area"} level={ballot?.level ?? "local"} lat={loc.lat} lng={loc.lng} pointNote={null} hpiRegion={ballot?.hpi_region} gss={ballot?.area_gss ?? null} loc={loc} /></Suspense>
        </section>
      ) : null}

      {loc ? (
        <section id="you-decides" className="you-sec">
          <Suspense fallback={<p className="meta">Working out who decides for your postcode…</p>}><Layers lat={loc.lat} lng={loc.lng} electionCouncil={ballot?.level === "local" ? ballot.area_name.split(":")[0] : null} /></Suspense>
        </section>
      ) : null}

      <section id="you-stake" className="you-sec" aria-labelledby="you-stake-h">
        <h2 id="you-stake-h">What&rsquo;s at stake, from your street to the world</h2>
        <StakeExplorer colours={colours} positions={positions} topics={topics} scales={scales} parties={partyList} sourceNote="Party positions are quoted from each party's own published documents, the same set used on the ballot pages; the short version under each quote is a reading aid. Parties are listed alphabetically; candidates in ballot-paper order." />
      </section>
    </>
  );
}

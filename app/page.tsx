import Link from "next/link";
import { longDate } from "@/lib/dates";
import { countClaimsByStatus, countClaimsPerBallot, listArchivedBallots, listBallots, listFaceTiles, publicClient } from "@/lib/data";
import BallotsMap from "@/components/BallotsMap";
import CountUp from "@/components/CountUp";
import Ticker from "@/components/Ticker";
import YourDemocracy from "@/components/YourDemocracy";
import TryPostcode from "@/components/TryPostcode";
import ElectionTimeline from "@/components/ElectionTimeline";
import HomeLookup, { LookupView } from "@/components/HomeLookup";
import JsonLd from "@/components/JsonLd";
import { graph, webPage } from "@/lib/schema";
import { Suspense } from "react";

// Cached and rebuilt every five minutes: the home page is the same for everyone, so it can be served straight from the edge.
export const revalidate = 300;
const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// "Try it" households (Barny, 27 Sept): deliberately unlike one another in age, household, housing, money, work and
// travel, so that as many people as possible see someone like them. Every value is one of the profile's own bands.
const EXAMPLES = [
  { title: "A student sharing a rented house", facts: "18 to 24 · university · part-time job · under £15,000 · no car",
    query: "age_band=18_24&household=shared&children=none&tenure=private_rent&income_band=under_15k&employment=student_working&student=university&drives=no" },
  { title: "A young family renting from the council", facts: "25 to 34 · a couple with a child under 5 · £15,000 to £25,000 · claims Universal Credit",
    query: "age_band=25_34&household=couple&children=under_5&tenure=social_rent&income_band=15k_25k&employment=employed&student=no&benefits=yes" },
  { title: "A retired homeowner living alone", facts: "65 or over · owns outright · pension income £25,000 to £40,000 · drives",
    query: "age_band=65_plus&household=single&children=none&tenure=own_outright&income_band=25k_40k&employment=retired&student=no&drives=yes" },
];

// Under 60 characters so search results show it whole (Nova audit, 27 Sept).
export const metadata = {
  title: { absolute: "What’s It To Me? · Who’s on your ballot and what it means" },
  description: "See every candidate on your UK ballot in ballot-paper order, what each has actually published, and what it could mean for you. Impartial and sourced.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const [ballots, archived, counts, srcRes, perBallot, tiles, recent] = await Promise.all([listBallots(), listArchivedBallots(), countClaimsByStatus(), publicClient().from("sources").select("id"), countClaimsPerBallot(), listFaceTiles(), publicClient().from("current_claims").select("id, created_at").eq("status", "verified").gte("created_at", weekAgo)]);
  const live = counts.verified ?? 0; const sources = srcRes.data?.length ?? 0;
  // The worked examples use the upcoming election with the most sourced positions, so there is something to see.
  const example = [...ballots].sort((a, b) => (perBallot[b.ballot_paper_id] ?? 0) - (perBallot[a.ballot_paper_id] ?? 0))[0] ?? null;
  return (
    <>
      <JsonLd data={graph(webPage("/", "What’s It To Me? · Who’s on your ballot and what it means", "See every candidate on your UK ballot in ballot-paper order, what each has actually published, and what it could mean for you. Impartial and sourced.", { "@type": ["WebPage", "CollectionPage"], about: { "@type": "Thing", name: "UK elections and the candidates standing in them" }, mainEntity: { "@type": "ItemList", name: "Elections covered", numberOfItems: ballots.length, itemListElement: ballots.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: `${b.area_name}, ${longDate(b.poll_date)}`, url: `https://whatsittome.org/ballot/${encodeURIComponent(b.ballot_paper_id)}` })) } }))} />
      <YourDemocracy />
      <div className="home-lockup">
        {/* AVIF first (about half the bytes of the WebP), WebP for older browsers (Nova audit: the largest thing on a phone's first screen). */}
        <picture className="brand-light"><source srcSet="/brand/lockup-light.avif" type="image/avif" /><img src="/brand/lockup-light.webp" fetchPriority="high" alt="What&rsquo;s It To Me? Politics, in your context." width={633} height={514} /></picture>
        <picture className="brand-dark"><source srcSet="/brand/lockup-dark.avif" type="image/avif" /><img src="/brand/lockup-dark.webp" loading="lazy" alt="What&rsquo;s It To Me? Politics, in your context." width={633} height={515} /></picture>
      </div>
      <section className="hero-ballot hero-grid">
        <div className="hero-main">

        {/* Romily's own words (round eight, q14, 29 Sept), replacing the lines she picked out as sounding like AI. */}
        <h1>You&rsquo;ve heard what they stand for. <em>But what does it mean for you?</em></h1>
        <p className="lede" style={{ maxWidth: "44rem" }}>In an era where we hear about politics from politicians and misinformation blurs the line between fact and opinion, What&rsquo;s It To Me? puts the information back in your hands. Explore the people, policies and decisions affecting your life, your community and beyond. No rankings. No recommendations. Just the information to make up your own mind.</p>

        {/* Romily, round eight (1, and q5 on 29 Sept): the profile is the centre of attention, called "Personalise my politics";
            the postcode is its first step and the quick lookup stays folded underneath. */}
        <div className="start-cta">
          <Link href="/start" className="button big">Personalise my politics &rarr;</Link>
          <p className="meta">A few quick questions, starting with your postcode, so what you read is about a household like yours. Skip any after the first. We don&rsquo;t store your answers.</p>
        </div>
        <Suspense fallback={<LookupView error={null} />}><HomeLookup /></Suspense>
        <ul className="trust-strip" aria-label="Why you can rely on what you read here">
          <li><Link href="/about"><b>Never tells you how to vote.</b> No rankings, scores or quiz matches.</Link></li>
          <li><Link href="/ledger"><b>Every claim sourced.</b> Exact words, dated, in a public ledger.</Link></li>
          <li><Link href="/who-we-are#interests"><b>Independent.</b> No ads and no money from any party.</Link></li>
          <li><Link href="/accessibility"><b>Built for everyone.</b> Tested against WCAG 2.2 AA.</Link></li>
        </ul>
        <p className="hero-rules">We will never tell you who to vote for, and we never score anyone. Every candidate gets the same page, in the order they appear on the ballot paper, and every statement links to where they said it. The judgement stays with you.</p>
        </div>
        <TryPostcode today={new Date().toISOString().slice(0, 10)} />
        <aside className="word-card" aria-label="Where the name comes from">
          <p className="word-head"><span className="word">What&rsquo;s it to me?</span> <span className="word-answer">Quite a lot, actually.</span></p>
          <p>The question people actually ask about politics, and the hardest one to get answered. Not who is winning &mdash; what it would mean for you, your household, your street. <Link href="/who-we-are#the-name">Where the name comes from &rarr;</Link></p>
        </aside>
        <div className="hero-foot">
        <ul className="stats" aria-label="What is on the site">
          <li><b><CountUp value={ballots.length} /></b> elections now</li>
          <li><b><CountUp value={live} /></b> sourced positions</li>
          <li><b><CountUp value={sources} /></b> named sources</li>
          <li><b>0</b> recommendations</li>
        </ul>
        </div>
      </section>

      <Ticker items={[
        `${ballots.length} elections open now`,
        `Next polling day ${new Date(ballots[0]?.poll_date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}`,
        `${tiles.length} candidates`,
        `${live} sourced positions`,
        `${sources} named sources`,
        "0 recommendations",
        "Every candidate, the same page",
        "We never ask who you support",
      ]} />

      {/* Romily (round 5, "anything else"): the question, asked of each topic, then with the perspective widened. Round eight q5
          (29 Sept): the four examples should touch the widest range of people, so they are things almost every household meets
          (the cost of living, health and care, a home, and who runs things locally and nationally). Every link goes to a page
          that treats every candidate the same; the order is fixed and nothing here depends on who is standing. */}
      {ballots.length ? (() => { const b = encodeURIComponent(ballots[0].ballot_paper_id); return (
        <section className="whats-it" aria-label="What's it to me?">
          <ul className="whats-it-topics">
            <li><Link href={`/ballot/${b}/topic/money_and_cost_of_living`}><span>The cost of living.</span> What&rsquo;s it to me?</Link></li>
            <li><Link href={`/ballot/${b}/topic/healthcare_and_social_care`}><span>Health and care.</span> What&rsquo;s it to me?</Link></li>
            <li><Link href="/explore/housing"><span>A home.</span> What&rsquo;s it to me?</Link></li>
            <li><Link href={`/ballot/${b}/office`}><span>The council, the MP.</span> What&rsquo;s it to me?</Link></li>
          </ul>
          <p className="whats-it-shift">Then widen the question: <Link href={`/ballot/${b}/area`}>what&rsquo;s it to my neighbourhood?</Link> <Link href={`/ballot/${b}/area#reps-heading`}>My region?</Link> <Link href="/parties">The country?</Link> <Link href={`/ballot/${b}?age_band=65_plus&household=single&children=none&tenure=social_rent&income_band=under_15k&employment=retired&student=no`}>Someone unlike me?</Link></p>
          <p className="meta">Describe any household, not only your own. The same page, the same rules, for every candidate.</p>
        </section>
      ); })() : null}

      <p className="meta faces-note">{tiles.length} candidates are asking for a vote right now across {ballots.length} elections. Each election below lists them in ballot-paper order; photos appear only on a candidate's own page.</p>

      {ballots.length ? (
        <section className="democracy">
          <h2 style={{ borderTop: 0, paddingTop: 0, marginTop: 0 }}>What's happening now</h2>
          <ul className="keypoints">
            {(() => { const d = Math.max(0, Math.round((new Date(ballots[0].poll_date + "T00:00:00Z").getTime() - new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime()) / 86400000)); const when = new Date(ballots[0].poll_date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }); return d === 0 ? <li><b>Today</b>is polling day, {when}</li> : <li><b>{d}</b>{d === 1 ? "day" : "days"} until the next polling day, {when}</li>; })()}
            <li><b>{tiles.length}</b>candidates confirmed across {ballots.length} elections</li>
            <li><b>{recent.data?.length ?? 0}</b>sourced positions added in the last seven days</li>
          </ul>
          <p className="meta"><Link href="/positions">Every position</Link> · <Link href="/parties">Explore the parties</Link> · <Link href="/learn">Learn how it works</Link></p>
        </section>
      ) : null}

      {example ? (
        <section className="examples" aria-labelledby="examples-h">
          <h2 id="examples-h" className="examples-title">Try it as someone else</h2>
          <p className="meta" style={{ margin: "0 0 0.6rem" }}>Three very different households, one election ({example.area_name}, {longDate(example.poll_date)}). Open one to see what each candidate has published that touches that household.</p>
          <ul className="example-cards">
            {EXAMPLES.map((e) => (
              <li key={e.title} className="example-card">
                <Link prefetch={false} className="ex-title card-link" href={`/ballot/${encodeURIComponent(example.ballot_paper_id)}?${e.query}`}>{e.title}</Link>
                <span className="ex-facts">{e.facts}</span>
                <span className="ex-go" aria-hidden>See what applies →</span>
              </li>
            ))}
          </ul>
          <p className="meta" style={{ margin: "0.6rem 0 0" }}>Or skip the household: <Link prefetch={false} href={`/ballot/${encodeURIComponent(example.ballot_paper_id)}/compare`}>all candidates side by side</Link> · <Link prefetch={false} href={`/ballot/${encodeURIComponent(example.ballot_paper_id)}/topic/housing_and_property`}>everyone on housing</Link></p>
        </section>
      ) : null}

      <ol className="steps">
        <li><strong>Open a ballot</strong><span>Every candidate, from the official nomination list, in the order they appear on the paper.</span><a href="#elections" className="step-go card-link">Choose an election <span aria-hidden>→</span></a></li>
        <li><strong>Describe a household</strong><span>Seven quick questions. Yours, a friend's, a neighbour's, someone unlike you. We don't store your answers.</span><Link prefetch={false} href="/start" className="step-go card-link">Personalise my politics <span aria-hidden>→</span></Link></li>
        <li><strong>See what applies</strong><span>What each candidate has said on ten topics, what it would mean for that household in pounds where it can be calculated, and where every word came from.</span>{example ? <Link prefetch={false} href={`/ballot/${encodeURIComponent(example.ballot_paper_id)}?${EXAMPLES[0].query}`} className="step-go card-link">See an example <span aria-hidden>→</span></Link> : null}</li>
      </ol>

      {ballots.length > 3 ? (<>
        <ElectionTimeline today={new Date().toISOString().slice(0, 10)} ballots={ballots.map((b) => ({ id: b.ballot_paper_id, area: b.area_name, date: b.poll_date, level: b.level, locked: b.candidates_locked, positions: perBallot[b.ballot_paper_id] ?? 0, faces: tiles.filter((t) => t.ballot === b.ballot_paper_id).map((t) => ({ name: t.name, photo: null, colour: t.colour })) }))} />
        <h3 style={{ marginTop: "2rem" }}>On the map</h3>
        <BallotsMap ballots={ballots.map((b) => ({ ballot_paper_id: b.ballot_paper_id, area_name: b.area_name, poll_date: b.poll_date, level: b.level, lat: b.area_lat, lng: b.area_lng }))} />
        <p><Link href="/next">What can I vote in next? Calendar, map and countdown &rarr;</Link></p>
      </>) : null}
      <p className="meta">A test version. Elections are added as their candidate lists are confirmed; you can look at any covered election whether or not you live there.</p>

      {archived.length ? (<>
        <h2>Archive</h2>
        <p className="small">Past elections, shown as they stood at the time. Useful for seeing how the same household would have looked under the law and the pledges of that year.</p>
        <ul style={{ paddingLeft: "1.1rem" }}>
          {archived.map((b) => (
            <li key={b.ballot_paper_id}><Link href={`/ballot/${encodeURIComponent(b.ballot_paper_id)}`}>{b.area_name}</Link> — {fmt(b.poll_date)}</li>
          ))}
        </ul>
      </>) : null}

      <h2>Two kinds of statement, both labelled</h2>
      <p>
        <strong>Computed</strong>: tax and benefit effects for a household in your bands, calculated with the open-source PolicyEngine UK model from a party's published pledges.{" "}
        <strong>Documented</strong>: a pledge that applies to a household like yours, quoted exactly from the party's or candidate's own published material, with source and date.
        Where a candidate has published nothing on a topic, it says so, in the same place, for everyone.
      </p>
      <p><Link href="/how-to-vote">How voting works: eligibility, ID, postal and proxy, support if you need it</Link> · <Link href="/about">The rules this site follows</Link> · <Link href="/ledger">The public ledger</Link></p>
    </>
  );
}

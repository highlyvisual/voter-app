import Link from "next/link";
import { longDate } from "@/lib/dates";
import { countClaimsPerBallot, listArchivedBallots, listBallots } from "@/lib/data";
import { HomeLocal, HomeMap, HomeNextVote, type HomeBallot } from "@/components/HomeApp";
import JsonLd from "@/components/JsonLd";
import { graph, webPage } from "@/lib/schema";

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
  const [ballots, archived, perBallot] = await Promise.all([listBallots(), listArchivedBallots(), countClaimsPerBallot()]);
  const today = new Date().toISOString().slice(0, 10);
  const homeBallots: HomeBallot[] = ballots.map((b) => ({ id: b.ballot_paper_id, area: b.area_name, date: b.poll_date, level: b.level, lat: b.area_lat, lng: b.area_lng }));
  // The worked examples use the upcoming election with the most sourced positions, so there is something to see.
  const example = [...ballots].sort((a, b) => (perBallot[b.ballot_paper_id] ?? 0) - (perBallot[a.ballot_paper_id] ?? 0))[0] ?? null;
  const first = ballots[0] ? encodeURIComponent(ballots[0].ballot_paper_id) : null;
  return (
    <>
      <JsonLd data={graph(webPage("/", "What’s It To Me? · Who’s on your ballot and what it means", "See every candidate on your UK ballot in ballot-paper order, what each has actually published, and what it could mean for you. Impartial and sourced.", { "@type": ["WebPage", "CollectionPage"], about: { "@type": "Thing", name: "UK elections and the candidates standing in them" }, mainEntity: { "@type": "ItemList", name: "Elections covered", numberOfItems: ballots.length, itemListElement: ballots.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: `${b.area_name}, ${longDate(b.poll_date)}`, url: `https://whatsittome.org/ballot/${encodeURIComponent(b.ballot_paper_id)}` })) } }))} />
      {/* Romily, round ten (q1 and q2): the home page is a short run of screens, one idea and one main action each, in
          her order of importance: your next vote, what's happening where you live, then how it all works. The detail
          that used to fill this page sits behind a tap at the foot, or on the pages it came from (/next has the
          calendar and countdown; the ticker and the counts are gone).
          Screen one keeps her 29 Sept design (rows 3 and 10, design E): the big map, with the next vote beside it (below
          it on a phone). id="elections" keeps older links to /#elections landing on the map of elections. */}
      <section id="elections" className="home-app" aria-label="Your next vote">
        <HomeMap ballots={homeBallots} />
        <div className="home-sheet">
          <div className="home-lockup">
            {/* AVIF first (about half the bytes of the WebP), WebP for older browsers (Nova audit). */}
            <picture className="brand-light"><source srcSet="/brand/lockup-light.avif" type="image/avif" /><img src="/brand/lockup-light.webp" fetchPriority="high" alt="What&rsquo;s It To Me? Politics, in your context." width={633} height={514} /></picture>
            <picture className="brand-dark"><source srcSet="/brand/lockup-dark.avif" type="image/avif" /><img src="/brand/lockup-dark.webp" loading="lazy" alt="What&rsquo;s It To Me? Politics, in your context." width={633} height={515} /></picture>
          </div>
          {/* Romily's own words (round eight, q14), cut down on 29 Sept at her request ("too chunky"). Kept, smaller, in
              round ten so that the next vote leads. For her to edit. */}
          <p className="home-slogan">You&rsquo;ve heard what they stand for. <em>But what does it mean for you?</em></p>
          <HomeNextVote ballots={homeBallots} today={today} />
          {/* The same line the app uses on its Home screen. */}
          <p className="meta nv-independent">Independent. No rankings, no recommendations, not affiliated with any government.</p>
        </div>
      </section>

      <section className="home-screen" aria-labelledby="local-h">
        <div className="home-screen-in">
          <h2 id="local-h">What&rsquo;s happening where you live</h2>
          <p className="home-screen-lede">What your council is deciding, consultations you can answer, and the official facts about your street: crime, schools, new homes and flood risk.</p>
          <HomeLocal />
        </div>
      </section>

      <section className="home-screen alt" aria-labelledby="learn-h">
        <div className="home-screen-in">
          <h2 id="learn-h">Understand how it works</h2>
          <p className="home-screen-lede">Who decides what, what a councillor actually does, and how voting works, in plain English.</p>
          <Link href="/learn" className="button big">Learn how it works &rarr;</Link>
          <p className="nv-second"><Link href="/how-to-vote">How to vote: ID, post and proxy</Link></p>
        </div>
      </section>

      {/* The quiet foot of the page (round ten, q2): everything else, folded. Each fold is a native <details>, so it opens
          from the keyboard and screen readers announce whether it is open. */}
      <section className="home-foot" aria-label="More from this site">
        <Link href="/feedback?from=/" className="fb-invite"><span><strong>Trying it out?</strong> Tell us what you think: two minutes, anonymous.</span><span aria-hidden>&rarr;</span></Link>

        {example ? (
          <details className="home-fold">
            <summary>Try it as someone else</summary>
            <div className="examples">
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
            </div>
          </details>
        ) : null}

        {archived.length ? (
          <details className="home-fold">
            <summary>Past elections</summary>
            <p className="small">Shown as they stood at the time. Useful for seeing how the same household would have looked under the law and the pledges of that year.</p>
            <ul style={{ paddingLeft: "1.1rem" }}>
              {archived.map((b) => (
                <li key={b.ballot_paper_id}><Link href={`/ballot/${encodeURIComponent(b.ballot_paper_id)}`}>{b.area_name}</Link> — {fmt(b.poll_date)}</li>
              ))}
            </ul>
          </details>
        ) : null}

        <details className="home-fold">
          <summary>More about this site</summary>
          <ul className="trust-strip" aria-label="Why you can rely on what you read here">
            <li><Link href="/about"><b>Never tells you how to vote.</b> No rankings, scores or quiz matches.</Link></li>
            <li><Link href="/ledger"><b>Every claim sourced.</b> Exact words, dated, in a public ledger.</Link></li>
            <li><Link href="/who-we-are#interests"><b>Independent.</b> No ads and no money from any party.</Link></li>
            <li><Link href="/accessibility"><b>Built for everyone.</b> Tested against WCAG 2.2 AA.</Link></li>
          </ul>
          <aside className="word-card" aria-label="Where the name comes from">
            <p className="word-head"><span className="word">What&rsquo;s it to me?</span> <span className="word-answer">Quite a lot, actually.</span></p>
            <p>The question people actually ask about politics, and the hardest one to get answered. Not who is winning &mdash; what it would mean for you, your household, your street. <Link href="/who-we-are#the-name">Where the name comes from &rarr;</Link></p>
          </aside>
          {/* Romily (round 5, "anything else"): the question, asked of each topic, then with the perspective widened. Round
              eight q5 (29 Sept): things almost every household meets. Every link goes to a page that treats every
              candidate the same; the order is fixed and nothing here depends on who is standing. */}
          {first ? (
            <section className="whats-it" aria-label="What's it to me?">
              <ul className="whats-it-topics">
                <li><Link href={`/ballot/${first}/topic/money_and_cost_of_living`}><span>The cost of living.</span> What&rsquo;s it to me?</Link></li>
                <li><Link href={`/ballot/${first}/topic/healthcare_and_social_care`}><span>Health and care.</span> What&rsquo;s it to me?</Link></li>
                <li><Link href="/explore/housing"><span>A home.</span> What&rsquo;s it to me?</Link></li>
                <li><Link href={`/ballot/${first}/office`}><span>The council, the MP.</span> What&rsquo;s it to me?</Link></li>
              </ul>
              <p className="whats-it-shift">Then widen the question: <Link href={`/ballot/${first}/area`}>what&rsquo;s it to my neighbourhood?</Link> <Link href={`/ballot/${first}/area#reps-heading`}>My region?</Link> <Link href="/parties">The country?</Link> <Link href={`/ballot/${first}?age_band=65_plus&household=single&children=none&tenure=social_rent&income_band=under_15k&employment=retired&student=no`}>Someone unlike me?</Link></p>
            </section>
          ) : null}
          <h2 className="home-fold-h">Two kinds of statement, both labelled</h2>
          <p>
            <strong>Computed</strong>: tax and benefit effects for a household in your bands, calculated with the open-source PolicyEngine UK model from a party&rsquo;s published pledges.{" "}
            <strong>Documented</strong>: a pledge that applies to a household like yours, quoted exactly from the party&rsquo;s or candidate&rsquo;s own published material, with source and date.
            Where a candidate has published nothing on a topic, it says so, in the same place, for everyone.
          </p>
          <p className="meta">A test version. Elections are added as their candidate lists are confirmed; you can look at any covered election whether or not you live there.</p>
          <p><Link href="/next">Every election coming up</Link> · <Link href="/positions">Every position</Link> · <Link href="/parties">The parties</Link> · <Link href="/about">The rules this site follows</Link> · <Link href="/ledger">The public ledger</Link></p>
        </details>
      </section>
    </>
  );
}

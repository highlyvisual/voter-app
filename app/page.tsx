import Link from "next/link";
import { countClaimsByStatus, countClaimsPerBallot, listArchivedBallots, listBallots, listFaceTiles, publicClient } from "@/lib/data";
import { findElection } from "./find/actions";
import BallotsMap from "@/components/BallotsMap";
import FacesWall from "@/components/FacesWall";
import CountUp from "@/components/CountUp";
import Ticker from "@/components/Ticker";
import YourDemocracy from "@/components/YourDemocracy";
import TryPostcode from "@/components/TryPostcode";
import ElectionTimeline from "@/components/ElectionTimeline";
import { img } from "@/lib/site";
import PostcodeField from "@/components/PostcodeField";

export const dynamic = "force-dynamic";
const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const [ballots, archived, counts, srcRes, perBallot, tiles, recent] = await Promise.all([listBallots(), listArchivedBallots(), countClaimsByStatus(), publicClient().from("sources").select("id"), countClaimsPerBallot(), listFaceTiles(), publicClient().from("current_claims").select("id, created_at").eq("status", "verified").gte("created_at", weekAgo)]);
  const live = counts.verified ?? 0; const sources = srcRes.data?.length ?? 0;
  return (
    <>
      <YourDemocracy />
      <section className="hero-ballot hero-grid">
        <div className="hero-main">

        <h1>Politics affects your life. Understanding it <em>shouldn&rsquo;t be difficult.</em></h1>
        <p className="lede" style={{ maxWidth: "44rem" }}>See who is asking for your vote, what they have actually published, and what it could mean for a household like yours.</p>
        
        <form action={findElection} className="find-big" aria-label="Find your election">
          <label htmlFor="postcode">Your postcode</label>
          <div className="row">
            <PostcodeField />
            <button type="submit">Find my election</button>
          </div>
          <p className="meta">Used once to find the elections at that address, via Democracy Club. Never kept by us. <Link href="/start" className="quiet-link">Or build your profile first →</Link></p>
          {error ? <p className="notice small" role="alert" style={{ marginTop: "0.6rem" }}>{error}</p> : null}
        </form>
        <p className="hero-rules">No political quiz. No recommendation. Just the evidence: every candidate gets the same page, in ballot-paper order, and every statement links to where it was published.</p>
        </div>
        <TryPostcode today={new Date().toISOString().slice(0, 10)} />
        <aside className="word-card" aria-label="What the word hustings means">
          <p className="word-head"><span className="word">hustings</span> <span className="pron">/ˈhʌs.tɪŋz/</span></p>
          <p>A meeting where every candidate in an election stands on the same platform and answers the same questions from voters. From Old Norse <em>hūsþing</em>, &ldquo;house assembly&rdquo;. That is what this site tries to be. <Link href="/who-we-are#the-word">The story of the word →</Link></p>
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

      <FacesWall tiles={tiles} />

      {ballots.length ? (
        <section className="democracy">
          <h2 style={{ borderTop: 0, paddingTop: 0, marginTop: 0 }}>What's happening now</h2>
          <ul className="keypoints">
            <li><b>{Math.max(0, Math.round((new Date(ballots[0].poll_date + "T00:00:00Z").getTime() - new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime()) / 86400000))}</b>days until the next polling day, {new Date(ballots[0].poll_date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}</li>
            <li><b>{tiles.length}</b>candidates confirmed across {ballots.length} elections</li>
            <li><b>{recent.data?.length ?? 0}</b>sourced positions added in the last seven days</li>
          </ul>
          <p className="meta"><Link href="/positions">Every position</Link> · <Link href="/parties">Explore the parties</Link> · <Link href="/learn">Learn how it works</Link></p>
        </section>
      ) : null}

      {ballots.length ? (
        <div className="example-links">
          <span className="meta" style={{ alignSelf: "center" }}>Try it:</span>
          <Link className="button secondary" href={`/ballot/${encodeURIComponent(ballots[0].ballot_paper_id)}?age_band=25_34&household=couple&children=school_age&tenure=private_rent&income_band=25k_40k&employment=employed&student=no`}>A renting couple with a child on £25–40k</Link>
          <Link className="button secondary" href={`/ballot/${encodeURIComponent(ballots[0].ballot_paper_id)}/compare`}>All candidates side by side</Link>
          <Link className="button secondary" href={`/ballot/${encodeURIComponent(ballots[0].ballot_paper_id)}/topic/housing_and_property`}>Everyone on housing</Link>
        </div>
      ) : null}

      <ol className="steps">
        <li><strong>Open a ballot</strong>Every candidate, from the official nomination list, in the order they appear on the paper.</li>
        <li><strong>Describe a household</strong>Seven quick bands. Yours, a friend's, a neighbour's. Nothing is saved.</li>
        <li><strong>See what applies</strong>Calculated tax and benefit figures, and each candidate's published positions on nine topics, with sources and independent further reading.</li>
      </ol>

      {ballots.length > 3 ? (<>
        <ElectionTimeline today={new Date().toISOString().slice(0, 10)} ballots={ballots.map((b) => ({ id: b.ballot_paper_id, area: b.area_name, date: b.poll_date, level: b.level, locked: b.candidates_locked, positions: perBallot[b.ballot_paper_id] ?? 0, faces: tiles.filter((t) => t.ballot === b.ballot_paper_id).map((t) => ({ name: t.name, photo: t.photo ? img(t.photo, 80) : null, colour: t.colour })) }))} />
        <h3 style={{ marginTop: "2rem" }}>On the map</h3>
        <BallotsMap ballots={ballots.map((b) => ({ ballot_paper_id: b.ballot_paper_id, area_name: b.area_name, poll_date: b.poll_date, level: b.level, lat: b.area_lat, lng: b.area_lng }))} />
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

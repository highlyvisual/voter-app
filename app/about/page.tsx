import Link from "next/link";
export default function About() {
  return (
    <>
      <p className="meta"><Link href="/who-we-are">Who we are, and why Hustings exists →</Link></p>
      <h1>How this works</h1>
      <p className="lede">The rules below are not aspirations. They are built into the code, which is public.</p>

      <h2>What this site never does</h2>
      <ul>
        <li>It never recommends, ranks, scores or matches. It shows consequences; you judge.</li>
        <li>It never asks who you support or how you voted. It asks only about a household, in bands, and keeps nothing: an optional profile lives in your own browser, never with us.</li>
        <li>It never publishes a position without its source. Every claim is a quotation from a named, dated, linked source; a short summary sits beneath it as a reading aid, and the quotation is the authority.</li>
      </ul>

      <div className="keypoint"><strong>The test we hold ourselves to:</strong> if you can tell from this site which way we would vote, we have failed.</div>

      <h2>Every candidate, the same page</h2>
      <p>
        Same sections, same order, same space, listed in ballot-paper order (alphabetical by surname). Where a candidate has published nothing on a topic,
        the slot says so and points to where to look, for every candidate alike. A party's established colour appears only where it is directly tied to that party's own material (a candidate's photo border, the party name, their column in a comparison), at identical weight for every party; every other colour on the site is neutral, and parties without an established colour stay grey.
      </p>

      <ul className="keypoints">
        <li><b>0</b>recommendations, rankings, scores or matches, ever.</li>
        <li><b>1 source</b>behind every position: named, dated, linked, quoted exactly.</li>
        <li><b>Nothing</b>stored about you. Household answers are bands, held only in the page you are on.</li>
      </ul>

      <h2>Two kinds of statement</h2>
      <p>
        <strong>Computed</strong>: a tax and benefit figure for a household in your bands, calculated with PolicyEngine UK, an open-source model, from a party's
        published pledges. You can see the inputs, the model version and the date.
      </p>
      <p>
        <strong>Documented</strong>: a pledge that applies to a household like yours, shown as the passage from the party's or candidate's own published material,
        with a link. We do not estimate how much it would affect you; we show you what was said and let you weigh it.
      </p>
      <h3>Candidate's own statement, and party position</h3>
      <p>
        Each candidate's page carries two layers, labelled. <strong>Candidate's own statement</strong>: what this person has published about this election.
        <strong> Party position</strong>: what the party they stand for has published, because in a parliamentary election the consequences of a win flow
        largely through the party's programme. For party positions we use the party's current published policy where it exists, dated; where nothing newer
        exists we use the most recent general-election manifesto and say so; and for a governing party, enacted policy is added as a separate dated source.
        Independents have no party layer.
      </p>
      <p>Anything that would be a guess is left out. For documented claims, a pledge is shown to a household only when a fact about that household plainly matches it (for example, a pledge on rent controls is shown to renters); we never estimate how large the effect would be.</p>

      <h3>How the calculated figures are produced</h3>
      <p>
        Households are described in bands, so every possible household is one of a fixed set of cells. For each cell we compute a representative household once,
        offline, with PolicyEngine UK, and store the result. The same postcode and bands always give the same figures, and the entire table is part of the published snapshot.
        The assumptions (band midpoints, representative ages and rents, which benefits are claimed) are listed under every calculation and in the
        <a href="https://github.com/highlyvisual/voter-app/blob/main/scripts/compute_grid.py"> script that produces it</a>.
      </p>

      <h2>Why these nine topics</h2>
      <p>
        The topics are not chosen by us. A topic earns a slot if it is in the top ten of the <a href="https://www.ipsos.com/en-uk/topic/issues-index" rel="noopener">Ipsos Issues Index</a>, the
        longest-running unprompted survey of what the public says matters most, or if it is the main subject of at least one candidate's published statement on the ballot.
        That rule produced: money and cost of living; housing; healthcare and social care; education; environment and energy; immigration and borders; crime, policing and justice; defence, foreign affairs and the EU. A ninth, equality and rights, is added on a different footing: the protected characteristics in the Equality Act 2010 (age, disability, sex, sexual orientation, gender reassignment, race, religion, and others) give it standing independent of any party, and parties publish positions on it.
        Immigration has been the public's most-mentioned concern throughout 2026; leaving it out would have quietly favoured some candidates over others.
      </p>
      <p>
        Some topics, such as money and housing, can be related to a household. Others, such as immigration or defence, mostly cannot, and we do not pretend otherwise: those rows show what candidates and parties have published, with sources, and nothing more.
      </p>

      <h3>The household questions</h3>
      <p>
        Eight questions are asked of every household, in bands. A few more are optional: whether anyone is disabled or has a long-term condition, is an unpaid carer,
        is on a visa or seeking asylum, receives a means-tested benefit, drives, or has served in the armed forces. They exist only because published positions refer to them.
        Leave any blank and nothing is assumed either way: a position that depends on it is listed as applying to other households, never hidden and never presumed.
        We never ask about sexual orientation, gender identity, religion or ethnicity: positions on equality are shown to everyone rather than targeted.
      </p>

      <h2>Going deeper</h2>
      <p>
        Every topic page ends with a short list of independent sources: official statistics, parliamentary research, fact-checkers and non-partisan research institutes. None is affiliated with a party. Where a source campaigns for a position, its label says so.
      </p>

      <h2>Sources, not referees</h2>
      <p>
        We do not vet politicians' claims or decide who is right. We publish what they and their parties have put in writing, quoted exactly, with the source,
        its date and a link, and we show the same slots for everyone. Summaries are drafted with AI assistance and are checked against their quotation by the people who run this site;
        if one misstates its source, it is withdrawn and the withdrawal is logged.
      </p>
      <h2>The ledger</h2>
      <p>
        Every claim lives in an append-only ledger: nothing can be edited or deleted, only superseded by a new entry that says who changed it and why.
        Before each polling day a dated, hashed copy of the whole ledger is published, so anyone can check later exactly what was shown. <a href="/ledger">The ledger is public.</a>
      </p>

      <h2>Data sources</h2>
      <ul>
        <li>Parliamentary record: the UK Parliament's Members and Commons Votes APIs (Open Parliament Licence). A candidate is linked only by an exact, checked match, recorded on their page; we show seats held and how they voted, never a score.</li>
        <li>Area figures: petition.parliament.uk (signatures by constituency) and data.police.uk (recorded crime, Open Government Licence). They describe the place, not any household.</li>
        <li>Acts of Parliament: legislation.gov.uk, linked as further reading so you can read what became law.</li>
        <li>Candidates, ballots and official nomination documents: <a href="https://democracyclub.org.uk/">Democracy Club</a>.</li>
        <li>Tax and benefit calculations: <a href="https://policyengine.org/uk">PolicyEngine UK</a>.</li>
        <li>Pledges: the party's or candidate's own published manifesto, website or statement, linked on every claim.</li>
      </ul>

      <h2 id="contact">Who runs this</h2>
      <p>
        Hustings is an independent, non-partisan, not-for-profit project. A hustings is the old public meeting where every candidate stands on the same platform and answers the same questions from voters. That is what this site tries to be. It takes no advertising and sells no data.
        {" "}It was started by Romily Johnson (Founder and Product Lead), with Barny Trevelyan-Johnson (Technical Lead), and is self-funded for now. Neither is a member of, works for, or is paid by any political party or campaign. <Link href="/who-we-are">Why Hustings exists, in Romily's words</Link>.
        <span className="muted"> [Contact address to be confirmed.]</span>
      </p>
      <h3>Complaints and corrections</h3>
      <p>
        If you believe a claim is wrong, unfair or misattributed, tell us. Every complaint is logged publicly with its outcome, whether or not we change anything.
        <span className="muted"> [Complaints address to be confirmed.]</span>
      </p>

      <h2>Code</h2>
      <p>
        Open source under AGPL-3.0: <a href="https://github.com/highlyvisual/voter-app">github.com/highlyvisual/voter-app</a>. Anyone can run the same
        ballot and household and get the same result.
      </p>
      <h2 id="limits">What this site can't tell you</h2>
      <p>Every source has limits, and some matter a great deal when deciding how to vote:</p>
      <ul>
        <li><strong>A record is not a person.</strong> Votes, statements and leaflets are what candidates chose to publish or had to do on the record. Casework, constituency work and private negotiation aren't captured.</li>
        <li><strong>Many Commons votes are whipped.</strong> An MP voting with their party may not reflect their own view, and voting against it can be principle, constituency or conscience. The record doesn't say which, so neither do we.</li>
        <li><strong>An absence is not a position.</strong> "No published position found" means we found nothing we could source, not that the candidate has no view. We never count silence for or against anyone.</li>
        <li><strong>Donations over a threshold only.</strong> Parties report donations above £11,180 (£2,230 for local branches); smaller gifts are invisible to us.</li>
        <li><strong>Area statistics describe places, not people.</strong> Deprivation, claimants and crime are about an area, and can hide big differences street by street.</li>
        <li><strong>Recorded crime isn't all crime,</strong> and near-real-time sewage data is the water companies' own unverified feed, not the Environment Agency's audited annual figures.</li>
        <li><strong>Council data can lag.</strong> Councillor lists are as recorded after the May 2026 elections; by-elections mean some seats have changed since.</li>
        <li><strong>Coverage is uneven.</strong> Some statistics exist for England only, and Scottish, Welsh and Northern Irish sources differ. Where something is missing for your area, we say so rather than fill the gap.</li>
      </ul>
    </>
  );
}

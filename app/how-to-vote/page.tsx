import Link from "next/link";
import { listBallots } from "@/lib/data";
import PlainToggle from "@/components/PlainToggle";
import Eligibility from "@/components/Eligibility";
import JsonLd from "@/components/JsonLd";
import { breadcrumbs, faqPage, graph } from "@/lib/schema";

// Common questions, shown on the page and given to search engines and AI assistants as an FAQ. Each answer restates what
// the guide above says, with the official source; keep the two in step.
const FAQ: [string, string][] = [
  ["Who can vote in a UK Parliament election?", "British, Irish and qualifying Commonwealth citizens aged 18 or over on polling day, who are registered to vote at a UK address."],
  ["How do I register to vote?", "Online at gov.uk/register-to-vote. It takes about five minutes, and you must do it before the registration deadline for the election. Students can register at both a home and a term-time address, but can vote only once in the same election."],
  ["Do I need photo ID to vote?", "Yes, to vote in person at UK Parliament elections, English council elections and all elections in Northern Ireland, but not at Scottish or Welsh council elections. A passport, driving licence or older person's bus pass all count; the full list is on gov.uk. If you have no accepted ID, apply for a free Voter Authority Certificate (in Northern Ireland, an Electoral Identity Card) before the deadline. Postal votes need no ID."],
  ["What time are polling stations open?", "From 7am to 10pm on polling day. If you are in the queue at 10pm, you can still vote."],
  ["How do I find my polling station?", "It is printed on your poll card. You can also find it by postcode at wheredoivote.co.uk, run by Democracy Club."],
  ["Can I vote by post?", "Yes. Apply for a postal vote online at gov.uk/apply-postal-vote. Your ballot paper is posted to you; return it before polling day, or hand it in at a polling station on the day."],
  ["What is a proxy vote?", "Someone you trust votes on your behalf, in the way you tell them. It is useful if you are away, ill or find polling stations hard to reach. Apply online at gov.uk/apply-proxy-vote."],
  ["Can I get help at the polling station if I am disabled?", "Yes. Every polling station must offer large-print ballot papers, a tactile voting device and seating, and staff will help you mark your paper if you ask. You can also bring a companion of your choice. You never have to explain why."],
  ["What if I make a mistake on my ballot paper?", "Ask the staff for a fresh ballot paper before you put it in the box. Mark one cross in one box on first-past-the-post elections."],
];

export const dynamic = "force-dynamic";
export const metadata = { title: "How voting works", description: "How to vote in the UK: who can vote, registering, photo ID, postal and proxy votes, polling station hours, and help for disabled voters.", alternates: { canonical: "/how-to-vote" } };

export default async function HowToVote() {
  const ballots = await listBallots();
  return (
    <>
      <JsonLd data={graph(faqPage("/how-to-vote", "How voting works: common questions", FAQ), breadcrumbs([["How voting works", "/how-to-vote"]]))} />
      <p className="eyebrow">Plain guide</p>
      <h1>How voting works</h1>
      <p className="lede">What you need to know to cast a vote in the UK, in the order you need to know it. Nothing here favours any party; every link goes to the official source.</p>
      <PlainToggle />
      <div className="plain-only">
        <h2>The short version</h2>
        <ol>
          <li><strong>Register.</strong> Five minutes online at gov.uk/register-to-vote. You must do this before the deadline on your ballot page.</li>
          <li><strong>Know what you are choosing.</strong> An MP makes national laws. A councillor runs local services. Your ballot page says which.</li>
          <li><strong>Pick how to vote.</strong> In person with photo ID; by post; or by proxy (someone you trust votes for you, as you tell them).</li>
          <li><strong>Need help?</strong> Every polling station has large-print papers, a tactile device, seating and staff who will help. You can bring someone with you.</li>
          <li><strong>On the day.</strong> One cross in one box. Ask for a new paper if you make a mistake.</li>
        </ol>
      </div>
      <div className="full-only">

      <h2>1. Can I vote?</h2>
      <Eligibility />
      <ul>
        <li><strong>UK Parliament elections:</strong> British, Irish and qualifying Commonwealth citizens aged 18 or over on polling day, registered at a UK address.</li>
        <li><strong>Local council elections in England:</strong> also EU citizens with existing rights to vote, and some others; in Scotland and Wales, all residents with permission to stay, from age 16.</li>
        <li>You must be <a href="https://www.gov.uk/register-to-vote" rel="noopener">registered to vote</a>. It takes about five minutes online. Students can register at both home and term-time addresses (but vote only once in the same election).</li>
      </ul>

      <ul className="keypoints">
        <li><b>3</b>ways to vote: in person, by post, or by proxy (someone you trust votes as you tell them).</li>
        <li><b>5 min</b>to register online at gov.uk, and you must do it before the deadline on your ballot page.</li>
        <li><b>Free</b>photo ID if you have none: apply for a Voter Authority Certificate.</li>
      </ul>

      <h2>2. What am I voting for?</h2>
      <p>
        An <strong>MP</strong> represents your constituency in the House of Commons: they vote on national laws, taxes and budgets, and take up constituents' problems with government bodies.
        A <strong>councillor</strong> sits on your local council: it sets council tax, decides planning, runs social care, bins, parking, libraries and (in most areas) school admissions. A councillor cannot change income tax or NHS policy.
        Both are elected for a fixed area; you vote for a named person, and their party tells you what programme they stand with.
      </p>
      <p>
        Most UK elections use <strong>first past the post</strong>: you mark one cross, and the candidate with the most votes wins, even without a majority. Some elections (Scottish and Welsh parliaments, Northern Ireland, Scottish councils) use proportional systems; the ballot page tells you which applies.
      </p>

      <h2>3. Three ways to vote</h2>
      <ul>
        <li><strong>In person</strong> at your polling station, 7am to 10pm on polling day. It is printed on your poll card, or <a href="https://wheredoivote.co.uk/" rel="noopener">find it by postcode</a> (Democracy Club). You need <a href="https://www.gov.uk/how-to-vote/photo-id-youll-need" rel="noopener">accepted photo ID</a>; a passport, driving licence or older person's bus pass all count. No ID? Apply for a free <a href="https://www.gov.uk/apply-for-photo-id-voter-authority-certificate" rel="noopener">Voter Authority Certificate</a>.</li>
        <li><strong>By post</strong>: <a href="https://www.gov.uk/apply-postal-vote" rel="noopener">apply for a postal vote online</a>. Your ballot is posted to you; return it before polling day or hand it in at a polling station.</li>
        <li><strong>By proxy</strong>: someone you trust votes on your behalf, in the way you tell them. Useful if you are away, ill, or find polling stations hard to reach. <a href="https://www.gov.uk/apply-proxy-vote" rel="noopener">Apply for a proxy vote online</a>. This is the option people know least about; it is entirely normal and secure.</li>
      </ul>

      <div className="keypoint"><strong>You can bring someone with you.</strong> Every polling station must offer large-print ballot papers, a tactile voting device and a seat, and staff will help you mark your paper if you ask. You never have to explain why.</div>

      <h2>4. Support if you are disabled or need help</h2>
      <ul>
        <li>Every polling station must provide reasonable equipment: a tactile voting device, large-print ballot papers, a magnifier, seating, and a low-level booth. Ask staff; you do not need to explain why.</li>
        <li>You may bring a <strong>companion</strong> of your choice into the polling station, or ask the Presiding Officer to help you mark your ballot.</li>
        <li>If getting there is the problem, a postal or proxy vote removes the journey.</li>
        <li>The Electoral Commission's guidance: <a href="https://www.electoralcommission.org.uk/voting-and-elections/how-vote/voting-person-and-additional-support" rel="noopener">voting in person and additional support</a>.</li>
      </ul>

      <h2>5. Deadlines for the elections we cover</h2>
      {ballots.length ? (
        <ul>
          {ballots.map((b) => (
            <li key={b.ballot_paper_id}><Link href={`/ballot/${encodeURIComponent(b.ballot_paper_id)}`}>{b.area_name}</Link>: the key dates are at the top of that page.</li>
          ))}
        </ul>
      ) : <p className="muted">No upcoming election loaded.</p>}

      <h2>6. On the day</h2>
      <p>Take your ID. Tell the staff your name and address. Take the ballot paper to a booth, put one cross in one box, fold it, and put it in the box. It takes a minute. If you make a mistake, ask for a fresh paper.</p>

      </div>
      <h2 id="questions">Common questions</h2>
      <div className="learn">
        {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
      </div>

      <p className="meta">Sources: <a href="https://www.gov.uk/how-to-vote" rel="noopener">gov.uk: How to vote</a>; <a href="https://www.electoralcommission.org.uk/voting-and-elections" rel="noopener">Electoral Commission</a>. This page is a plain-language summary; the official pages are the authority.</p>
    </>
  );
}

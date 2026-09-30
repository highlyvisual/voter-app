import Link from "next/link";
import { MESSAGE } from "./message";
import JsonLd from "@/components/JsonLd";
import { breadcrumbs, graph, PEOPLE, webPage } from "@/lib/schema";

export const metadata = { title: "Who we are", description: "Why What's It To Me exists, in the words of the student who started it — and who is behind it.", alternates: { canonical: "/who-we-are" } };

export default function WhoWeAre() {
  return (
    <>
      <JsonLd data={graph(webPage("/who-we-are", "Who we are", metadata.description, { "@type": "AboutPage", about: { "@id": "https://whatsittome.org/#org" }, mentions: [{ "@id": PEOPLE.romily["@id"] }, { "@id": PEOPLE.barny["@id"] }] }), breadcrumbs([["Who we are", "/who-we-are"]]))} />
      <p className="eyebrow">Who we are</p>
      <h1>Why What's It To Me exists</h1>
      <article className="founder-message">
        {MESSAGE.map((p, i) => <p key={i} className={i === 0 || i >= MESSAGE.length - 2 ? "pull" : undefined}>{p}</p>)}
        <p className="signature">Romily Johnson<span>Founder and Product Lead · student</span></p>
      </article>

      <h2>Who is behind it</h2>
      <ul className="founders">
        <li id="romily"><strong>Romily Johnson</strong> — Founder and Product Lead</li>
        <li id="barny"><strong>Barny Trevelyan-Johnson</strong> — Technical Lead</li>
      </ul>

      {/* Romily, 30 Sept 2026: "Democracy Club explicitly recognises that people involved in its work have political views
          while expecting their work to remain nonpartisan... otherwise it's not completely honest." */}
      <h2 id="views">We have political views. The site doesn&rsquo;t.</h2>
      <p>Both of us have political views, as almost anyone who cares enough about politics to build something like this does. Saying otherwise wouldn&rsquo;t be honest, and we don&rsquo;t think you need people with no opinions to get fair information. You need rules that keep the opinions out.</p>
      <p>So impartiality here doesn&rsquo;t rest on a promise about what we think. It rests on how the site is built. Every candidate and party gets the same page, in the order the law uses on the ballot paper. Every position is their own words, with the source. Nothing is ranked, scored or recommended. The rules are published <Link href="/about">here</Link> and in the code, so anyone can check them, and if you think something leans one way, <Link href="/contact">tell us</Link>: the correction, or our reason for leaving it, goes in the <Link href="/ledger">public log</Link>.</p>
      <p><a href="https://democracyclub.org.uk/blog/2023/02/17/why-democracy-club-is-non-partisan/" rel="noopener">Democracy Club</a>, whose election data this site is built on, works the same way: its volunteers include members of all the main parties and none, and it asks them to &ldquo;leave their politics at the door&rdquo;.</p>

      <h2 id="interests">Declaration of interests</h2>
      <p>Neither of us works for or is paid by any political party, candidate or campaign. At the time of writing, neither of us is a member of a party. If either of us joins a party, stands for election or campaigns for one, it will be declared here, with the date.</p>
      <p>What's It To Me is self-funded for now. It takes no advertising and no money from any party, candidate or campaign.</p>

      <h2 id="contact">Contact</h2>
      <p>Questions, corrections or complaints: <a href="mailto:hello@whatsittome.org">hello@whatsittome.org</a>. Every complaint about the content is logged publicly, with its outcome. <Link href="/contact">More ways to get in touch</Link>.</p>

      <h2 id="the-name">Where the name comes from</h2>
      <p className="word-head"><span className="word">What&rsquo;s it to me?</span></p>
      <p>It is the question people actually ask about politics, and usually the hardest one to get answered. Not who is winning, not who is up or down this week, but: what would this mean for me, for my household, for my street?</p>
      <p>Most political coverage answers a different question. Manifestos are written for everyone and therefore for no one in particular. Campaigns talk about millions of pounds and national averages. The gap between that and an ordinary life is where most people give up.</p>
      <p>So the name is the question, asked plainly. Tell the site a little about your household, if you want to, and it will show you what each candidate has actually published and where it touches your life. It will not tell you who to vote for; that judgement stays with you.</p>
      <p className="meta">The phrase can sound like a brush-off &mdash; &ldquo;what&rsquo;s it to you?&rdquo; &mdash; and that is part of the point. Plenty of people feel that way about politics, often because nobody has ever shown them the answer.</p>

      <p className="meta">How the site stays impartial, and where every piece of information comes from: <Link href="/about">How this works</Link> · <Link href="/ledger">The public ledger</Link></p>
    </>
  );
}

import Link from "next/link";
import { MESSAGE } from "./message";

export const metadata = { title: "Who we are", description: "Why What's It To Me exists, in the words of the student who started it — and who is behind it." };

export default function WhoWeAre() {
  return (
    <>
      <p className="eyebrow">Who we are</p>
      <h1>Why What's It To Me exists</h1>
      <article className="founder-message">
        {MESSAGE.map((p, i) => <p key={i} className={i === 0 || i >= MESSAGE.length - 2 ? "pull" : undefined}>{p}</p>)}
        <p className="signature">Romily Johnson<span>Founder and Product Lead · student</span></p>
      </article>

      <h2>Who is behind it</h2>
      <ul className="founders">
        <li><strong>Romily Johnson</strong> — Founder and Product Lead</li>
        <li><strong>Barny Trevelyan-Johnson</strong> — Technical Lead</li>
      </ul>

      <h2>Declaration of interests</h2>
      <p>Neither founder is a member of, works for, or is paid by any political party or campaign.</p>
      <p>What's It To Me is self-funded for now. It takes no advertising and no money from any party, candidate or campaign.</p>

      <h2>Contact</h2>
      <p>Questions, corrections or complaints: <a href="mailto:hello@whatsittome.org">hello@whatsittome.org</a>. Every complaint about the content is logged publicly, with its outcome.</p>

      <h2>Contact</h2>
      <p>Questions, corrections or complaints: <a href="mailto:hello@whatsittome.org">hello@whatsittome.org</a>.</p>

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

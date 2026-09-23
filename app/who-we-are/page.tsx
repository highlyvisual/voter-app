import Link from "next/link";
import { MESSAGE } from "./message";

export const metadata = { title: "Who we are", description: "Why Hustings exists, in the words of the student who started it — and who is behind it." };

export default function WhoWeAre() {
  return (
    <>
      <p className="eyebrow">Who we are</p>
      <h1>Why Hustings exists</h1>
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
      <p>Hustings is self-funded for now. It takes no advertising and no money from any party, candidate or campaign.</p>

      <h2>Contact</h2>
      <p>Questions, corrections or complaints: <a href="mailto:hello@hustings.org">hello@hustings.org</a>. Every complaint about the content is logged publicly, with its outcome.</p>

      <h2>Contact</h2>
      <p>Questions, corrections or complaints: <a href="mailto:hello@hustings.org">hello@hustings.org</a>.</p>

      <h2 id="the-word">What &ldquo;hustings&rdquo; means</h2>
      <p className="word-head"><span className="word">hustings</span> <span className="pron">/ˈhʌs.tɪŋz/</span> <span className="pos">noun, used with a singular or plural verb</span></p>
      <p><strong>Today:</strong> a meeting during an election where the candidates appear together, make their case and answer questions from voters. Being &ldquo;on the hustings&rdquo; also means being out campaigning.</p>
      <h3>Where the word comes from</h3>
      <p>It is about a thousand years old: dictionaries trace it to before 1050. Old English <em>hūsting</em> meant a meeting, court or tribunal, borrowed from Old Norse <em>hūsþing</em>: <em>hūs</em>, &ldquo;house&rdquo;, and <em>þing</em>, &ldquo;assembly&rdquo;. A &ldquo;house assembly&rdquo; was a council of the household of a king or nobleman, as opposed to the folk-moot, the assembly of all the people.</p>
      <h3>From a court to a platform</h3>
      <p>In the City of London, the Court of Husting was held on a platform in the Guildhall, presided over by the Lord Mayor. By 1719 &ldquo;hustings&rdquo; had come to mean a temporary platform for political speeches. Before 1872, candidates for Parliament were nominated in public from the hustings and addressed the electors from it; the Reform Act of 1832 required a separate hustings for every 600 electors. People who could not vote, including all women, still came to watch and take part in the crowd.</p>
      <h3>The end of the platform, and what survived</h3>
      <p>The Ballot Act of 1872 abolished public nomination at the hustings, replacing it with signed nomination papers and the secret ballot we still use. The platform went; the idea stayed. The word broadened to mean the election campaign itself, and today a hustings is the meeting where every candidate stands in front of the same audience and answers the same questions.</p>
      <h3>Why we chose it</h3>
      <p>That last idea is this site: every candidate on the same platform, the same questions, the same space, with the judgement left to the people listening.</p>
      <p className="meta">Sources: Online Etymology Dictionary, &ldquo;hustings&rdquo;; Collins English Dictionary; Encyclop&aelig;dia Britannica (11th edition), via Wikipedia, &ldquo;Husting&rdquo;.</p>

      <p className="meta">How the site stays impartial, and where every piece of information comes from: <Link href="/about">How this works</Link> · <Link href="/ledger">The public ledger</Link></p>
    </>
  );
}

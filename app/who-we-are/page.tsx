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

      <p className="meta">How the site stays impartial, and where every piece of information comes from: <Link href="/about">How this works</Link> · <Link href="/ledger">The public ledger</Link></p>
    </>
  );
}

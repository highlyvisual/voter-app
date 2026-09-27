"use client";
import Link from "next/link";
import { useState } from "react";
// A persistent "How do you know this?" (Romily §14): the answer to the trust question, always one tap away.
export default function HowDoYouKnow() {
  const [open, setOpen] = useState(false);
  return (
    <div className="hdyk">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="hdyk-btn" aria-label="How do you know this?"><span aria-hidden>?</span> <span className="long">How do you know this?</span></button>
      {open ? (
        <div className="hdyk-panel" role="dialog" aria-label="How we know what we show">
          <p><strong>Every position on this site is a quotation</strong> from something a party or candidate published, with its name, date and link. The short version underneath is a reading aid; the quotation is the record.</p>
          <ul className="small">
            <li><span className="chip layer-chip">Official source ✓</span> Government, Parliament, councils, the Electoral Commission.</li>
            <li><span className="chip layer-chip">Manifesto</span> A party's own published programme.</li>
            <li><span className="chip layer-chip">Public record</span> What was actually done: votes, Acts, budgets.</li>
            <li><span className="chip layer-chip">Candidate's own words</span> Their statement, website or leaflet — real, not necessarily true.</li>
            <li><span className="chip layer-chip">Calculated</span> A tax or benefit figure from the open-source PolicyEngine model.</li>
            <li><span className="chip none">No published position found</span> We looked and found nothing we could source. Not a judgement.</li>
          </ul>
          <p className="small">Every change is logged publicly, with the reason. <Link href="/about" prefetch={false}>How this works</Link> · <Link href="/ledger">The public ledger</Link></p>
          <button type="button" className="secondary small" onClick={() => setOpen(false)}>Close</button>
        </div>
      ) : null}
    </div>
  );
}

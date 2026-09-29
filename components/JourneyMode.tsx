import Link from "next/link";

// Round eight q20 (Romily, 29 Sept): "Some steps on a computer but also the option to just use one page (maybe not steps
// but layered)". The same journey both ways; the reader switches whenever they like and keeps what they entered.
export default function JourneyMode({ mode, qs }: { mode: "steps" | "flow"; qs: string }) {
  const q = new URLSearchParams(qs); q.delete("s");
  const tail = q.toString() ? `?${q.toString()}` : "";
  return (
    <nav className="journey-mode" aria-label="How to see this journey">
      <span className="meta">See it as:</span>
      {mode === "steps" ? <span className="on" aria-current="page">Steps</span> : <Link href={`/journey/steps${tail}`}>Steps</Link>}
      {mode === "flow" ? <span className="on" aria-current="page">One page</span> : <Link href={`/journey/flow${tail}`}>One page</Link>}
    </nav>
  );
}

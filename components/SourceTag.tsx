import type { ReactNode } from "react";
import { INDEPENDENT, LAYERS, LEGEND, TAG } from "@/lib/claims";

// Romily, round ten, q4: "Yes, a visible tag on each", "but also consider we do not want the pages to look too dense.
// So keep the tag small." Every claim, everywhere, carries the same small tag naming the kind of source it rests on.
// Neutral colours only, never a party's. Outlined: what candidates and parties publish about themselves. Shaded: a public
// record or someone else's report (Peter Keeling, Democracy Club: a clear line between the two).
export default function SourceTag({ kind }: { kind: string }) {
  if (!(kind in TAG)) return null;
  return (
    <span className={`src-tag src-tag-${INDEPENDENT.has(kind) ? "other" : "own"}`} data-kind={kind} title={LAYERS[kind]}>
      <span className="sr-only">Source: </span>{TAG[kind]}
    </span>
  );
}

/** The one-line key, behind a small (i): what the tags mean. */
export function SourceTagKey() {
  return (
    <details className="src-key">
      <summary>
        <svg viewBox="0 0 20 20" aria-hidden width="16" height="16"><circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M10 9v5M10 6.2v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        <span>What the tags mean</span>
      </summary>
      <p className="src-key-line">
        <Tags kinds={["candidate_statement", "manifesto", "campaign_leaflet"]} /> what candidates and parties publish themselves.{" "}
        <Tags kinds={["enacted_record", "third_party_analysis"]} /> a public record, or someone else&rsquo;s report. {LEGEND}
      </p>
    </details>
  );
}

function Tags({ kinds }: { kinds: string[] }): ReactNode {
  return <span className="src-key-tags">{kinds.map((k) => <SourceTag key={k} kind={k} />)}</span>;
}

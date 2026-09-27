import type { ReactNode } from "react";
import ExplainThis from "@/components/ExplainThis";
import ExtLink from "@/components/ExtLink";
import type { Claim } from "@/lib/data";
import { conditionText, layerKey } from "@/lib/claims";
import { longDate } from "@/lib/dates";

// "Simple first, evidence one click away" (Romily, round eight, points 4 and 14). Every claim, for every candidate,
// is shown in the same three layers:
//   1. What they say: our one-line summary of the quotation.
//   2. What this could mean for you: who it applies to, shown only when the claim names a group.
//   3. See the exact words and source: the verbatim quotation, the source, when it was published and retrieved,
//      and the archived copy. Closed by default; one tap opens it.
// In "exact words" view mode the quotation is shown up front instead of the summary, so a reader who prefers the
// candidate's own words never has to open anything.
export function whenText(appliesIf: unknown): string | null {
  const t = conditionText(appliesIf);
  return t ? t.replace(/^Applies if:\s*/, "") : null;
}

export function sayLabel(c: Claim): string {
  return layerKey(c) === "enacted_record" ? "What the record shows" : "What they say";
}

export default function ClaimLayers({ c, chip, children, footnote }: { c: Claim; chip: ReactNode; children?: ReactNode; footnote?: ReactNode }) {
  const s = c.sources;
  const when = whenText(c.applies_if);
  return (
    <>
      <p className="layer-label not-verbatim">{sayLabel(c)}</p>
      <p className="summary say not-verbatim">{c.claim_text}</p>
      <p className="layer-label only-verbatim">In their exact words</p>
      <blockquote className="quote only-verbatim">{c.source_quote}</blockquote>
      {when ? (
        <>
          <p className="layer-label">What this could mean for you</p>
          <p className="small for-you">This would apply to you if: {when}.</p>
        </>
      ) : null}
      {children}
      <details className="evidence">
        <summary>See the exact words and source</summary>
        <blockquote className="quote not-verbatim">{c.source_quote}</blockquote>
        <p className="small" style={{ margin: "0.3rem 0 0" }}>
          {chip}{" "}
          {s ? <><ExtLink href={s.url}>{s.title}</ExtLink>, {s.publisher}{s.published_on ? `, published ${longDate(s.published_on)}` : ""}. Retrieved {longDate(s.retrieved_at)}.{s.archive_url ? <> <a href={s.archive_url} rel="noopener">Archived copy</a>.</> : null}</> : "Source unavailable."}
        </p>
        <ExplainThis text={`${c.source_quote} ${c.claim_text}`} />
        {footnote}
      </details>
    </>
  );
}

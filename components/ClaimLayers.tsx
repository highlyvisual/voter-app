import type { ReactNode } from "react";
import ExplainThis from "@/components/ExplainThis";
import ExtLink from "@/components/ExtLink";
import type { Claim } from "@/lib/data";
import { conditionText, layerKey } from "@/lib/claims";
import { longDate } from "@/lib/dates";
import SourceTag from "@/components/SourceTag";

// "Simple first, evidence one click away" (Romily, round eight, points 4 and 14). Every claim, for every candidate,
// is shown in the same three layers:
//   1. What they say: our one-line summary of the quotation.
//   2. What this could mean for you: who it applies to, shown only when the claim names a group.
//   3. "Sourced:" (Romily, 29 Sept): the source named in one line; one tap opens the verbatim quotation, the source,
//      when it was published and retrieved,
//      and the archived copy. Closed by default; one tap opens it.
// In "exact words" view mode the quotation is shown up front instead of the summary, so a reader who prefers the
// candidate's own words never has to open anything.
// Round ten, q4 (Romily): a small source tag sits beside "What they say" on every claim, in both view modes.
export function whenText(appliesIf: unknown): string | null {
  const t = conditionText(appliesIf);
  return t ? t.replace(/^Applies if:\s*/, "") : null;
}

export function sayLabel(c: Claim): string {
  return layerKey(c) === "enacted_record" ? "What the record shows" : "What they say";
}

/** The short "Sourced:" line (Romily, 29 Sept, row 7: design C, "then click on it and it shows you the full link"). */
export function sourcedLabel(s: Claim["sources"] | null | undefined): string {
  if (!s) return "source unavailable";
  return `${s.title}${s.published_on ? `, ${longDate(s.published_on)}` : ""}`;
}

// `because` (Your Home, round eleven): where the page knows which answer matched, it says so in the reader's terms
// ("Applies to you because you told us you're renting privately") instead of repeating the condition.
export default function ClaimLayers({ c, chip, children, footnote, applies = false, blind = false, because, appliesTo = "Applies to you" }: { c: Claim; chip?: ReactNode; children?: ReactNode; footnote?: ReactNode; applies?: boolean; blind?: boolean; because?: string | null; appliesTo?: string }) {
  const s = c.sources;
  const when = whenText(c.applies_if);
  const tag = <SourceTag kind={layerKey(c)} />;
  // Where "Hide names and parties while I read" is offered, the source title can name the party, so it hides too.
  const label = blind ? <span className="blindable" data-blind="source hidden">{sourcedLabel(s)}</span> : sourcedLabel(s);
  return (
    <>
      <p className="layer-label not-verbatim">{sayLabel(c)} {tag}</p>
      <p className="summary say not-verbatim">{c.claim_text}</p>
      <p className="layer-label only-verbatim">In their exact words {tag}</p>
      <blockquote className="quote only-verbatim">{c.source_quote}</blockquote>
      {/* Row 8 (design A): with a profile, a claim that applies is marked plainly, with the reason. */}
      {when ? (applies ? (
        <p className="applies-yes"><svg viewBox="0 0 24 24" aria-hidden><path d="M5 12l5 5 9-10" /></svg>{because ? <span><strong>{appliesTo}</strong> because {because}.</span> : <span><strong>Applies to you:</strong> {when}.</span>}</p>
      ) : (
        <>
          <p className="layer-label">What this could mean for you</p>
          <p className="small for-you">This would apply to you if: {when}.</p>
        </>
      )) : null}
      {children}
      <details className="evidence said-where">
        <summary><span className="sw-label">Sourced:</span> {label}</summary>
        <blockquote className="quote not-verbatim">{c.source_quote}</blockquote>
        <p className={blind ? "small blind-hide" : "small"} style={{ margin: "0.3rem 0 0" }}>
          {chip ? <>{chip}{" "}</> : null}
          {s ? <><ExtLink href={s.url}>{s.title}</ExtLink>, {s.publisher}{s.published_on ? `, published ${longDate(s.published_on)}` : ""}. Retrieved {longDate(s.retrieved_at)}.{s.archive_url ? <> <a href={s.archive_url} rel="noopener">Archived copy</a>.</> : null} <span className="sw-url">{s.url}</span></> : "Source unavailable."}
        </p>
        <ExplainThis text={`${c.source_quote} ${c.claim_text}`} />
        {footnote}
      </details>
    </>
  );
}

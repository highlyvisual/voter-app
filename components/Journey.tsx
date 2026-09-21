import Link from "next/link";
// The four stages of the journey (Romily's brief §1): taken through politics, not handed a database.
// Every stage can be skipped; the candidates are always one tap away.
export const STAGES: [string, string, string][] = [
  ["area", "Your area", "Where politics meets your life"],
  ["office", "What you're voting for", "What this job does, and doesn't, control"],
  ["stakes", "What's at stake", "Where published policy touches your profile"],
  ["", "Meet the candidates", "Everyone asking for your vote"],
];
export default function Journey({ ballotId, current, qs }: { ballotId: string; current: string; qs: string }) {
  const at = STAGES.findIndex(([k]) => k === current);
  const base = `/ballot/${encodeURIComponent(ballotId)}`;
  const href = (k: string) => `${base}${k ? `/${k}` : ""}${qs ? `?${qs}` : ""}`;
  const next = STAGES[at + 1];
  return (
    <>
      <nav className="journey" aria-label="Your journey through this election">
        <ol>
          {STAGES.map(([k, label], i) => (
            <li key={label} className={i === at ? "now" : i < at ? "done" : ""}>
              <Link href={href(k)} aria-current={i === at ? "step" : undefined}><span className="n">{i + 1}</span><span className="t">{label}</span></Link>
            </li>
          ))}
        </ol>
      </nav>
      {next ? null : null}
    </>
  );
}
export function JourneyNext({ ballotId, current, qs }: { ballotId: string; current: string; qs: string }) {
  const at = STAGES.findIndex(([k]) => k === current);
  const next = STAGES[at + 1]; if (!next) return null;
  const base = `/ballot/${encodeURIComponent(ballotId)}`;
  return (
    <div className="journey-next">
      <Link href={`${base}${next[0] ? `/${next[0]}` : ""}${qs ? `?${qs}` : ""}`} className="button">Next: {next[1]} →</Link>
      {next[0] ? <Link href={`${base}${qs ? `?${qs}` : ""}#ballot-paper`} className="quiet-link">Skip to the candidates</Link> : null}
    </div>
  );
}

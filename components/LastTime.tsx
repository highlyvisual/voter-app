import type { PreviousResult } from "@/lib/democracyclub";

// Factual record of the previous result for the same seat. Shown in vote order because that is how results are declared;
// this ordering is of past votes, not of current candidates, and no recommendation is derived from it.
export default function LastTime({ result, label, open = false }: { result: PreviousResult | null; label: string; open?: boolean }) {
  if (!result || result.rows.length === 0) return null;
  const pct = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
  const num = new Intl.NumberFormat("en-GB");
  return (
    <details className="small" style={{ margin: "1rem 0" }} open={open}>
      <summary>{open ? label.charAt(0).toUpperCase() + label.slice(1) : `Last time in this seat: ${label}`}</summary>
      <table className="plain" style={{ marginTop: "0.5rem" }}>
        <thead><tr><th>Candidate</th><th>Party</th><th className="num">Votes</th><th className="num">Share</th></tr></thead>
        <tbody>
          {result.rows.map((r) => (
            <tr key={r.name + r.party}>
              <td>{r.name}{r.elected ? " (elected)" : ""}</td><td>{r.party}</td>
              <td className="num">{num.format(r.votes)}</td><td className="num">{pct.format(r.share)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted" style={{ margin: "0.4rem 0 0" }}>
        {num.format(result.total_votes)} valid votes{result.turnout_percentage ? `, turnout ${pct.format(result.turnout_percentage)}%` : ""}.
        Result data from Democracy Club{result.source ? <> (<a href={result.source} rel="noopener">source</a>)</> : null}. Past results describe the past; each election is a new contest.
      </p>
    </details>
  );
}

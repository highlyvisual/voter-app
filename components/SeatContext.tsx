import type { PreviousResult } from "@/lib/democracyclub";

// WP-B12: factual seat context from the stored previous result. No "safe/marginal" label, nothing predictive.
export default function SeatContext({ result, label, seats = 1 }: { result: PreviousResult | null; label: string; seats?: number }) {
  if (!result || result.rows.length < 2) return null;
  const num = new Intl.NumberFormat("en-GB"); const pct = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
  const rows = result.rows;
  const winner = rows[0]; const runnerUp = rows[seats] ?? rows[1];
  const margin = winner.votes - runnerUp.votes;
  const marginPct = result.total_votes ? (100 * margin) / result.total_votes : 0;
  return (
    <p className="small seat-context">
      At the {label}, {seats > 1 ? `the seats were won by ${rows.slice(0, seats).map((r) => `${r.party}`).join(" and ")}; the last seat` : `this seat`} was won by {num.format(margin)} votes ({pct.format(marginPct)}% of votes cast){result.turnout_percentage ? `; turnout was ${pct.format(result.turnout_percentage)}%` : ""}. Past results describe the past; each election is a new contest.
    </p>
  );
}

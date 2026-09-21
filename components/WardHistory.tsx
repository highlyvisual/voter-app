import { publicClient } from "@/lib/data";
// Past council elections in this ward, 2006–2024, from DCLEAPIL (Jason Leman, drawing on Andrew Teale's Local Elections
// Archive Project and Democracy Club). Results describe the past; boundaries and candidates change.
export default async function WardHistory({ ballotId }: { ballotId: string }) {
  const { data } = await publicClient().from("ward_history").select("*").eq("ballot_paper_id", ballotId).order("year", { ascending: false }).order("votes", { ascending: false });
  const rows = data ?? [];
  if (!rows.length) return null;
  const years = [...new Set(rows.map((r) => r.year))];
  return (
    <section className="area" aria-labelledby="history-heading">
      <h2 id="history-heading">Past elections in this ward</h2>
      <p className="meta">Every recorded council election here since 2006, most recent first. Elected candidates in bold. Past results describe the past; each election is a new contest.</p>
      {years.map((y) => {
        const yr = rows.filter((r) => r.year === y);
        const turnout = yr.find((r) => r.turnout_percentage)?.turnout_percentage;
        return (
          <details key={y} className="history-year">
            <summary><strong>{y}</strong> <span className="meta">— {yr.filter((r) => r.elected).map((r) => r.party_name ?? "Independent").join(", ") || "result recorded"} elected{turnout ? ` · turnout ${Number(turnout).toFixed(0)}%` : ""}</span></summary>
            <table className="plain"><tbody>
              {yr.map((r) => <tr key={r.id} style={r.elected ? { fontWeight: 600 } : undefined}><td>{r.candidate}</td><td>{r.party_name ?? "Independent"}</td><td className="num">{r.votes?.toLocaleString("en-GB") ?? "—"}</td></tr>)}
            </tbody></table>
          </details>
        );
      })}
      <p className="meta">Source: DCLEAPIL v1.0 British local election results 2006–2024, by Jason Leman, drawing on Andrew Teale's Local Elections Archive Project and Democracy Club (Creative Commons Attribution-ShareAlike 4.0). Where a ward's boundaries changed, earlier results were for a somewhat different area.</p>
    </section>
  );
}

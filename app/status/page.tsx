import Link from "next/link";
import { ago, freshness, stamp } from "@/lib/freshness";

export const metadata = { title: "Is this up to date?", description: "When the election data on this site was last refreshed, and whether the nightly update is working." };
export const dynamic = "force-dynamic";

export default async function Status() {
  const f = await freshness();
  const hours = f.ballots ? (Date.now() - new Date(f.ballots).getTime()) / 3600000 : Infinity;
  const state = hours < 36 ? "ok" : hours < 72 ? "warn" : "bad";
  const headline = state === "ok" ? "Up to date" : state === "warn" ? "Slightly behind" : "Out of date";
  const explain = state === "ok"
    ? "The nightly update ran as expected. Candidate lists were last checked against Democracy Club at the time shown below."
    : state === "warn"
      ? "The nightly update has not run for more than a day and a half. Nothing is wrong with what you can see, but a new candidate or a newly called by-election might be missing."
      : "The nightly update has not run for more than three days. Treat candidate lists here as possibly incomplete and check Democracy Club directly.";
  const rows: [string, string | null, string][] = [
    ["Elections and candidates", f.ballots, "Every current ballot and everyone standing, from Democracy Club. Refreshed nightly."],
    ["Candidate details", f.candidates, "Names, parties, photos and statements to voters."],
    ["Campaign leaflets", f.leaflets, "Leaflets archived by volunteers at ElectionLeaflets."],
    ["Sourced positions", f.claims, "Quotations from manifestos, records and candidate statements. Added by hand, so this moves less often."],
    ["Public ledger", f.ledger, "The last recorded correction, addition or change."],
  ];
  return (
    <>
      <p className="eyebrow">Data status</p>
      <h1>Is this up to date?</h1>
      <div className={`status-banner ${state}`}>
        <p className="status-headline">{headline}</p>
        <p style={{ margin: 0 }}>Elections and candidates last refreshed <strong>{ago(f.ballots, f.now)}</strong> — {stamp(f.ballots)}.</p>
        <p className="meta" style={{ margin: "0.4rem 0 0" }}>{explain}</p>
      </div>

      <table className="plain status-table">
        <thead><tr><th>What</th><th>Last refreshed</th><th>When</th></tr></thead>
        <tbody>
          {rows.map(([label, at, note]) => (
            <tr key={label}>
              <th scope="row">{label}<span className="meta" style={{ display: "block", fontWeight: 400 }}>{note}</span></th>
              <td style={{ whiteSpace: "nowrap" }}>{ago(at, f.now)}</td>
              <td className="meta" style={{ whiteSpace: "nowrap" }}>{stamp(at)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Every election we are showing</h2>
      <p>{f.liveBallots} election{f.liveBallots === 1 ? "" : "s"} currently listed. {f.stale.length === 0
        ? "All of them were refreshed in the last day and a half."
        : `${f.stale.length} of them ${f.stale.length === 1 ? "has" : "have"} not been refreshed for more than a day and a half:`}</p>
      {f.stale.length ? (
        <ul className="small">
          {f.stale.map((s) => <li key={s.id}><Link href={`/ballot/${encodeURIComponent(s.id)}`}>{s.area}</Link> — last refreshed {ago(s.at, f.now)}</li>)}
        </ul>
      ) : null}

      <h2>How the update works</h2>
      <p>Every morning at 05:17 UTC an automated job asks Democracy Club for every election now open, writes what it finds here, and records the time against each one. It also looks for new campaign leaflets and candidate photos. If a single election cannot be fetched, the job stops with an error rather than quietly dropping it, and that election would appear in the list above.</p>
      <p className="meta">Times are shown in UTC, which is the same as UK time in winter and one hour behind British Summer Time. Sourced positions are added by people, not by the nightly job, so that row moves less often and a gap there is normal. The code that does all this is <a href="https://github.com/highlyvisual/voter-app">open source</a>, and every change to a published claim is listed in <Link href="/ledger">the public ledger</Link>.</p>
    </>
  );
}

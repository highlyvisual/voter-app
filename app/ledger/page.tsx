import { TOPICS, countClaimsByStatus, listAllClaimMeta, listChangeLog, listClaimMeta, listCurrentVerifiedClaimsAll, listPageSnapshots } from "@/lib/data";
import { conditionText } from "@/lib/claims";

export const dynamic = "force-dynamic";
export const metadata = { title: "Public ledger", description: "Every claim on the site, its source and every change, in an append-only public record that cannot be edited or deleted.", alternates: { canonical: "/ledger" } };
const TOPIC_NAME = new Map<string, string>(TOPICS.map(([k, v]) => [k, v]));
const topic = (t: string) => TOPIC_NAME.get(t) ?? t.replace(/_/g, " ");

export default async function Ledger() {
  const [counts, log, live, current, all, snaps] = await Promise.all([countClaimsByStatus(), listChangeLog(), listCurrentVerifiedClaimsAll(), listClaimMeta(), listAllClaimMeta(), listPageSnapshots()]);
  const snapBallots = [...new Set(snaps.map((s) => s.ballot_paper_id))];
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const byId = new Map(all.map((c) => [c.id, c]));
  const name = (id: number | null) => { if (id == null) return ""; const c = byId.get(id); return c ? `${c.candidates?.name ?? "Party-level"} · ${topic(c.topic)}` : `#${id}`; };

  return (
    <>
      <h1>Public ledger</h1>
      <p className="lede">Every claim, its source, and every change. Nothing here can be edited or deleted; entries can only be superseded by a new entry that says who changed what, and why.</p>

      <h2>Where things stand</h2>
      {total === 0 ? <p className="muted">No claims have been entered yet.</p> : (
        <div className="scroll" tabIndex={0} role="region" aria-label="Where things stand"><table className="plain" style={{ maxWidth: "26rem" }}>
          <tbody>
            {(["verified", "withdrawn"] as const).map((s) => (
              <tr key={s}><th scope="row">{s === "verified" ? "Published" : "Withdrawn"}</th><td className="num">{counts[s] ?? 0}</td></tr>
            ))}
          </tbody>
        </table></div>
      )}
      <p className="small muted">Every published claim is a quotation from a named, dated, linked source, with a short summary as a reading aid. If a summary misstates its quotation, or a source is disputed, the claim is withdrawn and the reason is logged here.</p>

      <h2>Live claims ({live.length})</h2>
      {live.length === 0 ? <p className="muted">None yet.</p> : (
        <div className="scroll" tabIndex={0} role="region" aria-label="Live claims"><table className="plain">
          <thead><tr><th>#</th><th>Candidate</th><th>Topic</th><th>Claim</th><th>Source</th><th>Applies if</th></tr></thead>
          <tbody>
            {live.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td><td>{c.candidates?.name ?? "Party"}</td><td>{topic(c.topic)}</td><td>{c.claim_text}</td>
                <td>{c.sources ? <a href={c.sources.url} rel="noopener">{c.sources.publisher}</a> : ""}</td>
                <td>{conditionText(c.applies_if) ?? "Everyone"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      <h2>Copies kept by the Internet Archive</h2>
      <p className="small">The evening before each polling day, we ask the <a href="https://web.archive.org/" rel="noopener">Internet Archive</a> to keep a copy of every ballot, comparison and candidate page for that poll, so anyone can see exactly what this site showed, independently of us.</p>
      {snapBallots.length === 0 ? <p className="small muted">None yet. The first copies will be taken on the evening before the next polling day.</p> : snapBallots.map((b) => (
        <details key={b}><summary>{b} ({snaps.filter((s) => s.ballot_paper_id === b).length} pages, {snaps.find((s) => s.ballot_paper_id === b)!.taken_at.slice(0, 10)})</summary>
          <ul className="small">{snaps.filter((s) => s.ballot_paper_id === b).map((s) => <li key={s.page_url}><a href={s.archive_url!} rel="noopener">{s.page_url.replace("https://whatsittome.org", "")}</a></li>)}</ul>
        </details>
      ))}

      <h2>Change log</h2>
      <p className="small muted">A machine-readable, hashed copy of the entire ledger is at <a href="/ledger/snapshot">/ledger/snapshot</a>. Before each polling day that file is published to the code repository so the record cannot be quietly changed afterwards.</p>
      {log.length === 0 ? <p className="muted">No changes recorded yet.</p> : (<>
        <h3>Decisions, corrections and complaints</h3>
        <div className="scroll" tabIndex={0} role="region" aria-label="Decisions, corrections and complaints"><table className="plain">
          <thead><tr><th>When</th><th>Event</th><th>Claim</th><th>By</th><th>Detail</th></tr></thead>
          <tbody>
            {log.filter((r) => !["drafted", "published"].includes(r.event)).map((r) => (
              <tr key={r.id} id={r.claim_id != null ? `claim-${r.claim_id}` : undefined}>
                <td style={{ whiteSpace: "nowrap" }}>{r.created_at.slice(0, 16).replace("T", " ")}</td>
                <td>{r.event.replace(/_/g, " ")}</td>
                <td>{r.claim_id != null ? <>#{r.claim_id} <span className="muted">{name(r.claim_id)}</span></> : ""}</td>
                <td>{String(r.actor ?? "").replace(/\s*\(.*?build session\)/i, "")}</td>
                <td>{r.detail ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <details style={{ marginTop: "1rem" }}>
          <summary className="meta">Routine entries: drafting and publication ({log.filter((r) => ["drafted", "published"].includes(r.event)).length})</summary>
        <div className="scroll" tabIndex={0} role="region" aria-label="Routine entries"><table className="plain">
          <thead><tr><th>When</th><th>Event</th><th>Claim</th><th>By</th><th>Detail</th></tr></thead>
          <tbody>
            {log.filter((r) => ["drafted", "published"].includes(r.event)).map((r) => (
              <tr key={r.id}>
                <td style={{ whiteSpace: "nowrap" }}>{r.created_at.slice(0, 16).replace("T", " ")}</td>
                <td>{r.event.replace(/_/g, " ")}</td>
                <td>{r.claim_id != null ? <>#{r.claim_id} <span className="muted">{name(r.claim_id)}</span></> : ""}</td>
                <td>{String(r.actor ?? "").replace(/\s*\(.*?build session\)/i, "")}</td>
                <td>{r.detail ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
        </details>
      </>)}
    </>
  );
}

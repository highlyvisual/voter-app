import { countClaimsByStatus, listAllClaimMeta, listChangeLog, listClaimMeta, listCurrentVerifiedClaimsAll } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Public ledger" };
const topic = (t: string) => t.replace(/_/g, " ").replace("and", "&");

export default async function Ledger() {
  const [counts, log, live, current, all] = await Promise.all([countClaimsByStatus(), listChangeLog(), listCurrentVerifiedClaimsAll(), listClaimMeta(), listAllClaimMeta()]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const byId = new Map(all.map((c) => [c.id, c]));
  const name = (id: number | null) => { if (id == null) return ""; const c = byId.get(id); return c ? `${c.candidates?.name ?? "Party-level"} · ${topic(c.topic)}` : `#${id}`; };

  return (
    <>
      <h1>Public ledger</h1>
      <p className="lede">Every claim, its source, and every change. Nothing here can be edited or deleted; entries can only be superseded by a new entry that says who changed what, and why.</p>

      <h2>Where things stand</h2>
      {total === 0 ? <p className="muted">No claims have been entered yet.</p> : (
        <div className="scroll"><table className="plain" style={{ maxWidth: "26rem" }}>
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
        <div className="scroll"><table className="plain">
          <thead><tr><th>#</th><th>Candidate</th><th>Topic</th><th>Claim</th><th>Source</th><th>Applies if</th></tr></thead>
          <tbody>
            {live.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td><td>{c.candidates?.name ?? "Party"}</td><td>{topic(c.topic)}</td><td>{c.claim_text}</td>
                <td>{c.sources ? <a href={c.sources.url} rel="noopener">{c.sources.publisher}</a> : ""}</td>
                <td><code>{JSON.stringify(c.applies_if)}</code></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      <h2>Change log</h2>
      <p className="small muted">A machine-readable, hashed copy of the entire ledger is at <a href="/ledger/snapshot">/ledger/snapshot</a>. Before each polling day that file is published to the code repository so the record cannot be quietly changed afterwards.</p>
      {log.length === 0 ? <p className="muted">No changes recorded yet.</p> : (<>
        <h3>Decisions, corrections and complaints</h3>
        <div className="scroll"><table className="plain">
          <thead><tr><th>When</th><th>Event</th><th>Claim</th><th>By</th><th>Detail</th></tr></thead>
          <tbody>
            {log.filter((r) => !["drafted", "published"].includes(r.event)).map((r) => (
              <tr key={r.id} id={r.claim_id != null ? `claim-${r.claim_id}` : undefined}>
                <td style={{ whiteSpace: "nowrap" }}>{r.created_at.slice(0, 16).replace("T", " ")}</td>
                <td>{r.event.replace(/_/g, " ")}</td>
                <td>{r.claim_id != null ? <>#{r.claim_id} <span className="muted">{name(r.claim_id)}</span></> : ""}</td>
                <td>{r.actor}</td>
                <td>{r.detail ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <details style={{ marginTop: "1rem" }}>
          <summary className="meta">Routine entries: drafting and publication ({log.filter((r) => ["drafted", "published"].includes(r.event)).length})</summary>
        <div className="scroll"><table className="plain">
          <thead><tr><th>When</th><th>Event</th><th>Claim</th><th>By</th><th>Detail</th></tr></thead>
          <tbody>
            {log.filter((r) => ["drafted", "published"].includes(r.event)).map((r) => (
              <tr key={r.id}>
                <td style={{ whiteSpace: "nowrap" }}>{r.created_at.slice(0, 16).replace("T", " ")}</td>
                <td>{r.event.replace(/_/g, " ")}</td>
                <td>{r.claim_id != null ? <>#{r.claim_id} <span className="muted">{name(r.claim_id)}</span></> : ""}</td>
                <td>{r.actor}</td>
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

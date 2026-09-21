import type { CouncilPledge } from "@/lib/data";
const STATE: Record<string, string> = { achieved: "Achieved", on_track: "On track", signs_of_progress: "Signs of progress", wait_and_see: "Wait and see", unclear: "Unclear" };
// WP-B7 council layer: pledges from council minutes and budgets, maintained by hand, each with source, measurability and a state from the fixed vocabulary.
export default function CouncilPledges({ pledges, partyName }: { pledges: CouncilPledge[]; partyName: (ec: string | null) => string }) {
  if (!pledges.length) return null;
  return (
    <section className="area" aria-labelledby="pledges-heading">
      <h2 id="pledges-heading">Council pledges on the record</h2>
      <p className="meta">From council minutes and budget papers, with the source for each. States use Full Fact's vocabulary. "Not measurable as worded" means the pledge cannot be checked as written; that is a fact about the wording, not a judgement of the party.</p>
      <ul className="small">
        {pledges.map((p) => (
          <li key={p.id} style={{ marginBottom: "0.5rem" }}><strong>{partyName(p.party_ec_id)}</strong>: {p.pledge_text} <span className="chip none">{p.measurable ? (p.state ? STATE[p.state] : "Not yet assessed") : "Not measurable as worded"}</span> <span className="meta">— <a href={p.source_url} rel="noopener">{p.source_title ?? "source"}</a>{p.made_on ? `, ${p.made_on}` : ""}{p.evidence_urls.length ? <> · evidence: {p.evidence_urls.map((u, i) => <a key={u} href={u} rel="noopener">[{i + 1}]</a>)}</> : null}</span></li>
        ))}
      </ul>
    </section>
  );
}

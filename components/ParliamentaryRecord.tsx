import type { ParliamentRecord } from "@/lib/parliament";
import { TOPICS } from "@/lib/data";

// WP-B6: the record on Real-O-Mat rules. Position shows a vote only where a justification exists; below two relevant divisions on a topic
// the panel says so; absences are "Did not vote (reason not recorded)"; never a "voted for/against X" summary line.
export default function ParliamentaryRecordView({ rec, note }: { rec: ParliamentRecord; note: string | null }) {
  const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const voted = (v: boolean | null) => (v === null ? "Did not vote (reason not recorded)" : v ? "Aye" : "No");
  const withJ = rec.divisions.filter((d) => d.justification);
  const byTopic = TOPICS.map(([k, l]) => ({ k, l, rows: withJ.filter((d) => d.topic === k) })).filter((t) => t.rows.length > 0);
  return (
    <section className="slot record">
      <h4>Parliamentary record</h4>
      <p className="meta">UK Parliament open data (Members, Commons Votes, Hansard). {note ? note + "." : ""} Most recent {rec.divisions.length} divisions sampled; the full record is linked below.</p>
      <ul className="small" style={{ paddingLeft: "1.1rem", margin: "0.3rem 0" }}>
        {rec.memberships.slice(0, 4).map((m, i) => <li key={i}>{m.house === "Commons" ? "MP for" : "Member of the Lords,"} {m.from ?? ""}: {fmt(m.start)} to {m.end ? fmt(m.end) : "present"}</li>)}
      </ul>
      <div className="tabs" role="tablist">
        <details className="tab" open><summary>Position</summary>
          {byTopic.length === 0 ? <p className="empty">Not enough recorded votes with a recorded justification in this sample to say anything concrete.</p> : byTopic.map((t) => (
            <div key={t.k} style={{ marginBottom: "0.6rem" }}>
              <p className="meta" style={{ margin: 0 }}>{t.l}</p>
              {t.rows.length < 2 ? <p className="empty">Not enough recorded votes on this topic to say anything concrete ({t.rows.length} with a justification).</p> : (
                <ul className="small">{t.rows.map((d) => <li key={d.id}>{fmt(d.date)}: <a href={`https://votes.parliament.uk/Votes/Commons/Division/${d.id}`} rel="noopener">{d.title}</a> — {voted(d.votedAye)} <span className="chip none">{d.context}</span></li>)}</ul>
              )}
            </div>
          ))}
        </details>
        <details className="tab"><summary>Justification</summary>
          {withJ.length === 0 ? <p className="empty">No recorded justification found in this sample.</p> : withJ.map((d) => (
            <div key={d.id} className="claim" style={{ margin: "0.5rem 0" }}>
              <p className="meta" style={{ margin: 0 }}>{fmt(d.date)} · {d.justification!.debate} · {voted(d.votedAye)}</p>
              <blockquote className="quote" style={{ display: "block" }}>{d.justification!.text}</blockquote>
              <p className="meta" style={{ margin: 0 }}>The member's own words in the same debate, from <a href={d.justification!.url} rel="noopener">Hansard</a>. Where no such speech exists, the vote appears only under Source.</p>
            </div>
          ))}
        </details>
        <details className="tab"><summary>Source</summary>
          <div className="scroll" tabIndex={0}><table className="plain" style={{ marginTop: "0.4rem" }}>
            <thead><tr><th>Date</th><th>Division</th><th>Context</th><th>Recorded</th><th className="num">Ayes–Noes</th></tr></thead>
            <tbody>{rec.divisions.map((d) => (
              <tr key={d.id}><td style={{ whiteSpace: "nowrap" }}>{fmt(d.date)}</td><td><a href={`https://votes.parliament.uk/Votes/Commons/Division/${d.id}`} rel="noopener">{d.title}</a></td><td><span className="chip none">{d.context}</span></td><td>{voted(d.votedAye)}</td><td className="num">{d.ayes}–{d.noes}</td></tr>
            ))}</tbody>
          </table></div>
          <p className="meta">Every division for this member: <a href={`https://members.parliament.uk/member/${rec.memberId}/voting`} rel="noopener">members.parliament.uk</a>. Context tags come from the division title; "Free vote" is never asserted because the record does not say.</p>
        </details>
        {rec.interests && rec.interests.length ? (
          <details className="tab"><summary>Declared interests ({rec.interestsTotal})</summary>
            <ul className="small" style={{ marginTop: "0.4rem" }}>
              {rec.interests.map((i, k) => <li key={k} style={{ marginBottom: "0.3rem" }}><span className="chip none">{i.category.replace(/ \(including loans\)/, "")}</span> {i.summary} <span className="meta">— registered {fmt(i.registered)}</span></li>)}
            </ul>
            <p className="meta">Latest entries in the Register of Members' Financial Interests (UK Parliament, Open Parliament Licence). MPs must register anything that might reasonably be thought to influence them within 28 days; a registered interest is a disclosure, not a finding of wrongdoing. <a href={`https://members.parliament.uk/member/${rec.memberId}/registeredinterests`} rel="noopener">The full register for this member</a>.</p>
          </details>
        ) : null}
      </div>
    </section>
  );
}

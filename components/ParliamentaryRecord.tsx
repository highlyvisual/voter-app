import type { ParliamentRecord } from "@/lib/parliament";
import { TOPICS } from "@/lib/data";

// WP-B6: the record on Real-O-Mat rules. Position shows a vote only where a justification exists; below two relevant divisions on a topic
// the panel says so; absences are "Did not vote (reason not recorded)"; never a "voted for/against X" summary line.
export default function ParliamentaryRecordView({ rec, note }: { rec: ParliamentRecord; note: string | null }) {
  const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const voted = (v: boolean | null) => (v === null ? "Did not vote (reason not recorded)" : v ? "Aye" : "No");
  const withJ = rec.divisions.filter((d) => d.justification);
  const byTopic = TOPICS.map(([k, l]) => ({ k, l, rows: withJ.filter((d) => d.topic === k) })).filter((t) => t.rows.length > 0);
  return (
    <section className="slot record">
      <h4>Parliamentary record</h4>
      {rec.extras?.synopsis ? <p className="small">{rec.extras.synopsis} <span className="meta">(Parliament&rsquo;s own summary.)</span></p> : null}
      <p className="meta">UK Parliament open data (Members, Commons Votes, Hansard). {note ? note + "." : ""} Most recent {rec.divisions.length} divisions sampled; the full record is linked below.</p>
      <ul className="small" style={{ paddingLeft: "1.1rem", margin: "0.3rem 0" }}>
        {rec.memberships.slice(0, 4).map((m, i) => <li key={i}>{m.house === "Commons" ? "MP for" : "Member of the Lords,"} {m.from ?? ""}: {fmt(m.start)} to {m.end ? fmt(m.end) : "present"}</li>)}
      </ul>
      <div className="tabs">
        <details className="tab" open><summary>Position</summary>
          {byTopic.length === 0 ? <p className="empty">Not enough recorded votes with a recorded justification in this sample to say anything concrete.</p> : byTopic.map((t) => (
            <div key={t.k} style={{ marginBottom: "0.6rem" }}>
              <p className="meta" style={{ margin: 0 }}>{t.l}</p>
              {t.rows.length < 2 ? <p className="empty">Not enough recorded votes on this topic to say anything concrete ({t.rows.length} with a justification).</p> : (
                <ul className="small">{t.rows.map((d) => <li key={d.id}>{fmt(d.date)}: <a href={`https://votes.parliament.uk/Votes/Commons/Division/${d.id}`} rel="noopener">{d.title}</a> — {voted(d.votedAye)} <span className="chip none">{d.context}</span>{partyNote(d)}</li>)}</ul>
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
              <tr key={d.id}><td style={{ whiteSpace: "nowrap" }}>{fmt(d.date)}</td><td><a href={`https://votes.parliament.uk/Votes/Commons/Division/${d.id}`} rel="noopener">{d.title}</a></td><td><span className="chip none">{d.context}</span></td><td>{voted(d.votedAye)}{partyNote(d)}</td><td className="num">{d.ayes}–{d.noes}{d.split && d.split.length ? <details className="split"><summary>by party</summary>{d.split.map((p) => <div key={p.party}>{p.party}: {p.aye} aye, {p.no} no</div>)}</details> : null}</td></tr>
            ))}</tbody>
          </table></div>
          <p className="meta">Every division for this member: <a href={`https://members.parliament.uk/member/${rec.memberId}/voting`} rel="noopener">members.parliament.uk</a>. Context tags come from the division title; "Free vote" is never asserted because the record does not say.</p>
        </details>
        {rec.extras && rec.extras.edms.total ? (
          <details className="tab"><summary>Early day motions ({rec.extras.edms.total.toLocaleString("en-GB")})</summary>
            <ul className="small" style={{ marginTop: "0.4rem" }}>
              {rec.extras.edms.items.map((e) => <li key={e.id}><a href={`https://edm.parliament.uk/early-day-motion/${e.id}`} rel="noopener">{e.title}</a> <span className="meta">— EDM {e.number}, tabled {fmt(e.date)}{e.prayer ? "; a prayer against a statutory instrument" : ""}</span></li>)}
            </ul>
            <p className="meta">The most recent early day motions this member tabled or signed, by the titles Parliament gives them. An early day motion puts a view on record; very few are debated. <a href={`https://members.parliament.uk/member/${rec.memberId}/earlydaymotions`} rel="noopener">All of them</a>.</p>
          </details>
        ) : null}
        {rec.extras && rec.extras.questions.total ? (
          <details className="tab"><summary>Written questions ({rec.extras.questions.total.toLocaleString("en-GB")})</summary>
            <ul className="small" style={{ marginTop: "0.4rem" }}>
              {rec.extras.questions.items.map((q) => <li key={q.id} style={{ marginBottom: "0.3rem" }}>&ldquo;{q.text}&rdquo; <span className="meta">— {fmt(q.date)}{q.to ? `, to ${q.to}` : ""}. <a href={`https://questions-statements.parliament.uk/written-questions/detail/${q.date}/${q.uin}`} rel="noopener">Question and answer</a></span></li>)}
            </ul>
            <p className="meta">The member&rsquo;s most recent written questions to the government, in their own words. <a href={`https://members.parliament.uk/member/${rec.memberId}/writtenquestions`} rel="noopener">All of them</a>.</p>
          </details>
        ) : null}
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

// "Voted with / against most of their party" as a plain count. Never "rebel": the record doesn't say why.
function partyNote(d: { ownParty?: string | null; withParty?: boolean | null; split?: { party: string; aye: number; no: number }[] }) {
  if (d.withParty === null || d.withParty === undefined || !d.ownParty) return null;
  const t = d.split?.find((p) => p.party === d.ownParty);
  const tally = t ? ` (${d.ownParty}: ${t.aye} aye, ${t.no} no)` : "";
  return <span className="meta"> · {d.withParty ? "with most of their party" : "against most of their party"}{tally}</span>;
}

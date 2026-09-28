import { billTracker, parliamentNow, type HouseNow } from "@/lib/parliamentNow";

const short = (s: string) => new Date(s + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const NAME = { Commons: "The House of Commons", Lords: "The House of Lords" } as const;

function line(h: HouseNow) {
  if (h.current) return <>{NAME[h.house]} is in recess until {short(h.current.end)}.</>;
  return <>{NAME[h.house]} is sitting{h.next ? <>; its next recess is {short(h.next.start)} to {short(h.next.end)}</> : null}.</>;
}

/** "Parliament now": whether each House is sitting, from Parliament's own calendar. */
export async function RecessStrip() {
  const houses = await parliamentNow();
  if (!houses) return null;
  return (
    <aside className="callout parliament-now" aria-labelledby="parl-now-h">
      <h2 id="parl-now-h" className="small-heading">Parliament now</h2>
      <p className="small">{houses.map((h, i) => <span key={h.house}>{i ? " " : ""}{line(h)}</span>)}</p>
      <p className="meta">Recess dates from UK Parliament&rsquo;s <a href="https://whatson.parliament.uk/" rel="noopener">What&rsquo;s On calendar</a> (Open Parliament Licence), checked hourly.</p>
    </aside>
  );
}

/** A bill's progress, stage by stage, as Parliament records it. */
export async function BillProgress({ billId, why }: { billId: number; why: string }) {
  const b = await billTracker(billId);
  if (!b) return null;
  const status = b.isAct ? "It has become law (Royal Assent)." : b.withdrawn ? "It has been withdrawn." : b.defeated ? "It has been defeated." : b.currentStage ? `Current stage: ${b.currentStage.toLowerCase()}${b.currentHouse ? `, House of ${b.currentHouse}` : ""}.` : null;
  return (
    <section className="council-topic bill-progress" aria-labelledby={`bill-${billId}-h`}>
      <h2 id={`bill-${billId}-h`}>{b.title}: where it has got to</h2>
      <p className="small">{why} {status}</p>
      <ol className="small bill-stages">
        {b.stages.map((s, i) => (
          <li key={i} className={s.dates.length ? "done" : "current"}>
            <b>{s.house}</b>: {s.description}{s.dates.length ? <span className="meta"> — {s.dates.length === 1 ? short(s.dates[0]) : `${short(s.dates[0])} to ${short(s.dates[s.dates.length - 1])} (${s.dates.length} sittings)`}</span> : <span className="meta"> — no sitting listed yet</span>}
          </li>
        ))}
      </ol>
      {!b.isAct && !b.withdrawn && !b.defeated ? <p className="meta">A bill becomes law only after both Houses have agreed the same text and it receives Royal Assent.</p> : null}
      <details className="more">
        <summary className="meta">What the bill says it does (its long title)</summary>
        <p className="small">&ldquo;{b.longTitle}&rdquo;</p>
      </details>
      <p className="meta">{b.sponsors.length ? `Sponsoring department: ${b.sponsors.join(", ")}. ` : ""}Stages from the <a href={`https://bills.parliament.uk/bills/${billId}`} rel="noopener">UK Parliament bills record</a> (Open Parliament Licence){b.lastUpdate ? `, last updated there on ${short(b.lastUpdate)}` : ""}; checked hourly.</p>
    </section>
  );
}

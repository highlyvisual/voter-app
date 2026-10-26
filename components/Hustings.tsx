import { HUSTINGS_SOURCE, hustingsFor, type Husting } from "@/lib/democracyclub";

// Romily, round ten q14: "Yes, list them all and say who runs each". Every hustings Democracy Club lists for this ballot,
// by date, with what it is, when, where, the link and who runs it where the record itself says (lib/democracyclub.ts).
// Nothing is filtered or ordered by organiser. If the list could not be read, the section is left out rather than
// saying "none".
const dayTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", day: "numeric", month: "long", year: "numeric" });
const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "numeric", minute: "2-digit", hour12: true });
const t = (d: string) => clock.format(new Date(d)).replace(":00", "").replace(/\s/gu, "");
const ukDay = (d: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date(d));

function when(h: Husting) {
  const start = `${dayTime.format(new Date(h.starts))}, ${t(h.starts)}`;
  if (!h.ends) return start;
  return ukDay(h.ends) === ukDay(h.starts) ? `${start} to ${t(h.ends)}` : `${start} to ${dayTime.format(new Date(h.ends))}, ${t(h.ends)}`;
}

export default async function Hustings({ ballotId, archived }: { ballotId: string; archived: boolean }) {
  const list = await hustingsFor(ballotId);
  if (!list || (archived && !list.length)) return null;
  const source = <>Hustings: <a href={HUSTINGS_SOURCE} rel="noopener">Democracy Club</a> (CC BY 4.0). Checked hourly.</>;
  return (
    <section className="hustings" id="hustings" aria-labelledby="hustings-heading">
      <h2 id="hustings-heading">Hustings</h2>
      {list.length ? (
        <>
          <p className="meta">Public meetings where the candidates answer questions. Every one listed for this election, by date.</p>
          <ul className="hustings-list">
            {list.map((h, i) => (
              <li key={`${h.starts}-${i}`}>
                <span className="h-title">{h.title}</span>
                <span className="h-line">{when(h)}</span>
                {h.location ? <span className="h-line">{/^internet$/i.test(h.location) ? "Online" : h.location}</span> : null}
                <span className="h-line meta">Organiser: {h.organiser ? <>{h.organiser} <span>(as the event&rsquo;s title says)</span></> : <>see the event page{h.domain ? ` (${h.domain})` : ""}</>}</span>
                {h.url || h.postevent_url ? (
                  <span className="h-line">
                    {h.url ? <a href={h.url} rel="noopener">Event page</a> : null}
                    {h.url && h.postevent_url ? " · " : null}
                    {h.postevent_url ? <a href={h.postevent_url} rel="noopener">Recording or report</a> : null}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : <p className="small">No hustings listed yet for this election.</p>}
      <p className="meta">{source}</p>
    </section>
  );
}

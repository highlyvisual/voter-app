import type { Timetable } from "@/lib/democracyclub";
import { keyDates } from "@/lib/deadlines";
// The dates and rules live in lib/deadlines.ts, shared with the phone app's ballot route.
const short = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" });

export default function Deadlines({ pollDate, noticeUrl, gss, level, timetable }: { pollDate: string; noticeUrl: string | null; gss?: string | null; level?: string; timetable?: Timetable | null }) {
  const today = new Date().toISOString().slice(0, 10);
  const kd = keyDates({ pollDate, gss, level, timetable });
  const idRequired = kd.idRequired;
  const items = kd.items.map((i) => ({ label: i.label, when: new Date(i.date + "T00:00:00Z"), time: i.time, href: i.href }));
  const next = items.find((i) => i.when.toISOString().slice(0, 10) >= today);
  const daysTo = (d: Date) => Math.round((d.getTime() - new Date(today + "T00:00:00Z").getTime()) / 86400000);
  const pollDays = daysTo(new Date(pollDate + "T00:00:00Z"));
  return (
    <div className="dates" aria-label="Key dates">
      <span><strong>Key dates</strong></span>
      {pollDays >= 0 ? <span className="countdown">{pollDays === 0 ? "Polling day is today" : pollDays === 1 ? "Polling day is tomorrow" : `Polling day in ${pollDays} days`}{next ? ` · ${next.label.toLowerCase()} deadline ${daysTo(next.when) === 0 ? "today" : daysTo(next.when) === 1 ? "tomorrow" : `in ${daysTo(next.when)} days`}` : ""}</span> : null}
      {items.map((i) => {
        const past = i.when.toISOString().slice(0, 10) < today;
        return (
          past ? (
            <span key={i.label} className="closed">
              <a href={i.href} rel="noopener">{i.label}</a> closed {short(i.when)}{i.time ? ` ${i.time}` : ""}
            </span>
          ) : (
            <span key={i.label}>
              <a href={i.href} rel="noopener">{i.label}</a> by {short(i.when)}{i.time ? ` ${i.time}` : ""}
            </span>
          )
        );
      })}
      {items[0].when.toISOString().slice(0, 10) < today && pollDays >= 0 ? (
        <span className="what-now">
          Registration for this election has closed. If you weren&rsquo;t registered by {short(items[0].when)}, you can&rsquo;t vote in it, but <a href="https://www.gov.uk/register-to-vote" rel="noopener">registering now</a> takes about five minutes and puts you on the roll for the next one.
        </span>
      ) : null}
      <span>Polls 7am to 10pm{idRequired ? " · photo ID needed" : " · no photo ID needed at this election"} · <a href="https://wheredoivote.co.uk/" rel="noopener">Find your polling station</a> <span className="meta">(Democracy Club; it is also on your poll card)</span></span>
      <details>
        <summary>about these dates</summary>
        <ul>
          {timetable ? <li>From the election timetable held by <a href={timetable.source} rel="noopener">Democracy Club</a> (CC BY 4.0), which follows the statutory working-day rules.</li> : <li>Calculated from the statutory election timetable (working days before polling day).</li>}
          {noticeUrl ? <li>Confirm against the <a href={noticeUrl} rel="noopener">council's official notice</a>.</li> : null}
        </ul>
      </details>
    </div>
  );
}

// Statutory timetable for UK Parliamentary elections in England (RPA 1983 Sch. 1; Elections Act 2022 for Voter Authority Certificates):
// register 12 working days before poll; postal vote 11 working days (5pm); proxy vote and Voter Authority Certificate 6 working days (5pm).
// Calculated, not scraped; the council's official notice is linked for confirmation.
// Bank holidays by nation (GOV.UK). The statutory timetable counts working days, which excludes these.
const BANK_HOLIDAYS: Record<string, Set<string>> = {
  E: new Set(["2026-12-25", "2026-12-28", "2027-01-01", "2027-03-26", "2027-03-29", "2027-05-03", "2027-05-31", "2027-08-30", "2027-12-27", "2027-12-28"]),
  W: new Set(["2026-12-25", "2026-12-28", "2027-01-01", "2027-03-26", "2027-03-29", "2027-05-03", "2027-05-31", "2027-08-30", "2027-12-27", "2027-12-28"]),
  S: new Set(["2026-11-30", "2026-12-25", "2026-12-28", "2027-01-01", "2027-01-04", "2027-03-26", "2027-05-03", "2027-05-31", "2027-08-02", "2027-11-30", "2027-12-27", "2027-12-28"]),
};
function isWorkingDay(d: Date, nation: string) { const day = d.getUTCDay(); return day !== 0 && day !== 6 && !(BANK_HOLIDAYS[nation] ?? BANK_HOLIDAYS.E).has(d.toISOString().slice(0, 10)); }
function workingDaysBefore(poll: string, n: number, nation: string): Date {
  const d = new Date(poll + "T00:00:00Z"); let c = 0;
  while (c < n) { d.setUTCDate(d.getUTCDate() - 1); if (isWorkingDay(d, nation)) c++; }
  return d;
}
const short = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export default function Deadlines({ pollDate, noticeUrl, gss, level }: { pollDate: string; noticeUrl: string | null; gss?: string | null; level?: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const nation = (gss ?? "E").charAt(0).toUpperCase();
  // Same working-day rules across England, Scotland and Wales for these elections; photo ID is required at UK Parliament elections and
  // at council elections in England, but not at council elections in Scotland or Wales.
  const idRequired = level === "parliamentary" || nation === "E";
  const items = [
    { label: "Register", when: workingDaysBefore(pollDate, 12, nation), time: "", href: "https://www.gov.uk/register-to-vote" },
    { label: "Postal vote", when: workingDaysBefore(pollDate, 11, nation), time: "5pm", href: "https://www.gov.uk/apply-postal-vote" },
    { label: "Proxy vote", when: workingDaysBefore(pollDate, 6, nation), time: "5pm", href: "https://www.gov.uk/apply-proxy-vote" },
    ...(idRequired ? [{ label: "Free voter ID", when: workingDaysBefore(pollDate, 6, nation), time: "5pm", href: "https://www.gov.uk/apply-for-photo-id-voter-authority-certificate" }] : []),
  ];
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
          <span key={i.label} className={past ? "past" : undefined}>
            <a href={i.href} rel="noopener">{i.label}</a> by {short(i.when)}{i.time ? ` ${i.time}` : ""}
          </span>
        );
      })}
      <span>Polls 7am to 10pm{idRequired ? " · photo ID needed" : " · no photo ID needed at this election"}</span>
      <details>
        <summary>about these dates</summary>
        <ul>
          <li>Calculated from the statutory election timetable (working days before polling day).</li>
          {noticeUrl ? <li>Confirm against the <a href={noticeUrl} rel="noopener">council's official notice</a>.</li> : null}
        </ul>
      </details>
    </div>
  );
}

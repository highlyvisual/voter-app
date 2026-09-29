import Link from "next/link";
import BallotsMap from "@/components/BallotsMap";
import { listBallots, type Ballot } from "@/lib/data";
import { SCHEDULED } from "@/lib/scheduled";
import { longDate } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "What can I vote in next?",
  description: "Every election coming up in the UK: a countdown to the next polling day, a calendar and a map, from Democracy Club's list of called elections and the dates fixed by law.",
  alternates: { canonical: "/next" },
};

// Round eight q18 (Romily, 29 Sept): "What can I vote in next?" with a countdown, a calendar and a map. Elections that
// have been called come from Democracy Club (the nightly ingest); scheduled ones from lib/scheduled.ts, each with its
// source. Nothing about the viewer is used; the postcode search is the existing one.
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function londonToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
const dayDiff = (from: string, to: string) => Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000);
const inDays = (n: number) => (n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`);
const kind = (b: Ballot) => (b.level === "parliamentary" ? "UK Parliament by-election" : b.level === "local" ? "Council by-election" : "By-election");
const weekday = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });

function Month({ year, month, byDay, today }: { year: number; month: number; byDay: Map<string, Ballot[]>; today: string }) {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const iso = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return (
    <table className="cal">
      <caption>{LONG_MONTHS[month]} {year}</caption>
      <thead><tr>{WEEKDAYS.map((w) => <th key={w} scope="col" abbr={w}>{w.charAt(0)}<span className="sr-only">{w.slice(1)}</span></th>)}</tr></thead>
      <tbody>
        {weeks.map((wk, i) => (
          <tr key={i}>
            {wk.map((d, j) => {
              if (!d) return <td key={j} />;
              const list = byDay.get(iso(d)) ?? [];
              const cls = [list.length ? "has" : "", iso(d) === today ? "today" : "", iso(d) < today ? "past" : ""].filter(Boolean).join(" ");
              return (
                <td key={j} className={cls || undefined}>
                  {list.length ? <a href={`#day-${iso(d)}`} aria-label={`${d} ${LONG_MONTHS[month]}: ${list.length === 1 ? "one election" : `${list.length} elections`}`}>{d}<span className="cal-dot" aria-hidden /></a> : <span>{d}</span>}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function NextPage() {
  const today = londonToday();
  const ballots = (await listBallots()).filter((b) => b.poll_date >= today && !b.cancelled);
  const byDay = new Map<string, Ballot[]>();
  for (const b of ballots) byDay.set(b.poll_date, [...(byDay.get(b.poll_date) ?? []), b]);
  const days = [...byDay.keys()].sort();
  const next = days[0];
  const scheduled = SCHEDULED.filter((s) => s.date >= today);
  // Months to draw: this month through the month of the last called election.
  const [ty, tm] = today.split("-").map(Number);
  const last = days[days.length - 1] ?? today;
  const [ly, lm] = last.split("-").map(Number);
  const months: [number, number][] = [];
  for (let k = ty * 12 + tm - 1; k <= ly * 12 + lm - 1 && months.length < 12; k++) months.push([Math.floor(k / 12), k % 12]);

  return (
    <>
      <p className="eyebrow">Coming up</p>
      <h1>What can I vote in next?</h1>
      <p className="lede">Every election that has been called in the UK, and the big dates already fixed. Find yours by postcode, or browse by date or on the map.</p>
      <p><Link href="/start" className="button">Find my next vote by postcode &rarr;</Link> <span className="meta">We don&rsquo;t store your postcode.</span></p>

      <section className="countdowns" aria-label="Countdown">
        {next ? (
          <div className="count-card">
            <p className="count-label">Next polling day</p>
            <p className="count-big">{dayDiff(today, next) === 0 ? "Today" : dayDiff(today, next) === 1 ? "Tomorrow" : <>{dayDiff(today, next)} <span>days</span></>}</p>
            <p className="count-sub">{weekday(next)} {longDate(next)} &middot; {byDay.get(next)!.length === 1 ? "one by-election" : `${byDay.get(next)!.length} by-elections`}. Polls open 7am to 10pm.</p>
          </div>
        ) : null}
        {scheduled.slice(0, 1).map((s) => (
          <div className="count-card quiet" key={s.id}>
            <p className="count-label">Next big election day</p>
            <p className="count-big">{dayDiff(today, s.date)} <span>days</span></p>
            <p className="count-sub">{s.when}: {s.title}.</p>
          </div>
        ))}
      </section>

      <h2>Calendar</h2>
      <p className="meta">Days with an election are marked; select one to see what is on.</p>
      <div className="cal-row">{months.map(([y, m]) => <Month key={`${y}-${m}`} year={y} month={m} byDay={byDay} today={today} />)}</div>

      <h2>Map</h2>
      <BallotsMap ballots={ballots.map((b) => ({ ballot_paper_id: b.ballot_paper_id, area_name: b.area_name, poll_date: b.poll_date, level: b.level, lat: b.area_lat ?? null, lng: b.area_lng ?? null }))} />

      <h2>By date</h2>
      {days.length ? (
        <ol className="by-date">
          {days.map((d) => (
            <li key={d} id={`day-${d}`}>
              <h3>{weekday(d)} {longDate(d)} <span className="meta">{inDays(dayDiff(today, d))}</span></h3>
              <ul>
                {byDay.get(d)!.sort((a, b) => a.area_name.localeCompare(b.area_name)).map((b) => (
                  <li key={b.ballot_paper_id}>
                    <Link href={`/ballot/${encodeURIComponent(b.ballot_paper_id)}`}>{b.area_name}</Link> <span className="meta">{kind(b)}{b.postponed ? " · postponed" : ""}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : <p>No elections have been called for the coming weeks. By-elections are listed here as soon as they are announced.</p>}

      <h2>Already fixed</h2>
      <ul className="scheduled">
        {scheduled.map((s) => (
          <li key={s.id}>
            <strong>{s.when}</strong>: {s.title}. <span className="meta">{s.detail} ({s.certainty}.) Source: {s.sources.map(([t, u], i) => <span key={u}>{i ? "; " : ""}<a href={u} rel="noopener">{t}</a></span>)}.</span>
          </li>
        ))}
      </ul>
      <p className="meta">Called elections from <a href="https://democracyclub.org.uk/" rel="noopener">Democracy Club</a>, updated every night. Dates can change: a by-election can be called at any time, and a general election can be called before its deadline. <Link href="/how-to-vote">How voting works</Link>.</p>
    </>
  );
}

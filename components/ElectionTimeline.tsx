"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SCHEDULED } from "@/lib/scheduled";

// "What's coming up": slide the horizon from two weeks to the next general election. Elections with confirmed
// candidates (from Democracy Club) are listed in full; elections fixed by law but without candidates yet are shown as
// scheduled, with their source. Order is by polling date only.
type B = { id: string; area: string; date: string; level: string; locked: boolean; positions: number };
const STOPS: [string, number | null, string, string][] = [
  ["2 weeks", 14, "in the next two weeks", "2 weeks"],
  ["6 weeks", 42, "in the next six weeks", "6 weeks"],
  ["3 months", 92, "in the next three months", "3 months"],
  ["1 year", 365, "in the next year", "1 year"],
  ["general election", null, "up to the next general election", "Next general election"],
];

export default function ElectionTimeline({ ballots, today }: { ballots: B[]; today: string }) {
  const [i, setI] = useState(1);
  const [, days, phrase] = STOPS[i];
  const end = useMemo(() => {
    if (days === null) return "2029-08-15";
    const d = new Date(today + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10);
  }, [days, today]);
  const inRange = ballots.filter((b) => b.date >= today && b.date <= end);
  const sched = SCHEDULED.filter((s) => s.date <= end);
  const dates = [...new Set(inRange.map((b) => b.date))];
  const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const lastConfirmed = ballots.map((b) => b.date).sort().at(-1);
  return (
    <section className="timeline" aria-labelledby="elections">
      <h2 id="elections">What's coming up</h2>
      <div className="range">
        <label htmlFor="horizon" className="range-label">Show elections <strong>{phrase}</strong></label>
        <input id="horizon" type="range" min={0} max={STOPS.length - 1} step={1} value={i} onChange={(e) => setI(Number(e.target.value))} aria-valuetext={phrase} list="horizon-stops" />
        <datalist id="horizon-stops">{STOPS.map((_, k) => <option key={k} value={k} />)}</datalist>
        <div className="range-ticks" aria-hidden>{STOPS.map(([key, , , tick], k) => <button type="button" key={key} className={k === i ? "on" : ""} onClick={() => setI(k)} tabIndex={-1}>{tick}</button>)}</div>
      </div>
      <p className="range-summary" aria-live="polite">
        <strong>{inRange.length}</strong> {inRange.length === 1 ? "election" : "elections"} with candidates confirmed{sched.length ? <>, and <strong>{sched.length}</strong> scheduled {sched.length === 1 ? "election" : "elections"} whose candidates aren't known yet</> : ""}.
      </p>

      {dates.map((d) => (
        <section key={d} className="date-group">
          <h3>{fmt(d)}</h3>
          <ul className="election-list">
            {inRange.filter((b) => b.date === d).map((b) => (
              <li key={b.id}>
                <Link href={`/ballot/${encodeURIComponent(b.id)}`}>{b.area}</Link>
                <span className="meta"> {b.level === "parliamentary" ? "UK Parliament" : "Council"}{b.locked ? "" : " · nominations not yet closed"} · {b.positions} sourced {b.positions === 1 ? "position" : "positions"}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {days !== null && days > 42 && inRange.length && lastConfirmed && lastConfirmed < end ? (
        <p className="meta gap-note">No other elections have candidates confirmed after {fmt(lastConfirmed)}. By-elections are added as they're called, usually a few weeks before polling day.</p>
      ) : null}

      {sched.length ? (
        <div className="scheduled">
          {sched.map((s) => (
            <article key={s.id} className="scheduled-card">
              <p className="sched-when">{s.when} <span className="sched-tag">{s.certainty}</span></p>
              <h3>{s.title}</h3>
              <p>{s.detail}</p>
              <p className="meta">Candidates not yet known. {s.sources.length === 1 ? "Source" : "Sources"}: {s.sources.map(([name, url], k) => <span key={url}>{k ? "; " : ""}<a href={url} rel="noopener">{name}</a></span>)}.</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

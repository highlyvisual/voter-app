"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readProfile } from "@/lib/profile";
import { SCHEDULED } from "@/lib/scheduled";

// "What's coming up": slide the horizon from two weeks to the next general election. Elections with confirmed
// candidates (from Democracy Club) are listed in full; elections fixed by law but without candidates yet are shown as
// scheduled, with their source. Order is by polling date only.
type Face = { name: string; photo: string | null; colour: string | null };
type B = { id: string; area: string; date: string; level: string; locked: boolean; positions: number; faces: Face[] };
const STOPS: [string, number | null, string, string][] = [
  ["2 weeks", 14, "in the next two weeks", "2 weeks"],
  ["6 weeks", 42, "in the next six weeks", "6 weeks"],
  ["3 months", 92, "in the next three months", "3 months"],
  ["1 year", 365, "in the next year", "1 year"],
  ["general election", null, "up to the next general election", "Next general election"],
];

export default function ElectionTimeline({ ballots, today }: { ballots: B[]; today: string }) {
  const [i, setI] = useState(1);
  const [own, setOwn] = useState(false);
  useEffect(() => { try { setOwn(Boolean(readProfile()?.ballot)); } catch {} }, []);
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
      <h2 id="elections">{own ? "Other elections we cover" : "What's coming up"}</h2>
      {own ? <p className="meta">Your own election is above. These are the others, in case you want to look at one.</p> : null}
      <details open={!own} className="timeline-body">
      <summary className="meta">{own ? "Show the full list" : "Hide the list"}</summary>
      <div className="range">
        <label htmlFor="horizon" className="range-label">Show elections <strong>{phrase}</strong></label>
        <input id="horizon" type="range" min={0} max={STOPS.length - 1} step={1} value={i} onChange={(e) => setI(Number(e.target.value))} aria-valuetext={phrase} list="horizon-stops" />
        <datalist id="horizon-stops">{STOPS.map((_, k) => <option key={k} value={k} />)}</datalist>
        <div className="range-ticks" aria-hidden>{STOPS.map(([key, , , tick], k) => <button type="button" key={key} className={k === i ? "on" : ""} onClick={() => setI(k)} tabIndex={-1}>{tick}</button>)}</div>
      </div>
      <p className="range-summary" aria-live="polite">
        <strong>{inRange.length}</strong> {inRange.length === 1 ? "election" : "elections"} with candidates confirmed{sched.length ? <>, and <strong>{sched.length}</strong> scheduled {sched.length === 1 ? "election" : "elections"} whose candidates aren't known yet</> : ""}.
      </p>

      <ol className="tl">
        {dates.map((d) => {
          const dt = new Date(d + "T00:00:00Z");
          const diff = Math.round((dt.getTime() - new Date(today + "T00:00:00Z").getTime()) / 86400000);
          const rel = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : `In ${diff} days`;
          return (
            <li key={d} className="tl-day">
              <div className="tl-date" aria-hidden>
                <span className="tl-dow">{dt.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}</span>
                <span className="tl-dnum">{dt.getUTCDate()}</span>
                <span className="tl-mon">{dt.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}</span>
                <span className="tl-rel">{rel}</span>
              </div>
              <div className="tl-body">
                <h3 className="sr-only">{fmt(d)}</h3>
                <ul className="tl-rows">
                  {inRange.filter((b) => b.date === d).map((b) => {
                    const [council, place] = b.area.includes(":") ? b.area.split(":").map((x) => x.trim()) : [null, b.area];
                    const name = (place ?? b.area).replace(/\s+ward$/i, "");
                    const where = b.level === "parliamentary" ? "UK Parliament · constituency by-election" : `${council ?? "Council"} · ${/\bdivision\b|County/i.test(b.area) && !/ward$/i.test(b.area) ? "county division" : "ward"} by-election`;
                    const shown = b.faces.slice(0, 7);
                    return (
                      <li key={b.id}>
                        <Link href={`/ballot/${encodeURIComponent(b.id)}`} className="tl-row">
                          <span className="tl-main">
                            <span className="tl-name">{name}</span>
                            <span className="tl-where">{where}</span>
                          </span>
                          <span className="tl-faces" aria-hidden>
                            {shown.map((f, k) => f.photo
                              ? <img key={k} src={f.photo} alt="" width={30} height={30} loading="lazy" style={{ borderColor: f.colour ?? "var(--rule)" }} />
                              : <span key={k} className="tl-initials" style={{ borderColor: f.colour ?? "var(--rule)" }}>{f.name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).map((w) => w[0]).slice(0, 2).join("")}</span>)}
                            {b.faces.length > shown.length ? <span className="tl-more">+{b.faces.length - shown.length}</span> : null}
                          </span>
                          <span className="tl-stats">
                            <span><b>{b.faces.length}</b> {b.faces.length === 1 ? "candidate" : "candidates"}</span>
                            <span className={b.positions ? "" : "tl-none"}>{b.positions ? <><b>{b.positions}</b> sourced {b.positions === 1 ? "position" : "positions"}</> : "No positions sourced yet"}</span>
                            {!b.locked ? <span className="tl-none">Nominations open</span> : null}
                          </span>
                          <span className="tl-go" aria-hidden>→</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>

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
      </details>
    </section>
  );
}

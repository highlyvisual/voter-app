"use client";
import { useState } from "react";

export type Level = { key: string; label: string; gss: string; stats: { slug: string; name: string; means: string; display: string; period: string; source: { name: string; href: string } | null }[] };

// One area at a time (round eight q7): the same list for the council, then wider areas if the reader chooses.
export default function AreaFigures({ levels }: { levels: Level[] }) {
  const [k, setK] = useState(levels[0]?.key ?? "council");
  const cur = levels.find((l) => l.key === k) ?? levels[0];
  if (!cur) return null;
  return (
    <>
      {levels.length > 1 ? (
        <div className="area-zoom" role="group" aria-label="Show the figures for">
          <span className="meta">Show the figures for:</span>
          {levels.map((l) => <button key={l.key} type="button" aria-pressed={l.key === cur.key} className={l.key === cur.key ? "on" : ""} onClick={() => setK(l.key)}>{l.label}</button>)}
        </div>
      ) : null}
      <p className="meta" aria-live="polite" style={{ margin: "0.4rem 0" }}>Showing: <strong>{cur.label}</strong>{cur.key === "council" ? "" : " (a wider area than the council)"}.</p>
      <dl className="stat-list plain">
        {cur.stats.map((s) => (
          <div key={s.slug}>
            <dt>{s.name}</dt>
            <dd><b>{s.display}</b> <span className="meta">{s.period}{s.source ? <> · <a href={s.source.href} rel="noopener">{s.source.name}</a></> : null}</span><span className="meta sub">{s.means}</span></dd>
          </div>
        ))}
      </dl>
      <p className="meta"><a href={`https://www.ons.gov.uk/explore-local-statistics/areas/${cur.gss}`} rel="noopener">More figures for {cur.label} from the ONS</a></p>
    </>
  );
}

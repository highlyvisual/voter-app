"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { JourneyData } from "@/lib/journeyData";
import JourneyProfile from "@/components/JourneyProfile";

// Prototype B (Romily, round 5, q6): one page that opens up as you go. Each section appears once the one before is
// done, and detail expands in place. Nothing is hidden for good: "show everything" opens the lot.
const SECTIONS = ["you", "area", "job", "matters", "candidates", "deeper"] as const;
export default function JourneyFlow({ d, map, reps, office }: { d: JourneyData; map: ReactNode; reps: ReactNode; office: ReactNode }) {
  const [open, setOpen] = useState(1);
  const [all, setAll] = useState(false);
  useEffect(() => { try { const n = Number(sessionStorage.getItem("jf-open") ?? "1"); if (n > 1) setOpen(n); } catch {} }, []);
  const reveal = (n: number) => { setOpen((o) => { const v = Math.max(o, n); try { sessionStorage.setItem("jf-open", String(v)); } catch {} return v; }); setTimeout(() => document.getElementById(`jf-${SECTIONS[n - 1]}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };
  const shown = (i: number) => all || i < open;
  const base = `/ballot/${encodeURIComponent(d.ballot.id)}`; const qq = d.qs ? `?${d.qs}` : "";
  const rel = d.topics.filter((t) => t.reason);
  return (
    <div className="jf">
      <header className="jf-hero">
        <p className="eyebrow">What's It To Me?</p>
        <h1>{d.ballot.place}: {d.ballot.days ? `${d.ballot.days} days to go.` : "polling day."}</h1>
        <p className="lede">{d.ballot.council ? `${d.ballot.council} · ` : ""}{d.ballot.level === "parliamentary" ? "UK Parliament by-election" : "council by-election"} · {d.ballot.dateText}. {d.candidates.length} candidates. Tell us a little and the page builds itself around you; or <button type="button" className="link" onClick={() => setAll(true)}>show everything now</button>.</p>
      </header>

      <section id="jf-you" className="jf-sec">
        <h2><span className="n">1</span>About you</h2>
        <JourneyProfile household={d.household} qs={d.qs} />
        {!shown(1) ? <p><button type="button" onClick={() => reveal(2)}>{Object.keys(d.household).length ? "Next: your area" : "Skip: show my area"}</button></p> : null}
      </section>

      {shown(1) ? <section id="jf-area" className="jf-sec">
        <h2><span className="n">2</span>Your area</h2>
        {map}
        <details className="jf-more"><summary>Who represents you now</summary>{reps}</details>
        {!shown(2) ? <p><button type="button" onClick={() => reveal(3)}>Next: what you're voting for</button></p> : null}
      </section> : null}

      {shown(2) ? <section id="jf-job" className="jf-sec">
        <h2><span className="n">3</span>What you're voting for</h2>
        <details className="jf-more" open><summary>What this job does, and doesn't, control</summary>{office}</details>
        {!shown(3) ? <p><button type="button" onClick={() => reveal(4)}>Next: what matters to you</button></p> : null}
      </section> : null}

      {shown(3) ? <section id="jf-matters" className="jf-sec">
        <h2><span className="n">4</span>{rel.length ? "What touches your household, first" : "Nine topics"}</h2>
        {rel.length ? <ul className="topic-first">{rel.map((t) => <li key={t.topic}><strong>{t.label}</strong> <span className="meta">— first {t.reason}</span></li>)}</ul> : null}
        <div className="jf-topics">{d.topics.map((t) => (
          <details key={t.topic} className="jf-topic">
            <summary><span className="jf-tname">{t.short}</span><span className="jf-tn">{t.n}</span><span className="meta">{t.n ? `published ${t.n === 1 ? "position" : "positions"} from ${t.who} of ${d.candidates.length}` : "nothing published yet"}</span></summary>
            <div className="jf-tbody">{t.reason ? <p className="meta">Shown first {t.reason}.</p> : null}<p><Link href={`${base}/topic/${t.topic}${qq}`}>See what each candidate has published on {t.label.toLowerCase()} →</Link></p></div>
          </details>))}</div>
        {!shown(4) ? <p><button type="button" onClick={() => reveal(5)}>Next: the candidates</button></p> : null}
      </section> : null}

      {shown(4) ? <section id="jf-candidates" className="jf-sec">
        <h2><span className="n">5</span>The candidates</h2>
        <p className="meta">{d.candidates.length} in ballot-paper order, the same page for each. Open one for their photo, positions and sources.</p>
        <ol className="js-cands">{d.candidates.map((c) => (
          <li key={c.id}><Link href={`${base}/candidate/${c.id}${qq}`}><span className="n">{c.n}</span><span className="who"><strong>{c.name}</strong><span className="party"><span className="party-dot" style={{ background: c.colour ?? "var(--rule)" }} />{c.party}</span></span><span className="meta">{c.positions ? `${c.positions} sourced ${c.positions === 1 ? "position" : "positions"}` : "Nothing published found"}</span></Link></li>
        ))}</ol>
        {!shown(5) ? <p><button type="button" onClick={() => reveal(6)}>Next: go deeper</button></p> : null}
      </section> : null}

      {shown(5) ? <section id="jf-deeper" className="jf-sec">
        <h2><span className="n">6</span>Go deeper</h2>
        <p>{d.stats.claims} sourced positions from {d.stats.sources} named sources, every one linked to where it was published.</p>
        <ul className="js-links">
          <li><Link href={`${base}/compare${qq}`}>Compare candidates side by side, one topic at a time</Link></li>
          <li><Link href={`${base}${qq}`}>The full ballot page, everything in one place</Link></li>
          <li><Link href={`${base}/area${qq}`}>Your area in depth: planning, deprivation, council tax, history</Link></li>
          <li><Link href="/how-to-vote">How to vote: ID, postal, proxy, deadlines</Link></li>
        </ul>
      </section> : null}
    </div>
  );
}

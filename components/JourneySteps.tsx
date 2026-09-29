"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { JourneyData } from "@/lib/journeyData";
import JourneyProfile from "@/components/JourneyProfile";
import JourneyMode from "@/components/JourneyMode";

// Prototype A (Romily, round 5, q6): one screen per stage, Back and Next, a trail showing where you are, like an app.
// The step lives in the URL (?s=n) so every screen has its own link and survives a reload.
export const STEP_NAMES = ["Start", "Your ballot", "About you", "Your area", "The job", "What matters", "Candidates", "Go deeper"];
export default function JourneySteps({ d, step, map, reps, office }: { d: JourneyData; step: number; map: ReactNode; reps: ReactNode; office: ReactNode }) {
  const router = useRouter(); const path = usePathname();
  const go = (n: number) => { const q = new URLSearchParams(d.qs); q.set("s", String(n)); router.push(`${path}?${q.toString()}`); window.scrollTo({ top: 0 }); };
  const s = Math.min(Math.max(step, 0), STEP_NAMES.length - 1);
  const base = `/ballot/${encodeURIComponent(d.ballot.id)}`; const qq = d.qs ? `?${d.qs}` : "";
  const rel = d.topics.filter((t) => t.reason);
  return (
    <div className="js">
      <JourneyMode mode="steps" qs={d.qs} />
      <ol className="js-trail" aria-label="Where you are">{STEP_NAMES.map((n, i) => <li key={n} className={i === s ? "now" : i < s ? "done" : ""}><button type="button" onClick={() => go(i)}><span className="n">{i + 1}</span><span className="t">{n}</span></button></li>)}</ol>
      <div className="js-screen" key={s}>
        {s === 0 ? (<>
          <p className="eyebrow">What's It To Me?</p>
          <h1>Before you vote, see what it means for you.</h1>
          <p className="lede">In a few short steps: where you live, a little about you, and then the election, the candidates and what they've published, in the order it touches your life.</p>
          <ul className="js-promises"><li>No quiz, no score, no recommendation.</li><li>Every candidate gets the same page, in ballot-paper order.</li><li>We never ask who you support, and nothing you enter is sent to us.</li></ul>
        </>) : s === 1 ? (<>
          <p className="eyebrow">Your ballot</p>
          <h1>{d.ballot.place}</h1>
          <p className="lede">{d.ballot.council ? `${d.ballot.council} · ` : ""}{d.ballot.level === "parliamentary" ? "UK Parliament by-election" : "council by-election"} · {d.ballot.dateText}{d.ballot.days ? ` · in ${d.ballot.days} days` : " · today"}.</p>
          <p className="meta">In the real thing this step is where you'd type a postcode. This prototype starts from one election so the two versions can be compared like for like.</p>
        </>) : s === 2 ? (<>
          <p className="eyebrow">About you</p>
          <h1>A little about you, so the right things come first.</h1>
          <JourneyProfile household={d.household} qs={d.qs} extra={{ s: "2" }} />
        </>) : s === 3 ? (<>
          <p className="eyebrow">Your area</p>
          <h1>Where you live, and who speaks for it now.</h1>
          {map}
          {reps}
        </>) : s === 4 ? (<>
          <p className="eyebrow">The job</p>
          <h1>What you're actually voting for.</h1>
          <p className="lede">The most common confusion in politics is crediting or blaming someone for things their job doesn't control.</p>
          {office}
        </>) : s === 5 ? (<>
          <p className="eyebrow">What matters</p>
          <h1>{rel.length ? "The topics that touch your household, first." : "Ten topics. Pick any."}</h1>
          {rel.length ? <ul className="topic-first">{rel.map((t) => <li key={t.topic}><strong>{t.label}</strong> <span className="meta">— first {t.reason}</span></li>)}</ul> : null}
          <div className="stakes">{d.topics.map((t) => (
            <Link key={t.topic} href={`${base}/topic/${t.topic}${qq}`} className={`stake${t.n ? "" : " empty"}`}>
              <span className="stake-title">{t.short}</span>
              {t.reason ? <span className="meta stake-why">First {t.reason}</span> : null}
              <span className="stake-unit">{t.n ? "Published positions to compare" : "Nobody has published on this yet"}</span>
              <span className="stake-go">{t.n ? "Compare them →" : "See the topic →"}</span>
            </Link>))}</div>
        </>) : s === 6 ? (<>
          <p className="eyebrow">Candidates</p>
          <h1>Everyone asking for your vote.</h1>
          <p className="lede">{d.candidates.length} candidates, in ballot-paper order, the same page for each. Open one for their photo, their published positions and the sources.</p>
          <ol className="js-cands">{d.candidates.map((c) => (
            <li key={c.id}><Link href={`${base}/candidate/${c.id}${qq}`}><span className="n">{c.n}</span><span className="who"><strong>{c.name}</strong><span className="party"><span className="party-dot" style={{ background: c.colour ?? "var(--rule)" }} />{c.party}</span></span><span className="meta">{c.positions ? "Has published positions" : "Nothing published found"}</span></Link></li>
          ))}</ol>
        </>) : (<>
          <p className="eyebrow">Go deeper</p>
          <h1>The evidence, when you want it.</h1>
          <p className="lede">Every position here is quoted from a named source and linked to where it was published.</p>
          <ul className="js-links">
            <li><Link href={`${base}/compare${qq}`}>Compare candidates side by side, one topic at a time</Link></li>
            <li><Link href={`${base}${qq}`}>The full ballot page, everything in one place</Link></li>
            <li><Link href={`${base}/area${qq}`}>Your area in depth: planning, deprivation, council tax, history</Link></li>
            <li><Link href="/how-to-vote">How to vote: ID, postal, proxy, deadlines</Link></li>
          </ul>
        </>)}
      </div>
      <div className="js-actions">
        {s > 0 ? <button type="button" className="secondary" onClick={() => go(s - 1)}>Back</button> : <span />}
        {s < STEP_NAMES.length - 1 ? <button type="button" onClick={() => go(s + 1)}>{s === 0 ? "Start" : s === 2 ? (Object.keys(d.household).length ? "Next" : "Skip for now") : `Next: ${STEP_NAMES[s + 1]}`}</button> : <Link href={`${base}${qq}`} className="button">Open the full page</Link>}
        {s > 0 && s < 6 ? <button type="button" className="link" onClick={() => go(6)}>Skip to the candidates</button> : null}
      </div>
    </div>
  );
}

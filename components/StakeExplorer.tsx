"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readPersonal } from "@/lib/profile";
import { personalMatchers, type PersonalMatch } from "@/lib/personal";
import { partyVars } from "@/lib/partyColour";

// Round eight q6 (Romily, 29 Sept; agreed with Barny: no verdicts, more personal): "What's at stake", from your street to
// the world, with the topics that touch you first. Every party's own words, same template for each, parties in
// alphabetical order, nothing ranked or scored. Answers about the person (ethnicity, religion, sex, gender, orientation)
// are read from this browser only and change two things: Equality and rights comes first, and positions that mention
// the group chosen are gathered at the top, from every party that has any.
export type StakePosition = { id: number; scale: string; party: string; topic: string; quote: string; summary: string; source: string; url: string; published: string | null };
export type StakeTopic = { key: string; label: string; reason: string | null };
export type Scale = { key: string; title: string; intro: string; topics: string[]; who: string[]; whoLabel?: string; extra?: { text: string; href: string } };

const fmtDate = (d: string | null) => (d ? new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }) : "undated");

function Position({ p }: { p: StakePosition }) {
  return (
    <li className="sx-pos">
      <blockquote>&ldquo;{p.quote}&rdquo;</blockquote>
      <p className="meta">In short: {p.summary} <span className="sx-src">Source: {p.url ? <a href={p.url} rel="noopener">{p.source}</a> : p.source}, {fmtDate(p.published)}.</span></p>
    </li>
  );
}

function TopicBlock({ t, positions, parties, reason, colours }: { t: StakeTopic; positions: StakePosition[]; parties: string[]; reason: string | null; colours: Record<string, string | null> }) {
  const byParty = new Map<string, StakePosition[]>();
  for (const p of positions) byParty.set(p.party, [...(byParty.get(p.party) ?? []), p]);
  const withAny = parties.filter((x) => byParty.has(x));
  const none = parties.filter((x) => !byParty.has(x));
  return (
    <details className="sx-topic" open={Boolean(reason) || undefined}>
      <summary>
        <span className="sx-tname">{t.label}</span>
        {reason ? <span className="sx-why">First {reason}</span> : null}
        <span className="meta">{withAny.length ? (withAny.length === parties.length ? "Published by all of them" : "Published by some of them") : "Nothing published yet"}</span>
      </summary>
      <div className="sx-body">
        {withAny.map((party) => (
          <section key={party} className={`sx-party${colours[party] ? " party-scope" : ""}`} style={partyVars(colours[party])}>
            <h4><span className="party-swatch" aria-hidden />{party}</h4>
            <ul>{byParty.get(party)!.slice(0, 3).map((p) => <Position key={p.id} p={p} />)}</ul>
            {byParty.get(party)!.length > 3 ? <p className="meta"><Link href={`/positions?topic=${t.key}&q=${encodeURIComponent(party)}`}>More from {party} on this &rarr;</Link></p> : null}
          </section>
        ))}
        {none.length ? <p className="meta">Nothing found on this topic yet from: {none.join(", ")}.</p> : null}
        <p className="meta"><Link href={`/positions?topic=${t.key}`}>Every position on {t.label.toLowerCase()}, with the full sources &rarr;</Link></p>
      </div>
    </details>
  );
}

export default function StakeExplorer({ positions, topics, scales, parties, sourceNote, colours = {} }: { positions: StakePosition[]; topics: StakeTopic[]; scales: Scale[]; parties: string[]; sourceNote: string; colours?: Record<string, string | null> }) {
  const [matchers, setMatchers] = useState<PersonalMatch[]>([]);
  const [scale, setScale] = useState(scales[0]?.key ?? "");
  useEffect(() => {
    const load = () => setMatchers(personalMatchers(readPersonal()));
    load(); window.addEventListener("profile-changed", load);
    return () => window.removeEventListener("profile-changed", load);
  }, []);
  const personalReason = matchers.length ? `because you told us about your ${matchers.map((m) => m.key === "trans" || m.key === "sex" ? "sex and gender" : m.key === "orientation" ? "sexual orientation" : m.key === "ethnicity" ? "ethnic group" : m.key).filter((v, i, a) => a.indexOf(v) === i).join(", ")}` : null;
  const reasonFor = (k: string) => (k === "equality_and_rights" && personalReason ? personalReason : topics.find((t) => t.key === k)?.reason ?? null);
  const ordered = (keys: string[]) => {
    const rel = topics.filter((t) => keys.includes(t.key) && reasonFor(t.key));
    // Equality first when it has a personal reason; then the household's own order; then the rest in the fixed order.
    rel.sort((a, b) => (a.key === "equality_and_rights" && personalReason ? -1 : b.key === "equality_and_rights" && personalReason ? 1 : 0));
    const rest = topics.filter((t) => keys.includes(t.key) && !reasonFor(t.key));
    return [...rel, ...rest];
  };
  const national = useMemo(() => positions.filter((p) => p.scale !== "local"), [positions]);
  const mentions = useMemo(() => matchers.map((m) => ({ m, hits: national.filter((p) => m.re.test(p.quote)) })), [matchers, national]);
  const cur = scales.find((s) => s.key === scale) ?? scales[0];
  return (
    <div className="stake-x">
      {mentions.length ? (
        <section className="sx-mentions" aria-labelledby="sx-mentions-h">
          <h3 id="sx-mentions-h">What each party has said, in its own words</h3>
          <p className="meta">You told us: {mentions.map(({ m }) => m.answerText).join("; ")}. These are the positions whose own words mention {mentions.map(({ m }) => m.label).filter((v, i, a) => a.indexOf(v) === i).join(", or ")}, from every party that has one, in alphabetical order. We don&rsquo;t say whether any of them is good or bad for you: that is yours to judge. These answers never leave this browser. <Link href="/profile">Change or delete them</Link>.</p>
          {mentions.map(({ m, hits }) => {
            const byParty = new Map<string, StakePosition[]>();
            for (const p of hits) byParty.set(p.party, [...(byParty.get(p.party) ?? []), p]);
            const none = parties.filter((x) => !byParty.has(x));
            return (
              <div key={m.key} className="sx-mention">
                <h4>Mentions {m.label}</h4>
                {parties.filter((x) => byParty.has(x)).map((party) => (
                  <section key={party} className="sx-party"><h5>{party}</h5><ul>{byParty.get(party)!.map((p) => <Position key={p.id} p={p} />)}</ul></section>
                ))}
                {!hits.length ? <p className="meta">No party&rsquo;s published words mention this yet.</p> : none.length ? <p className="meta">Nothing found that mentions this from: {none.join(", ")}.</p> : null}
              </div>
            );
          })}
        </section>
      ) : null}

      <div className="area-zoom sx-scales" role="group" aria-label="Choose a scale">
        {scales.map((s) => <button key={s.key} type="button" aria-pressed={s.key === cur.key} className={s.key === cur.key ? "on" : ""} onClick={() => setScale(s.key)}>{s.title}</button>)}
      </div>
      <div className="sx-scale" aria-live="polite">
        <p>{cur.intro}{cur.extra ? <> <Link href={cur.extra.href}>{cur.extra.text} &rarr;</Link></> : null}</p>
        {cur.topics.length ? ordered(cur.topics).map((t) => <TopicBlock colours={colours} key={t.key} t={t} positions={positions.filter((p) => p.scale === cur.key && p.topic === t.key)} parties={cur.who} reason={reasonFor(t.key)} />) : null}
      </div>
      <p className="meta">{sourceNote}</p>
    </div>
  );
}

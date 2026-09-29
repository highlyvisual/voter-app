"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readPersonal } from "@/lib/profile";
import { PERSONAL_FIELDS, PERSONAL_KEYS, personalMatchers, tierHits, type PersonalKey } from "@/lib/personal";
import { partyVars } from "@/lib/partyColour";

// Round eight q6 (Romily, 29 Sept; agreed with Barny: no verdicts, more personal): "What's at stake", from your street to
// the world, with the topics that touch you first. Every party's own words, same template for each, parties in
// alphabetical order, nothing ranked or scored. Answers about the person (ethnicity, religion, sex, gender, orientation)
// are read from this browser only and change two things: Equality and rights comes first, and positions that mention
// the group chosen are gathered at the top, from every party that has any: first those whose words name that group, then
// those about the subject in general (Romily, 29 Sept). "Someone else's" lets you describe another person, just for this
// page, to see which parties' words name them; nothing about them is saved.
export type StakePosition = { id: number; scale: string; party: string; topic: string; quote: string; summary: string; source: string; url: string; published: string | null };
export type StakeTopic = { key: string; label: string; reason: string | null };
export type Scale = { key: string; title: string; intro: string; topics: string[]; who: string[]; whoLabel?: string; extra?: { text: string; href: string } };

const fmtDate = (d: string | null) => (d ? new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }) : "undated");

function Position({ p }: { p: StakePosition }) {
  return (
    <li className="sx-pos">
      <blockquote>&ldquo;{p.quote}&rdquo;</blockquote>
      <p className="meta">In short: {p.summary}</p>
      {/* Row 7 (Romily, 29 Sept): the source in one line; one tap opens the full link. */}
      <details className="evidence said-where">
        <summary><span className="sw-label">Sourced:</span> {p.source}, {fmtDate(p.published)}</summary>
        <p className="small sx-src">{p.url ? <a href={p.url} rel="noopener">{p.source}</a> : p.source}, published {fmtDate(p.published)}. {p.url ? <span className="sw-url">{p.url}</span> : null}</p>
      </details>
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

function PartyGroup({ items, parties, colours }: { items: StakePosition[]; parties: string[]; colours: Record<string, string | null> }) {
  const byParty = new Map<string, StakePosition[]>();
  // The same sentence can be filed twice (under two topics); show it once.
  for (const p of items) { const l = byParty.get(p.party) ?? []; if (!l.some((x) => x.quote === p.quote)) byParty.set(p.party, [...l, p]); }
  return (
    <>
      {parties.filter((x) => byParty.has(x)).map((party) => (
        <section key={party} className={`sx-party${colours[party] ? " party-scope" : ""}`} style={partyVars(colours[party])}>
          <h5><span className="party-swatch" aria-hidden />{party}</h5>
          <ul>{byParty.get(party)!.map((p) => <Position key={p.id} p={p} />)}</ul>
        </section>
      ))}
    </>
  );
}

const SUBJECT: Record<PersonalKey, string> = { ethnicity: "ethnic group", religion: "religion", sex: "sex and gender", trans: "sex and gender", orientation: "sexual orientation" };

export default function StakeExplorer({ positions, topics, scales, parties, sourceNote, colours = {} }: { positions: StakePosition[]; topics: StakeTopic[]; scales: Scale[]; parties: string[]; sourceNote: string; colours?: Record<string, string | null> }) {
  const [mine, setMine] = useState<Record<string, string> | null>(null);
  const [other, setOther] = useState<Record<string, string>>({});
  const [lens, setLens] = useState<"me" | "other">("me");
  const [scale, setScale] = useState(scales[0]?.key ?? "");
  useEffect(() => {
    const load = () => setMine(readPersonal());
    load(); window.addEventListener("profile-changed", load);
    return () => window.removeEventListener("profile-changed", load);
  }, []);
  const matchers = useMemo(() => personalMatchers(lens === "other" ? other : mine), [lens, other, mine]);
  const subjects = matchers.map((m) => SUBJECT[m.key]).filter((v, i, a) => a.indexOf(v) === i).join(", ");
  const personalReason = matchers.length ? (lens === "other" ? `for the person you described (${subjects})` : `because you told us about your ${subjects}`) : null;
  const reasonFor = (k: string) => (k === "equality_and_rights" && personalReason ? personalReason : topics.find((t) => t.key === k)?.reason ?? null);
  const ordered = (keys: string[]) => {
    const rel = topics.filter((t) => keys.includes(t.key) && reasonFor(t.key));
    // Equality first when it has a personal reason; then the household's own order; then the rest in the fixed order.
    rel.sort((a, b) => (a.key === "equality_and_rights" && personalReason ? -1 : b.key === "equality_and_rights" && personalReason ? 1 : 0));
    const rest = topics.filter((t) => keys.includes(t.key) && !reasonFor(t.key));
    return [...rel, ...rest];
  };
  const national = useMemo(() => positions.filter((p) => p.scale !== "local"), [positions]);
  const tiers = useMemo(() => matchers.map((m) => ({ m, ...tierHits(m, national) })), [matchers, national]);
  const cur = scales.find((s) => s.key === scale) ?? scales[0];
  const who = lens === "other" ? "them" : "you";
  return (
    <div className="stake-x">
      <section className="sx-lens" aria-labelledby="sx-lens-h">
        <h3 id="sx-lens-h">Whose point of view?</h3>
        <div className="scale-switch" role="group" aria-label="Whose point of view">
          <button type="button" aria-pressed={lens === "me"} className={lens === "me" ? "on" : undefined} onClick={() => setLens("me")}>Yours</button>
          <button type="button" aria-pressed={lens === "other"} className={lens === "other" ? "on" : undefined} onClick={() => setLens("other")}>Someone else&rsquo;s</button>
        </div>
        {lens === "me" && !mine ? (
          <p className="meta">You haven&rsquo;t answered the optional questions about you, so nothing below is picked out for you. <Link href="/profile#about-you">Answer them</Link>, or choose &ldquo;Someone else&rsquo;s&rdquo; to describe anyone you like.</p>
        ) : null}
        {lens === "other" ? (
          <div className="sx-other">
            <p className="meta">Describe a friend, a relative, or anyone at all, to see which parties&rsquo; own words name them. This is only for this page: nothing is saved, and your own answers don&rsquo;t change.</p>
            <div className="sx-other-grid">
              {PERSONAL_KEYS.map((k) => (
                <label key={k} className="sx-field">
                  <span>{PERSONAL_FIELDS[k].label.replace(/^Your /, "Their ").replace("you identify", "they identify").replace("your sex", "their sex")}</span>
                  <select value={other[k] ?? ""} onChange={(e) => setOther((o) => ({ ...o, [k]: e.target.value }))}>
                    <option value="">Not set</option>
                    {(PERSONAL_FIELDS[k].options as readonly (readonly [string, string])[]).map(([code, text]) => <option key={code} value={code}>{text}</option>)}
                  </select>
                </label>
              ))}
            </div>
            {Object.values(other).some(Boolean) ? <p><button type="button" className="secondary small" onClick={() => setOther({})}>Clear</button></p> : null}
          </div>
        ) : null}
      </section>

      {tiers.length ? (
        <section className="sx-mentions" aria-labelledby="sx-mentions-h" aria-live="polite">
          <h3 id="sx-mentions-h">What each party has said, in its own words</h3>
          <p className="meta">{lens === "other" ? "The person you described: " : "You told us: "}{tiers.map(({ m }) => m.answerText).join("; ")}. First, positions whose own words name {who === "you" ? "your" : "their"} group; then those on the same subject that don&rsquo;t. Parties in alphabetical order. This is matched on the words used, so it can&rsquo;t tell whether a position would help or harm anyone: that is yours to judge. {lens === "me" ? <>These answers never leave this browser. <Link href="/profile#about-you">Change or delete them</Link>.</> : null}</p>
          {tiers.map(({ m, named, general }) => (
            <div key={m.key} className="sx-mention">
              {m.names ? (
                <>
                  <h4><span className="sx-tier named">Names {who === "you" ? "your" : "their"} group</span> {m.names.label}</h4>
                  {named.length ? <PartyGroup items={named} parties={parties} colours={colours} /> : <p className="meta">No party&rsquo;s published words name {m.names.label} yet.</p>}
                </>
              ) : null}
              <h4><span className="sx-tier">{m.names ? "Same subject, not naming the group" : "On the subject"}</span> {m.about.label}</h4>
              {general.length ? <PartyGroup items={general} parties={parties} colours={colours} /> : <p className="meta">Nothing else found on {m.about.label}.</p>}
            </div>
          ))}
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

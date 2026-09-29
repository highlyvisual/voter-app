"use client";
import { useEffect, useMemo, useState } from "react";
import { longDate } from "@/lib/dates";
import { index, matches, queryTokens, suggest, normalise, stem } from "@/lib/search";
import ViewMode from "@/components/ViewMode";
import { partyFill, partyVars } from "@/lib/partyColour";

export type Row = {
  id: number; who: string; whoKind: "candidate" | "party"; party: string; sortKey: string; ballot: string; candidateId: number | null;
  topic: string; topicShort: string; topicKey: string; layer: string; layerKey: string; precision: string; claim: string; quote: string;
  source: string; publisher: string; url: string; published: string | null; urlArchived: boolean; archive: string | null; applies: string | null; record: boolean;
  colour: string | null; // the party's own colour, for its own candidates and material only
};
export type Election = { id: string; name: string; date: string | null; upcoming: boolean };
type TopicOpt = { key: string; label: string; short: string };

// What each kind of source is, in plain words, shown beside the filter. The same kinds as the grey chips on every card.
const KIND_HELP: Record<string, string> = {
  candidate_statement: "Something the candidate published themselves, such as their statement to voters.",
  manifesto: "The party's own published programme or policy paper.",
  campaign_leaflet: "A leaflet the campaign delivered.",
  enacted_record: "An official record of what was done, such as a vote or a government document.",
  third_party_analysis: "Someone else's report of what was said, such as a news agency.",
};
const KIND_ORDER = ["candidate_statement", "manifesto", "campaign_leaflet", "enacted_record", "third_party_analysis"];
const PAGE = 60;

// Explore every position: choose an election and a topic with large buttons, or search. No counts on the buttons
// (Romily, round eight q9: "I don't like the numbers - they are confusing"). Results are grouped by election,
// then by who said it, in ballot-paper order. The filter state lives in the address, so a view can be shared or bookmarked.
export default function PositionsExplorer({ rows, elections, topics, initial }: { rows: Row[]; elections: Election[]; topics: TopicOpt[]; initial: { election: string; topic: string; q: string; kind: string; past: boolean } }) {
  const known = new Set(elections.map((e) => e.id));
  const [el, setEl] = useState(known.has(initial.election) ? initial.election : "");
  const [tp, setTp] = useState(initial.topic);
  const [q, setQ] = useState(initial.q);
  const [kind, setKind] = useState(KIND_HELP[initial.kind] ? initial.kind : "");
  const [past, setPast] = useState(initial.past || Boolean(initial.election && elections.find((e) => e.id === initial.election && !e.upcoming)));
  const [show, setShow] = useState(PAGE);
  const reset = () => setShow(PAGE);

  // Keep the address in step with the filters (replace, not push, so Back leaves the page rather than undoing a click).
  useEffect(() => {
    const p = new URLSearchParams();
    if (el) p.set("election", el);
    if (tp) p.set("topic", tp);
    if (q.trim()) p.set("q", q.trim());
    if (kind) p.set("kind", kind);
    if (past) p.set("past", "1");
    const s = p.toString();
    window.history.replaceState(null, "", s ? `?${s}` : window.location.pathname);
  }, [el, tp, q, kind, past]);

  const upcoming = useMemo(() => new Set(elections.filter((e) => e.upcoming).map((e) => e.id)), [elections]);
  const inScope = (r: Row) => (el ? r.ballot === el : past || upcoming.has(r.ballot));
  const indexed = useMemo(() => rows.map((r) => ({ r, h: index(`${r.who} ${r.party} ${r.claim} ${r.quote} ${r.source} ${r.publisher} ${r.topic} ${r.layer}`) })), [rows]);
  const vocabulary = useMemo(() => { const v = new Set<string>(); for (const { h } of indexed) for (const w of h.words) v.add(w); return v; }, [indexed]);
  const tokens = useMemo(() => queryTokens(q), [q]);
  // Everything except the topic, so each topic button can say how many positions it would show.
  const base = useMemo(() => indexed.filter(({ r, h }) => inScope(r) && (!kind || r.layerKey === kind) && matches(tokens, h)).map(({ r }) => r), // eslint-disable-next-line react-hooks/exhaustive-deps
    [indexed, tokens, el, kind, past, upcoming]);
  const filtered = useMemo(() => (tp ? base.filter((r) => r.topicKey === tp) : base), [base, tp]);
  const topicCount = useMemo(() => { const m = new Map<string, number>(); for (const r of base) m.set(r.topicKey, (m.get(r.topicKey) ?? 0) + 1); return m; }, [base]);
  const kindsPresent = useMemo(() => KIND_ORDER.filter((k) => rows.some((r) => r.layerKey === k)), [rows]);
  const suggestions = useMemo(() => (q.trim() && filtered.length === 0 ? [...new Set(tokens.flatMap((t) => suggest(t, vocabulary)))].slice(0, 4) : []), [q, filtered.length, tokens, vocabulary]);

  // Group: election (in the list's order), then who said it (ballot-paper order), then the positions.
  const groups = useMemo(() => {
    const order = new Map(elections.map((e, i) => [e.id, i]));
    const sorted = [...filtered].sort((a, b) => (order.get(a.ballot) ?? 999) - (order.get(b.ballot) ?? 999) || a.sortKey.localeCompare(b.sortKey, "en-GB") || a.topic.localeCompare(b.topic));
    const out: { election: Election; people: { key: string; who: string; party: string; kind: Row["whoKind"]; candidateId: number | null; colour: string | null; rows: Row[] }[] }[] = [];
    let shown = 0;
    for (const r of sorted) {
      if (shown >= show) break;
      shown++;
      let g = out[out.length - 1];
      if (!g || g.election.id !== r.ballot) { g = { election: elections.find((e) => e.id === r.ballot) ?? { id: r.ballot, name: r.ballot, date: null, upcoming: false }, people: [] }; out.push(g); }
      const key = `${r.whoKind}:${r.candidateId ?? r.who}`;
      let p = g.people[g.people.length - 1];
      if (!p || p.key !== key) { p = { key, who: r.who, party: r.party, kind: r.whoKind, candidateId: r.candidateId, colour: r.colour, rows: [] }; g.people.push(p); }
      p.rows.push(r);
    }
    return out;
  }, [filtered, elections, show]);

  const mark = (text: string) => {
    if (!tokens.length) return text;
    return text.split(/(\s+)/).map((w, i) => {
      const bare = normalise(w);
      const hit = bare && tokens.some((t) => { const sw = stem(bare); return sw === t || sw.startsWith(t) || t.startsWith(sw); });
      return hit ? <mark key={i}>{w}</mark> : w;
    });
  };
  const elName = el ? elections.find((e) => e.id === el)?.name : null;
  const tpName = tp ? topics.find((t) => t.key === tp)?.label : null;
  const summary = [elName ?? (past ? "all elections, including past ones" : "elections coming up"), tpName, kind ? KIND_LABEL(kind, rows) : null, q.trim() ? `“${q.trim()}”` : null].filter(Boolean).join(" · ");
  const anyFilter = Boolean(el || tp || q || kind || past);
  const clearAll = () => { setEl(""); setTp(""); setQ(""); setKind(""); setPast(false); reset(); };
  const pastCount = elections.filter((e) => !e.upcoming).length;

  return (
    <div className="explorer">
      <a className="skip-results" href="#results">Skip to the results</a>
      <form className="explorer-controls" role="search" aria-label="Find positions" onSubmit={(e) => e.preventDefault()}>
        <fieldset>
          <legend>1. Which election?</legend>
          <label htmlFor="px-election" className="sr-only">Election</label>
          <select id="px-election" value={el} onChange={(e) => { setEl(e.target.value); reset(); }}>
            <option value="">{past ? "All elections" : "All elections coming up"}</option>
            <optgroup label="Coming up">
              {elections.filter((e) => e.upcoming).map((e) => <option key={e.id} value={e.id}>{e.name}{e.date ? ` (${longDate(e.date)})` : ""}</option>)}
            </optgroup>
            {past || (el && !upcoming.has(el)) ? (
              <optgroup label="Past">
                {elections.filter((e) => !e.upcoming).map((e) => <option key={e.id} value={e.id}>{e.name}{e.date ? ` (${longDate(e.date)})` : ""}</option>)}
              </optgroup>
            ) : null}
          </select>
          {pastCount ? (
            <label className="check">
              <input type="checkbox" checked={past} onChange={(e) => { setPast(e.target.checked); if (!e.target.checked && el && !upcoming.has(el)) setEl(""); reset(); }} />
              Include past elections ({pastCount})
            </label>
          ) : null}
        </fieldset>

        <fieldset>
          <legend>2. Which topic?</legend>
          <div className="topic-buttons">
            <button type="button" className={`topic-btn${tp ? "" : " on"}`} aria-pressed={!tp} onClick={() => { setTp(""); reset(); }}>
              All topics
            </button>
            {topics.map((t) => {
              const n = topicCount.get(t.key) ?? 0;
              return (
                <button key={t.key} type="button" className={`topic-btn${tp === t.key ? " on" : ""}`} aria-pressed={tp === t.key} disabled={n === 0 && tp !== t.key}
                  onClick={() => { setTp(tp === t.key ? "" : t.key); reset(); }} title={t.label}>
                  {t.short}
                </button>
              );
            })}
          </div>
          <p className="meta hint">A dashed, greyed-out topic has nothing published for your other choices.</p>
        </fieldset>

        <div className="px-search">
          <label htmlFor="px-q" className="px-step">3. Or search for a word</label>
          <input id="px-q" type="search" value={q} onChange={(e) => { setQ(e.target.value); reset(); }} placeholder="e.g. rent, bins, NHS, pylons" autoComplete="off" />
        </div>

        <details className="more-options">
          <summary>More options: kind of source, and how to show each position</summary>
          <fieldset>
            <legend>Kind of source</legend>
            <div className="kind-options">
              <label className="kind"><input type="radio" name="px-kind" checked={!kind} onChange={() => { setKind(""); reset(); }} /> <span><b>Any</b></span></label>
              {kindsPresent.map((k) => (
                <label key={k} className="kind">
                  <input type="radio" name="px-kind" checked={kind === k} onChange={() => { setKind(k); reset(); }} />
                  <span><b>{KIND_LABEL(k, rows)}</b><span className="meta"> {KIND_HELP[k]}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="viewmode-row"><span className="meta">Show each position as</span> <ViewMode /></div>
        </details>
      </form>

      <div className="explorer-status" aria-live="polite">
        <p><b>{filtered.length} {filtered.length === 1 ? "position" : "positions"}</b>{summary ? <> · {summary}</> : null}</p>
        <span className="status-actions">
          {filtered.length ? <a className="button secondary small" href="#results">See them</a> : null}
          {anyFilter ? <button type="button" className="secondary small" onClick={clearAll}>Clear all choices</button> : null}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="deadend">
          <p style={{ margin: 0 }}><strong>Nothing found{q.trim() ? <> for &ldquo;{q.trim()}&rdquo;</> : null}.</strong> That may mean nobody has published on it, rather than that it doesn&rsquo;t matter.</p>
          {suggestions.length ? <p style={{ margin: "0.4rem 0 0" }}>Did you mean: {suggestions.map((s, i) => <span key={s}>{i ? " · " : ""}<button type="button" className="secondary small" onClick={() => setQ(s)}>{s}</button></span>)}</p> : null}
          {!past && pastCount ? <p style={{ margin: "0.4rem 0 0" }}><button type="button" className="secondary small" onClick={() => setPast(true)}>Look in past elections too</button></p> : null}
          <p style={{ margin: "0.4rem 0 0" }}><button type="button" onClick={clearAll}>Clear all choices</button></p>
        </div>
      ) : null}

      <div id="results" tabIndex={-1}>
        {groups.map((g) => (
          <section key={g.election.id} className="px-election" aria-labelledby={`px-${g.election.id}`}>
            <h2 id={`px-${g.election.id}`}>{g.election.name}</h2>
            <p className="meta px-election-meta">
              {g.election.date ? <>{g.election.upcoming ? "Polling day" : "Held on"} {longDate(g.election.date)} · </> : null}
              <a href={`/ballot/${encodeURIComponent(g.election.id)}`}>The ballot page</a> · <a href={`/ballot/${encodeURIComponent(g.election.id)}/compare`}>Compare everyone side by side</a>
            </p>
            {g.people.map((p) => (
              <div key={p.key} className={`px-person${p.colour ? " party-scope" : ""}`} style={partyVars(p.colour)}>
                <h3>
                  {p.kind === "candidate" ? <a href={`/ballot/${encodeURIComponent(g.election.id)}${p.candidateId ? `#c-${p.candidateId}` : ""}`}>{p.who}</a> : p.who}
                  {p.party ? <> <span className={`px-party${p.colour ? " party-pill filled" : ""}`} style={partyFill(p.colour)}>{p.party}</span></> : null}
                  {p.kind === "party" ? <span className="px-party"> (the party&rsquo;s own material)</span> : null}
                </h3>
                <ul className="px-list">
                  {p.rows.map((r) => (
                    <li key={r.id} className="px-card">
                      <p className="px-tags"><span className="chip none">{r.topicShort}</span> <span className="chip none">{r.layer}</span>{r.precision === "aspiration" ? <> <span className="chip none">Stated aim</span></> : null}</p>
                      <p className="layer-label not-verbatim">{r.record ? "What the record shows" : "What they say"}</p>
                      <p className="summary not-verbatim">{mark(r.claim)}</p>
                      <p className="layer-label only-verbatim">In their exact words</p>
                      <blockquote className="quote only-verbatim">{mark(r.quote)}</blockquote>
                      {r.applies ? <><p className="layer-label">What this could mean for you</p><p className="small for-you">This would apply to you if: {r.applies}.</p></> : null}
                      {/* Opened while searching, so a match inside the quotation is visible. */}
                      <details className="evidence" open={tokens.length > 0}>
                        <summary>See the exact words and source</summary>
                        <blockquote className="quote not-verbatim">{mark(r.quote)}</blockquote>
                        <p className="small" style={{ margin: "0.3rem 0 0" }}><a href={r.url} rel="noopener">{r.source}</a>{r.urlArchived ? " (archived copy: the original page no longer loads)" : ""}, {r.publisher}{r.published ? `, published ${longDate(r.published)}` : ""}.{r.archive ? <> <a href={r.archive} rel="noopener">Archived copy</a>.</> : null}</p>
                      </details>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
      {filtered.length > show ? <p><button type="button" onClick={() => setShow((s) => s + PAGE)}>Show more ({filtered.length - show} left)</button></p> : null}
    </div>
  );
}

function KIND_LABEL(k: string, rows: Row[]): string {
  return rows.find((r) => r.layerKey === k)?.layer ?? k;
}

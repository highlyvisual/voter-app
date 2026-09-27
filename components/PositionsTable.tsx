"use client";
import { useMemo, useState } from "react";
import { longDate } from "@/lib/dates";
import { index, matches, queryTokens, suggest, normalise, stem } from "@/lib/search";

export type Row = { id: number; who: string; party: string; election: string; ballot: string; candidateId: number | null; topic: string; topicKey: string; layer: string; precision: string; claim: string; quote: string; source: string; publisher: string; url: string; published: string | null; urlArchived: boolean; archive: string | null; applies: string | null; record: boolean };

// Search and filter over every position. Two columns on a phone (label, then the claim), a table on a wide screen.
export default function PositionsTable({ rows, elections, topics, layers }: { rows: Row[]; elections: string[]; topics: string[]; layers: string[] }) {
  const [q, setQ] = useState(""); const [el, setEl] = useState(""); const [tp, setTp] = useState(""); const [ly, setLy] = useState(""); const [show, setShow] = useState(50);
  // Index every row once: the search then understands word forms, hyphens, synonyms and a single typo.
  const indexed = useMemo(() => rows.map((r) => ({ r, h: index(`${r.who} ${r.party} ${r.election} ${r.claim} ${r.quote} ${r.source} ${r.publisher} ${r.topic} ${r.layer}`) })), [rows]);
  const vocabulary = useMemo(() => { const v = new Set<string>(); for (const { h } of indexed) for (const w of h.words) v.add(w); return v; }, [indexed]);
  const tokens = useMemo(() => queryTokens(q), [q]);
  const filtered = useMemo(() => indexed.filter(({ r, h }) => (!el || r.election === el) && (!tp || r.topic === tp) && (!ly || r.layer === ly) && matches(tokens, h)).map(({ r }) => r), [indexed, tokens, el, tp, ly]);
  const suggestions = useMemo(() => (q.trim() && filtered.length === 0 ? [...new Set(tokens.flatMap((t) => suggest(t, vocabulary)))].slice(0, 4) : []), [q, filtered.length, tokens, vocabulary]);
  const mark = (text: string) => {
    if (!tokens.length) return text;
    const words = text.split(/(\s+)/);
    return words.map((w, i) => {
      const bare = normalise(w);
      const isHit = bare && tokens.some((t) => { const sw = stem(bare); return sw === t || sw.startsWith(t) || t.startsWith(sw); });
      return isHit ? <mark key={i}>{w}</mark> : w;
    });
  };
  const visible = filtered.slice(0, show);
  return (
    <>
      <div className="positions-controls">
        <label htmlFor="pq" className="meta">Search every quotation and summary</label>
        <input id="pq" type="search" value={q} onChange={(e) => { setQ(e.target.value); setShow(50); }} placeholder="e.g. rent, police, VAT, pylons" />
        <div className="row">
          <label className="meta">Election<select value={el} onChange={(e) => { setEl(e.target.value); setShow(50); }}><option value="">All</option>{elections.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="meta">Topic<select value={tp} onChange={(e) => { setTp(e.target.value); setShow(50); }}><option value="">All</option>{topics.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="meta">Kind of source<select value={ly} onChange={(e) => { setLy(e.target.value); setShow(50); }}><option value="">All</option>{layers.map((x) => <option key={x}>{x}</option>)}</select></label>
          {(q || el || tp || ly) ? <button type="button" className="secondary" onClick={() => { setQ(""); setEl(""); setTp(""); setLy(""); }}>Clear</button> : null}
        </div>
        <p className="meta" aria-live="polite"><span className="result-count">{filtered.length} of {rows.length} positions</span>{filtered.length > visible.length ? `, showing the first ${visible.length}` : ""}. {q.trim() && filtered.length > 0 ? "Word forms, hyphens and everyday synonyms are matched, so \u201crenting\u201d finds \u201crenters\u201d and \u201cdoctor\u201d finds \u201cGP\u201d." : ""}</p>
        {q.trim() && filtered.length === 0 ? (
          <div className="deadend">
            <p style={{ margin: 0 }}><strong>Nothing found for “{q.trim()}”.</strong> That may mean nobody has published on it, rather than that it does not matter.</p>
            {suggestions.length ? <p style={{ margin: "0.4rem 0 0" }}>Did you mean: {suggestions.map((sug, i) => <span key={sug}>{i ? " · " : ""}<button type="button" className="secondary small" onClick={() => setQ(sug)}>{sug}</button></span>)}</p> : null}
            <p style={{ margin: "0.4rem 0 0" }}><button type="button" onClick={() => { setQ(""); setEl(""); setTp(""); setLy(""); }}>Clear and show all {rows.length}</button></p>
          </div>
        ) : null}
      </div>
      <ol className="positions">
        {visible.map((r) => (
          <li key={r.id} className="position">
            <div className="pos-meta">
              <a href={`/ballot/${encodeURIComponent(r.ballot)}${r.candidateId ? `#c-${r.candidateId}` : ""}`}><strong>{r.who}</strong></a>
              {r.party ? <span className="meta"> {r.party}</span> : null}
              <span className="meta">{r.election}</span>
              <span className="chip none">{r.topic}</span>
              <span className="chip none">{r.layer}</span>
              {r.precision === "aspiration" ? <span className="chip none">Stated aim</span> : null}
            </div>
            <div className="pos-body">
              <p className="layer-label not-verbatim">{r.record ? "What the record shows" : "What they say"}</p>
              <p className="summary say not-verbatim">{mark(r.claim)}</p>
              <p className="layer-label only-verbatim">In their exact words</p>
              <blockquote className="quote only-verbatim">{mark(r.quote)}</blockquote>
              {r.applies ? <><p className="layer-label">What this could mean for you</p><p className="small for-you">This would apply to you if: {r.applies}.</p></> : null}
              {/* Opened automatically while searching, so a match inside the quotation is visible. */}
              <details className="evidence" open={tokens.length > 0}>
                <summary>See the exact words and source</summary>
                <blockquote className="quote not-verbatim">{mark(r.quote)}</blockquote>
                <p className="small" style={{ margin: "0.3rem 0 0" }}><a href={r.url} rel="noopener">{r.source}</a>{r.urlArchived ? " (archived copy: the original page no longer loads)" : ""}, {r.publisher}{r.published ? `, published ${longDate(r.published)}` : ""}.{r.archive ? <> <a href={r.archive} rel="noopener">Archived copy</a>.</> : null}</p>
              </details>
            </div>
          </li>
        ))}
      </ol>
      {filtered.length > visible.length ? <p><button type="button" onClick={() => setShow((s) => s + 100)}>Show 100 more</button></p> : null}
    </>
  );
}

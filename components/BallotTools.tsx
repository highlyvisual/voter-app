"use client";
import { useEffect, useMemo, useState } from "react";
import { TOPICS } from "@/lib/data";
import { index, matches, queryTokens } from "@/lib/search";

// Explore controls for a ballot: filter by topic, search every quotation, see the effect of each choice as a count
// before committing (Shneiderman's dynamic queries: the result set updates within 100ms, so filtering is exploration,
// not a series of decisions). State is reflected in the URL so any view can be shared. Hiding is always described as
// a view, never a judgement, and every empty result offers the way back.
export default function BallotTools({ counts, total }: { counts: Record<number, Record<string, number>>; total: number }) {
  const [topic, setTopic] = useState("");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(total);

  // restore from the URL on first paint, so a shared link opens the same view
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("topic") ?? ""; const s = p.get("q") ?? "";
    if (t) setTopic(t); if (s) setQ(s);
  }, []);

  useEffect(() => {
    const term = q.trim().toLowerCase();
    const tokens = queryTokens(q);
    let visible = 0;
    document.querySelectorAll<HTMLDetailsElement>("details.candidate").forEach((el) => {
      const id = Number(el.id.replace("c-", ""));
      const topicOk = !topic || (counts[id]?.[topic] ?? 0) > 0;
      let textOk = true;
      if (term) {
        let any = false;
        el.querySelectorAll<HTMLElement>(".claim").forEach((cl) => {
          const hit = matches(tokens, index(cl.textContent ?? ""));
          cl.style.display = hit ? "" : "none"; cl.classList.toggle("hit", hit); if (hit) any = true;
        });
        el.querySelectorAll<HTMLElement>(".topic").forEach((t) => { t.style.display = t.querySelector(".claim.hit") ? "" : "none"; });
        textOk = any; if (any) el.open = true;
      } else {
        el.querySelectorAll<HTMLElement>(".claim").forEach((cl) => { cl.style.display = ""; cl.classList.remove("hit"); });
        el.querySelectorAll<HTMLElement>(".topic").forEach((t) => { t.style.display = ""; });
      }
      const show = topicOk && textOk;
      el.style.display = show ? "" : "none";
      if (show) visible++;
    });
    setShown(visible);
    const p = new URLSearchParams(window.location.search);
    topic ? p.set("topic", topic) : p.delete("topic");
    q.trim() ? p.set("q", q.trim()) : p.delete("q");
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}${window.location.hash}` : window.location.pathname + window.location.hash);
  }, [topic, q, counts]);

  const label = useMemo(() => Object.fromEntries(TOPICS), []);
  const filtered = Boolean(topic || q.trim());
  const clear = () => { setTopic(""); setQ(""); };

  return (
    <div className="ballot-tools">
      <div className="row">
        <label className="meta" htmlFor="bt-topic">Topic<select id="bt-topic" value={topic} onChange={(e) => setTopic(e.target.value)}><option value="">All ten</option>{TOPICS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label className="meta" htmlFor="bt-q">Search every position on this ballot<input id="bt-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. rent, GP, police, pylons" /></label>
      </div>
      {filtered ? (
        <div className="filter-chips">
          {topic ? <span className="filter-chip">{label[topic]}<button type="button" aria-label={`Remove the ${label[topic]} filter`} onClick={() => setTopic("")}>×</button></span> : null}
          {q.trim() ? <span className="filter-chip">“{q.trim()}”<button type="button" aria-label="Clear the search" onClick={() => setQ("")}>×</button></span> : null}
          <button type="button" className="secondary small" onClick={clear}>Show all {total}</button>
        </div>
      ) : null}
      <p className="meta" aria-live="polite"><span className="result-count">Showing {shown} of {total} {total === 1 ? "candidate" : "candidates"}.</span> {filtered ? `${total - shown} hidden by your filters — hiding is a view, not a judgement; everyone remains on the ballot paper.` : "Everyone on the ballot, in ballot-paper order."}</p>
      {filtered && shown === 0 ? (
        <div className="deadend">
          <p style={{ margin: 0 }}><strong>Nothing matches that here.</strong> That may mean no candidate has published on it, rather than that it does not matter.</p>
          <p style={{ margin: "0.4rem 0 0" }}><button type="button" onClick={clear}>Show all {total} candidates</button></p>
        </div>
      ) : null}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { TOPICS } from "@/lib/data";
// WP-A13: which topics to see first. Reorders topic sections via CSS order on every candidate card; never feeds a computation. localStorage only.
export default function TopicOrder() {
  const [first, setFirst] = useState<string[]>([]);
  useEffect(() => { try { setFirst(JSON.parse(localStorage.getItem("topicsFirst") ?? "[]")); } catch {} }, []);
  useEffect(() => {
    try { localStorage.setItem("topicsFirst", JSON.stringify(first)); } catch {}
    document.querySelectorAll<HTMLElement>(".topic[data-topic]").forEach((el) => { const i = first.indexOf(el.dataset.topic ?? ""); el.style.order = i >= 0 ? String(i - 100) : "0"; });
  }, [first]);
  const toggle = (k: string) => setFirst((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]));
  return (
    <details className="household" style={{ marginTop: "0.75rem" }}>
      <summary><span className="summary-line"><b>Which topics do you want to see first?</b>{first.length ? ` ${first.length} chosen.` : " Optional."}</span><span className="change">Choose</span></summary>
      <div className="pills" style={{ marginTop: "0.6rem" }}>{TOPICS.map(([k, l]) => <label key={k} className={`pill${first.includes(k) ? " on" : ""}`}><input type="checkbox" checked={first.includes(k)} onChange={() => toggle(k)} />{l}</label>)}</div>
      <p className="meta" style={{ margin: "0.5rem 0 0" }}>Changes only the order of topic sections on this page. It never changes what is shown, who is shown, or any figure.</p>
    </details>
  );
}

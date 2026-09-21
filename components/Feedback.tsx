"use client";
import { useState } from "react";
import { sendFeedback } from "@/app/feedback/actions";

export default function Feedback({ ballot }: { ballot: string }) {
  const [sent, setSent] = useState(false);
  const [found, setFound] = useState(""); const [likely, setLikely] = useState("");
  const key = typeof window !== "undefined" ? (sessionStorage.getItem("fk") ?? (() => { const k = Math.random().toString(36).slice(2); sessionStorage.setItem("fk", k); return k; })()) : "";
  if (sent) return <p className="meta">Thank you. Counts are published at <a href="/about/impact">/about/impact</a>; nothing else is kept.</p>;
  return (
    <form className="feedback" action={async (fd) => { await sendFeedback(fd); setSent(true); }}>
      <input type="hidden" name="ballot" value={ballot} /><input type="hidden" name="k" value={key} />
      <p className="small" style={{ margin: "0 0 0.3rem" }}><strong>Did you find what you were looking for?</strong></p>
      <div className="pills">{[["yes", "Yes"], ["no", "No"]].map(([v, l]) => <label key={v} className={`pill${found === v ? " on" : ""}`}><input type="radio" name="found" value={v} checked={found === v} onChange={() => setFound(v)} />{l}</label>)}</div>
      <p className="small" style={{ margin: "0.6rem 0 0.3rem" }}><strong>Has this changed how likely you are to vote?</strong></p>
      <div className="pills">{[["more", "More likely"], ["less", "Less likely"], ["same", "No difference"]].map(([v, l]) => <label key={v} className={`pill${likely === v ? " on" : ""}`}><input type="radio" name="likely" value={v} checked={likely === v} onChange={() => setLikely(v)} />{l}</label>)}</div>
      <textarea name="comment" maxLength={500} placeholder="Optional comment (kept without any identifier)" style={{ width: "100%", minHeight: "3rem", marginTop: "0.6rem" }} />
      <div className="actions"><button type="submit" disabled={!found && !likely}>Send</button><span className="meta">Anonymous daily counts per election, nothing else.</span></div>
    </form>
  );
}

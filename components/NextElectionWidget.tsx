"use client";
import { useEffect, useRef, useState } from "react";
import type { EmbedResult } from "@/app/api/embed/next-election/route";

// The "Your next election" box for other sites (Romily, round ten, q8: local news, schools, charities, councils).
// The postcode goes to our own lookup in a POST body and is not kept anywhere, not even in this browser. No cookies,
// no storage, no tracking. Links open whatsittome.org in a new tab.
const SITE = "https://whatsittome.org";
const togo = (n: number) => (n === 0 ? "Polling day is today" : n === 1 ? "Tomorrow" : `${n} days to go`);

export default function NextElectionWidget() {
  const [postcode, setPostcode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<EmbedResult | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const live = useRef<HTMLDivElement>(null);

  // Tells the page around the box how tall it is, so the optional resizing snippet can fit the frame. Only a number is
  // sent, never the postcode or the results.
  useEffect(() => {
    const el = box.current;
    if (window.parent === window || !el || typeof ResizeObserver === "undefined") return;
    // The box's own height, not the page's: the page is never shorter than the frame, so it could only ever grow.
    const send = () => window.parent.postMessage({ whatsittome: "next-election", height: Math.ceil(el.getBoundingClientRect().height) }, "*");
    const ro = new ResizeObserver(send);
    ro.observe(el);
    send();
    return () => ro.disconnect();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/embed/next-election", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postcode }), cache: "no-store" });
      setResult(r.ok ? ((await r.json()) as EmbedResult) : { status: "unavailable" });
    } catch {
      setResult({ status: "unavailable" });
    } finally {
      setBusy(false);
      live.current?.focus();
    }
  }

  const invalid = result?.status === "invalid";
  return (
    <div className="ne-box" ref={box}>
      <h1 className="ne-title">Your next election</h1>
      <form className="ne-form" onSubmit={submit} noValidate>
        <label htmlFor="ne-postcode">Your postcode</label>
        <div className="ne-row">
          <input
            id="ne-postcode" name="postcode" type="text" autoComplete="postal-code" autoCapitalize="characters" spellCheck={false}
            enterKeyHint="search" placeholder="e.g. WC1H 9JE" required value={postcode} maxLength={10}
            aria-invalid={invalid || undefined} aria-describedby={invalid ? "ne-error" : undefined}
            onChange={(e) => setPostcode(e.target.value)}
          />
          <button type="submit" disabled={busy}>{busy ? "Looking…" : "Look up"}</button>
        </div>
      </form>
      <noscript><p className="ne-note"><a href={`${SITE}/`} target="_blank" rel="noopener">Look up your postcode on whatsittome.org</a></p></noscript>

      <div className="ne-result" ref={live} tabIndex={-1} aria-live="polite">
        {result?.status === "invalid" ? <p id="ne-error" className="ne-error">{result.message}</p> : null}
        {result?.status === "unavailable" ? (
          <p className="ne-note">We couldn&rsquo;t look that up just now. <a href={`${SITE}/`} target="_blank" rel="noopener">Try on whatsittome.org</a></p>
        ) : null}
        {result?.status === "none" ? (
          <p className="ne-note">No elections are scheduled for that postcode yet. <a href={`${SITE}/next`} target="_blank" rel="noopener">See what&rsquo;s coming up across the UK</a></p>
        ) : null}
        {result?.status === "ok" ? (
          <>
            <ul className="ne-list">
              {result.elections.map((e) => (
                <li key={e.href + e.name + e.place}>
                  <a href={e.href} target="_blank" rel="noopener">
                    <span className="ne-name">{e.name}</span>
                    <span className="ne-place">{e.place}</span>
                    <span className="ne-date"><time dateTime={e.date}>{e.dateLabel}</time> · <strong>{togo(e.daysToGo)}</strong></span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="ne-note"><a href="https://www.gov.uk/how-to-vote" target="_blank" rel="noopener">Who can vote and how: GOV.UK</a></p>
          </>
        ) : null}
      </div>

      <p className="ne-foot">
        <a href={`${SITE}/`} target="_blank" rel="noopener">What&rsquo;s It To Me?</a> · Independent. No rankings, no recommendations. · Election data:{" "}
        <a href="https://democracyclub.org.uk/" target="_blank" rel="noopener">Democracy Club</a> (CC BY 4.0)
      </p>
    </div>
  );
}

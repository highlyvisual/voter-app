"use client";
import { useEffect, useRef, useState } from "react";
// A slow horizontal ticker of facts about the site, paused on hover or focus and static under reduced motion.
// Facts only — counts, dates, the rules — never a claim about anyone standing.
export default function Ticker({ items }: { items: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) el.classList.add("still");
  }, []);
  const line = items.join("   ·   ");
  return (
    <div className={`ticker${paused ? " still" : ""}`} ref={ref} aria-label="What is on the site right now">
      <button type="button" className="ticker-pause" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>{paused ? "Play" : "Pause"}</button>
      <div className="ticker-track">
        <span>{line}   ·   </span><span aria-hidden>{line}   ·   </span>
      </div>
    </div>
  );
}

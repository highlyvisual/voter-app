"use client";
import { useState } from "react";
import { WORDS } from "@/lib/words";

// Round eight q19, fourth Learn visual: tap a word to see what it means. The full list is also on the page below the
// chips, so nothing depends on script. Plain definitions, no politics.


export default function Words() {
  const [open, setOpen] = useState<string | null>(null);
  const def = WORDS.find(([w]) => w === open)?.[1];
  return (
    <div className="words">
      <div className="word-chips" role="group" aria-label="Words">
        {WORDS.map(([w]) => <button key={w} type="button" aria-pressed={open === w} aria-controls="word-def" className={open === w ? "on" : ""} onClick={() => setOpen(open === w ? null : w)}>{w}</button>)}
      </div>
      <div id="word-def" className="word-def" aria-live="polite">
        {open ? <><p className="word-def-w">{open}</p><p>{def}</p></> : <p className="meta">Tap a word to see what it means.</p>}
      </div>
    </div>
  );
}

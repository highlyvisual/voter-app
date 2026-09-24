"use client";
import { useRouter, usePathname } from "next/navigation";
import { FIELDS } from "@/lib/household";
import type { Household } from "@/lib/household";

// The short "about you" used by both journey prototypes: three questions, each skippable, written into the URL so the
// page re-renders with the topics that touch this household. Nothing is sent to us or stored by us.
const ASK: (keyof typeof FIELDS)[] = ["tenure", "children", "age_band"];
const PROMPT: Record<string, string> = { tenure: "Your home", children: "Children at home", age_band: "Your age" };
export default function JourneyProfile({ household, qs, extra = {} }: { household: Household; qs: string; extra?: Record<string, string> }) {
  const router = useRouter(); const path = usePathname();
  const set = (k: string, v: string) => {
    const q = new URLSearchParams(qs); Object.entries(extra).forEach(([a, b]) => q.set(a, b));
    if (q.get(k) === v) q.delete(k); else q.set(k, v);
    router.replace(`${path}?${q.toString()}`, { scroll: false });
  };
  return (
    <div className="jp">
      {ASK.map((k) => (
        <fieldset key={k} className="jp-q">
          <legend>{PROMPT[k]} <span className="meta">— {FIELDS[k].label.toLowerCase()}</span></legend>
          <div className="pills">{(FIELDS[k].options as readonly (readonly [string, string])[]).map(([code, text]) => <button key={code} type="button" className={`pill${household[k] === code ? " on" : ""}`} onClick={() => set(k, code)}>{text}</button>)}</div>
        </fieldset>
      ))}
      <p className="meta">Skip any of these. They only change which published positions are shown first, never who is shown. We never ask who you support.</p>
    </div>
  );
}

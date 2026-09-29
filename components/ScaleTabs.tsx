"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

// Row 6 of Romily's design choices (29 Sept, design E14): a candidate's positions read one scale at a time: your
// council, your region, the UK, the world. The topic cards carry data-scale; this switch shows one scale's cards.
// A scale this office doesn't decide says so, in the same place for every candidate, with where to look instead.
// Without JavaScript every card shows and the switch is hidden.
export type ScaleTab = { key: string; label: string; note?: string; href?: string; hrefText?: string };

export default function ScaleTabs({ tabs, initial, children }: { tabs: ScaleTab[]; initial: string; children: ReactNode }) {
  const [on, setOn] = useState(initial);
  const [ready, setReady] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { setReady(true); }, []);
  useEffect(() => {
    if (!ready || !box.current) return;
    box.current.querySelectorAll<HTMLElement>("[data-scale]").forEach((el) => { el.hidden = el.dataset.scale !== on; });
  }, [on, ready]);
  const tab = tabs.find((t) => t.key === on);
  const count = ready && box.current ? box.current.querySelectorAll(`[data-scale="${on}"]`).length : 1;
  return (
    <div className={`scale-tabs${ready ? " ready" : ""}`}>
      <div className="scale-switch" role="group" aria-label="What's at stake, by scale">
        {tabs.map((t) => (
          <button key={t.key} type="button" aria-pressed={on === t.key} className={on === t.key ? "on" : undefined} onClick={() => setOn(t.key)}>
            <span className={`scale-dot scale-${t.key}`} aria-hidden />{t.label}
          </button>
        ))}
      </div>
      {ready && tab?.note && count === 0 ? (
        <p className="scale-note" role="status">{tab.note}{tab.href ? <> <Link href={tab.href}>{tab.hrefText ?? "Find out more"} &rarr;</Link></> : null}</p>
      ) : ready && tab?.note ? <p className="scale-note small">{tab.note}{tab.href ? <> <Link href={tab.href}>{tab.hrefText ?? "Find out more"} &rarr;</Link></> : null}</p> : null}
      <div ref={box}>{children}</div>
    </div>
  );
}

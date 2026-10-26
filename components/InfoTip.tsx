"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

// A small round (i) that opens a short note (Romily, round ten q29: "The line saying why should be a pop up tab not on
// the topic to create less dense wording"). The same look as the council-business (i) (app/r10-council.css): a real
// <button> with aria-expanded, a 44px target, closed with Escape or a second tap.
export default function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);
  return (
    <span className="cb-why info-tip">
      <button ref={btn} type="button" className="cb-why-btn" aria-expanded={open} aria-label={label} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}><span aria-hidden>i</span></button>
      {open ? <span className="cb-why-panel" role="note">{children}</span> : null}
    </span>
  );
}

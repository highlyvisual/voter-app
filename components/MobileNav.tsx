"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
// On narrow screens the six links collapse behind one Menu button; on wide screens they show inline as before.
const LINKS: [string, string][] = [["/how-to-vote", "How to vote"], ["/learn", "Learn"], ["/about", "How this works"], ["/who-we-are", "Who we are"], ["/positions", "Positions"], ["/parties", "Parties"]];
export default function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey); document.addEventListener("click", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("click", onClick); };
  }, [open]);
  return (
    <div className="nav-wrap" ref={ref}>
      <nav className="nav-inline" aria-label="Main">{LINKS.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}</nav>
      <Link href="/profile" className="nav-profile">My profile</Link>
      <button type="button" className="nav-toggle secondary" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)}>
        <span aria-hidden>{open ? "✕" : "☰"}</span> Menu
      </button>
      {children}
      {open ? (
        <nav id="mobile-menu" className="nav-sheet" aria-label="Main">
          {LINKS.map(([h, l]) => <Link key={h} href={h} onClick={() => setOpen(false)}>{l}</Link>)}
        </nav>
      ) : null}
    </div>
  );
}

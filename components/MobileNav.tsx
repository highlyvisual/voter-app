"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// The header (Romily, 29 Sept: "Positions" and "Parties" were wrapping onto a second line on a laptop).
// Five main links sit inline on wide screens and the two about-us pages go under "More"; on narrow screens, or whenever
// the links would not fit on one line (a large text size, a narrow window), everything goes behind one Menu button.
// The header never wraps.
const PRIMARY: [string, string][] = [["/next", "Coming up"], ["/how-to-vote", "How to vote"], ["/learn", "Learn"], ["/positions", "Positions"], ["/parties", "Parties"]];
const MORE: [string, string][] = [["/about", "How this works"], ["/who-we-are", "Who we are"]];

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
  // If the inline links would not fit on one line, switch to the Menu button. Measured, not guessed, so it also works at
  // 150% text size. The class is set directly on the element so React never has to re-render the header for it.
  useEffect(() => {
    const wrap = ref.current; const inner = wrap?.closest(".inner") as HTMLElement | null;
    if (!wrap || !inner) return;
    const check = () => {
      wrap.classList.remove("compact");
      const over = inner.scrollWidth > inner.clientWidth + 1;
      wrap.classList.toggle("compact", over);
    };
    check();
    const ro = new ResizeObserver(check); ro.observe(inner);
    const mo = new MutationObserver(check); mo.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class"] });
    document.fonts?.ready.then(check).catch(() => {});
    return () => { ro.disconnect(); mo.disconnect(); };
  }, []);
  const close = () => setOpen(false);
  return (
    <div className="nav-wrap" ref={ref}>
      <nav className="nav-inline" aria-label="Main">{PRIMARY.map(([h, l]) => <Link key={h} href={h} prefetch={false}>{l}</Link>)}</nav>
      <button type="button" className="nav-toggle secondary" aria-expanded={open} aria-controls="nav-sheet" onClick={() => setOpen((o) => !o)}>
        <span className="w-menu"><span aria-hidden>{open ? "✕" : "☰"}</span><span className="nav-toggle-word"> Menu</span></span>
        <span className="w-more">More <span aria-hidden>{open ? "▴" : "▾"}</span></span>
      </button>
      <Link href="/profile" prefetch={false} className="nav-profile">My profile</Link>
      {children}
      {open ? (
        <nav id="nav-sheet" className="nav-sheet" aria-label="Menu">
          {PRIMARY.map(([h, l]) => <Link key={h} href={h} prefetch={false} className="sheet-primary" onClick={close}>{l}</Link>)}
          {MORE.map(([h, l]) => <Link key={h} href={h} prefetch={false} onClick={close}>{l}</Link>)}
        </nav>
      ) : null}
    </div>
  );
}

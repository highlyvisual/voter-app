"use client";
import { useEffect, useRef, useState } from "react";

// Shows a hint only when the comparison table is wider than its container (i.e. there are columns off-screen).
export default function ScrollHint({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const check = () => setOverflow(el.scrollWidth > el.clientWidth + 8 && el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    check(); el.addEventListener("scroll", check); window.addEventListener("resize", check);
    return () => { el.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, []);
  return (
    <div style={{ position: "relative" }}>
      <div ref={ref} className="scroll compare-wrap">{children}</div>
      {overflow ? <p className="meta scroll-hint" aria-hidden>More candidates to the right — scroll sideways</p> : null}
    </div>
  );
}

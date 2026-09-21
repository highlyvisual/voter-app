"use client";
import { useEffect, useState } from "react";
// Light / dark / system. localStorage only. Party colours are unaffected.
export default function ThemeToggle() {
  const [t, setT] = useState<"system" | "light" | "dark">("system");
  useEffect(() => { try { const v = localStorage.getItem("theme"); if (v === "light" || v === "dark") setT(v); } catch {} }, []);
  useEffect(() => {
    if (t === "system") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t);
    try { t === "system" ? localStorage.removeItem("theme") : localStorage.setItem("theme", t); } catch {}
  }, [t]);
  return (
    <span className="theme-toggle" role="group" aria-label="Colour theme">
      {(["light", "system", "dark"] as const).map((v) => <button key={v} type="button" className={t === v ? "on" : ""} onClick={() => setT(v)} aria-pressed={t === v}>{v === "system" ? "Auto" : v === "light" ? "Light" : "Dark"}</button>)}
    </span>
  );
}

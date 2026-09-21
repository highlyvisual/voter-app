"use client";
import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";
// Reading settings: text size and high contrast. Stored in this browser only.
export default function Settings() {
  const [size, setSize] = useState(100); const [hc, setHc] = useState(false); const [open, setOpen] = useState(false); const [theme, setTheme] = useState<Theme>("system"); const [lite, setLite] = useState(false);
  useEffect(() => { try { const s = Number(localStorage.getItem("textsize") ?? 100); if (s >= 90) setSize(s); setHc(localStorage.getItem("contrast") === "high"); const t = localStorage.getItem("theme"); if (t === "light" || t === "dark") setTheme(t); setLite(localStorage.getItem("lite") === "1"); } catch {} }, []);
  useEffect(() => { document.documentElement.classList.toggle("lite", lite); try { localStorage.setItem("lite", lite ? "1" : "0"); } catch {} }, [lite]);
  useEffect(() => { document.documentElement.style.fontSize = `${size}%`; try { localStorage.setItem("textsize", String(size)); } catch {} }, [size]);
  useEffect(() => { document.documentElement.classList.toggle("high-contrast", hc); try { localStorage.setItem("contrast", hc ? "high" : "normal"); } catch {} }, [hc]);
  useEffect(() => {
    if (theme === "system") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", theme);
    try { theme === "system" ? localStorage.removeItem("theme") : localStorage.setItem("theme", theme); } catch {}
  }, [theme]);
  return (
    <div className="settings">
      <button type="button" className="secondary small" onClick={() => setOpen((o) => !o)} aria-expanded={open}>Display</button>
      {open ? (
        <div className="settings-panel">
          <p className="meta" style={{ margin: 0 }}>Text size</p>
          <div className="pills">
            {[100, 115, 130, 150].map((s) => <button key={s} type="button" className={`pill${size === s ? " on" : ""}`} onClick={() => setSize(s)}>{s === 100 ? "Normal" : `${s}%`}</button>)}
          </div>
          <p className="meta" style={{ margin: "0.5rem 0 0" }}>Contrast</p>
          <div className="pills">
            <button type="button" className={`pill${!hc ? " on" : ""}`} onClick={() => setHc(false)}>Normal</button>
            <button type="button" className={`pill${hc ? " on" : ""}`} onClick={() => setHc(true)}>High contrast</button>
          </div>
          <p className="meta" style={{ margin: "0.5rem 0 0" }}>Theme</p>
          <div className="pills">
            {(["light", "system", "dark"] as const).map((v) => <button key={v} type="button" className={`pill${theme === v ? " on" : ""}`} onClick={() => setTheme(v)}>{v === "system" ? "Auto" : v === "light" ? "Light" : "Dark"}</button>)}
          </div>
          <p className="meta" style={{ margin: "0.5rem 0 0" }}>Data</p>
          <div className="pills">
            <button type="button" className={`pill${!lite ? " on" : ""}`} onClick={() => setLite(false)}>Full</button>
            <button type="button" className={`pill${lite ? " on" : ""}`} onClick={() => setLite(true)}>Low data (no photos or maps)</button>
          </div>
          <p className="meta">Kept in this browser only.</p>
        </div>
      ) : null}
    </div>
  );
}

"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

// Defined outside the component so the buttons keep their identity (and keyboard focus) when a setting changes.
function Row({ label, children }: { label: string; children: ReactNode }) {
  return <fieldset className="set-row"><legend>{label}</legend><div className="seg">{children}</div></fieldset>;
}
function Opt({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" className={on ? "on" : ""} aria-pressed={on} onClick={onClick}>{children}</button>;
}

type Theme = "system" | "light" | "dark";
// Display settings: text size, contrast, theme and low data. Stored in this browser only.
// Round eight q2 (Romily, 29 Sept): "could be displayed a bit more aesthetically, whilst ensure it is fully readable" -
// a titled panel with a live sample, one segmented choice per row, a close button, and Escape or a click outside to close.
export default function Settings() {
  const [size, setSize] = useState(100); const [hc, setHc] = useState(false); const [open, setOpen] = useState(false); const [theme, setTheme] = useState<Theme>("system"); const [lite, setLite] = useState(false);
  const wrap = useRef<HTMLDivElement>(null); const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { try { const s = Number(localStorage.getItem("textsize") ?? 100); if (s >= 90) setSize(s); setHc(localStorage.getItem("contrast") === "high"); const t = localStorage.getItem("theme"); if (t === "light" || t === "dark") setTheme(t); setLite(localStorage.getItem("lite") === "1"); } catch {} }, []);
  // The trial colour directions at /looks ended when Romily chose her palette (29 Sept); any stored choice is cleared.
  useEffect(() => { try { localStorage.removeItem("look"); document.documentElement.removeAttribute("data-look"); } catch {} }, []);
  useEffect(() => { document.documentElement.classList.toggle("lite", lite); try { localStorage.setItem("lite", lite ? "1" : "0"); } catch {} }, [lite]);
  useEffect(() => { document.documentElement.style.fontSize = `${size}%`; try { localStorage.setItem("textsize", String(size)); } catch {} }, [size]);
  useEffect(() => { document.documentElement.classList.toggle("high-contrast", hc); try { localStorage.setItem("contrast", hc ? "high" : "normal"); } catch {} }, [hc]);
  // High contrast meets WCAG 2.2 AAA 2.5.5 (targets 44 by 44): links inside a sentence are exempt, but a link that stands
  // on its own in its line ("Source: GOV.UK", "More figures →") must be big enough to tap. CSS can't tell the two apart,
  // so while high contrast is on, links whose parent holds little else are marked data-hc-solo and grown in theme.css.
  useEffect(() => {
    const mark = () => {
      document.querySelectorAll<HTMLAnchorElement>("main a[href]").forEach((a) => {
        const p = a.parentElement; if (!p || a.classList.contains("card-link")) return;
        if (!a.hasAttribute("data-hc-solo") && getComputedStyle(a).display !== "inline") return;
        const own = (a.textContent ?? "").replace(/\s+/g, " ").trim();
        const rest = (p.textContent ?? "").replace(/\s+/g, " ").trim().replace(own, "").replace(/[\s·•|,.:;→←()\-–—]+/g, "");
        const solo = rest.length <= 15;
        if (solo && !a.hasAttribute("data-hc-solo")) a.setAttribute("data-hc-solo", "");
        if (!solo && a.hasAttribute("data-hc-solo")) a.removeAttribute("data-hc-solo");
      });
    };
    if (!hc) { document.querySelectorAll("[data-hc-solo]").forEach((e) => e.removeAttribute("data-hc-solo")); return; }
    mark();
    let raf = 0;
    const mo = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(mark); });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); cancelAnimationFrame(raf); };
  }, [hc]);
  useEffect(() => {
    if (theme === "system") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", theme);
    try { theme === "system" ? localStorage.removeItem("theme") : localStorage.setItem("theme", theme); } catch {}
  }, [theme]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); } };
    const onDown = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey); document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [open]);

  const reset = () => { setSize(100); setHc(false); setTheme("system"); setLite(false); };
  const changed = size !== 100 || hc || theme !== "system" || lite;

  return (
    <div className="settings" ref={wrap}>
      <button ref={toggle} type="button" className="settings-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="display-settings" aria-label="Display settings" title="Display settings"><span aria-hidden>Aa</span></button>
      {open ? (
        <div className="settings-panel" id="display-settings" role="dialog" aria-label="Display settings">
          <div className="set-head">
            <p className="set-title">Display</p>
            <button type="button" className="set-close" onClick={() => { setOpen(false); toggle.current?.focus(); }} aria-label="Close display settings">&times;</button>
          </div>
          <p className="set-sample" aria-hidden>Aa <span>The quick brown fox</span></p>
          <Row label="Text size">
            {[100, 115, 130, 150].map((s) => <Opt key={s} on={size === s} onClick={() => setSize(s)}><span style={{ fontSize: `${0.8 + (s - 100) / 200}rem` }}>A</span><span className="sr-only">{s === 100 ? "Normal size" : `${s}%`}</span></Opt>)}
          </Row>
          <Row label="Theme">
            {(["light", "system", "dark"] as const).map((v) => <Opt key={v} on={theme === v} onClick={() => setTheme(v)}>{v === "system" ? "Auto" : v === "light" ? "Light" : "Dark"}</Opt>)}
          </Row>
          <Row label="Contrast">
            <Opt on={!hc} onClick={() => setHc(false)}>Normal</Opt>
            <Opt on={hc} onClick={() => setHc(true)}>High</Opt>
          </Row>
          <Row label="Photos and maps">
            <Opt on={!lite} onClick={() => setLite(false)}>Show</Opt>
            <Opt on={lite} onClick={() => setLite(true)}>Hide (low data)</Opt>
          </Row>
          <div className="set-foot">
            <span className="meta">Saved in this browser only.</span>
            {changed ? <button type="button" className="link" onClick={reset}>Reset</button> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";
import { useState } from "react";
// A ready-made citation for students and teachers (Harvard style), copied in one tap.
export default function CiteThis({ title }: { title: string }) {
  const [done, setDone] = useState(false);
  const cite = () => {
    const url = window.location.origin + window.location.pathname;
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    return `What's It To Me (${new Date().getFullYear()}) ${title}. Available at: ${url} (Accessed: ${today}).`;
  };
  return (
    <details className="cite">
      <summary>Cite this page</summary>
      <p className="small" style={{ margin: "0.4rem 0" }}><span suppressHydrationWarning>{typeof window === "undefined" ? "" : cite()}</span></p>
      <button type="button" className="secondary small" onClick={async () => { try { await navigator.clipboard.writeText(cite()); setDone(true); setTimeout(() => setDone(false), 2000); } catch {} }}>{done ? "Copied" : "Copy citation"}</button>
      <p className="meta">Harvard style. Every figure on the page also names its original source, which is usually the better thing to cite.</p>
    </details>
  );
}

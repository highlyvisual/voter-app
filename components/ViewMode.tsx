"use client";
import { useEffect, useState } from "react";

// Summary or verbatim view of every claim. Default: summary. Persisted in localStorage only.
export default function ViewMode() {
  const [mode, setMode] = useState<"summary" | "verbatim">("summary");
  useEffect(() => { try { const m = localStorage.getItem("viewmode"); if (m === "verbatim" || m === "summary") setMode(m); } catch {} }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("mode-verbatim", mode === "verbatim");
    document.documentElement.classList.toggle("mode-summary", mode === "summary");
    try { localStorage.setItem("viewmode", mode); } catch {}
  }, [mode]);
  return (
    <span className="viewmode" role="group" aria-label="How to show each position">
      <button type="button" className={mode === "summary" ? "on" : ""} onClick={() => setMode("summary")}>Summaries</button>
      <button type="button" className={mode === "verbatim" ? "on" : ""} onClick={() => setMode("verbatim")}>Exact quotations</button>
    </span>
  );
}

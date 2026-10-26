"use client";
import { useEffect, useRef, useState } from "react";

// A copy-paste snippet with a Copy button, for /embed (Romily, round ten, q8).
export function EmbedSnippet({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* the code is on screen to select by hand */ }
  }
  return (
    <div className="embed-snippet">
      <pre aria-label={label}><code>{code}</code></pre>
      <button type="button" className="secondary small" onClick={copy}>{copied ? "Copied" : `Copy ${label.toLowerCase()}`}</button>
      <span className="sr-only" aria-live="polite">{copied ? "Copied to the clipboard" : ""}</span>
    </div>
  );
}

// The live preview: the real box in a frame, resized to fit as the resizing snippet does on other sites.
export function EmbedPreview() {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const on = (e: MessageEvent) => {
      const d = e.data as { whatsittome?: string; height?: number } | null;
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow || d?.whatsittome !== "next-election" || typeof d.height !== "number") return;
      if (frame.current) frame.current.style.height = `${Math.min(Math.max(d.height, 200), 1600)}px`;
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, []);
  return (
    <div className="embed-preview">
      <iframe ref={frame} src="/embed/next-election" title="Your next election (preview)" height={360} loading="lazy" />
    </div>
  );
}

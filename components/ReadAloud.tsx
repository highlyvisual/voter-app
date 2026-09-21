"use client";
import { useEffect, useState } from "react";
// Read aloud using the browser's own speech synthesis. No service, no data leaves the device.
export default function ReadAloud({ selector, label = "Read aloud" }: { selector: string; label?: string }) {
  const [ok, setOk] = useState(false); const [on, setOn] = useState(false);
  useEffect(() => { setOk(typeof window !== "undefined" && "speechSynthesis" in window); return () => { try { window.speechSynthesis?.cancel(); } catch {} }; }, []);
  if (!ok) return null;
  const speak = () => {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return;
    window.speechSynthesis.cancel();
    if (on) { setOn(false); return; }
    const u = new SpeechSynthesisUtterance(el.innerText.slice(0, 4000));
    u.lang = "en-GB"; u.rate = 0.98; u.onend = () => setOn(false);
    setOn(true); window.speechSynthesis.speak(u);
  };
  return <button type="button" className="secondary small readaloud" onClick={speak} aria-pressed={on}>{on ? "Stop" : label}</button>;
}

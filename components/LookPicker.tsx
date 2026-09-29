"use client";
import { useEffect, useState } from "react";

// Three colour directions for Romily to try on the real site (round eight, q10-12). Kept in this browser only.
const LOOKS: { key: string; name: string; words: string; sw: string[] }[] = [
  { key: "", name: "As it is now", words: "White paper, black ink, a magenta accent.", sw: ["#ffffff", "#f2f0eb", "#000000", "#d6006f"] },
  { key: "warm", name: "1. Warm magenta", words: "Keeps the magenta, on a warm paper with plum-black ink. Friendly and personal.", sw: ["#fffaf4", "#f6ebe0", "#1c1219", "#c2005f"] },
  { key: "brass", name: "2. Graphite and brass", words: "Cool stone paper, graphite ink, an old-gold accent. Calm and sophisticated.", sw: ["#f8f7f3", "#ecebe4", "#101317", "#8a6508"] },
  { key: "umber", name: "3. Umber and rose", words: "Soft rose paper, dark umber ink, a burnt-earth accent. Human and warm.", sw: ["#fdf8f6", "#f4e6e1", "#1d1411", "#9c4424"] },
];

export default function LookPicker() {
  const [cur, setCur] = useState("");
  useEffect(() => { try { setCur(localStorage.getItem("look") ?? ""); } catch {} }, []);
  const pick = (k: string) => {
    setCur(k);
    try { k ? localStorage.setItem("look", k) : localStorage.removeItem("look"); } catch {}
    if (k) document.documentElement.setAttribute("data-look", k); else document.documentElement.removeAttribute("data-look");
  };
  return (
    <ul className="look-grid">
      {LOOKS.map((l) => (
        <li key={l.key || "now"} className={`look-card${cur === l.key ? " on" : ""}`}>
          <div className="sw" aria-hidden>{l.sw.map((c) => <i key={c} style={{ background: c }} />)}</div>
          <div className="body">
            <h2>{l.name}</h2>
            <p>{l.words}</p>
            <button type="button" aria-pressed={cur === l.key} onClick={() => pick(l.key)}>{cur === l.key ? "Showing now" : "Try this"}</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FIELDS, FIELD_KEYS, OPTIONAL_FIELDS, OPTIONAL_KEYS } from "@/lib/household";
import { PERSONAL_KEYS } from "@/lib/personal";
import { readPersonal, readProfile } from "@/lib/profile";

// The answers this page is built from, in plain words, read from this browser (the address carries the household bands
// only). Answers about the person are counted, never shown here, in case someone else is looking at the screen.
export default function YouSummary() {
  const [bits, setBits] = useState<string[] | null>(null);
  const [personal, setPersonal] = useState(false);
  useEffect(() => {
    const load = () => {
      const p = readProfile() ?? {};
      const out: string[] = [];
      for (const k of FIELD_KEYS) { const t = (FIELDS[k].options as readonly (readonly [string, string])[]).find(([c]) => c === p[k])?.[1]; if (t) out.push(k === "children" && p[k] === "none" ? "No children or dependants" : k === "age_band" ? `Aged ${t}` : t); }
      for (const k of OPTIONAL_KEYS) if (p[k] === "yes") out.push(OPTIONAL_FIELDS[k].label);
      setBits(out);
      setPersonal(Boolean(readPersonal() && PERSONAL_KEYS.some((k) => readPersonal()?.[k])));
    };
    load(); window.addEventListener("profile-changed", load);
    return () => window.removeEventListener("profile-changed", load);
  }, []);
  if (bits === null) return null;
  return (
    <div className="you-summary">
      <p><strong>Based on:</strong> {bits.length ? bits.join(" · ") : "no household answers yet"}{personal ? " · your answers about you (kept in this browser only)" : ""}.</p>
      <p className="meta"><Link href="/profile">Change or delete my answers</Link> · <Link href="/start">Start again</Link></p>
    </div>
  );
}

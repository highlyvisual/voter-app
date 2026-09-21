"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { profileQuery, readProfile, type Profile } from "@/lib/profile";
// Home for a returning visitor (Romily §19): your election, your countdown, what changed on your ballot this week,
// and the places to go next. Built entirely in the browser from the device-only profile and the open data endpoint.
type Data = { ballot: { area_name: string; poll_date: string; level: string }; candidates: unknown[]; claims: { created_at: string }[] };
export default function YourDemocracy() {
  const [p, setP] = useState<Profile | null>(null); const [d, setD] = useState<Data | null>(null);
  useEffect(() => { const prof = readProfile(); setP(prof); if (prof?.ballot) fetch(`/api/data/${encodeURIComponent(prof.ballot)}`).then((r) => (r.ok ? r.json() : null)).then(setD).catch(() => {}); }, []);
  if (!p?.ballot || !d) return null;
  const days = Math.max(0, Math.round((new Date(d.ballot.poll_date + "T00:00:00Z").getTime() - new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime()) / 86400000));
  const week = Date.now() - 7 * 86400000;
  const fresh = d.claims.filter((c) => new Date(c.created_at).getTime() > week).length;
  const q = profileQuery(p); const base = `/ballot/${encodeURIComponent(p.ballot)}`; const qq = q ? `?${q}` : "";
  return (
    <section className="your-democracy" aria-labelledby="yd">
      <p className="eyebrow" style={{ margin: 0 }}>Welcome back</p>
      <h2 id="yd" style={{ borderTop: 0, paddingTop: 0, marginTop: "0.2rem" }}>Your democracy</h2>
      <div className="yd-grid">
        <div><b>{days}</b><span>days until polling day in {d.ballot.area_name}</span></div>
        <div><b>{d.candidates.length}</b><span>candidates confirmed</span></div>
        <div><b>{fresh}</b><span>sourced positions added to this site in the last 7 days</span></div>
      </div>
      <nav className="yd-hub" aria-label="Your election">
        <Link href={`${base}${qq}`}>My ballot</Link>
        <Link href={`${base}/area${qq}`}>My area</Link>
        <Link href={`${base}/stakes${qq}`}>What's at stake</Link>
        <Link href={`${base}/compare${qq}`}>Compare</Link>
        <Link href="/learn">Learn</Link>
        <Link href="/profile">My profile</Link>
      </nav>
    </section>
  );
}

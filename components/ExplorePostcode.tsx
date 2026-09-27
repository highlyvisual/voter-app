"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { readProfile } from "@/lib/profile";

// Finds the area for the explorer from a postcode, in the browser. Only the outward code and a location rounded to
// about 100 m go into the page address, as on the rest of the site. Uses the saved profile's postcode when there is one.
export default function ExplorePostcode() {
  const router = useRouter(); const sp = useSearchParams();
  const [pc, setPc] = useState(""); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const go = async (postcode: string, quiet = false) => {
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.replace(/\s+/g, ""))}`);
      if (r.status === 404) { if (!quiet) setErr("We can't find that postcode. Please check it and try again."); return; }
      const j = await r.json(); const p = j?.result;
      if (!p) { if (!quiet) setErr("We couldn't look up that postcode just now. Please try again in a minute."); return; }
      const next = new URLSearchParams(sp.toString());
      next.set("pc", p.outcode); next.set("loc", `${p.latitude.toFixed(3)},${p.longitude.toFixed(3)}`);
      router.replace(`?${next.toString()}`, { scroll: false });
    } catch { if (!quiet) setErr("We couldn't look up that postcode just now. Please try again in a minute."); }
    finally { setBusy(false); }
  };
  useEffect(() => { if (!sp.get("loc")) { const p = readProfile(); if (p?.postcode) go(p.postcode, true); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <form className="explore-pc" onSubmit={(e) => { e.preventDefault(); if (pc.trim()) go(pc.trim()); }}>
      <label htmlFor="explore-pc" className="meta">{sp.get("loc") ? "Try another postcode" : "Your postcode, to show the bodies for your area"}</label>
      <div className="row"><input id="explore-pc" value={pc} onChange={(e) => setPc(e.target.value)} autoComplete="postal-code" placeholder="e.g. NW5 1ED" aria-invalid={Boolean(err)} aria-describedby={err ? "explore-err" : undefined} /><button type="submit" disabled={busy}>{busy ? "Looking up…" : "Show"}</button></div>
      {err ? <p id="explore-err" role="alert" className="small">{err}</p> : null}
    </form>
  );
}

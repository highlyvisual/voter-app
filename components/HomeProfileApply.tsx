"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { HOUSEHOLD_KEYS, profileQuery, readProfile } from "@/lib/profile";

// The Your Home pages are drawn on the server from the address, like the ballot pages: the saved profile (kept on this
// device only) is turned into address parameters here, exactly as if the reader had chosen them. Two parts, in one step:
// the household answers (unless the reader is looking "as someone else", or has switched the profile off), and the
// place: the outward code, the rounded point and the ballot saved for "Your politics". The full postcode never travels.
export default function HomeProfileApply() {
  const router = useRouter();
  const sp = useSearchParams();
  useEffect(() => {
    const p = readProfile();
    if (!p) return;
    const next = new URLSearchParams(sp.toString());
    let changed = false;
    const hasHousehold = HOUSEHOLD_KEYS.some((k) => sp.get(k));
    if (!hasHousehold && !sp.get("as") && sp.get("profile") !== "off") {
      for (const [k, v] of new URLSearchParams(profileQuery(p))) { next.set(k, v); changed = true; }
    }
    const hasPlace = ["pc", "loc", "con", "ballot"].some((k) => sp.get(k));
    if (!hasPlace && p.you) {
      const you = new URLSearchParams(p.you);
      for (const k of ["pc", "loc", "ballot"]) { const v = you.get(k); if (v) { next.set(k, v); changed = true; } }
    }
    if (changed) router.replace(`?${next.toString()}${window.location.hash}`, { scroll: false });
  }, [sp, router]);
  return null;
}

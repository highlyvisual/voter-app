"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { HOUSEHOLD_KEYS, profileQuery, readProfile, writeProfile } from "@/lib/profile";
import { usePathname } from "next/navigation";
// On a ballot page opened without household answers, apply the saved profile automatically and say so, with a
// one-tap way to see the page without it. A page the user has already set by hand is never overridden.
export default function ProfileApply() {
  const router = useRouter(); const sp = useSearchParams(); const path = usePathname();
  const [using, setUsing] = useState(false);
  // Remember which ballot this device belongs to, so the home page can say "your election". Device only.
  useEffect(() => { const m = path.match(/^\/ballot\/([^/]+)/); const p = readProfile(); if (m && p && p.postcode && sp.get("pc") && p.ballot !== decodeURIComponent(m[1])) writeProfile({ ...p, ballot: decodeURIComponent(m[1]) }); }, [path, sp]);
  useEffect(() => {
    const has = HOUSEHOLD_KEYS.some((k) => sp.get(k));
    const p = readProfile(); const q = profileQuery(p);
    if (has) { setUsing(Boolean(q) && HOUSEHOLD_KEYS.every((k) => (sp.get(k) ?? "") === (p?.[k] ?? ""))); return; }
    if (sp.get("profile") === "off" || !q) return;
    const next = new URLSearchParams(sp.toString()); for (const [k, v] of new URLSearchParams(q)) next.set(k, v);
    router.replace(`?${next.toString()}${window.location.hash}`, { scroll: false });
  }, [sp, router]);
  if (!using) return null;
  const off = new URLSearchParams(sp.toString()); HOUSEHOLD_KEYS.forEach((k) => off.delete(k)); off.set("profile", "off");
  return <p className="profile-note">Showing what applies to <strong>your profile</strong>. <Link href="/profile">Edit it</Link> · <Link href={`?${off.toString()}`}>See the page without it</Link></p>;
}

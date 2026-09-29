"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { readProfile } from "@/lib/profile";

// The app's bottom bar on phones and tablets (Romily, 29 Sept, row 2: design A1). Five fixed places, always under the
// thumb. "You" and "Ballot" go to this person's own page and ballot once this device knows them (the saved profile,
// kept in the browser only); before that, to the questions and to the list of elections.
const ICONS: Record<string, React.ReactNode> = {
  home: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  you: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  ballot: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  next: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  learn: <path d="M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 1 2 2z" />,
};

export default function TabBar() {
  const path = usePathname() ?? "/";
  const [you, setYou] = useState("/start");
  const [ballot, setBallot] = useState("/next");
  useEffect(() => {
    const load = () => {
      const p = readProfile();
      setYou(p?.you ? `/you?${p.you}` : p?.postcode ? "/profile" : "/start");
      setBallot(p?.ballot ? `/ballot/${encodeURIComponent(p.ballot)}` : "/next");
    };
    load(); window.addEventListener("profile-changed", load);
    return () => window.removeEventListener("profile-changed", load);
  }, []);
  // The questions have their own Back and Next bar at the foot of the screen.
  if (path.startsWith("/start")) return null;
  const tabs: [string, string, string, boolean][] = [
    ["home", "Home", "/", path === "/"],
    ["you", "You", you, path.startsWith("/you") || path.startsWith("/profile")],
    ["ballot", "Ballot", ballot, path.startsWith("/ballot")],
    ["next", "Coming up", "/next", path.startsWith("/next")],
    ["learn", "Learn", "/learn", path.startsWith("/learn")],
  ];
  return (
    <nav className="tabbar" aria-label="App">
      {tabs.map(([k, label, href, on]) => (
        <Link key={k} href={href} prefetch={false} className={on ? "on" : undefined} aria-current={on ? "page" : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden>{ICONS[k]}</svg>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

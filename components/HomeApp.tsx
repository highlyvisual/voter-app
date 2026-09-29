"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AreaMap from "@/components/AreaMap";
import BallotsMap from "@/components/BallotsMap";
import { readProfile } from "@/lib/profile";

// The home page's first screen (Romily, 29 Sept: rows 3 and 10, design E; "I like the big map"). The map comes first:
// for someone this device already knows, their own area with the local-issues layers; for anyone else, every election
// coming up. Beside it (below it on a phone): what this person can open next, and the elections coming up, nearest
// first when we know where they are. Everything here is read from the profile kept in this browser; nothing is sent.
export type HomeBallot = { id: string; area: string; date: string; level: string; lat: number | null; lng: number | null };
type Saved = { you: string; outcode: string | null; loc: { lat: number; lng: number } | null; ballot: string | null };

function useSaved(): Saved | null {
  const [s, setS] = useState<Saved | null>(null);
  useEffect(() => {
    const load = () => {
      const p = readProfile();
      if (!p?.you) { setS(null); return; }
      const q = new URLSearchParams(p.you);
      const m = (q.get("loc") ?? "").match(/^(-?\d{1,2}\.\d{1,3}),(-?\d{1,3}\.\d{1,3})$/);
      setS({ you: p.you, outcode: q.get("pc"), loc: m ? { lat: Number(m[1]), lng: Number(m[2]) } : null, ballot: q.get("ballot") ?? p.ballot ?? null });
    };
    load(); window.addEventListener("profile-changed", load);
    return () => window.removeEventListener("profile-changed", load);
  }, []);
  return s;
}

const when = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const daysTo = (d: string, today: string) => Math.round((Date.parse(d + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86400000);
const inDays = (n: number) => (n <= 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`);
const kind = (level: string) => (level === "parliamentary" ? "UK Parliament by-election" : "Council by-election");
const place = (area: string) => area.replace(/ ward$/, "").replace(/^(.*?): /, "");
const dist = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => (a.lat - b.lat) ** 2 + ((a.lng - b.lng) * Math.cos((a.lat * Math.PI) / 180)) ** 2;

export function HomeMap({ ballots }: { ballots: HomeBallot[] }) {
  const s = useSaved();
  const own = s?.ballot ? ballots.find((b) => b.id === s.ballot) : undefined;
  return (
    <div className="home-map">
      {s?.loc ? (
        <AreaMap ballotId={s.ballot ?? undefined} areaName={own?.area ?? s.outcode ?? "your area"} lat={s.loc.lat} lng={s.loc.lng} outcode={s.outcode} levelLabel={own?.level === "local" ? "ward" : "constituency"} loc={s.loc} />
      ) : (
        <BallotsMap ballots={ballots.map((b) => ({ ballot_paper_id: b.id, area_name: b.area, poll_date: b.date, level: b.level, lat: b.lat, lng: b.lng }))} />
      )}
      <div className="loc-pill">
        <svg viewBox="0 0 24 24" aria-hidden><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
        {s?.outcode ? (
          <span><strong>{s.outcode}</strong>{own ? <> · {place(own.area)}</> : null} · <Link href="/profile">Change</Link></span>
        ) : (
          <span><strong>Every election coming up</strong> · <Link href="/start">Show my area</Link></span>
        )}
      </div>
      <Link href={s ? `/you?${s.you}` : "/start"} className="map-cta">{s ? "Your politics" : "Personalise my politics"} <span aria-hidden>&rarr;</span></Link>
    </div>
  );
}

export function HomeTiles({ ballots }: { ballots: HomeBallot[] }) {
  const s = useSaved();
  const own = s?.ballot ? ballots.find((b) => b.id === s.ballot) : undefined;
  const you = s ? `/you?${s.you}` : null;
  const tiles: [string, string, string][] = [
    ["What you’re voting for", own ? `${place(own.area)}, ${when(own.date)}` : "Every election coming up, with a calendar and a map", you ? `${you}#you-vote` : "/next"],
    ["Life where you live", "Crime, schools, homes and flood risk: the official facts", you ? `${you}#you-area` : "/start"],
    ["Who decides what", "Your council, your MP, the government, and the bodies nobody elects", you ? `${you}#you-decides` : "/learn/who-decides"],
    ["What’s at stake", "Your council, your region, the UK and the world, in each party’s own words", you ? `${you}#you-stake` : "/you#you-stake"],
  ];
  return (
    <section className="home-tiles" aria-labelledby="tiles-h">
      <h2 id="tiles-h">{s ? "Your politics" : "Your politics, once we know your area"}</h2>
      <ul>
        {tiles.map(([t, sub, href]) => (
          <li key={t}><Link href={href} className="tile card-link"><span className="tile-t">{t}</span><span className="tile-s">{sub}</span><span className="tile-go" aria-hidden>&rarr;</span></Link></li>
        ))}
      </ul>
    </section>
  );
}

export function HomeComingUp({ ballots, today }: { ballots: HomeBallot[]; today: string }) {
  const s = useSaved();
  const loc = s?.loc ?? null;
  const upcoming = ballots.filter((b) => b.date >= today);
  const list = loc ? [...upcoming].sort((a, b) => (a.lat == null || b.lat == null ? 0 : dist(loc, { lat: a.lat, lng: a.lng! }) - dist(loc, { lat: b.lat, lng: b.lng! }))) : upcoming;
  if (!list.length) return null;
  return (
    <section className="coming-up" aria-labelledby="coming-h">
      <h2 id="coming-h">{loc ? "Coming up near you" : "Coming up"} <Link href="/next" className="see-all">See all</Link></h2>
      <ul className="rows">
        {list.slice(0, 4).map((b) => (
          <li key={b.id}><Link href={`/ballot/${encodeURIComponent(b.id)}`} className="row-link"><span><span className="row-t">{place(b.area)}</span><span className="row-s">{kind(b.level)} · {when(b.date)} · {inDays(daysTo(b.date, today))}</span></span><svg viewBox="0 0 24 24" aria-hidden className="chev"><path d="M9 6l6 6-6 6" /></svg></Link></li>
        ))}
      </ul>
    </section>
  );
}

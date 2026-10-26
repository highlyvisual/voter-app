"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import AreaMap from "@/components/AreaMap";
import BallotsMap from "@/components/BallotsMap";
import HomeLookup, { LookupView } from "@/components/HomeLookup";
import { profileQuery, readProfile } from "@/lib/profile";

// The home page's first screen (Romily, 29 Sept: rows 3 and 10, design E; "I like the big map"). The map comes first:
// for someone this device already knows, their own area with the local-issues layers; for anyone else, every election
// coming up. Beside it (below it on a phone): their next vote (Romily, round ten, q1: "Your next vote: who's standing
// and what it means for you" is the main aim). Everything here is read from the profile kept in this browser; nothing
// is sent. The map's own "Personalise my politics" button went in round ten: one main action per screen (q2).
export type HomeBallot = { id: string; area: string; date: string; level: string; lat: number | null; lng: number | null };
type Saved = { you: string; household: string; outcode: string | null; loc: { lat: number; lng: number } | null; ballot: string | null };

function useSaved(): Saved | null {
  const [s, setS] = useState<Saved | null>(null);
  useEffect(() => {
    const load = () => {
      const p = readProfile();
      if (!p?.you) { setS(null); return; }
      const q = new URLSearchParams(p.you);
      const m = (q.get("loc") ?? "").match(/^(-?\d{1,2}\.\d{1,3}),(-?\d{1,3}\.\d{1,3})$/);
      setS({ you: p.you, household: profileQuery(p), outcode: q.get("pc"), loc: m ? { lat: Number(m[1]), lng: Number(m[2]) } : null, ballot: q.get("ballot") ?? p.ballot ?? null });
    };
    load(); window.addEventListener("profile-changed", load);
    return () => window.removeEventListener("profile-changed", load);
  }, []);
  return s;
}

const daysTo = (d: string, today: string) => Math.round((Date.parse(d + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86400000);
const longWhen = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const kind = (level: string) => (level === "parliamentary" ? "UK Parliament by-election" : "Council by-election");
const place = (area: string) => area.replace(/ ward$/, "").replace(/^(.*?): /, "");

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
    </div>
  );
}

// Screen one (Romily, round ten, q1 and q2): the person's next vote, and one thing to do about it. Known ballot: where,
// when, how long to go, and who is standing. Otherwise: the postcode box, with the full profile as the second choice.
export function HomeNextVote({ ballots, today }: { ballots: HomeBallot[]; today: string }) {
  const s = useSaved();
  const own = s?.ballot ? ballots.find((b) => b.id === s.ballot && b.date >= today) : undefined;
  if (own && s) {
    const n = daysTo(own.date, today);
    const id = encodeURIComponent(own.id);
    const hq = s.household ? `?${s.household}` : "";
    return (
      <div className="nv">
        <h1 className="nv-h">Your next vote</h1>
        <div className="nv-card">
          <p className="nv-place">{place(own.area)}</p>
          <p className="nv-what">{kind(own.level)} · {longWhen(own.date)}</p>
          <p className="nv-count">{n <= 0 ? <b>Polling day is today</b> : <><b>{n}</b> {n === 1 ? "day" : "days"} to go</>}</p>
          <Link href={`/ballot/${id}${hq}#ballot-paper`} className="button big">See who&rsquo;s standing &rarr;</Link>
          <p className="nv-second"><Link href={`/ballot/${id}/stakes${hq}`}>What it could mean for you</Link></p>
        </div>
      </div>
    );
  }
  return (
    <div className="nv">
      <h1 className="nv-h">Your next vote</h1>
      {s ? (
        <>
          <p className="nv-lede">There&rsquo;s no election we cover at {s.outcode ?? "your postcode"} right now. We add each election as soon as its list of candidates is confirmed.</p>
          <Link href="/next" className="button big">See every election coming up &rarr;</Link>
          <p className="nv-second"><Link href={`/you?${s.you}`}>Your politics, in one place</Link></p>
        </>
      ) : (
        <>
          <p className="nv-lede">Who&rsquo;s standing where you live, and what it could mean for you.</p>
          <Suspense fallback={<LookupView error={null} />}><HomeLookup /></Suspense>
          <p className="nv-second"><Link href="/start">Or personalise my politics &rarr;</Link></p>
        </>
      )}
    </div>
  );
}

// Screen two (Romily, round ten, q1: "What's happening near me" stays central, close behind the vote).
export function HomeLocal() {
  const s = useSaved();
  const you = s ? `/you?${s.you}` : null;
  return (
    <>
      <Link href={you ? `${you}#you-now` : "/start"} className="button big">{you ? "See what’s happening near me" : "Show me my area"} &rarr;</Link>
      <p className="nv-second"><Link href={you ? `${you}#you-decides` : "/learn/who-decides"}>Who decides what for your address</Link></p>
    </>
  );
}

import Link from "next/link";
import { publicClient } from "@/lib/data";
import { councilBySlug } from "@/lib/councils";
import { fixLink, linkFixes, type LinkFix } from "@/lib/links";
import { parliamentNow, type HouseNow } from "@/lib/parliamentNow";

// "What matters to me right now" (Romily, 6 Oct): what is happening this month that touches the person's own address,
// from the jobs that already run: open consultations, the council's next meetings and what it has just decided, new
// traffic orders, schools proposed to open or close, and whether Parliament is sitting. Each line is dated and links to
// the record it came from. Ordered by date only: how a profile should order council business is still being discussed
// with Romily (round eight q15), so nothing here is sorted by importance or matched to the person.
const WINDOW = 42; // days either side of today for meetings
const RECENT_NOTICES = 30;

type Consult = { url: string; title: string; closes: string };
type Item = { meeting_id: number; item_id: number; meeting_date: string; body: string; title: string; kind: string; url: string };
type Outcome = { meeting_id: number; item_id: number; outcome: string; sentence: string; minutes_url: string };
type Notice = { notice_id: string; notice_type: string | null; title: string | null; published: string | null; url: string };
type School = { urn: number; name: string; status: string; phase: string | null; open_date: string | null; close_date: string | null; reason_opened: string | null; reason_closed: string | null; gias_url: string };

const iso = (d: Date) => d.toISOString().slice(0, 10);
const day = (d: string, weekday = false) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { ...(weekday ? { weekday: "short" as const } : {}), day: "numeric", month: "long", timeZone: "UTC" });
const clip = (t: string, n = 140) => (t.length > n ? t.slice(0, n - 3).trimEnd() + "…" : t);
const HOUSE = { Commons: "The House of Commons", Lords: "The House of Lords" } as const;

function parliamentLine(hs: HouseNow[]) {
  const [c, l] = [hs.find((h) => h.house === "Commons"), hs.find((h) => h.house === "Lords")];
  if (c && l && c.current && l.current && c.current.end === l.current.end) return `Both Houses of Parliament are in recess until ${day(c.current.end)}.`;
  return hs.map(houseLine).join(" ");
}

function houseLine(h: HouseNow) {
  if (h.current) return `${HOUSE[h.house]} is in recess until ${day(h.current.end)}.`;
  return `${HOUSE[h.house]} is sitting${h.next ? `; its next recess starts ${day(h.next.start)}` : ""}.`;
}

export default async function RightNow({ councilSlug, district }: { councilSlug: string | null; district: string | null }) {
  const today = new Date();
  const t = iso(today);
  const ahead = iso(new Date(today.getTime() + WINDOW * 86400000));
  const back = iso(new Date(today.getTime() - WINDOW * 86400000));
  const noticesSince = iso(new Date(today.getTime() - RECENT_NOTICES * 86400000));
  const council = councilSlug ? await councilBySlug(councilSlug) : null;
  const db = publicClient();
  const none = Promise.resolve({ data: [] as never[] });
  const [FX, houses, { data: consults }, { data: items }, { data: notices }, { data: schools }] = await Promise.all([
    linkFixes().catch(() => new Map<string, LinkFix>()),
    parliamentNow().catch(() => null),
    council ? db.from("council_consultations").select("url, title, closes").eq("council_slug", council.slug).gte("closes", t).order("closes").limit(4) : none,
    council ? db.from("council_agenda_items").select("meeting_id, item_id, meeting_date, body, title, kind, url").eq("council_slug", council.slug).neq("kind", "placeholder").gte("meeting_date", back).lte("meeting_date", ahead).order("meeting_date").order("item_id") : none,
    council ? db.from("gazette_notices").select("notice_id, notice_type, title, published, url").eq("council_slug", council.slug).gte("published", noticesSince).order("published", { ascending: false }).limit(4) : none,
    council?.gss ? db.from("school_changes").select("urn, name, status, phase, open_date, close_date, reason_opened, reason_closed, gias_url").or(`district_gss.eq.${council.gss},la_gss.eq.${council.gss}`).in("status", ["Proposed to open", "Open, but proposed to close"]).order("name").limit(4) : none,
  ]);
  const L = (u: string) => fixLink(FX, u)?.href ?? u;

  const rows = (items ?? []) as Item[];
  const past = rows.filter((r) => r.meeting_date < t);
  const { data: outs } = past.length
    ? await db.from("council_item_outcomes").select("meeting_id, item_id, outcome, sentence, minutes_url").eq("council_slug", council!.slug).in("meeting_id", [...new Set(past.map((r) => r.meeting_id))])
    : { data: [] as Outcome[] };
  const outcomeOf = new Map(((outs ?? []) as Outcome[]).map((o) => [`${o.meeting_id}:${o.item_id}`, o]));
  // The next meeting only, so the list stays short; the council page has the rest.
  const next = rows.filter((r) => r.meeting_date >= t);
  const nextId = next[0]?.meeting_id;
  const nextItems = next.filter((r) => r.meeting_id === nextId);
  // Newest decisions first, only those whose result was read word for word from the minutes.
  const decided = past.map((r) => ({ r, o: outcomeOf.get(`${r.meeting_id}:${r.item_id}`) })).filter((x): x is { r: Item; o: Outcome } => Boolean(x.o)).sort((a, b) => b.r.meeting_date.localeCompare(a.r.meeting_date)).slice(0, 3);
  const cs = (consults ?? []) as Consult[];
  const ns = (notices ?? []) as Notice[];
  const ss = (schools ?? []) as School[];
  const name = council?.name ?? (district ? `${district} council` : "your council");
  const councilHref = council ? `/council/${council.slug}` : null;
  const anything = cs.length || nextItems.length || decided.length || ns.length || ss.length;

  return (
    <>
      <ul className="now-list">
        {cs.length ? (
          <li>
            <h3>Have your say</h3>
            <ul className="auto-list">{cs.slice(0, 3).map((x) => <li key={x.url}><a href={L(x.url)} rel="noopener">{x.title}</a> <span className="meta">closes {day(x.closes)}</span></li>)}</ul>
            <p className="meta">Open consultations on {name}&rsquo;s own consultation site, closing soonest first.</p>
          </li>
        ) : null}
        {nextItems.length ? (
          <li>
            <h3>Next at the council: {day(nextItems[0].meeting_date, true)}, {nextItems[0].body}</h3>
            <ul className="auto-list">{nextItems.slice(0, 4).map((it) => <li key={it.item_id}>{it.kind === "motion" ? <span className="chip none">Motion</span> : null} {it.title}</li>)}</ul>
            <p className="meta"><a href={L(nextItems[0].url)} rel="noopener">The agenda</a>, as the council titled each item{nextItems.length > 4 ? `; ${nextItems.length - 4} more on it` : ""}.</p>
          </li>
        ) : null}
        {decided.length ? (
          <li>
            <h3>Just decided</h3>
            <ul className="auto-list">
              {decided.map(({ r, o }) => (
                <li key={`${r.meeting_id}:${r.item_id}`}>{clip(r.title)} <span className="meta">{r.body}, {day(r.meeting_date)}</span><br /><b>{o.outcome}</b>: &ldquo;{o.sentence}&rdquo; <a href={L(o.minutes_url)} rel="noopener" className="meta">Minutes</a></li>
              ))}
            </ul>
            <p className="meta">The result in the minutes&rsquo; own words, read automatically; where the words could not be read, an item is left out here and shown on the council page.</p>
          </li>
        ) : null}
        {ns.length ? (
          <li>
            <h3>New traffic and highways orders</h3>
            <ul className="auto-list">{ns.slice(0, 3).map((r) => <li key={r.notice_id}><a href={L(r.url)} rel="noopener">{clip(r.title ?? "Notice", 170)}</a> <span className="meta">{r.notice_type}{r.published ? `, ${day(r.published)}` : ""}</span></li>)}</ul>
            <p className="meta">Published in The Gazette in the last {RECENT_NOTICES} days (Open Government Licence).</p>
          </li>
        ) : null}
        {ss.length ? (
          <li>
            <h3>Schools proposed to open or close</h3>
            <ul className="auto-list">
              {ss.slice(0, 3).map((r) => {
                const opening = r.status === "Proposed to open";
                const why = opening ? r.reason_opened : r.reason_closed;
                const when = opening ? r.open_date : r.close_date;
                return <li key={r.urn}><a href={L(r.gias_url)} rel="noopener">{r.name}</a>{r.phase ? ` (${r.phase.toLowerCase()})` : ""} — {r.status.toLowerCase()}{why ? `; reason recorded: ${why.toLowerCase()}` : ""}{when ? `; proposed date ${day(when)}` : ""}</li>;
              })}
            </ul>
            <p className="meta">The Department for Education&rsquo;s register, Get Information about Schools. Most are a school becoming an academy, which changes who runs it, not whether it is there.</p>
          </li>
        ) : null}
        {houses ? (
          <li>
            <h3>Parliament</h3>
            <p className="small">{parliamentLine(houses)}</p>
            <p className="meta">From UK Parliament&rsquo;s <a href="https://whatson.parliament.uk/" rel="noopener">What&rsquo;s On calendar</a>.</p>
          </li>
        ) : null}
      </ul>
      {!anything ? (
        <p className="empty">Nothing from {name}&rsquo;s council papers, consultations or notices in the six weeks either side of today that we can read yet. We read meeting papers, consultation sites and notices for some councils so far, not all; the council&rsquo;s own website has the rest.</p>
      ) : null}
      {councilHref ? <p className="meta"><Link href={councilHref}>Everything {name} is deciding, with sources &rarr;</Link></p> : null}
    </>
  );
}

import { publicClient } from "@/lib/data";
import { billLabel, outcomeLabel, titleMatchesSub, type HomeSub, type NowLabel } from "@/lib/homeTopics";

// "What's happening?" on the Your Home pages (Romily, 26 Oct points 1 and 6). Only what the site already reads, each item
// dated and linked to its record: bills in Parliament (UK Parliament Bills API, Open Parliament Licence), and, where we
// read the council's papers, its agenda items, the results read from its minutes and its open consultations. An item is
// filed under a sub-topic only by the fixed word lists in lib/homeTopics.ts. A failed source simply adds nothing.
export type Happening = { id: string; title: string; date: string; dateWord: string; label: NowLabel | null; where: string; text: string; url: string; detail: string; kind: "bill" | "member-bill" | "council" | "consultation" };

const H = { "User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)" };
// Search words sent to the Bills API for each sub-topic. The API's search is loose ("housing" also finds "House of
// Lords"), so every result is then filtered by the sub-topic's own word list; these words only decide what is asked for.
const BILL_SEARCH: Record<HomeSub, string[]> = {
  renting: ["renters", "tenants", "landlord", "social housing", "homelessness"],
  owning: ["leasehold", "mortgage", "stamp duty", "homeowners", "commonhold"],
  housing: ["planning", "housing", "new homes", "new towns"],
};
// The 2024 Parliament's first session in the Bills API (it began on 9 July 2024). An Act from an earlier Parliament is
// old news here; a bill that is not in the latest session has fallen.
const FIRST_SESSION_THIS_PARLIAMENT = 39;

type RawBill = { billId: number; shortTitle: string; lastUpdate: string; billWithdrawn: string | null; isDefeated: boolean; billTypeId: number; introducedSessionId: number; includedSessionIds: number[]; isAct: boolean; currentHouse: string; currentStage?: { description: string; house: string; stageSittings?: { date: string }[] } | null };

export async function billsFor(sub: HomeSub): Promise<Happening[]> {
  const found = new Map<number, RawBill>();
  await Promise.all(BILL_SEARCH[sub].map(async (term) => {
    try {
      const r = await fetch(`https://bills-api.parliament.uk/api/v1/Bills?SearchTerm=${encodeURIComponent(term)}&SortOrder=DateUpdatedDescending&Take=25`, { signal: AbortSignal.timeout(15000), headers: H, next: { revalidate: 3600 } });
      if (!r.ok) return;
      for (const b of ((await r.json()) as { items?: RawBill[] }).items ?? []) found.set(b.billId, b);
    } catch { /* this search adds nothing */ }
  }));
  const all = [...found.values()];
  const latest = Math.max(0, ...all.flatMap((b) => b.includedSessionIds ?? []));
  return all
    .filter((b) => titleMatchesSub(b.shortTitle, sub))
    .filter((b) => (b.isAct ? b.introducedSessionId >= FIRST_SESSION_THIS_PARLIAMENT : (b.includedSessionIds ?? []).includes(latest) && !b.isDefeated && !b.billWithdrawn))
    .map((b) => {
      // The latest sitting that has happened (a stage can be listed with a future date), else the record's last update.
      const today = new Date().toISOString().slice(0, 10);
      const sittings = (b.currentStage?.stageSittings ?? []).map((s) => s.date.slice(0, 10)).filter((d) => d <= today).sort();
      const date = sittings.at(-1) ?? b.lastUpdate.slice(0, 10);
      const government = b.billTypeId === 1;
      const stage = b.isAct ? "Became law (Royal Assent)" : b.currentStage ? `Now at: ${b.currentStage.description.toLowerCase()}, House of ${b.currentStage.house}` : "";
      return {
        id: `bill-${b.billId}`, title: b.shortTitle, date, dateWord: b.isAct ? "Royal Assent" : sittings.length ? "Last stage" : "Last updated", label: billLabel(b), where: "UK Parliament", text: b.shortTitle,
        url: `https://bills.parliament.uk/bills/${b.billId}`, detail: `${government ? "A Government Bill" : "A private member's bill"}. ${stage}.`, kind: government || b.isAct ? "bill" as const : "member-bill" as const,
      };
    });
}

const BACK = 90, AHEAD = 42;

export async function councilFor(slug: string, councilName: string, sub: HomeSub): Promise<Happening[]> {
  const db = publicClient();
  const today = new Date();
  const t = today.toISOString().slice(0, 10);
  const back = new Date(today.getTime() - BACK * 86400000).toISOString().slice(0, 10);
  const ahead = new Date(today.getTime() + AHEAD * 86400000).toISOString().slice(0, 10);
  const [{ data: consults }, { data: items }] = await Promise.all([
    db.from("council_consultations").select("url, title, closes").eq("council_slug", slug).gte("closes", t).order("closes").limit(40),
    db.from("council_agenda_items").select("meeting_id, item_id, meeting_date, body, title, kind, url").eq("council_slug", slug).neq("kind", "placeholder").gte("meeting_date", back).lte("meeting_date", ahead).order("meeting_date"),
  ]);
  type Item = { meeting_id: number; item_id: number; meeting_date: string; body: string; title: string; kind: string; url: string };
  const mine = ((items ?? []) as Item[]).filter((i) => titleMatchesSub(i.title, sub));
  const past = mine.filter((i) => i.meeting_date < t);
  const { data: outs } = past.length
    ? await db.from("council_item_outcomes").select("meeting_id, item_id, outcome, sentence, minutes_url").eq("council_slug", slug).in("meeting_id", [...new Set(past.map((i) => i.meeting_id))])
    : { data: [] };
  const outcome = new Map(((outs ?? []) as { meeting_id: number; item_id: number; outcome: string; sentence: string; minutes_url: string }[]).map((o) => [`${o.meeting_id}:${o.item_id}`, o]));
  const out: Happening[] = [];
  for (const c of (consults ?? []) as { url: string; title: string; closes: string }[]) {
    if (!titleMatchesSub(c.title, sub)) continue;
    out.push({ id: `cons-${c.url}`, title: c.title, date: c.closes, dateWord: "Closes", label: "consultation", where: councilName, text: c.title, url: c.url, detail: `On ${councilName}'s consultation site.`, kind: "consultation" });
  }
  for (const i of mine) {
    const o = outcome.get(`${i.meeting_id}:${i.item_id}`);
    const upcoming = i.meeting_date >= t;
    out.push({
      id: `item-${i.meeting_id}-${i.item_id}`, title: i.title, date: i.meeting_date, dateWord: upcoming ? "Meeting" : "Met", label: o ? outcomeLabel(o.outcome) : null, where: councilName, text: i.title, url: o?.minutes_url ?? i.url,
      detail: upcoming ? `On the agenda for ${i.body}.` : o ? `${i.body}. The minutes record: “${o.sentence}”` : `${i.body}. We couldn't read the result from the minutes.`,
      kind: "council",
    });
  }
  return out;
}

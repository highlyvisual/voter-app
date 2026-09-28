// Item 7 of the data-sources build list: what Parliament is doing now, for Learn. Both from UK Parliament open data
// (Open Parliament Licence), cached for an hour: recess dates from the What's On API and a bill's stages from the Bills
// API. A failed request hides the panel; nothing is guessed.
const H = { "User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)" };

export type Recess = { house: "Commons" | "Lords"; start: string; end: string };
export type HouseNow = { house: "Commons" | "Lords"; current: Recess | null; next: Recess | null };

const ymd = (d: Date) => d.toISOString().slice(0, 10);

export async function parliamentNow(today = new Date()): Promise<HouseNow[] | null> {
  const from = ymd(new Date(today.getTime() - 60 * 86400000));
  const to = ymd(new Date(today.getTime() + 200 * 86400000));
  try {
    const r = await fetch(`https://whatson-api.parliament.uk/calendar/events/nonsitting.json?queryParameters.startDate=${from}&queryParameters.endDate=${to}`, { signal: AbortSignal.timeout(15000), headers: H, next: { revalidate: 3600 } });
    if (!r.ok) return null;
    const rows = (await r.json()) as { House: string; StartDate: string; EndDate: string; Category: string }[];
    // Recesses only: non-sitting Fridays and bank holidays are left out.
    const recesses: Recess[] = rows.filter((e) => /^Recess - (Commons|Lords)$/.test(e.Category) && (e.House === "Commons" || e.House === "Lords"))
      .map((e) => ({ house: e.House as Recess["house"], start: e.StartDate.slice(0, 10), end: e.EndDate.slice(0, 10) }))
      .sort((a, b) => a.start.localeCompare(b.start));
    const t = ymd(today);
    return (["Commons", "Lords"] as const).map((house) => {
      const mine = recesses.filter((x) => x.house === house);
      return { house, current: mine.find((x) => x.start <= t && t <= x.end) ?? null, next: mine.find((x) => x.start > t) ?? null };
    });
  } catch {
    return null;
  }
}

export type BillStage = { description: string; house: string; dates: string[] };
export type Bill = { id: number; title: string; longTitle: string; currentStage: string | null; currentHouse: string | null; isAct: boolean; defeated: boolean; withdrawn: boolean; lastUpdate: string | null; stages: BillStage[]; sponsors: string[] };

export async function billTracker(billId: number): Promise<Bill | null> {
  try {
    const opts = () => ({ signal: AbortSignal.timeout(15000), headers: H, next: { revalidate: 3600 } });
    const [b, s] = await Promise.all([
      fetch(`https://bills-api.parliament.uk/api/v1/Bills/${billId}`, opts()).then((r) => (r.ok ? r.json() : null)),
      fetch(`https://bills-api.parliament.uk/api/v1/Bills/${billId}/Stages?Take=60`, opts()).then((r) => (r.ok ? r.json() : null)),
    ]);
    if (!b || !s) return null;
    type St = { description: string; house: string; sortOrder: number; stageSittings?: { date: string }[] };
    const stages = ((s.items ?? []) as St[]).sort((a, c) => a.sortOrder - c.sortOrder)
      .map((x) => ({ description: x.description, house: x.house, dates: (x.stageSittings ?? []).map((y) => y.date.slice(0, 10)) }));
    type Sp = { member?: { name?: string } | null; organisation?: { name?: string } | null };
    return {
      id: billId, title: b.shortTitle, longTitle: b.longTitle ?? "",
      currentStage: b.currentStage?.description ?? null, currentHouse: b.currentStage?.house ?? b.currentHouse ?? null,
      isAct: Boolean(b.isAct), defeated: Boolean(b.isDefeated), withdrawn: Boolean(b.billWithdrawn), lastUpdate: b.lastUpdate ? String(b.lastUpdate).slice(0, 10) : null,
      stages, sponsors: [...new Set(((b.sponsors ?? []) as Sp[]).map((x) => x.organisation?.name).filter((n): n is string => Boolean(n)))],
    };
  } catch (ex) {
    console.error(`billTracker(${billId}) failed:`, ex);
    return null;
  }
}

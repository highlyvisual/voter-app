// UK Parliament open data (developer.parliament.uk). Free, no authentication, Open Parliament Licence.
// Used only for candidates with a stored, exact-matched parliament_member_id; never a live name guess.
const H = { "User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)" };

export type Membership = { house: string; from: string | null; start: string; end: string | null };
export type PartySplit = { party: string; aye: number; no: number };
export type Division = { id: number; title: string; date: string; votedAye: boolean | null; ayes: number; noes: number; context: string; topic: string | null; justification: { text: string; url: string; debate: string } | null; split?: PartySplit[]; ownParty?: string | null; withParty?: boolean | null };
export type Interest = { category: string; summary: string; registered: string };
export type ParliamentRecord = { memberId: number; name: string; party: string | null; memberships: Membership[]; divisions: Division[]; totalDivisionsSampled: number; interests?: Interest[]; interestsTotal?: number; extras?: ParliamentExtras };

export async function parliamentRecord(memberId: number, take = 8): Promise<ParliamentRecord | null> {
  try {
    const [m, bio, votes] = await Promise.all([
      fetch(`https://members-api.parliament.uk/api/Members/${memberId}`, { signal: AbortSignal.timeout(6000), headers: H, next: { revalidate: 604800 } }).then((r) => (r.ok ? r.json() : null)),
      fetch(`https://members-api.parliament.uk/api/Members/${memberId}/Biography`, { signal: AbortSignal.timeout(6000), headers: H, next: { revalidate: 604800 } }).then((r) => (r.ok ? r.json() : null)),
      fetch(`https://commonsvotes-api.parliament.uk/data/divisions.json/membervoting?queryParameters.memberId=${memberId}&queryParameters.take=${take}`, { signal: AbortSignal.timeout(6000), headers: H, next: { revalidate: 86400 } }).then((r) => (r.ok ? r.json() : [])),
    ]);
    if (!m) return null;
    const v = m.value ?? m;
    // representations = seats held (constituency, dates); the full history, most recent first
    const memberships: Membership[] = ((bio?.value?.representations ?? []) as { house: number; name: string; startDate: string; endDate: string | null }[])
      .map((h) => ({ house: h.house === 1 ? "Commons" : "Lords", from: h.name ?? null, start: (h.startDate ?? "").slice(0, 10), end: h.endDate ? h.endDate.slice(0, 10) : null }))
      .sort((a, b) => b.start.localeCompare(a.start));
    const raw = ((votes ?? []) as { MemberVotedAye: boolean | null; MemberWasTeller: boolean; PublishedDivision: { DivisionId: number; Title: string; Date: string; AyeCount: number; NoCount: number } }[]);
    // Justification (WP-B6): the member's own spoken contribution in the same debate on the day of the division, from Hansard. Else none.
    const days = [...new Set(raw.map((x) => x.PublishedDivision.Date.slice(0, 10)))];
    const spoken = new Map<string, { DebateSection: string; DebateSectionExtId: string; ContributionTextFull: string }[]>();
    await Promise.all(days.map(async (d) => {
      try {
        const h = await fetch(`https://hansard-api.parliament.uk/search/contributions/Spoken.json?queryParameters.memberId=${memberId}&queryParameters.startDate=${d}&queryParameters.endDate=${d}&queryParameters.take=20&queryParameters.house=Commons`, { signal: AbortSignal.timeout(6000), headers: H, next: { revalidate: 86400 } }).then((r) => (r.ok ? r.json() : null));
        spoken.set(d, h?.Results ?? []);
      } catch { spoken.set(d, []); }
    }));
    const divisions: Division[] = raw.map((x) => {
      const t = x.PublishedDivision.Title; const d = x.PublishedDivision.Date.slice(0, 10);
      const bill = t.split(/:| Second Reading| Third Reading| Report Stage| Committee| Programme| Money Resolution/)[0].trim().toLowerCase();
      const hit = (spoken.get(d) ?? []).find((c) => c.DebateSection && bill && c.DebateSection.trim().toLowerCase().includes(bill.slice(0, 30)));
      return {
        id: x.PublishedDivision.DivisionId, title: t, date: d, votedAye: x.MemberVotedAye, ayes: x.PublishedDivision.AyeCount, noes: x.PublishedDivision.NoCount,
        context: contextTag(t), topic: topicOf(t),
        justification: hit ? { text: hit.ContributionTextFull.slice(0, 320) + (hit.ContributionTextFull.length > 320 ? "…" : ""), url: `https://hansard.parliament.uk/Commons/${d}/debates/${hit.DebateSectionExtId}`, debate: hit.DebateSection.trim() } : null,
      };
    });
    return { memberId, name: v.nameDisplayAs ?? v.nameFullTitle ?? "", party: v.latestParty?.name ?? null, memberships, divisions, totalDivisionsSampled: divisions.length };
  } catch {
    return null;
  }
}

// Context tag from a fixed set, derived from the division title only; "Free vote" is never asserted (it cannot be read from the record).
export function contextTag(title: string): string {
  const t = title.toLowerCase();
  if (/ten minute rule/.test(t)) return "Private Member's Bill";
  if (/opposition day|opposition motion/.test(t)) return "Opposition Day motion";
  if (/amendment|new clause/.test(t)) return "Amendment";
  if (/programme|business of the house|sitting|allocation of time|closure|deferred division|carry-over|standing order/.test(t)) return "Procedural";
  if (/reading|report stage|committee of the whole|lords amendments|money resolution|ways and means/.test(t)) return "Bill stage (sponsor not classified)";
  return "Motion";
}
// Topic mapping by keyword; null when no keyword matches. Used only to group, never to summarise.
export function topicOf(title: string): string | null {
  const t = title.toLowerCase();
  const map: [RegExp, string][] = [
    [/tax|budget|finance|national insurance|universal credit|benefit|pension|welfare|cost of living|employment/, "money_and_cost_of_living"],
    [/\bhousing|\brenters?\b|\brent\b|planning|leasehold|homeless/, "housing_and_property"],
    [/nhs|health|social care|mental health|hospital|assisted dying|terminally ill/, "healthcare_and_social_care"],
    [/school|education|university|student|children.?s wellbeing|skills/, "education_and_universities"],
    [/climate|energy|environment|water|net zero|great british energy|nature|flood/, "environment_climate_and_energy"],
    [/immigration|asylum|border|migration|nationality|citizenship/, "immigration_and_borders"],
    [/crime|police|sentenc|justice|prison|offender|terrorism|public order/, "crime_policing_and_justice"],
    [/defence|armed forces|ukraine|foreign|european union|nato|israel|gaza|trade/, "defence_foreign_affairs_and_eu"],
    [/equality|discrimination|rights|gender|disab|race relations|conversion/, "equality_and_rights"],
  ];
  for (const [re, k] of map) if (re.test(t)) return k;
  return null;
}

// Register of Members' Financial Interests (UK Parliament Interests API, Open Parliament Licence). Entries stay on the
// register for twelve months after they expire, so a recent former MP may still have some.
export async function interestsFor(memberId: number, take = 12): Promise<{ items: Interest[]; total: number } | null> {
  try {
    const j = await fetch(`https://interests-api.parliament.uk/api/v1/Interests?MemberId=${memberId}&Take=${take}&SortOrder=PublishingDateDescending`, { signal: AbortSignal.timeout(6000), headers: H, next: { revalidate: 86400 } }).then((r) => (r.ok ? r.json() : null));
    if (!j) return null;
    return { total: j.totalResults ?? 0, items: (j.items ?? []).map((i: { summary: string; registrationDate: string; category?: { name: string } }) => ({ category: i.category?.name ?? "", summary: i.summary, registered: i.registrationDate })) };
  } catch { return null; }
}

// How each party voted in a division, and whether this member voted with most of their own party at the time.
// Counts only; a vote against one's party can be principle, constituency or conscience, and the record doesn't say.
export async function withPartySplits(memberId: number, divisions: Division[]): Promise<Division[]> {
  return Promise.all(divisions.map(async (d) => {
    try {
      const j = await fetch(`https://commonsvotes-api.parliament.uk/data/division/${d.id}.json`, { signal: AbortSignal.timeout(6000), headers: H, next: { revalidate: 604800 } }).then((r) => (r.ok ? r.json() : null));
      if (!j) return d;
      type M = { MemberId: number; Party: string };
      const tally = new Map<string, PartySplit>();
      const add = (list: M[] | undefined, side: "aye" | "no") => (list ?? []).forEach((m) => { const t = tally.get(m.Party) ?? { party: m.Party, aye: 0, no: 0 }; t[side]++; tally.set(m.Party, t); });
      add(j.Ayes, "aye"); add(j.Noes, "no"); add(j.AyeTellers, "aye"); add(j.NoTellers, "no");
      const all: M[] = [...(j.Ayes ?? []), ...(j.Noes ?? []), ...(j.AyeTellers ?? []), ...(j.NoTellers ?? [])];
      const own = all.find((m) => m.MemberId === memberId)?.Party ?? null;
      const t = own ? tally.get(own) : null;
      const withParty = t && d.votedAye !== null && t.aye !== t.no ? (d.votedAye ? t.aye > t.no : t.no > t.aye) : null;
      return { ...d, split: [...tally.values()].sort((a, b) => b.aye + b.no - (a.aye + a.no)), ownParty: own, withParty };
    } catch { return d; }
  }));
}

// Item 6 of the data-sources build list: more of the member's own record, all from the Members API (Open Parliament
// Licence). Parliament's own one-line synopsis; early day motions the member tabled or signed (titles as published);
// written questions the member asked (their own words, verbatim, never shortened into a summary of ours).
export type Edm = { id: number; title: string; number: string; date: string; prayer: boolean };
export type WrittenQuestion = { id: number; uin: string; date: string; text: string; to: string | null; house: string };
export type ParliamentExtras = { synopsis: string | null; edms: { total: number; items: Edm[] }; questions: { total: number; items: WrittenQuestion[] } };

export async function parliamentExtras(memberId: number): Promise<ParliamentExtras | null> {
  const get = (p: string, revalidate: number) => fetch(`https://members-api.parliament.uk/api/Members/${memberId}/${p}`, { signal: AbortSignal.timeout(6000), headers: H, next: { revalidate } }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const [syn, edm, wq] = await Promise.all([get("Synopsis", 604800), get("Edms?page=1", 86400), get("WrittenQuestions?page=1", 86400)]);
  if (!syn && !edm && !wq) return null;
  // The synopsis is HTML with links to Parliament's own pages; keep the words only.
  const synopsis = typeof syn?.value === "string" ? syn.value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : null;
  type E = { value: { id: number; title: string; number: string; dateTabled: string; isPrayer: boolean } };
  type Q = { value: { id: number; uin: string; dateTabled: string; questionText: string; house: number; answeringBody?: { name?: string } | null } };
  return {
    synopsis,
    edms: { total: edm?.totalResults ?? 0, items: ((edm?.items ?? []) as E[]).slice(0, 8).map(({ value: v }) => ({ id: v.id, title: v.title, number: v.number, date: (v.dateTabled ?? "").slice(0, 10), prayer: Boolean(v.isPrayer) })) },
    questions: { total: wq?.totalResults ?? 0, items: await fullQuestions(((wq?.items ?? []) as Q[]).map(({ value: v }) => ({ id: v.id, uin: v.uin, date: (v.dateTabled ?? "").slice(0, 10), text: v.questionText, to: v.answeringBody?.name ?? null, house: v.house === 2 ? "Lords" : "Commons" }))) },
  };
}

// The Members API (and the Questions API's list) cut question text at 255 characters. The member's words are shown
// whole or not at all: a cut question is re-read from the Written Questions API, and dropped if that fails.
async function fullQuestions(qs: WrittenQuestion[]): Promise<WrittenQuestion[]> {
  const latest = [...qs].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 6);
  const out = await Promise.all(latest.map(async (q) => {
    if (q.text.length < 255) return q;
    const j = await fetch(`https://questions-statements-api.parliament.uk/api/writtenquestions/questions/${q.id}`, { signal: AbortSignal.timeout(6000), headers: H, next: { revalidate: 604800 } }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const text = j?.value?.questionText;
    return typeof text === "string" && text.length >= q.text.length ? { ...q, text } : null;
  }));
  return out.filter((q): q is WrittenQuestion => q !== null);
}

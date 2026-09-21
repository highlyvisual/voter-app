// Area statistics from official open data. These describe the constituency or ward, never a household.
const H = { "User-Agent": "voter-app (github.com/highlyvisual/voter-app)" };

export type PetitionRow = { id: number; action: string; total: number; local: number; url: string };
// Most-signed open petitions by people in this constituency, from petition.parliament.uk (signatures_by_constituency).
export async function topPetitionsFor(constituencyName: string, sample = 25): Promise<{ rows: PetitionRow[]; asOf: string } | null> {
  try {
    const list = await fetch("https://petition.parliament.uk/petitions.json?state=open", { headers: H, next: { revalidate: 86400 } }).then((r) => (r.ok ? r.json() : null));
    if (!list) return null;
    const ids = (list.data as { id: number }[]).slice(0, sample).map((p) => p.id);
    const details = await Promise.all(ids.map((id) => fetch(`https://petition.parliament.uk/petitions/${id}.json`, { headers: H, next: { revalidate: 86400 } }).then((r) => (r.ok ? r.json() : null)).catch(() => null)));
    const rows: PetitionRow[] = [];
    for (const d of details) {
      const a = d?.data?.attributes; if (!a) continue;
      const c = (a.signatures_by_constituency ?? []).find((x: { name: string }) => x.name.toLowerCase() === constituencyName.toLowerCase());
      if (c) rows.push({ id: d.data.id, action: a.action, total: a.signature_count, local: c.signature_count, url: `https://petition.parliament.uk/petitions/${d.data.id}` });
    }
    rows.sort((x, y) => y.local - x.local);
    return { rows: rows.slice(0, 5), asOf: new Date().toISOString().slice(0, 10) };
  } catch { return null; }
}

export type CrimeSummary = { month: string; total: number; categories: { category: string; count: number }[] };
// Recorded street-level crime within about a mile of a point, for the latest available month, from data.police.uk (OGL).
export async function crimeNear(lat: number, lng: number): Promise<CrimeSummary | null> {
  try {
    const avail = await fetch("https://data.police.uk/api/crimes-street-dates", { headers: H, next: { revalidate: 86400 } }).then((r) => (r.ok ? r.json() : null));
    const month: string | undefined = avail?.[0]?.date;
    if (!month) return null;
    const data = await fetch(`https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${month}`, { headers: H, next: { revalidate: 86400 } }).then((r) => (r.ok ? r.json() : null));
    if (!Array.isArray(data)) return null;
    const counts = new Map<string, number>();
    for (const c of data as { category: string }[]) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    const categories = [...counts.entries()].map(([category, count]) => ({ category: category.replace(/-/g, " "), count })).sort((a, b) => b.count - a.count).slice(0, 6);
    return { month, total: data.length, categories };
  } catch { return null; }
}

export type Hpi = { region: string; month: string; averagePrice: number; annualChange: number | null; flat: number | null; detached: number | null };
// UK House Price Index by local authority (HM Land Registry linked data, OGL). Tries the last few published months.
export function hpiRegionFromArea(areaName: string): string | null {
  const council = areaName.includes(":") ? areaName.split(":")[0] : "";
  if (!council) return null;
  return council.replace(/\b(Borough|District|County|City|Council|Metropolitan|Royal)\b/g, "").replace(/\s+of\s+/g, " ").trim().toLowerCase().replace(/[^a-z\s-]/g, "").replace(/\s+/g, "-");
}
export async function hpiFor(region: string): Promise<Hpi | null> {
  const now = new Date();
  for (let back = 2; back <= 6; back++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    const m = d.toISOString().slice(0, 7);
    try {
      const r = await fetch(`https://landregistry.data.gov.uk/data/ukhpi/region/${region}/month/${m}.json`, { headers: H, next: { revalidate: 604800 } });
      if (!r.ok) continue;
      const j = await r.json(); const t = j?.result?.primaryTopic;
      if (t?.averagePrice) return { region, month: m, averagePrice: t.averagePrice, annualChange: t.percentageAnnualChange ?? null, flat: t.averagePriceFlatMaisonette ?? null, detached: t.averagePriceDetached ?? null };
    } catch { /* try earlier month */ }
  }
  return null;
}

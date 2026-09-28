// Area statistics from official open data. These describe the constituency or ward, never a household.
const H = { "User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)" };

export type PetitionRow = { id: number; action: string; total: number; local: number; url: string };
// Most-signed open petitions by people in this constituency, from petition.parliament.uk (signatures_by_constituency).
export async function topPetitionsFor(constituencyName: string, sample = 25): Promise<{ rows: PetitionRow[]; asOf: string } | null> {
  try {
    const list = await fetch("https://petition.parliament.uk/petitions.json?state=open", { signal: AbortSignal.timeout(5000), headers: H, next: { revalidate: 86400 } }).then((r) => (r.ok ? r.json() : null));
    if (!list) return null;
    const ids = (list.data as { id: number }[]).slice(0, sample).map((p) => p.id);
    const details = await Promise.all(ids.map((id) => fetch(`https://petition.parliament.uk/petitions/${id}.json`, { signal: AbortSignal.timeout(5000), headers: H, next: { revalidate: 86400 } }).then((r) => (r.ok ? r.json() : null)).catch(() => null)));
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
    const avail = await fetch("https://data.police.uk/api/crimes-street-dates", { signal: AbortSignal.timeout(5000), headers: H, next: { revalidate: 86400 } }).then((r) => (r.ok ? r.json() : null));
    const month: string | undefined = avail?.[0]?.date;
    if (!month) return null;
    const data = await fetch(`https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${month}`, { signal: AbortSignal.timeout(5000), headers: H, next: { revalidate: 86400 } }).then((r) => (r.ok ? r.json() : null));
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
      const r = await fetch(`https://landregistry.data.gov.uk/data/ukhpi/region/${region}/month/${m}.json`, { signal: AbortSignal.timeout(5000), headers: H, next: { revalidate: 604800 } });
      if (!r.ok) continue;
      const j = await r.json(); const t = j?.result?.primaryTopic;
      if (t?.averagePrice) return { region, month: m, averagePrice: t.averagePrice, annualChange: t.percentageAnnualChange ?? null, flat: t.averagePriceFlatMaisonette ?? null, detached: t.averagePriceDetached ?? null };
    } catch { /* try earlier month */ }
  }
  return null;
}

// Claimant count (ONS via Nomis, Open Government Licence): people claiming unemployment-related benefits, with the
// rate as a share of working-age residents, for a ward or constituency GSS code, beside the national rate.
export type Claimant = { period: string; count: number; rate: number; nationRate: number | null; nationName: string };
export async function claimantFor(gss: string): Promise<Claimant | null> {
  const nation = gss.startsWith("W") ? ["W92000004", "Wales"] : gss.startsWith("S") ? ["S92000003", "Scotland"] : ["E92000001", "England"];
  try {
    // Wards can be requested by their ONS code; Westminster constituencies cannot, so fetch all 650 (2024 boundaries,
    // Nomis type 172; about 110 KB, cached a day) and pick this one out.
    const isConstituency = /^(E14|W07|S14|N05)/.test(gss);
    const url = `https://www.nomisweb.co.uk/api/v01/dataset/NM_162_1.data.csv?geography=${isConstituency ? "TYPE172" : gss},${nation[0]}&date=latest&gender=0&age=0&measure=1,2&measures=20100&select=date_name,geography_code,measure_name,obs_value`;
    const txt = await fetch(url, { signal: AbortSignal.timeout(5000), headers: H, next: { revalidate: 86400 } }).then((r) => (r.ok ? r.text() : ""));
    const rows = txt.trim().split("\n").slice(1).map((l) => l.split(",").map((x) => x.replace(/^"|"$/g, "")));
    const get = (code: string, measure: string) => rows.find((r) => r[1] === code && r[2].startsWith(measure));
    const c = get(gss, "Claimant count"), r = get(gss, "Claimants as a proportion"), n = get(nation[0], "Claimants as a proportion");
    if (!c || !r) return null;
    return { period: c[0], count: Number(c[3]), rate: Number(r[3]), nationRate: n ? Number(n[3]) : null, nationName: nation[1] };
  } catch { return null; }
}
// English Indices of Deprivation 2025 for the neighbourhood (LSOA) containing a point. England only.
export type Deprivation = { code: string; name: string; nation: string; indexName: string; edition: string; publisher: string; total: number; decile: number; rank: number | null; domains: { name: string; decile: number }[] };
const NATION_OF: Record<string, string> = { E: "England", W: "Wales", S: "Scotland", N: "Northern Ireland" };
// The official index of each nation, from its own publisher (docs/automation/open-data-mysociety.md, section 3): England's
// 2025 indices in deprivation_2025; Wales (WIMD 2025), Scotland (SIMD 2020v2) and Northern Ireland (NIMDM 2017) in
// deprivation_areas. Each index ranks only its own nation's areas, so a decile is never compared across a border. The area
// code comes from postcodes.io: 2021 LSOAs for England and Wales, 2011 data zones for Scotland (SIMD 2020 uses them), and
// 2001 Super Output Areas for Northern Ireland (NIMDM 2017 uses them).
export async function deprivationAt(lat: number, lng: number): Promise<Deprivation | null> {
  try {
    const pc = await fetch(`https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}&limit=1&radius=300`, { signal: AbortSignal.timeout(5000), next: { revalidate: 604800 } }).then((r) => r.json());
    const codes = pc?.result?.[0]?.codes ?? {};
    const country: string | undefined = pc?.result?.[0]?.country;
    const code: string | undefined = country === "Scotland" ? codes.lsoa11 : country === "Northern Ireland" ? codes.lsoa11 : (codes.lsoa21 ?? codes.lsoa);
    if (!code) return null;
    const { publicClient } = await import("@/lib/data");
    const db = publicClient();
    if (code.startsWith("E01")) {
      const [{ data }, { count }] = await Promise.all([db.from("deprivation_2025").select("*").eq("lsoa_code", code).maybeSingle(), db.from("deprivation_2025").select("lsoa_code", { count: "exact", head: true })]);
      if (!data) return null;
      return { code: data.lsoa_code, name: data.lsoa_name, nation: "England", indexName: "English Indices of Deprivation", edition: "2025", publisher: "Ministry of Housing, Communities and Local Government", total: count ?? 33755, decile: data.imd_decile, rank: data.imd_rank,
        domains: [["Income", data.income_decile], ["Employment", data.employment_decile], ["Education", data.education_decile], ["Health", data.health_decile], ["Crime", data.crime_decile], ["Housing and services", data.housing_services_decile], ["Living environment", data.living_env_decile]].map(([name, decile]) => ({ name: name as string, decile: decile as number })) };
    }
    const nation = NATION_OF[code[0]] ?? country;
    if (!nation || nation === "England") return null;
    const [{ data }, { count }] = await Promise.all([db.from("deprivation_areas").select("*").eq("area_code", code).maybeSingle(), db.from("deprivation_areas").select("area_code", { count: "exact", head: true }).eq("nation", nation)]);
    if (!data) return null;
    return { code: data.area_code, name: data.area_name ?? data.area_code, nation: data.nation, indexName: data.index_name, edition: data.edition, publisher: data.publisher, total: count ?? 0, decile: data.overall_decile, rank: data.overall_rank,
      domains: ((data.domains ?? []) as { name: string; decile: number }[]).map((d) => ({ name: d.name, decile: d.decile })) };
  } catch { return null; }
}

// "The area in numbers": official statistics for a council area from ONS Explore Local Statistics (ELS), which gathers
// indicators from ONS, DWP, HM Land Registry, DESNZ, Ofcom, DfT and others into one place for every council in the UK.
// Open Government Licence; each figure is credited to its original producer, with its period.
//
// The API is not formally documented (found through ELS's own "get the data" links on 27 Sept 2026), so a failed or
// changed response simply hides the panel. The same fixed list of indicators is used for every council, in the same
// order; nothing is compared with other councils or ranked.
export type LocalStat = { slug: string; label: string; subtitle: string; value: number; display: string; period: string; source: { name: string; href: string } | null };

// The fixed list, in display order. Indicators ELS doesn't publish for a nation are simply absent there.
export const LOCAL_STAT_SLUGS = [
  "population-count", "median-age", "gross-disposable-household-income-per-head", "gross-median-weekly-pay",
  "children-in-relative-poverty-after-housing", "claimant-count", "average-house-price", "housing-affordability-ratio",
  "healthy-life-expectancy-female", "healthy-life-expectancy-male", "greenhouse-gas-emissions", "gigabit-capable-broadband",
  "electric-vehicle-public-charging-devices", "active-businesses",
];

// Round eight q25 (Romily, 29 Sept): "I don't get the Council in numbers... so many people won't". Each figure gets an
// everyday name and one line on what it means, written from ELS's own definition (the subtitle), and a plain unit.
export const PLAIN: Record<string, { name: string; means: string; unit?: string }> = {
  "population-count": { name: "People living here", means: "An official estimate of everyone who lives in the area, in the middle of the year.", unit: "people" },
  "median-age": { name: "Typical age", means: "Half the people who live here are younger than this and half are older." },
  "gross-disposable-household-income-per-head": { name: "Money to live on, per person, per year", means: "Average household income per person after taxes, with benefits added: what people have to spend or save." },
  "gross-median-weekly-pay": { name: "Typical weekly pay, before tax", means: "For employees who live here: half earn more than this each week, half earn less." },
  "children-in-relative-poverty-after-housing": { name: "Children growing up in poverty", means: "The share of children under 16 in families on low incomes once housing costs are paid." },
  "claimant-count": { name: "People claiming unemployment-related benefits", means: "The share of people aged 16 to 64 claiming Jobseeker's Allowance or Universal Credit while looking for work." },
  "average-house-price": { name: "Average price of a home", means: "The average price of a home here in the month shown." },
  "housing-affordability-ratio": { name: "How many years of pay a home costs", means: "A typical home's price divided by the typical yearly pay of people who live here.", unit: "times yearly pay" },
  "healthy-life-expectancy-female": { name: "Years in good health: women", means: "How many years a girl born here can expect to live in good health, at current rates." },
  "healthy-life-expectancy-male": { name: "Years in good health: men", means: "How many years a boy born here can expect to live in good health, at current rates." },
  "greenhouse-gas-emissions": { name: "Greenhouse gases, per person", means: "Emissions from the area in a year, shared out per resident, in tonnes of carbon dioxide or its equivalent.", unit: "tonnes per person" },
  "gigabit-capable-broadband": { name: "Homes and businesses that can get the fastest broadband", means: "The share of addresses that can get gigabit broadband (1,000 Mbps)." },
  "electric-vehicle-public-charging-devices": { name: "Public chargers for electric cars", means: "Public charging points at all speeds, for every 100,000 people.", unit: "per 100,000 people" },
  "active-businesses": { name: "Businesses trading here", means: "Businesses with sales or staff in the year.", unit: "businesses" },
};

// Wider areas for the same figures (round eight q7: "the option to expand the geographical area"). ONS codes checked
// against ELS's own area pages on 29 Sept 2026. Regions exist only in England.
export const REGION_GSS: Record<string, string> = {
  "North East": "E12000001", "North West": "E12000002", "Yorkshire and The Humber": "E12000003", "East Midlands": "E12000004",
  "West Midlands": "E12000005", "East of England": "E12000006", "London": "E12000007", "South East": "E12000008", "South West": "E12000009",
};
export const NATION_GSS: Record<string, [string, string]> = { E: ["E92000001", "England"], W: ["W92000004", "Wales"], S: ["S92000003", "Scotland"], N: ["N92000002", "Northern Ireland"] };
export const UK_GSS = "K02000001";

type Item = {
  label: string;
  extension: { slug: string; subtitle?: string; prefix?: string | null; suffix?: string | null; subText?: string | null; decimalPlaces?: number; source?: { name: string; href: string }[] };
  dimension: { period: { category: { index: Record<string, number> } }; measure?: { category: { index: Record<string, number> } } };
  value: (number | null)[];
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ELS periods are ISO dates or intervals: "2024-06-30", "2024-01-01/P1Y", "2024-04-01/P1Y" (a financial year),
// "2022-01-01/P3Y", "2026-07-01/P1M".
export function periodText(p: string): string {
  const m = p.match(/^(\d{4})-(\d{2})-(\d{2})(?:\/P(\d+)([YM]))?$/);
  if (!m) return p;
  const [, y, mo, d, n, unit] = m;
  const year = Number(y), month = Number(mo);
  if (!unit) return `${Number(d)} ${MONTHS[month - 1]} ${year}`;
  if (unit === "M") return `${MONTHS[month - 1]} ${year}`;
  const years = Number(n);
  if (month === 1) return years === 1 ? `${year}` : `${year} to ${year + years - 1}`;
  const endYear = year + years;
  return `${MONTHS[month - 1]} ${year} to ${MONTHS[(month + 10) % 12]} ${endYear}`;
}

function format(value: number, e: Item["extension"], unit?: string): string {
  const dp = e.decimalPlaces ?? 0;
  const n = new Intl.NumberFormat("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(value);
  const tail = unit ?? e.subText;
  return `${e.prefix ?? ""}${n}${e.suffix ?? ""}${tail ? ` ${tail}` : ""}`;
}

export async function localStats(gss: string | null | undefined): Promise<LocalStat[]> {
  if (!gss || !/^[ENSWK]\d{8}$/.test(gss)) return [];
  try {
    const r = await fetch(`https://www.ons.gov.uk/explore-local-statistics/api/v1/data.json?geo=${gss}&time=latest`, {
      signal: AbortSignal.timeout(8000), headers: { "User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)" }, next: { revalidate: 86400 },
    });
    if (!r.ok) return [];
    const j = (await r.json()) as { link?: { item?: Item[] } };
    const bySlug = new Map((j.link?.item ?? []).map((it) => [it.extension?.slug, it]));
    const out: LocalStat[] = [];
    for (const slug of LOCAL_STAT_SLUGS) {
      const it = bySlug.get(slug);
      if (!it || !it.value?.length) continue;
      // With confidence intervals the measure dimension holds value, lower and upper bounds; take the value.
      const measure = it.dimension.measure?.category.index;
      const idx = measure && "value" in measure ? measure.value : 0;
      const v = it.value[idx];
      if (typeof v !== "number" || !Number.isFinite(v)) continue;
      const period = Object.keys(it.dimension.period.category.index)[0] ?? "";
      const src = it.extension.source?.[0] ?? null;
      out.push({ slug, label: it.label, subtitle: it.extension.subtitle ?? "", value: v, display: format(v, it.extension, PLAIN[slug]?.unit), period: periodText(period), source: src ? { name: src.name, href: src.href } : null });
    }
    return out;
  } catch {
    return [];
  }
}

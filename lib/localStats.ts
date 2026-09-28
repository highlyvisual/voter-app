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

function format(value: number, e: Item["extension"]): string {
  const dp = e.decimalPlaces ?? 0;
  const n = new Intl.NumberFormat("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(value);
  return `${e.prefix ?? ""}${n}${e.suffix ?? ""}${e.subText ? ` ${e.subText}` : ""}`;
}

export async function localStats(gss: string | null | undefined): Promise<LocalStat[]> {
  if (!gss || !/^[ENSW]\d{8}$/.test(gss)) return [];
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
      out.push({ slug, label: it.label, subtitle: it.extension.subtitle ?? "", value: v, display: format(v, it.extension), period: periodText(period), source: src ? { name: src.name, href: src.href } : null });
    }
    return out;
  } catch {
    return [];
  }
}

// Place facts from planning.data.gov.uk (Open Government Licence) for a point rounded to ~100 m. Never stored; describes the place, not a household.
const H = { "User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)" };
export type PlaceFact = { dataset: string; label: string; name: string; url: string; meaning: string };
const DATASETS: [string, string, string][] = [
  ["conservation-area", "Conservation area", "Extra planning controls on demolition, extensions and trees; check with the council before external works."],
  ["article-4-direction-area", "Article 4 direction", "Some permitted development rights are withdrawn here (the named direction says which), so works that normally need no permission may need it."],
  ["listed-building-outline", "Listed building", "Listed-building consent is needed for changes to the building, inside and out."],
  ["flood-risk-zone", "Flood risk zone", "In a flood zone as mapped for planning; relevant to insurance and to what can be built."],
  ["tree-preservation-zone", "Tree preservation order area", "Protected trees; works to them need council consent."],
  ["local-plan-boundary", "Planning authority", "The council whose local plan sets what can be built here."],
];
export async function placeFacts(lat: number, lng: number): Promise<PlaceFact[]> {
  const out: PlaceFact[] = [];
  await Promise.all(DATASETS.map(async ([ds, label, meaning]) => {
    try {
      const d = await fetch(`https://www.planning.data.gov.uk/entity.json?longitude=${lng}&latitude=${lat}&dataset=${ds}&limit=5`, { signal: AbortSignal.timeout(5000), headers: H, next: { revalidate: 604800 } }).then((r) => (r.ok ? r.json() : null));
      for (const e of (d?.entities ?? []) as { entity: number; name?: string; reference?: string }[]) {
        out.push({ dataset: ds, label, name: e.name || e.reference || label, url: `https://www.planning.data.gov.uk/entity/${e.entity}`, meaning });
      }
    } catch { /* optional */ }
  }));
  const order = DATASETS.map((d) => d[0]);
  return out.sort((a, b) => order.indexOf(a.dataset) - order.indexOf(b.dataset));
}

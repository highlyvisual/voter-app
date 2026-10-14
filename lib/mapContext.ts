// Main roads and place names around a voting area, from OpenStreetMap (ODbL) via the Overpass API, so the app's drawn
// map shows where the area is. Server only: the phone never contacts OpenStreetMap. Two public Overpass mirrors are
// asked at once and the first good answer wins; if neither answers within 7 seconds the map is drawn without them
// (the outline alone), and the next request tries again. A good answer is cached for a week.
export const OSM_CREDIT = "Roads and place names © OpenStreetMap contributors (ODbL)";
const MIRRORS = ["https://overpass-api.de/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];

export type MapRoad = { ref: string | null; name: string | null; kind: "major" | "minor"; line: [number, number][] };
export type MapPlace = { name: string; kind: string; at: [number, number] };

type OsmEl = { type: string; lat?: number; lon?: number; tags?: Record<string, string>; geometry?: { lat: number; lon: number }[] };

const r5 = (x: number) => Math.round(x * 1e5) / 1e5;

// bbox as [minLng, minLat, maxLng, maxLat]. A large area (a parliamentary seat) gets only the biggest roads and places.
export async function fetchMapContext(bbox: [number, number, number, number]): Promise<{ roads: MapRoad[]; places: MapPlace[] } | null> {
  const [x0, y0, x1, y1] = bbox;
  const padX = (x1 - x0) * 0.35, padY = (y1 - y0) * 0.35;
  const box = `${(y0 - padY).toFixed(4)},${(x0 - padX).toFixed(4)},${(y1 + padY).toFixed(4)},${(x1 + padX).toFixed(4)}`;
  const big = (x1 - x0) * (y1 - y0) > 0.02; // roughly 10 km by 15 km in England
  const roads = big ? "motorway|trunk|primary" : "motorway|trunk|primary|secondary";
  const places = big ? "city|town|village" : "city|town|village|suburb|neighbourhood|quarter";
  const q = `[out:json][timeout:6];(way["highway"~"^(${roads})$"](${box});node["place"~"^(${places})$"]["name"](${box}););out tags geom qt;`;

  const ask = async (url: string) => {
    const r = await fetch(url, { method: "POST", body: new URLSearchParams({ data: q }), headers: { "User-Agent": "whatsittome.org area map" }, signal: AbortSignal.timeout(7000), next: { revalidate: 604800 } });
    if (!r.ok) throw new Error(String(r.status));
    const j = (await r.json()) as { elements?: OsmEl[] };
    if (!Array.isArray(j.elements)) throw new Error("no elements");
    return j.elements;
  };
  let els: OsmEl[];
  try { els = await Promise.any(MIRRORS.map(ask)); } catch { return null; }

  const out: { roads: MapRoad[]; places: MapPlace[] } = { roads: [], places: [] };
  for (const e of els) {
    const t = e.tags ?? {};
    if (e.type === "way" && e.geometry?.length) {
      const kind = /^(motorway|trunk|primary)$/.test(t.highway ?? "") ? "major" : "minor";
      out.roads.push({ ref: t.ref ?? null, name: t.name ?? null, kind, line: e.geometry.map((p) => [r5(p.lon), r5(p.lat)]) });
    } else if (e.type === "node" && t.name && e.lat != null && e.lon != null) {
      out.places.push({ name: t.name, kind: t.place ?? "place", at: [r5(e.lon), r5(e.lat)] });
    }
  }
  // Keep the reply small: at most 400 road pieces and 40 places, biggest first.
  const rank: Record<string, number> = { city: 0, town: 1, village: 2, suburb: 3, quarter: 4, neighbourhood: 5 };
  out.places.sort((a, b) => (rank[a.kind] ?? 9) - (rank[b.kind] ?? 9));
  out.places = out.places.slice(0, 40);
  out.roads.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "major" ? -1 : 1));
  out.roads = out.roads.slice(0, 400);
  return out;
}

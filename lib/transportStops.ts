import atco from "./atco_areas.json";
// Public transport stops near a point, as GeoJSON for the map (round eight q6, next batch: transport). Two sources, both
// the DfT's NaPTAN register under the Open Government Licence: for England, planning.data.gov.uk's copy
// (transport-access-node) queried by bounding box; for Scotland and Wales, the NaPTAN API's file for the council's ATCO
// area (lib/atco_areas.json maps a council to its area), fetched whole, cached for a week and filtered by distance here.
// Northern Ireland is not in NaPTAN. Nothing about the viewer is kept; the point is the rounded one the page already uses.
const H = { "User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)" };
export type Stop = { name: string; detail: string; kind: "stop" | "station"; lat: number; lng: number; code: string; record: string };
// NaPTAN stop types, in the register's own words (NaPTAN schema guide). Bus and coach stops are one layer; everything a
// journey starts from that is not a roadside bus stop is the other.
const TYPES: Record<string, [string, "stop" | "station"]> = {
  BCT: ["Bus or coach stop", "stop"], BCS: ["Bus or coach station bay", "stop"], BCQ: ["Bus or coach station variable bay", "stop"], BCE: ["Bus or coach station entrance", "station"], BST: ["Bus or coach station", "station"],
  RSE: ["Railway station entrance", "station"], RLY: ["Railway platform", "station"], RPL: ["Railway platform", "station"],
  MET: ["Underground, metro or tram station entrance", "station"], PLT: ["Underground, metro or tram platform", "station"], TMU: ["Tram or metro stop", "station"],
  FER: ["Ferry terminal", "station"], FBT: ["Ferry berth", "station"], FTD: ["Ferry terminal entrance", "station"],
  AIR: ["Airport entrance", "station"], GAT: ["Airport gate", "station"], TXR: ["Taxi rank", "station"], STR: ["Shared taxi rank", "station"], LSE: ["Lift or cable car station entrance", "station"], LCB: ["Lift or cable car platform", "station"],
};
const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => Math.hypot((a.lat - b.lat) * 111.2, (a.lng - b.lng) * 111.2 * Math.cos((a.lat * Math.PI) / 180));
const normName = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/\btaff\b/g, "taf").replace(/^(the|city of|comhairle nan)\s+/, "").replace(/\s+(city|council)$/g, "").replace(/[^a-z]/g, "");
const ALIASES: Record<string, string> = { nahEileananSiar: "westernisles" };

/** The ATCO area for a council named the way postcodes.io names it, or null. */
export function atcoAreaFor(names: (string | null | undefined)[]): { atco: string; name: string; region: string | null } | null {
  const areas = (atco as { areas: { atco: string; name: string; region: string | null }[] }).areas;
  for (const n of names) {
    if (!n) continue;
    const k = ALIASES[n.replace(/[^A-Za-z]/g, "")] ?? normName(n);
    const hit = areas.find((a) => normName(a.name) === k);
    if (hit) return hit;
  }
  return null;
}

/** One platform or entrance per station: platforms of the same name collapse on to the entrance where there is one. */
function dedupe(stops: Stop[]): Stop[] {
  const out: Stop[] = []; const seen = new Map<string, Stop>();
  for (const s of stops) {
    if (s.kind === "stop") { out.push(s); continue; }
    const key = s.name.toLowerCase().replace(/\b(underground|rail|railway|station|entrance|platform|\d+)\b/g, "").replace(/[^a-z]/g, "");
    const prev = seen.get(key);
    if (!prev) { seen.set(key, s); out.push(s); }
    else if (/entrance/i.test(s.detail) && !/entrance/i.test(prev.detail)) { prev.lat = s.lat; prev.lng = s.lng; prev.detail = s.detail; prev.code = s.code; prev.record = s.record; }
  }
  return out;
}

async function england(lat: number, lng: number, d: number, limit: number): Promise<Stop[]> {
  const poly = `POLYGON((${lng - d} ${lat - d},${lng + d} ${lat - d},${lng + d} ${lat + d},${lng - d} ${lat + d},${lng - d} ${lat - d}))`;
  const r = await fetch(`https://www.planning.data.gov.uk/entity.geojson?dataset=transport-access-node&geometry=${encodeURIComponent(poly)}&geometry_relation=intersects&limit=${limit}`, { signal: AbortSignal.timeout(8000), headers: H, next: { revalidate: 604800 } });
  if (!r.ok) return [];
  const gj = await r.json();
  return ((gj?.features ?? []) as { geometry: { type: string; coordinates: number[] }; properties: Record<string, string | number> }[]).flatMap((f) => {
    const t = String(f.properties["transport-access-node-type"] ?? ""); const ty = TYPES[t];
    if (!ty || f.geometry?.type !== "Point") return [];
    return [{ name: String(f.properties.name ?? ty[0]), detail: ty[0], kind: ty[1], lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], code: String(f.properties.reference ?? ""), record: `https://www.planning.data.gov.uk/entity/${f.properties.entity}` }];
  });
}

async function naptanArea(atcoCode: string, lat: number, lng: number, radiusKm: number): Promise<Stop[]> {
  const r = await fetch(`https://naptan.api.dft.gov.uk/v1/access-nodes?atcoAreaCodes=${atcoCode}&dataFormat=csv`, { signal: AbortSignal.timeout(20000), headers: H, next: { revalidate: 604800 } });
  if (!r.ok) return [];
  const text = await r.text(); const lines = text.split(/\r?\n/); const hdr = lines[0].split(",");
  const col = (n: string) => hdr.indexOf(n);
  const [iName, iInd, iStreet, iLat, iLng, iType, iStatus, iCode] = ["CommonName", "Indicator", "Street", "Latitude", "Longitude", "StopType", "Status", "ATCOCode"].map(col);
  const out: Stop[] = [];
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV: fields are quoted only when they contain commas; split on commas outside quotes.
    const cells = lines[i].match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"')) ?? [];
    if (cells.length < hdr.length - 1 || cells[iStatus] === "inactive") continue;
    const ty = TYPES[cells[iType]]; const la = Number(cells[iLat]), lo = Number(cells[iLng]);
    if (!ty || !Number.isFinite(la) || !Number.isFinite(lo)) continue;
    if (km({ lat, lng }, { lat: la, lng: lo }) > (ty[1] === "stop" ? radiusKm : radiusKm * 2)) continue;
    const ind = cells[iInd] && cells[iInd] !== "-" ? ` (${cells[iInd]}${cells[iStreet] ? `, ${cells[iStreet]}` : ""})` : cells[iStreet] ? ` (${cells[iStreet]})` : "";
    out.push({ name: `${cells[iName]}${ind}`, detail: ty[0], kind: ty[1], lat: la, lng: lo, code: cells[iCode], record: "https://www.data.gov.uk/dataset/ff93ffc1-6656-47d8-9155-85ea0b8f2251/naptan" });
  }
  return out;
}

/** Stops near the point: England from planning.data.gov.uk; Scotland and Wales from the council's NaPTAN area file. */
export async function stopsNear(lat: number, lng: number, place: { country: string | null; district: string | null; county: string | null }): Promise<{ stops: Stop[]; stations: Stop[]; source: string } | null> {
  try {
    let all: Stop[] = [];
    if (place.country === "England" || !place.country) {
      const [near, wide] = await Promise.all([england(lat, lng, 0.006, 400), england(lat, lng, 0.014, 300)]);
      all = [...near.filter((s) => s.kind === "stop"), ...wide.filter((s) => s.kind === "station")];
    } else if (place.country === "Scotland" || place.country === "Wales") {
      const area = atcoAreaFor([place.district, place.county]);
      if (!area) return null;
      all = await naptanArea(area.atco, lat, lng, 0.7);
    } else return null;
    const stops = all.filter((s) => s.kind === "stop"); const stations = dedupe(all.filter((s) => s.kind === "station"));
    if (!stops.length && !stations.length) return null;
    return { stops, stations, source: place.country === "England" || !place.country ? "planning.data.gov.uk" : "NaPTAN API" };
  } catch { return null; }
}

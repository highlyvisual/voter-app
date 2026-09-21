// Near real-time storm overflow activity, from each water company's own feed published through the National Storm
// Overflows Hub (Water UK and Stream; event feed on open licence). Unverified operational data: it shows monitor
// activations, not the Environment Agency's verified annual spill counts.
export const OVERFLOW_FEEDS: Record<string, string> = {
  "Anglian Water": "https://services3.arcgis.com/VCOY1atHWVcDlvlJ/arcgis/rest/services/stream_service_outfall_locations_view/FeatureServer/0",
  "Northumbrian Water": "https://services-eu1.arcgis.com/MSNNjkZ51iVh8yBj/arcgis/rest/services/Northumbrian_Water_Storm_Overflow_Activity_2_view/FeatureServer/0",
  "Severn Trent Water": "https://services1.arcgis.com/NO7lTIlnxRMMG9Gw/arcgis/rest/services/Severn_Trent_Water_Storm_Overflow_Activity/FeatureServer/0",
  "South West Water": "https://services-eu1.arcgis.com/OMdMOtfhATJPcHe3/arcgis/rest/services/NEH_outlets_PROD/FeatureServer/0",
  "Thames Water": "https://services2.arcgis.com/g6o32ZDQ33GpCIu3/arcgis/rest/services/Thames_Water_Storm_Overflow_Activity_(Production)_view/FeatureServer/0",
  "United Utilities": "https://services5.arcgis.com/5eoLvR0f8HKb7HWP/arcgis/rest/services/United_Utilities_Storm_Overflow_Activity/FeatureServer/0",
  "Wessex Water": "https://services.arcgis.com/3SZ6e0uCvPROr4mS/arcgis/rest/services/Wessex_Water_Storm_Overflow_Activity/FeatureServer/0",
  "Yorkshire Water": "https://services-eu1.arcgis.com/1WqkK5cDKUbF0CkH/arcgis/rest/services/Yorkshire_Water_Storm_Overflow_Activity/FeatureServer/0",
};
export type Overflow = { id: string; company: string; status: number | null; latestStart: number | null; latestEnd: number | null; water: string | null; lat: number; lng: number };
export async function overflowsNear(lat: number, lng: number, d = 0.03): Promise<Overflow[]> {
  const env = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  const results = await Promise.all(Object.entries(OVERFLOW_FEEDS).map(async ([company, url]) => {
    try {
      const q = `${url}/query?where=1%3D1&geometry=${env}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true&outSR=4326&resultRecordCount=200&f=json`;
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(q, { signal: ctrl.signal, next: { revalidate: 900 } }).finally(() => clearTimeout(t));
      if (!r.ok) return [];
      const j = (await r.json()) as { features?: { attributes: Record<string, unknown>; geometry?: { x: number; y: number } }[] };
      return (j.features ?? []).map((f) => {
        const a = Object.fromEntries(Object.entries(f.attributes).map(([k, v]) => [k.toLowerCase(), v])) as Record<string, unknown>;
        const num = (v: unknown) => (typeof v === "number" ? v : null);
        return { id: String(a.id ?? ""), company, status: num(a.status), latestStart: num(a.latesteventstart), latestEnd: num(a.latesteventend), water: (a.receivingwatercourse as string) ?? null, lat: f.geometry?.y ?? (a.latitude as number), lng: f.geometry?.x ?? (a.longitude as number) };
      }).filter((o) => Number.isFinite(o.lat) && Number.isFinite(o.lng));
    } catch { return []; }
  }));
  return results.flat();
}

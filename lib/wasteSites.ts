// Permitted waste sites near a point, as points and polygons for the map (round eight q6, next batch: waste), from each
// nation's regulator, all under the Open Government Licence or the regulator's open licence:
//   England:  the Environment Agency's public register of waste operations, loaded weekly into waste_sites because its own
//             distance query takes over twenty seconds (scripts/auto/waste_sites.py), and its authorised landfill site
//             boundaries (WFS, by bounding box).
//   Wales:    Natural Resources Wales's waste permits and authorised landfill points on DataMapWales (WFS, by bounding box).
//   Scotland: SEPA's authorised sites (granted waste permits, licences, registrations and exemptions), queried by distance.
// Northern Ireland: no open spatial register found yet. Every feature links to the regulator's own record or dataset.
const H = { "User-Agent": "What's It To Me? (whatsittome.org; hello@whatsittome.org)" };
export type Site = { name: string; detail: string; lat: number; lng: number; record: string; recordLabel: string; polygon?: number[][][] };
const box = (lat: number, lng: number, d: number) => `${lng - d},${lat - d},${lng + d},${lat + d}`;

async function england(lat: number, lng: number): Promise<Site[]> {
  const out: Site[] = [];
  const d = 0.014;
  const [{ publicClient }, landfill] = await Promise.all([
    import("./data"),
    fetch(`https://environment.data.gov.uk/spatialdata/permitted-waste-sites-authorised-landfill-site-boundaries/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=dataset-692eaecf-d465-11e4-ac2e-f0def148f590:Permitted_Waste_Sites_Authorised_Landfill_Site_Boundaries&outputFormat=application/json&srsName=EPSG:4326&count=20&bbox=${box(lat, lng, 0.02)},EPSG:4326`, { signal: AbortSignal.timeout(9000), headers: H, next: { revalidate: 604800 } }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ]);
  // The register itself is in waste_sites (loaded weekly by scripts/auto/waste_sites.py): permits in force, with a location.
  const { data } = await publicClient().from("waste_sites").select("registration, name, holder, site_type, address, effective_date, lat, lng").gte("lat", lat - d).lte("lat", lat + d).gte("lng", lng - d * 1.6).lte("lng", lng + d * 1.6).limit(150);
  for (const it of ((data ?? []) as { registration: string; name: string; holder: string | null; site_type: string | null; address: string | null; effective_date: string | null; lat: number; lng: number }[])) {
    out.push({ name: it.name, detail: [it.site_type, it.holder && it.holder !== it.name ? `Operator: ${it.holder}` : "", it.address, it.effective_date ? `Permit in force since ${it.effective_date}` : ""].filter(Boolean).join(" · "), lat: it.lat, lng: it.lng,
      record: `https://environment.data.gov.uk/public-register/waste-operations/registration/${it.registration}`, recordLabel: "The Environment Agency's register entry" });
  }
  for (const f of ((landfill?.features ?? []) as { geometry?: { type: string; coordinates: number[][][] | number[][][][] }; properties: Record<string, string | null> }[])) {
    const pr = f.properties; if (!f.geometry) continue;
    const rings = f.geometry.type === "Polygon" ? (f.geometry.coordinates as number[][][]) : (f.geometry.coordinates as number[][][][])[0];
    const first = rings?.[0]?.[0]; if (!first) continue;
    const epr = (pr.lic_epr ?? "").split("/").pop() ?? "";
    out.push({ name: pr.lic_site || pr.site_name || "Authorised landfill site", detail: [pr.type_desc, pr.site_name && pr.site_name !== pr.lic_site ? `Operator: ${pr.site_name}` : "", pr.status ? `Permit ${String(pr.status).toLowerCase()}` : "", "Boundary as authorised by the Environment Agency"].filter(Boolean).join(" · "), lat: first[1], lng: first[0], polygon: rings,
      record: epr ? `https://environment.data.gov.uk/public-register/waste-operations/registration/${epr}` : "https://environment.data.gov.uk/dataset/692eaecf-d465-11e4-ac2e-f0def148f590", recordLabel: "The Environment Agency's register entry" });
  }
  return out;
}

async function wales(lat: number, lng: number): Promise<Site[]> {
  const q = (layer: string, d: number, n: number) => fetch(`https://datamap.gov.wales/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geonode:${layer}&outputFormat=application/json&srsName=EPSG:4326&bbox=${box(lat, lng, d)},EPSG:4326&maxFeatures=${n}`, { signal: AbortSignal.timeout(9000), headers: H, next: { revalidate: 604800 } }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const [permits, landfill] = await Promise.all([q("nrw_waste_permits", 0.015, 120), q("nrw_authorised_landfill_sites_pnt", 0.02, 20)]);
  type F = { geometry?: { type: string; coordinates: number[] }; properties: Record<string, string | null> };
  const out: Site[] = [];
  for (const f of ((permits?.features ?? []) as F[])) {
    const p = f.properties; if (f.geometry?.type !== "Point" || (p.permit_status && p.permit_status !== "Effective")) continue;
    out.push({ name: p.site_name || p.operator || "Permitted waste site", detail: [p.permit_type ? `${p.permit_type} permit` : "", p.operator ? `Operator: ${p.operator}` : "", [p.site_address_1, p.site_town_or_city, p.site_postcode].filter(Boolean).join(", "), p.operational_status ? String(p.operational_status) : "", p.effective_date ? `In force since ${String(p.effective_date).slice(0, 10)}` : ""].filter(Boolean).join(" · "), lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0],
      record: p.online_public_reg_link || "https://datamap.gov.wales/layers/geonode:nrw_waste_permits", recordLabel: "Natural Resources Wales's register entry" });
  }
  for (const f of ((landfill?.features ?? []) as F[])) {
    const p = f.properties; if (f.geometry?.type !== "Point" || (p.permit_status && p.permit_status !== "Effective")) continue;
    out.push({ name: p.site_name || "Authorised landfill site", detail: ["Authorised landfill", p.permit_activity_descripti ? String(p.permit_activity_descripti) : "", p.operator ? `Operator: ${p.operator}` : "", p.operational_status ? String(p.operational_status) : ""].filter(Boolean).join(" · "), lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0],
      record: p.permit_number ? `https://publicregister.naturalresources.wales/Search/Results?SearchTerm=${encodeURIComponent(p.permit_number)}` : "https://datamap.gov.wales/layers/geonode:nrw_authorised_landfill_sites_pnt", recordLabel: "Natural Resources Wales's register entry" });
  }
  return out;
}

async function scotland(lat: number, lng: number): Promise<Site[]> {
  const url = `https://services-eu1.arcgis.com/jj6fR2HO7enbrICO/arcgis/rest/services/Authorised_Sites/FeatureServer/443/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&distance=1500&units=esriSRUnit_Meter&spatialRel=esriSpatialRelIntersects&where=${encodeURIComponent("regulatory_area='Waste' AND authorisation_status='Granted'")}&outFields=*&outSR=4326&f=json&resultRecordCount=200`;
  const d = await fetch(url, { signal: AbortSignal.timeout(9000), headers: H, next: { revalidate: 604800 } }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  type F = { attributes: Record<string, string | null>; geometry?: { x: number; y: number } };
  return ((d?.features ?? []) as F[]).filter((f) => f.geometry).map((f) => {
    const a = f.attributes;
    return { name: a.authorisation_holder || a.authorisation_description || "Authorised waste site", detail: [a.authorisation_level, a.authorisation_activity, a.authorisation_description, a.auth_status_date ? `Granted ${a.auth_status_date}` : "", a.authorisation_no ? `Ref ${a.authorisation_no}` : ""].filter(Boolean).join(" · "), lat: f.geometry!.y, lng: f.geometry!.x,
      record: "https://opendata-scottishepa.hub.arcgis.com/datasets/3b62789bac6e4282824f1cc2a7c05edf", recordLabel: "SEPA's authorised sites dataset" };
  });
}

export async function wasteSitesNear(lat: number, lng: number, country: string | null): Promise<{ sites: Site[]; source: string } | null> {
  try {
    const raw = country === "Wales" ? await wales(lat, lng) : country === "Scotland" ? await scotland(lat, lng) : country === "Northern Ireland" ? [] : await england(lat, lng);
    // Several permits often sit on one site (an operator's transfer station with separate exemptions): one dot per name and spot.
    const seen = new Set<string>();
    const sites = raw.filter((x) => { const k = `${x.name.toLowerCase()}|${x.lat.toFixed(4)}|${x.lng.toFixed(4)}`; if (seen.has(k)) return false; seen.add(k); return true; });
    if (!sites.length) return null;
    return { sites, source: country === "Wales" ? "Natural Resources Wales" : country === "Scotland" ? "SEPA" : "Environment Agency" };
  } catch { return null; }
}

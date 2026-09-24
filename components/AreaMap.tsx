"use client";
import { useEffect, useRef, useState } from "react";

// Leaflet map: the voting area's boundary (ONS), an approximate marker for the postcode district if one was supplied (outward code only),
// and the area's representative point. Tiles from OpenStreetMap. Nothing about the viewer is recorded.
type Props = { ballotId: string; areaName: string; lat: number | null; lng: number | null; outcode?: string | null; levelLabel: string; loc?: { lat: number; lng: number } | null };
declare global { interface Window { L?: any } }

export default function AreaMap({ ballotId, areaName, lat, lng, outcode, levelLabel, loc = null }: Props) {
  const [layers, setLayers] = useState<{ label: string; colour: string; n: number; whatItMeans?: string; more?: string }[]>([]);
  const [explain, setExplain] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const groups = (typeof window !== "undefined" ? ((window as unknown as { __tsmLayers?: Record<string, { addTo: (m: unknown) => void; remove: () => void }> }).__tsmLayers ??= {}) : {}) as Record<string, { addTo: (m: unknown) => void; remove: () => void }>;
  const mapRefObj = useRef<unknown>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    let map: any; let cancelled = false;
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(css);
    const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    s.onload = async () => {
      if (cancelled || !ref.current || !window.L) return;
      const L = window.L;
      mapRefObj.current = map = L.map(ref.current, { scrollWheelZoom: false, attributionControl: true }).setView([lat ?? 51.5, lng ?? -0.12], 13);
      map.getContainer().setAttribute("role", "region");
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
      try {
        const gj = await fetch(`/api/boundary?ballot=${encodeURIComponent(ballotId)}`).then((r) => r.json());
        if (gj?.features?.length) {
          const layer = L.geoJSON(gj, { style: { color: "#23262d", weight: 2, fillColor: "#23262d", fillOpacity: 0.07 } }).addTo(map);
          layer.bindTooltip(`${areaName} (${levelLabel} boundary)`, { sticky: true });
          if (!loc) map.fitBounds(layer.getBounds(), { padding: [16, 16] });
        }
      } catch { /* boundary optional */ }
      if (outcode) {
        try {
          const oc = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(outcode)}`).then((r) => r.json());
          const o = oc?.result;
          if (o?.latitude) {
            L.circle([o.latitude, o.longitude], { radius: 700, color: "#7a5a00", weight: 2, fillColor: "#f5c451", fillOpacity: 0.25 }).addTo(map)
              .bindTooltip(`Postcode district ${outcode} (approximate centre; your exact address is never used)`).openTooltip();
          }
        } catch { /* optional */ }
      }
      // Local issues around the supplied point: areas you are inside, and sites you can tap.
      if (loc) {
        try {
          const res = await fetch(`/api/place-layers?lat=${loc.lat}&lng=${loc.lng}&ballot=${encodeURIComponent(ballotId)}`).then((r) => r.json());
          const found: { label: string; colour: string; n: number; whatItMeans?: string; more?: string }[] = [];
          const homes = (p: Record<string, string>) => p["maximum-net-dwellings"] || p["minimum-net-dwellings"] || "";
          for (const l of res?.layers ?? []) {
            const popup = (pr: Record<string, string>) => {
              const title = pr.name || pr["site-address"] || pr.reference || l.label;
              const nPub = (res.published ?? {})[l.topic] ?? 0;
              const n = l.dataset === "brownfield-land" ? homes(pr) : "";
              const status = pr["planning-permission-status"] ? String(pr["planning-permission-status"]).replace(/-/g, " ") : "";
              const school = l.dataset === "educational-establishment" && pr.reference ? `<div style="margin-top:.35rem"><a href="https://reports.ofsted.gov.uk/provider/21/${pr.reference}" target="_blank" rel="noopener">Ofsted inspection reports</a> · <a href="https://get-information-schools.service.gov.uk/Establishments/Establishment/Details/${pr.reference}" target="_blank" rel="noopener">School details</a></div>` : "";
              return `<strong>${l.label}</strong><br>${title}${n ? `<br><b>${n} homes</b> estimated${status ? `, ${status}` : ""}` : ""}<div style="margin-top:.35rem;font-size:.85em">${l.note}</div>${school}<div style="margin-top:.35rem"><a href="/ballot/${encodeURIComponent(ballotId)}/topic/${l.topic}">${nPub ? `${nPub} candidate${nPub === 1 ? " has" : "s have"} published on this — compare them →` : "What candidates have published on this →"}</a><br><a href="https://www.planning.data.gov.uk/entity/${pr.entity}" target="_blank" rel="noopener">The official record</a></div>`;
            };
            if (l.dataset === "educational-establishment" && l.geojson?.features) l.geojson.features = l.geojson.features.filter((f: { properties?: Record<string, string> }) => (f.properties?.["educational-establishment-status"] ?? "1") === "1");
            const layer = L.geoJSON(l.geojson, {
              style: { color: l.colour, weight: 2, fillColor: l.colour, fillOpacity: 0.16 },
              pointToLayer: (f: { properties?: Record<string, string> }, latlng: unknown) => L.circleMarker(latlng, { radius: 7, color: l.colour, weight: 2, fillColor: "#fff", fillOpacity: 0.95 }),
              onEachFeature: (f: { properties?: Record<string, string> }, lyr: { bindPopup: (s: string) => void }) => lyr.bindPopup(popup(f.properties ?? {})),
            }).addTo(map);
            groups[l.label] = layer;
            found.push({ label: l.label, colour: l.colour, n: l.count, whatItMeans: l.whatItMeans, more: l.more });
          }
          try {
            const ov = await fetch(`/api/overflows?lat=${loc.lat}&lng=${loc.lng}`).then((r) => r.json());
            const list = (ov?.overflows ?? []) as { id: string; company: string; status: number | null; latestStart: number | null; latestEnd: number | null; water: string | null; lat: number; lng: number }[];
            if (list.length) {
              const OVC = "#d81b60"; // raspberry: distinct from every layer colour and from any party
              const when = (t: number | null) => (t ? new Date(t).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "unknown");
              const g = L.layerGroup(list.map((o) => {
                const live = o.status === 1;
                const txt = live ? `<b>Discharging now</b> (since ${when(o.latestStart)})` : o.status === -1 ? "Monitor offline" : `Not discharging. Last discharge ended ${when(o.latestEnd)}`;
                return L.circleMarker([o.lat, o.lng], { radius: live ? 9 : 6, color: OVC, weight: 2, fillColor: live ? OVC : "#fff", fillOpacity: 0.95 })
                  .bindPopup(`<strong>Storm overflow</strong> ${o.id}<br>${o.company}${o.water ? ` · into ${o.water}` : ""}<div style="margin-top:.35rem">${txt}</div><div style="margin-top:.35rem;font-size:.85em">Near real-time, unverified data from the water company via the National Storm Overflows Hub (Water UK and Stream, open licence). Verified annual spill counts are published separately by the Environment Agency.</div><div style="margin-top:.35rem"><a href="/ballot/${encodeURIComponent(ballotId)}/topic/environment_climate_and_energy">What candidates have published on the environment →</a></div>`);
              })).addTo(map);
              groups["Storm overflows"] = g as unknown as { addTo: (m: unknown) => void; remove: () => void };
              const live = list.filter((o) => o.status === 1).length;
              found.push({ label: live ? `Storm overflows (${live} discharging now)` : "Storm overflows", colour: OVC, n: list.length, whatItMeans: "Points where a water company is allowed to release untreated sewage mixed with rainwater into a river or the sea when its system is overwhelmed. Filled dots are discharging now, from the company's own live feed; verified annual figures are published separately by the Environment Agency.", more: "https://www.gov.uk/government/publications/storm-overflows-discharge-reduction-plan" });
              if (live) groups[`Storm overflows (${live} discharging now)`] = groups["Storm overflows"];
            }
          } catch { /* optional */ }
          found.sort((a, b) => b.n - a.n);
          setLayers(found);
          // With a postcode, show the neighbourhood rather than the whole area, so local detail is legible.
          map.setView([loc.lat, loc.lng], 15);
        } catch { /* layers optional */ }
      }
      setStatus("ready");
    };
    s.onerror = () => setStatus("error");
    document.head.appendChild(s);
    return () => { cancelled = true; if (map) map.remove(); };
  }, [ballotId, areaName, lat, lng, outcode, levelLabel, loc]);
  return (
    <div className="map-wrap">
      <div ref={ref} className="map" role="region" aria-label={`Map of ${areaName}`} />
      {status === "loading" ? <p className="meta map-note">Loading map…</p> : null}
      {status === "error" ? <p className="meta map-note">Map couldn't load. Boundary data: ONS Open Geography Portal.</p> : null}
      {layers.length ? (
        <p className="meta map-note map-key"><strong>Local issues near your postcode.</strong> {layers.map((l) => (
          <button key={l.label} type="button" className={`key-item key-toggle${hidden[l.label] ? " off" : ""}`} aria-pressed={!hidden[l.label]} onClick={() => { const g = groups[l.label]; const off = !hidden[l.label]; if (g && mapRefObj.current) { off ? g.remove() : g.addTo(mapRefObj.current); } setHidden((h) => ({ ...h, [l.label]: off })); }}>
            <span className="key-swatch" style={{ background: l.colour }} aria-hidden /> {l.label} ({l.n})
          </button>
        ))}
        {layers.map((l) => l.whatItMeans ? <button key={`${l.label}-q`} type="button" className={`key-what${explain === l.label ? " on" : ""}`} aria-expanded={explain === l.label} onClick={() => setExplain((e) => (e === l.label ? null : l.label))} title={`What "${l.label}" means`}>What does "{l.label.replace(/ \(.*\)$/, "")}" mean?</button> : null)}
        {explain ? (() => { const l = layers.find((x) => x.label === explain); return l?.whatItMeans ? <span className="key-explain" role="note"><strong>{l.label.replace(/ \(.*\)$/, "")}:</strong> {l.whatItMeans}{l.more ? <> <a href={l.more} target="_blank" rel="noopener">Official guidance →</a></> : null}</span> : null; })() : null} Tap any shape or dot for what it is, the official record, and what candidates here have published on it. These are facts about the ground, not anyone's proposals. Layer colours are chosen to be unlike any party's.</p>
      ) : null}
      <p className="meta map-note">Boundary: ONS Open Geography Portal (Open Government Licence). Map tiles: OpenStreetMap. {outcode ? "The highlighted circle is the centre of your postcode district, not your address." : ""}</p>
    </div>
  );
}

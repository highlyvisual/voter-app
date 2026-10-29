"use client";
import { useEffect, useId, useRef, useState } from "react";
import MapInfo from "@/components/MapInfo";
import { LIFE_AREAS, COUNT_NOUN, areaOf, responsible, type AreaKey, type PlaceFacts, type Resp } from "@/lib/lifeAreas";
import { TOPIC_SHORT } from "@/lib/types";
import { Icon, svg } from "@/components/LifeAreaIcon";

// Leaflet map: the voting area's boundary (ONS), an approximate marker for the postcode district if one was supplied (outward code only),
// and the area's representative point. Tiles from OpenStreetMap. Nothing about the viewer is recorded.
// Round eleven (Romily's design, 29 Oct 2026: "can these be shown differently so they aren't clustered?"): with a
// postcode, the map comes first with a hint to tap anything on it, then "What's around you?" as five life-area cards
// (each with its own switch, its numbers from this area's data and "View on map"), then a fold with every layer, each
// with its own switch and an (i) that says what it means (Barny, 24 Sept: every legend item explains itself). Tapping
// anything opens the same card for every layer: the facts with their source, "Who's responsible?" for this place
// (lib/lifeAreas.ts), and what the candidates here have said on that topic.
type Props = { ballotId?: string; areaName: string; lat: number | null; lng: number | null; outcode?: string | null; levelLabel: string; loc?: { lat: number; lng: number } | null };
declare global { interface Window { L?: any } }
type MapLayer = { dataset: string; label: string; colour: string; n: number; capped?: boolean; level?: string; month?: string; topic: string; whatItMeans?: string; more?: string };
type Toggle = { addTo: (m: unknown) => void; remove: () => void; getBounds?: () => { isValid: () => boolean } };

// Everything from outside (place names, addresses, the regulators' descriptions) is escaped before it goes in a pop-up.
const esc = (x: unknown) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const ext = (href: string, text: string) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>`;
const row = (k: string, v: unknown) => (v ? `<div class="mp-row"><span>${esc(k)}</span> ${esc(v)}</div>` : "");
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
const ONE: Record<string, string> = { "transport-stops": "Bus or coach stop", "transport-stations": "Station or stop", "waste-sites": "Permitted waste site" };
const shortLabel = (l: MapLayer) => (l.dataset === "police-crime" ? "Recorded crime" : l.label.replace(/ \(.*\)$/, ""));
const countText = (l: MapLayer) => (l.dataset === "flood-risk-zone" ? (l.level ? `zone ${l.level}` : "") : `${l.n}${l.capped ? "+" : ""}`);

function popupHtml(o: { area: AreaKey | null; colour: string; title: string; facts: string; source: string; who: Resp[]; topic: string; ballotId: string }) {
  const short = (TOPIC_SHORT as Record<string, string>)[o.topic] ?? "this";
  const who = o.who.length ? `<div class="mp-block"><div class="mp-bh">${svg("people", 16)} Who&rsquo;s responsible?</div><ul>${o.who.map((r) => `<li><b>${esc(r.role)}:</b> ${esc(r.body)}${r.note ? ` <span class="mp-note">${esc(r.note)}</span>` : ""} <span class="mp-src">(${ext(r.src[1], r.src[0])})</span></li>`).join("")}</ul></div>` : "";
  const cands = o.ballotId
    ? `<div class="mp-block"><div class="mp-bh">${svg("speech", 16)} What are candidates saying?</div><p>See what your local candidates have said about ${esc(short.toLowerCase())} in this area.</p><a class="mp-go" href="/ballot/${encodeURIComponent(o.ballotId)}/topic/${esc(o.topic)}">View candidate positions &rarr;</a></div>`
    : `<div class="mp-block"><div class="mp-bh">${svg("speech", 16)} What are parties saying?</div><p>See what each party has published on ${esc(short.toLowerCase())}, in its own words.</p><a class="mp-go" href="/positions?topic=${esc(o.topic)}">View party positions &rarr;</a></div>`;
  return `<div class="mp"><div class="mp-head"><span class="mp-ico" style="background:${esc(o.colour)}">${svg(o.area ?? "list", 16)}</span><strong>${esc(o.title)}</strong></div><div class="mp-facts">${o.facts}</div><p class="mp-source">Source: ${o.source}</p>${who}${cands}</div>`;
}

export default function AreaMap({ ballotId = "", areaName, lat, lng, outcode, levelLabel, loc = null }: Props) {
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [help, setHelp] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const groups = useRef<Record<string, Toggle>>({});
  const mapRefObj = useRef<any>(null);
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const helpId = useId();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    let map: any; let cancelled = false;
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "/vendor/leaflet-1.9.4/leaflet.css"; document.head.appendChild(css);
    const s = document.createElement("script"); s.src = "/vendor/leaflet-1.9.4/leaflet.js";
    s.onload = async () => {
      if (cancelled || !ref.current || !window.L) return;
      const L = window.L;
      mapRefObj.current = map = L.map(ref.current, { scrollWheelZoom: false, attributionControl: false }).setView([lat ?? 51.5, lng ?? -0.12], 13);
      map.getContainer().setAttribute("role", "region");
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      try {
        const gj = ballotId ? await fetch(`/api/boundary?ballot=${encodeURIComponent(ballotId)}`).then((r) => r.json()) : null;
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
              .bindTooltip(`Postcode district ${outcode} (approximate centre; your exact address is never used)`);
          }
        } catch { /* optional */ }
      }
      // Local issues around the supplied point: areas you are inside, and sites you can tap.
      if (loc) {
        try {
          const res = await fetch(`/api/place-layers?lat=${loc.lat}&lng=${loc.lng}`).then((r) => r.json());
          const place = (res?.place ?? null) as PlaceFacts | null;
          const who = (d: string, extra?: { company?: string }) => (place ? responsible(d, place, extra) : []);
          const found: MapLayer[] = [];
          const pdg = (pr: Record<string, string>, by: string) => `${esc(by)}, via ${pr.entity ? ext(`https://www.planning.data.gov.uk/entity/${pr.entity}`, "planning.data.gov.uk") : "planning.data.gov.uk"} (Open Government Licence)`;
          for (const l of (res?.layers ?? []) as (MapLayer & { geojson: { features?: { properties?: Record<string, string> }[] }; note: string })[]) {
            const area = areaOf(l.dataset);
            const card = (title: string, facts: string, source: string) => popupHtml({ area, colour: l.colour, title, facts, source, who: who(l.dataset), topic: l.topic, ballotId });
            const popup = (pr: Record<string, string>) => {
              if (l.dataset === "police-crime") return card("Recorded crime", `${row("Where", pr.street)}${row("Recorded", pr.n ? `${pr.n} in ${pr.month}` : "")}${pr.detail ? `<div class="mp-row"><span>Category</span> ${esc(cap(pr.detail))}</div>` : ""}<p class="mp-note">${esc(l.note)}</p>`, ext("https://data.police.uk/about/", "police.uk") + " (Open Government Licence)");
              if (l.dataset === "brownfield-land") {
                const homes = pr["maximum-net-dwellings"] || pr["minimum-net-dwellings"] || "";
                const st = pr["planning-permission-status"] ? cap(String(pr["planning-permission-status"]).replace(/-/g, " ")) : "";
                return card(l.label, `${row("Reference", pr.reference)}${row("Site", pr["site-address"] || pr.name)}${row("Status", st ? `On the brownfield register; ${st.toLowerCase()}` : "On the brownfield register")}${row("Potential homes", homes)}<p class="mp-note">${esc(l.note)}</p>`, pdg(pr, "The council's brownfield register"));
              }
              if (l.dataset === "flood-risk-zone") {
                const lv = pr["flood-risk-level"];
                return card(l.label, `${row("Risk level", lv ? `Flood zone ${lv} (${lv === "3" ? "high probability" : "medium probability"} of flooding)` : "")}${row("Modelled from", pr["flood-risk-type"])}<p class="mp-note">${esc(l.note)} Flood defences are not taken into account.</p>`, pdg(pr, "Environment Agency"));
              }
              if (l.dataset === "educational-establishment") return card(pr.name || l.label, `${row("Type", "School, college or nursery")}${pr.reference ? `<div class="mp-row">${ext(`https://reports.ofsted.gov.uk/provider/21/${pr.reference}`, "Ofsted inspection reports")} · ${ext(`https://get-information-schools.service.gov.uk/Establishments/Establishment/Details/${pr.reference}`, "School details")}</div>` : ""}`, pdg(pr, "Department for Education register"));
              // Transport stops and waste sites: the feature carries its own record link (the regulator's or DfT's).
              if (pr.record) return card(ONE[l.dataset] ?? l.label, `${row("Name", pr.name)}${pr.detail ? `<div class="mp-row">${esc(pr.detail)}</div>` : ""}`, ext(pr.record, pr.recordLabel ?? "The official record"));
              return card(l.label, `${row("Name", pr.name || pr.reference)}<p class="mp-note">${esc(l.note)}</p>`, pdg(pr, "The council"));
            };
            if (l.dataset === "educational-establishment" && l.geojson?.features) l.geojson.features = l.geojson.features.filter((f) => (f.properties?.["educational-establishment-status"] ?? "1") === "1");
            // Markers are hollow rings in the layer's colour; areas are tinted shapes (Romily's design).
            const layer = L.geoJSON(l.geojson, {
              style: { color: l.colour, weight: 2, fillColor: l.colour, fillOpacity: 0.18 },
              pointToLayer: (_f: unknown, latlng: unknown) => L.circleMarker(latlng, { radius: l.dataset === "police-crime" || l.dataset === "transport-stops" ? 5 : 7, color: l.colour, weight: 2.5, fillColor: "#ffffff", fillOpacity: 0.85 }),
              onEachFeature: (f: { properties?: Record<string, string> }, lyr: { bindPopup: (s: string, o: unknown) => void }) => lyr.bindPopup(popup(f.properties ?? {}), { maxWidth: 320, className: "mp-popup" }),
            }).addTo(map);
            groups.current[l.dataset] = layer;
            const n = l.dataset === "educational-establishment" ? l.geojson.features?.length ?? l.n : (l as unknown as { count: number }).count;
            found.push({ dataset: l.dataset, label: l.label, colour: l.colour, n, capped: l.capped, level: l.level, month: l.month, topic: l.topic, whatItMeans: l.whatItMeans, more: l.more });
          }
          try {
            const ov = await fetch(`/api/overflows?lat=${loc.lat}&lng=${loc.lng}`).then((r) => r.json());
            const list = (ov?.overflows ?? []) as { id: string; company: string; status: number | null; latestStart: number | null; latestEnd: number | null; water: string | null; lat: number; lng: number }[];
            if (list.length) {
              const OVC = "#a8326e"; // deep raspberry: 14.7 or more from every party colour (CIEDE2000), unlike every layer
              const when = (t: number | null) => (t ? new Date(t).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "unknown");
              const g = L.layerGroup(list.map((o) => {
                const live = o.status === 1;
                const txt = live ? `Discharging now (since ${when(o.latestStart)})` : o.status === -1 ? "Monitor offline" : `Not discharging. Last discharge ended ${when(o.latestEnd)}`;
                return L.circleMarker([o.lat, o.lng], { radius: live ? 9 : 7, color: OVC, weight: 2.5, fillColor: live ? OVC : "#fff", fillOpacity: 0.9 })
                  .bindPopup(popupHtml({ area: "environment", colour: OVC, title: "Storm overflow", facts: `${row("Overflow", o.id)}${row("Water company", o.company)}${row("Into", o.water)}${row("Now", txt)}<p class="mp-note">Near real-time, unverified data from the water company. Verified annual spill counts are published separately by the Environment Agency.</p>`, source: `the water company's live feed, via the National Storm Overflows Hub on ${ext("https://www.streamwaterdata.co.uk/", "Stream")} (Water UK, open licence)`, who: who("storm-overflows", { company: o.company }), topic: "environment_climate_and_energy", ballotId }), { maxWidth: 320, className: "mp-popup" });
              })).addTo(map);
              groups.current["storm-overflows"] = g as unknown as Toggle;
              const live = list.filter((o) => o.status === 1).length;
              found.push({ dataset: "storm-overflows", label: live ? `Storm overflows (${live} discharging now)` : "Storm overflows", colour: OVC, n: list.length, topic: "environment_climate_and_energy", whatItMeans: "Points where a water company is allowed to release untreated sewage mixed with rainwater into a river or the sea when its system is overwhelmed. Filled dots are discharging now, from the company's own live feed; verified annual figures are published separately by the Environment Agency.", more: "https://www.gov.uk/government/publications/storm-overflows-discharge-reduction-plan" });
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
    return () => { cancelled = true; if (map) map.remove(); groups.current = {}; };
  }, [ballotId, areaName, lat, lng, outcode, levelLabel, loc]);

  const show = (datasets: string[], on: boolean) => {
    for (const d of datasets) { const g = groups.current[d]; if (g && mapRefObj.current) { if (on) g.addTo(mapRefObj.current); else g.remove(); } }
    setHidden((h) => ({ ...h, ...Object.fromEntries(datasets.map((d) => [d, !on])) }));
  };
  const present = (a: (typeof LIFE_AREAS)[number]) => layers.filter((l) => a.datasets.includes(l.dataset));
  const viewOnly = (a: (typeof LIFE_AREAS)[number]) => {
    const mine = present(a).map((l) => l.dataset);
    show(layers.map((l) => l.dataset).filter((d) => !mine.includes(d)), false);
    show(mine, true);
    frame.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="map-wrap">
      {/* Romily, round ten, q2: OpenStreetMap's and the ONS's credits behind the (i) in the map's corner. */}
      <div className="map-frame" ref={frame}>
        <div ref={ref} className="map" role="region" aria-label={`Map of ${areaName}`} />
        {layers.length ? <p className="wa-hint" aria-hidden><Icon k="pointer" size={15} /> Select anything on the map to see more information <span>&rarr;</span></p> : null}
        <MapInfo />
      </div>
      {status === "loading" ? <p className="meta map-note">Loading map…</p> : null}
      {status === "error" ? <p className="meta map-note">Map couldn't load. Boundary data: ONS Open Geography Portal.</p> : null}
      {layers.length ? (
        <section className="wa" aria-labelledby={`${helpId}-h`}>
          <div className="wa-title">
            <h3 id={`${helpId}-h`}>What&rsquo;s around you?</h3>
            <button type="button" className="wa-q" aria-expanded={help} aria-controls={helpId} aria-label="About this map" onClick={() => setHelp((x) => !x)}>?</button>
          </div>
          <div id={helpId} className="wa-help" hidden={!help}>
            <p>The map shows facts about the ground near {outcode ? `the centre of ${outcode}` : "your postcode"}, from official records: recorded crime, land for homes, planning protections, flood risk, waste sites, transport and schools. They are not anyone&rsquo;s proposals.</p>
            <p>Use the switches to show or hide each group, or open the full list to choose single layers. Tap anything on the map for what it is, its source, who is responsible for it here, and what the candidates have said on that subject.</p>
            <p className="meta">{outcode ? "The highlighted circle is the centre of your postcode district, not your address. " : ""}Colours are chosen to be unlike any party&rsquo;s. Sources are named in every pop-up: police.uk, planning.data.gov.uk (councils, the Environment Agency, the Department for Education), the DfT&rsquo;s NaPTAN register, the environmental regulators and the National Storm Overflows Hub. Boundaries: ONS Open Geography Portal (Open Government Licence). Map tiles: &copy; OpenStreetMap contributors.</p>
          </div>
          <ul className="wa-cards">
            {LIFE_AREAS.map((a) => {
              const mine = present(a);
              const on = mine.some((l) => !hidden[l.dataset]);
              return (
                <li key={a.key} className={`wa-card wa-${a.key}${mine.length ? "" : " none"}`}>
                  <div className="wa-card-top">
                    <span className="wa-ico"><Icon k={a.key} size={20} /></span>
                    {mine.length ? <button type="button" role="switch" aria-checked={on} aria-label={`Show ${a.title} on the map`} className="wa-switch" onClick={() => show(mine.map((l) => l.dataset), !on)}><span /></button> : null}
                  </div>
                  <p className="wa-card-title">{a.title}</p>
                  {mine.length ? mine.map((l) => (
                    <p key={l.dataset} className="wa-stat">
                      {l.dataset === "flood-risk-zone" ? <><b>{l.level ? `Zone ${l.level}` : "Yes"}</b> <span>highest flood risk nearby</span></>
                        : <><b>{l.n}{l.capped ? "+" : ""}</b> <span>{COUNT_NOUN[l.dataset]?.[l.n === 1 ? 0 : 1] ?? shortLabel(l)}</span></>}
                      {l.month ? <span className="wa-sub">{l.month}</span> : null}
                    </p>
                  )) : <p className="wa-stat"><span>Nothing on the map here</span></p>}
                  {mine.length ? <button type="button" className="wa-view" onClick={() => viewOnly(a)}>View on map <span aria-hidden>&rarr;</span></button> : null}
                </li>
              );
            })}
          </ul>
          <details className="wa-fold">
            <summary><Icon k="list" size={18} /> Show or hide individual map layers ({layers.length} total)</summary>
            <ul className="wa-layers">
              {layers.map((l) => (
                <li key={l.dataset}>
                  <div className="wa-lrow">
                    <button type="button" role="switch" aria-checked={!hidden[l.dataset]} aria-label={`Show ${shortLabel(l)}`} className={`wa-switch wa-${areaOf(l.dataset) ?? "none"}`} onClick={() => show([l.dataset], Boolean(hidden[l.dataset]))}><span /></button>
                    <span className="wa-swatch" style={{ background: l.colour }} aria-hidden />
                    <span className="wa-lname">{shortLabel(l)}{countText(l) ? ` (${countText(l)})` : ""}</span>
                    {l.whatItMeans ? <button type="button" className="wa-i" aria-expanded={info === l.dataset} aria-label={`What ${shortLabel(l).toLowerCase()} means`} onClick={() => setInfo((x) => (x === l.dataset ? null : l.dataset))}>i</button> : null}
                  </div>
                  {info === l.dataset && l.whatItMeans ? <p className="wa-ltext">{l.whatItMeans}{l.more ? <> <a href={l.more} rel="noopener">Official guidance &rarr;</a></> : null}</p> : null}
                </li>
              ))}
            </ul>
          </details>
        </section>
      ) : null}
    </div>
  );
}

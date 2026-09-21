"use client";
import { useEffect, useRef, useState } from "react";
declare global { interface Window { L?: any } }
type B = { ballot_paper_id: string; area_name: string; poll_date: string; level: string; lat: number | null; lng: number | null };

// Every upcoming election on one map. Markers are area centres from ONS boundaries; nothing about the viewer is used.
export default function BallotsMap({ ballots }: { ballots: B[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let map: any; let cancelled = false;
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(css);
    const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    s.onload = () => {
      if (cancelled || !ref.current || !window.L) return;
      const L = window.L;
      map = L.map(ref.current, { scrollWheelZoom: false }).setView([54.5, -3], 5);
      map.getContainer().setAttribute("role", "region");
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
      const pts: [number, number][] = [];
      for (const b of ballots) {
        if (b.lat == null || b.lng == null) continue;
        pts.push([b.lat, b.lng]);
        const d = new Date(b.poll_date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
        L.circleMarker([b.lat, b.lng], { radius: b.level === "parliamentary" ? 10 : 7, color: "#23262d", weight: 2, fillColor: b.level === "parliamentary" ? "#23262d" : "#ffffff", fillOpacity: 0.9 })
          .addTo(map)
          .bindPopup(`<strong>${b.area_name}</strong><br>${b.level === "parliamentary" ? "UK Parliament" : "Council"} by-election, ${d}<br><a href="/ballot/${encodeURIComponent(b.ballot_paper_id)}">Open</a>`);
      }
      if (pts.length) map.fitBounds(pts, { padding: [16, 16], maxZoom: 7 });
    };
    s.onerror = () => setErr(true);
    document.head.appendChild(s);
    return () => { cancelled = true; if (map) map.remove(); };
  }, [ballots]);
  return (
    <div className="map-wrap">
      <div ref={ref} className="map map-tall" role="region" aria-label="Map of upcoming elections" />
      <p className="meta map-note">{err ? "Map couldn't load." : "Each marker is an election you can open. Larger marker: UK Parliament by-election."} Boundary centres: ONS Open Geography Portal. Tiles: OpenStreetMap.</p>
    </div>
  );
}

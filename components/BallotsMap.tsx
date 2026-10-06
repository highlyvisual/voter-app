"use client";
import { shortMonth } from "@/lib/dates";
import { useEffect, useRef, useState } from "react";
declare global { interface Window { L?: any } }
const MARKER = "#B8004F";
type B = { ballot_paper_id: string; area_name: string; poll_date: string; level: string; lat: number | null; lng: number | null };

// Every upcoming election on one map. Markers are area centres from ONS boundaries; nothing about the viewer is used.
export default function BallotsMap({ ballots }: { ballots: B[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let map: any; let cancelled = false;
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "/vendor/leaflet-1.9.4/leaflet.css"; document.head.appendChild(css);
    const s = document.createElement("script"); s.src = "/vendor/leaflet-1.9.4/leaflet.js";
    s.onload = () => {
      if (cancelled || !ref.current || !window.L) return;
      const L = window.L;
      map = L.map(ref.current, { scrollWheelZoom: false }).setView([54.5, -3], 5);
      map.getContainer().setAttribute("role", "region");
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors · Boundaries: ONS (OGL)" }).addTo(map);
      const pts: [number, number][] = [];
      for (const b of ballots) {
        if (b.lat == null || b.lng == null) continue;
        pts.push([b.lat, b.lng]);
        const d = (() => { const x = new Date(b.poll_date + "T00:00:00Z"); return `${x.getUTCDate()} ${shortMonth(x)}`; })();
        // Raspberry, the site's own accent (not a party colour). Fixed rather than themed: the map tiles stay light in dark mode.
        const parl = b.level === "parliamentary";
        L.circleMarker([b.lat, b.lng], parl
          ? { radius: 10, color: "#ffffff", weight: 2, fillColor: MARKER, fillOpacity: 1 }
          : { radius: 7, color: MARKER, weight: 2.5, fillColor: "#ffffff", fillOpacity: 0.95 })
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
      <p className="meta map-note">{err ? "Map couldn't load." : "Each marker is an election you can open. Larger marker: UK Parliament by-election."}</p>
      <details className="map-credits">
        <summary>About this map</summary>
        <p>Boundary centres: ONS Open Geography Portal (Open Government Licence). Map tiles: &copy; OpenStreetMap contributors.</p>
      </details>
    </div>
  );
}

"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

// The map's credits behind a small round (i) in its corner (Romily, round ten, q2: "please may we move the source ...
// as it is less visually appealing ofc keep the source elswhere but not displayed like that"). Leaflet's own credit
// line is switched off where this is used; the OpenStreetMap Foundation's attribution guidelines allow the credit on an
// interactive map to be revealed by an (i) control like this one. A real <button> with aria-expanded, 44px square,
// closed with Escape or a second tap.
export default function MapInfo({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);
  return (
    <div className="map-info">
      <button ref={btn} type="button" className="map-info-btn" aria-expanded={open} aria-controls={id} aria-label="About this map: sources and credits" onClick={() => setOpen((o) => !o)}>
        <span aria-hidden>i</span>
      </button>
      <div id={id} className="map-info-panel" hidden={!open}>
        <p>&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> (ODbL), map tiles from <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener">openstreetmap.org</a> · Boundaries: <a href="https://geoportal.statistics.gov.uk/" target="_blank" rel="noopener">ONS Open Geography Portal</a> (<a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" target="_blank" rel="noopener">OGL</a>)</p>
        {children}
      </div>
    </div>
  );
}

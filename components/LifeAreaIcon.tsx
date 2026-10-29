import type { AreaKey } from "@/lib/lifeAreas";

// Icons, as SVG path data (24 x 24, stroked), shared by the cards and the pop-ups.
export const ICON: Record<AreaKey | "pointer" | "people" | "speech" | "list", string> = {
  safety: "M12 2.5l7.5 3v5.8c0 4.7-3.2 8.9-7.5 10.2-4.3-1.3-7.5-5.5-7.5-10.2V5.5z",
  homes: "M3.5 11 12 3.5l8.5 7.5M6 9.5V20.5h4.5v-6h3v6H18V9.5",
  environment: "M5 20c0-8.5 5.5-14.5 15-15.5-.5 9.5-6.5 15.5-15 15.5zM5 20l8.5-8.5",
  transport: "M6 3.5h12a1.5 1.5 0 0 1 1.5 1.5v11.5h-15V5A1.5 1.5 0 0 1 6 3.5zM4.5 11h15M7.5 16.5V20M16.5 16.5V20M8 13.8h.01M16 13.8h.01",
  education: "M2 9.5 12 4.5l10 5-10 5zM6 11.5v4.8c3.3 2.3 8.7 2.3 12 0v-4.8M22 9.5v5",
  pointer: "M5 3.5l13.5 6.5-6 1.8-2 6.2z",
  people: "M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.8a3.2 3.2 0 0 1 0 6.2M18 14.3c2 .7 3 2.9 3 5.7",
  speech: "M4 4.5h16v11H10l-6 4.5z",
  list: "M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01",
};
export const svg = (k: keyof typeof ICON, size = 18) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[k]}"/></svg>`;
export function Icon({ k, size = 18 }: { k: keyof typeof ICON; size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={ICON[k]} /></svg>;
}

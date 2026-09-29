import type { CSSProperties } from "react";

// Party colours (Romily, 29 Sept: "use more colour of the parties whenever talking about policies, candidates and the
// party itself"). A party's own colour, as recorded for it, marks that party's own candidates, positions and pages, and
// nothing else. Text on a party colour is black or white, whichever reads better (WCAG contrast), so a pale colour
// such as the SNP's yellow gets black text and a dark one such as UKIP's purple gets white.

const HEX = /^#[0-9a-f]{6}$/i;

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** Black or white, whichever has the higher contrast on this colour. */
export function inkOn(hex: string): "#000000" | "#ffffff" {
  const l = luminance(hex);
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? "#000000" : "#ffffff";
}

/** CSS custom properties for anything that belongs to one party: --party, --party-ink (text on it) and --party-tint. */
export function partyVars(hex: string | null | undefined): CSSProperties | undefined {
  if (!hex || !HEX.test(hex)) return undefined;
  return { "--party": hex, "--party-ink": inkOn(hex), "--party-tint": `${hex}24` } as CSSProperties;
}

/** A filled party label: the party's colour behind black or white text. */
export function partyFill(hex: string | null | undefined): CSSProperties | undefined {
  if (!hex || !HEX.test(hex)) return undefined;
  return { ...partyVars(hex), background: hex, borderColor: hex, color: inkOn(hex) };
}

import { useColorScheme } from 'react-native';

// Romily's palette (29 Sept 2026, docs/design/2026-09-29-directions.md row 1; the website's app/theme.css): direction C's
// latte, card, cocoa and rose, with A's sand and raspberry and E's apricot and aubergine (deepened to #3A1530, away from
// UKIP's purple). Every text colour is 4.5:1 or better on the surfaces it sits on, light and dark, as on the site.
// Party colours are never used here: they come from the API, for a party's own material only.
export const light = {
  paper: '#F7EFE6', panel: '#FFFBF6', sand: '#F4F1EA', apricot: '#FBEADB',
  ink: '#2B1B14', soft: '#4A3A31', muted: '#5F4E45',
  accent: '#B8004F', onAccent: '#FFFFFF', accentSoft: '#FFE4EF', // raspberry: links, "Applies to you"
  rose: '#9E3F4F', onRose: '#FFFFFF', roseSoft: '#F1DAD6', roseGold: '#C98A80', // rose: the main buttons; rose-gold decorative only
  aubergine: '#3A1530', onAubergine: '#FFFFFF', aubergineSoft: '#F0DCE8',
  line: '#E6D8CC', chip: '#F4F1EA', skeleton: '#EDE2D6', warn: '#7A4B00', warnBg: '#FFF4D6',
  // The drawn area map (no tiles): ground, grid and the boundary.
  mapGround: '#FBEADB', mapGrid: '#F1DCC8', mapFill: '#E9C9D4', mapEdge: '#3A1530', road: '#FFFBF6', roadCasing: '#E2C6AE',
};
export const dark: typeof light = {
  paper: '#1B1310', panel: '#241A15', sand: '#2A1F19', apricot: '#2E211A',
  ink: '#F7EFE6', soft: '#E6D6C8', muted: '#CDB9A9',
  accent: '#FF86B3', onAccent: '#1B1310', accentSoft: '#3B1526',
  rose: '#F2A3AE', onRose: '#1B1310', roseSoft: '#3A2023', roseGold: '#C98A80',
  aubergine: '#E2BFD7', onAubergine: '#1B1310', aubergineSoft: '#33202E',
  line: '#46362C', chip: '#2A1F19', skeleton: '#2F231D', warn: '#FFD68A', warnBg: '#3A2B12',
  mapGround: '#2E211A', mapGrid: '#36271F', mapFill: '#4A2A3C', mapEdge: '#E2BFD7', road: '#4A3A31', roadCasing: '#241A15',
};
export type Palette = typeof light;

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

// Fraunces for headings and the wordmark, Public Sans for everything else (the site's type, bundled in the app; loaded
// in the root layout). One family per weight, so a weight is chosen by family, never by fontWeight.
export const F = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_400Regular_Italic',
  body: 'PublicSans_400Regular',
  medium: 'PublicSans_500Medium',
  semi: 'PublicSans_600SemiBold',
  bold: 'PublicSans_700Bold',
};

// 48 px tap targets everywhere (the brief; WCAG 2.5.5 asks for 44).
export const TAP = 48;

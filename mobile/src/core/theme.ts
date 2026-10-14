import { useColorScheme } from 'react-native';

// Site palette (app/theme.css): latte paper, cocoa ink, raspberry accent; dark-mode values from the same file.
// Party colours are never used here: they come from the API, for a party's own material only.
export const light = {
  paper: '#F7EFE6', panel: '#FFFFFF', ink: '#2B1B14', soft: '#4A3A31', accent: '#B8004F', onAccent: '#FFFFFF',
  line: '#E6D6C8', chip: '#EDE2D6', skeleton: '#E9DED2', warn: '#7A4B00', warnBg: '#FFF4D6',
};
export const dark: typeof light = {
  paper: '#1B1310', panel: '#241A15', ink: '#F7EFE6', soft: '#E6D6C8', accent: '#FF86B3', onAccent: '#1B1310',
  line: '#3A2B23', chip: '#33261F', skeleton: '#2F231D', warn: '#FFD68A', warnBg: '#3A2B12',
};
export type Palette = typeof light;

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

// 48 px tap targets everywhere (the brief; WCAG 2.5.5 asks for 44).
export const TAP = 48;

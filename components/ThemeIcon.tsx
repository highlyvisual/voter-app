// One simple line icon for each life area (Romily, round eleven q2: "tappable as the main icons"). Drawn here, on a
// 24-unit grid, in the text colour, with the same stroke for all ten, so no theme looks heavier than another. No icon
// library and no emoji. Decorative: the theme's name is always written beside it.
const P: Record<string, React.ReactNode> = {
  "your-area": <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.4" /></>,
  "money-and-work": <><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.8" /><path d="M6 9.5h.01M18 14.5h.01" /></>,
  "your-home": <><path d="M3.5 11 12 4l8.5 7" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5.5h4V20" /></>,
  "education-and-family": <><path d="M2.5 9 12 5l9.5 4-9.5 4z" /><path d="M6.5 11v4.5c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8V11" /><path d="M21.5 9v5" /></>,
  healthcare: <path d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z" />,
  transport: <><rect x="5" y="3.5" width="14" height="14" rx="2.5" /><path d="M5 11h14" /><path d="M7.5 20.5v-3M16.5 20.5v-3" /><path d="M8.5 14.3h.01M15.5 14.3h.01" /></>,
  "safety-and-rights": <><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z" /><path d="m8.8 12.2 2.3 2.3 4.3-4.6" /></>,
  immigration: <><rect x="5.5" y="2.5" width="13" height="19" rx="2" /><circle cx="12" cy="10.5" r="3.5" /><path d="M8.5 10.5h7M12 7c-1 1-1.5 2.2-1.5 3.5S11 13 12 14M12 7c1 1 1.5 2.2 1.5 3.5S13 13 12 14" /><path d="M9 17.5h6" /></>,
  "uk-and-the-world": <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z" /></>,
  environment: <><path d="M6 18C6 10 11 5 20 4c-.5 9-5.5 14-13.2 14.2" /><path d="M4 20c3.5-4.5 7-8 11-10.5" /></>,
};

export default function ThemeIcon({ slug, size = 32 }: { slug: string; size?: number }) {
  return (
    <svg className="theme-icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden focusable="false" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      {P[slug] ?? null}
    </svg>
  );
}

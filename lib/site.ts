// Site identity in one place. Override with NEXT_PUBLIC_SITE_NAME / NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_SITE_TAGLINE if the name changes.
export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "What’s It To Me?",
  short: process.env.NEXT_PUBLIC_SITE_SHORT ?? "What’s It To Me?",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://whatsittome.org",
  email: "hello@whatsittome.org",
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE ?? "Who is on your ballot, and what each of them winning would change for a household like yours.",
  repo: "https://github.com/highlyvisual/voter-app",
  // "any": show a photo wherever one exists (Barny, 19 Sept 2026). "all-or-none": only when every candidate on the ballot has one (WP-A3).
  photos: (process.env.NEXT_PUBLIC_PHOTOS_MODE ?? "any") as "any" | "all-or-none",
};

// Candidate photos, emblems and leaflets, resized and converted by Netlify's image CDN (cached at the edge), so a
// 56px face costs a few kilobytes rather than a ~900 KB original. Falls back to the plain proxy for other hosts.
const RESIZABLE = ["candidates.democracyclub.org.uk", "static-candidates.democracyclub.org.uk", "images.electionleaflets.org"];
export const img = (u: string | null | undefined, w = 240) => {
  if (!u) return "";
  try { if (RESIZABLE.includes(new URL(u).hostname)) return `/.netlify/images?url=${encodeURIComponent(u)}&w=${w}&fm=webp&q=75`; } catch {}
  return `/api/img?u=${encodeURIComponent(u)}`;
};

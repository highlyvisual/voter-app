// Site identity in one place. Override with NEXT_PUBLIC_SITE_NAME / NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_SITE_TAGLINE if the name changes.
export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Hustings",
  short: process.env.NEXT_PUBLIC_SITE_SHORT ?? "Hustings",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://hustings.org",
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE ?? "Who is on your ballot, and what each of them winning would change for a household like yours.",
  repo: "https://github.com/highlyvisual/voter-app",
  // "any": show a photo wherever one exists (Barny, 19 Sept 2026). "all-or-none": only when every candidate on the ballot has one (WP-A3).
  photos: (process.env.NEXT_PUBLIC_PHOTOS_MODE ?? "any") as "any" | "all-or-none",
};

export const img = (u: string | null | undefined) => (u ? `/api/img?u=${encodeURIComponent(u)}` : "");

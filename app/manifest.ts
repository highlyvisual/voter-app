import type { MetadataRoute } from "next";

// Lets people add the site to their home screen (the first step towards an installable app; round eight, point 18).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "What's It To Me?",
    short_name: "What's It To Me?",
    description: "Who is on your ballot, what each candidate has published, and what it could mean for a household like yours. Impartial and sourced; never a recommendation.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7EFE6",
    theme_color: "#FFFBF6",
    lang: "en-GB",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

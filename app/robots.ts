import type { MetadataRoute } from "next";
// Until launch (ALLOW_INDEXING unset) every page also carries noindex, and no sitemap is advertised. Crawling itself stays
// allowed so that link previews on social media keep working.
//
// AI assistants and AI search are named explicitly (Nova audit, 27 Sept): a voter-information site wants to be read and
// cited accurately, so each is allowed the same public pages as everyone else and kept out of the same private ones. A
// crawler named in its own group ignores the "*" group, so every group carries the full list. How they should cite the
// site is in /llms.txt and on /about/data-use.
const DISALLOW = ["/looks", "/review", "/candidates/submit", "/journey", "/profile", "/api/", "/*/notes"];
const ALLOW = ["/", "/api/data/", "/llms.txt"];
const AI = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Applebot-Extended", "DuckAssistBot", "MistralAI-User", "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  const indexing = process.env.ALLOW_INDEXING === "1";
  return {
    rules: [
      { userAgent: "*", allow: ALLOW, disallow: DISALLOW },
      { userAgent: AI, allow: ALLOW, disallow: DISALLOW },
    ],
    ...(indexing ? { sitemap: "https://whatsittome.org/sitemap.xml" } : {}),
  };
}

import type { MetadataRoute } from "next";
// Until launch (ALLOW_INDEXING unset) every page also carries noindex, and no sitemap is advertised. Crawling itself stays
// allowed so that link previews on social media keep working.
export default function robots(): MetadataRoute.Robots {
  const indexing = process.env.ALLOW_INDEXING === "1";
  return {
    rules: [{ userAgent: "*", allow: ["/", "/api/data/"], disallow: ["/review", "/candidates/submit", "/journey", "/profile", "/api/", "/*/notes"] }],
    ...(indexing ? { sitemap: "https://whatsittome.org/sitemap.xml" } : {}),
  };
}

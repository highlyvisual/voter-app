import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: ["/", "/ballot/", "/about", "/how-to-vote", "/data", "/api/data/", "/ledger"], disallow: ["/review", "/candidates/submit", "/find", "/feedback"] }], sitemap: "https://hustings.org/sitemap.xml" };
}

import type { NextConfig } from "next";

// Security policy. Inline scripts stay allowed because Next.js streams its page data in inline scripts; everything
// else is limited to this site and the few services the pages actually use (map tiles, postcode lookups, Netlify's
// page-speed beacon). Only /ballot/*/embed may be shown inside another site's page.
const csp = (frameAncestors: string) => [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tile.openstreetmap.org",
  "font-src 'self'",
  "connect-src 'self' https://api.postcodes.io https://ingesteer.services-prod.nsvcs.net",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  `frame-ancestors ${frameAncestors}`,
].join("; ");

const common = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

// Netlify's edge may keep a page for five minutes and serve a stale copy for up to an hour while it fetches a fresh one.
// Every query string is a separate copy (household answers are in the query), and nothing here reads cookies.
// Excluded: the maintainers' console, the candidate form, API routes (they set their own) and Next.js internals.
const edgeCache = [
  { key: "Netlify-CDN-Cache-Control", value: "public, durable, s-maxage=300, stale-while-revalidate=3600" },
  { key: "Netlify-Vary", value: "query" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/privacy", destination: "/about/data-use", permanent: false }];
  },
  async headers() {
    return [
      { source: "/:path((?!ballot/[^/]+/embed).*)", headers: [...common, { key: "Content-Security-Policy", value: csp("'none'") }, { key: "X-Frame-Options", value: "DENY" }] },
      { source: "/ballot/:id/embed", headers: [...common, { key: "Content-Security-Policy", value: csp("*") }] },
      { source: "/:path((?!review|candidates/submit|api|_next|\\.netlify).*)", headers: edgeCache },
      { source: "/brand/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
      { source: "/fonts/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/vendor/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};
export default nextConfig;

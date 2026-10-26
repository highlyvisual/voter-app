import type { Metadata } from "next";
import NextElectionWidget from "@/components/NextElectionWidget";

// The box other sites put in an iframe (Romily, round ten, q8). The site's header, footer, tab bar and help button are
// left out for every /embed/ page (components/SiteChrome.tsx), and next.config.ts lets any site frame /embed/*.
// Never indexed: it is a fragment, and /embed is the page that explains it.
export const metadata: Metadata = {
  title: "Your next election",
  description: "Type a postcode to see the elections coming up there, with dates and days to go.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/embed" },
};

export default function NextElectionEmbed() {
  return <NextElectionWidget />;
}

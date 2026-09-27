import { jsonLd } from "@/lib/schema";
// Structured data for search engines and AI assistants. A data block, not a script: nothing runs.
export default function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />;
}

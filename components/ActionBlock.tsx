
// WP-A8: where there is nothing sourced, say what the body decides and where to look, never "no information" alone.
export default function ActionBlock({ level, areaName, councilSiteUrl, partySiteUrl, wardForLeaflets }: { level: string; areaName: string; councilSiteUrl?: string | null; partySiteUrl?: string | null; wardForLeaflets?: string | null }) {
  const decides = level === "parliamentary"
    ? "An MP votes on national laws, taxes, benefits, the NHS budget and defence, and takes up constituents' cases with government bodies."
    : "A councillor sits on the council that sets council tax and decides planning, housing repairs and allocations, social care, bins, parking, libraries and, in most areas, school admissions. It cannot change national tax, benefits or NHS policy.";
  const leafletQ = encodeURIComponent((wardForLeaflets ?? areaName).replace(/^.*?:\s*/, "").replace(/\s+ward$/i, ""));
  return (
    <div className="action-block">
      <p style={{ margin: 0 }}><strong>Nothing published that we could source, yet.</strong> {decides}</p>
      <ul>
        <li>Are you this candidate, or their agent? If something here is wrong, <a href="mailto:hello@whatsittome.org?subject=Correction">email us</a> and we will check it against the source.</li>
        <li>Look yourself: {councilSiteUrl ? <><a href={councilSiteUrl} rel="noopener">the council's election notices</a> · </> : null}{partySiteUrl ? <><a href={partySiteUrl} rel="noopener">the party's site</a> · </> : null}<a href={`https://electionleaflets.org/leaflets/?q=${leafletQ}`} rel="noopener">leaflets archived for this area</a> (electionleaflets.org, a Democracy Club project).</li>
      </ul>
    </div>
  );
}

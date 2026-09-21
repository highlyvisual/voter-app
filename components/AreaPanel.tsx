import { claimantFor, crimeNear, deprivationAt, hpiFor, hpiRegionFromArea, topPetitionsFor } from "@/lib/area";

// "Your area in numbers": official statistics that describe the place, never a household, each with its source and its limits.
export default async function AreaPanel({ areaName, level, lat, lng, pointNote, hpiRegion, gss = null, loc = null }: { areaName: string; level: string; lat: number | null; lng: number | null; pointNote: string | null; hpiRegion?: string | null; gss?: string | null; loc?: { lat: number; lng: number } | null }) {
  const region = hpiRegion ?? hpiRegionFromArea(areaName);
  const [petitions, crime, hpi, claimant, dep] = await Promise.all([level === "parliamentary" ? topPetitionsFor(areaName) : Promise.resolve(null), lat && lng ? crimeNear(lat, lng) : Promise.resolve(null), region ? hpiFor(region) : Promise.resolve(null), gss ? claimantFor(gss) : Promise.resolve(null), loc ? deprivationAt(loc.lat, loc.lng) : Promise.resolve(null)]);
  if (!petitions?.rows.length && !crime && !hpi && !claimant && !dep) return null;
  const decileWords = (d: number) => d === 1 ? "among the 10% most deprived" : d === 10 ? "among the 10% least deprived" : d <= 5 ? `in the ${["", "", "second", "third", "fourth", "fifth"][d]} most deprived tenth` : `in the ${["", "", "", "", "", "", "fifth", "fourth", "third", "second"][d]} least deprived tenth`;
  const num = new Intl.NumberFormat("en-GB");
  return (
    <section className="area" aria-labelledby="area-heading">
      <h2 id="area-heading">{areaName} in numbers</h2>
      <p className="meta">Official open data about the area. It describes the place, not you, and it favours no candidate.</p>
      <div className="area-grid">
        {petitions?.rows.length ? (
          <div>
            <h3>What people here are petitioning Parliament about</h3>
            <ol className="small">
              {petitions.rows.map((p) => (
                <li key={p.id}><a href={p.url} rel="noopener">{p.action}</a> <span className="meta">— {num.format(p.local)} signatures here, {num.format(p.total)} nationally</span></li>
              ))}
            </ol>
            <p className="meta">Open petitions with the most signatures from this constituency, among the 25 largest nationally. Source: petition.parliament.uk, {petitions.asOf}.</p>
          </div>
        ) : null}
        {claimant ? (
          <div>
            <h3>People claiming unemployment-related benefits</h3>
            <p className="small" style={{ margin: "0 0 0.3rem" }}><b>{claimant.count.toLocaleString("en-GB")}</b> people in {areaName.split(":").pop()?.trim()}, <b>{claimant.rate}%</b> of residents aged 16–64{claimant.nationRate !== null ? `, against ${claimant.nationRate}% across ${claimant.nationName}` : ""} ({claimant.period}).</p>
            <p className="meta">Claimant count, Office for National Statistics via Nomis (Open Government Licence). It counts people claiming Jobseeker's Allowance or Universal Credit while required to seek work; it is not the same as the unemployment rate.</p>
          </div>
        ) : null}
        {dep ? (
          <div>
            <h3>How this neighbourhood compares</h3>
            <p className="small" style={{ margin: "0 0 0.3rem" }}>The neighbourhood around your postcode ({dep.name}) is <b>{decileWords(dep.imd)}</b> of England's 33,755 neighbourhoods on the official Index of Multiple Deprivation 2025.</p>
            <ul className="small dep-grid">
              {([["Income", dep.income], ["Employment", dep.employment], ["Education", dep.education], ["Health", dep.health], ["Crime", dep.crime], ["Housing and services", dep.housing], ["Living environment", dep.living]] as [string, number][]).map(([l, d]) => <li key={l}><span>{l}</span><span className="dep-bar" aria-label={`decile ${d} of 10, where 1 is most deprived`}>{Array.from({ length: 10 }, (_, k) => <i key={k} className={k < d ? "on" : ""} />)}</span><span className="meta">{d}/10</span></li>)}
            </ul>
            <p className="meta">English Indices of Deprivation 2025, Ministry of Housing, Communities and Local Government (Open Government Licence). Deciles: 1 is the most deprived tenth of neighbourhoods, 10 the least. A measure of an area, not of anyone who lives there.</p>
          </div>
        ) : null}
        {hpi ? (
          <div>
            <h3>House prices in {hpi.region.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</h3>
            <p className="small" style={{ margin: "0 0 0.3rem" }}>Average price <b>{num.format(hpi.averagePrice) ? `£${num.format(hpi.averagePrice)}` : ""}</b>{hpi.annualChange !== null ? `, ${hpi.annualChange > 0 ? "up" : hpi.annualChange < 0 ? "down" : "unchanged"} ${Math.abs(hpi.annualChange).toFixed(1)}% on a year earlier` : ""} ({new Date(hpi.month + "-01T00:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}).</p>
            <ul className="small">{hpi.flat ? <li>Flats and maisonettes: £{num.format(hpi.flat)}</li> : null}{hpi.detached ? <li>Detached houses: £{num.format(hpi.detached)}</li> : null}</ul>
            <p className="meta">Source: HM Land Registry UK House Price Index for the local authority (Open Government Licence). A local-authority average; prices within it vary widely.</p>
          </div>
        ) : null}
        {crime ? (
          <div>
            <h3>Recorded crime nearby, {new Date(crime.month + "-01T00:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}</h3>
            <p className="small" style={{ margin: "0 0 0.3rem" }}><b>{num.format(crime.total)}</b> street-level crimes recorded within about a mile of the area's centre.</p>
            <ul className="small">
              {crime.categories.map((c) => <li key={c.category}>{c.category}: {num.format(c.count)}</li>)}
            </ul>
            <p className="meta">Source: data.police.uk (Open Government Licence). {pointNote ?? ""} Recorded crime reflects reporting and policing as well as offending; see the ONS guidance in further reading.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

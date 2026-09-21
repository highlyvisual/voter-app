import { placeFacts } from "@/lib/place";
// Place panel: what the planning record says about the spot around a rounded location. Facts with their official entity pages; nothing predictive.
export default async function PlacePanel({ lat, lng }: { lat: number; lng: number }) {
  const facts = await placeFacts(lat, lng);
  return (
    <section className="area" aria-labelledby="place-heading">
      <h2 id="place-heading">Around this postcode: the planning record</h2>
      <p className="meta">From planning.data.gov.uk (Open Government Licence), for a point rounded to about 100 metres. Councillors decide many of these things; MPs do not. Nothing about you is stored.</p>
      {facts.length ? (
        <ul className="small">
          {facts.map((f) => <li key={f.url} style={{ marginBottom: "0.4rem" }}><strong>{f.label}:</strong> <a href={f.url} rel="noopener">{f.name}</a> <span className="meta">— {f.meaning}</span></li>)}
        </ul>
      ) : <p className="small">No conservation area, Article 4 direction, listed building, flood zone or tree order recorded at this point in the national dataset. Councils publish to it at different rates, so absence is not proof.</p>}
    </section>
  );
}

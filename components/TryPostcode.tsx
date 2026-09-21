"use client";
// The elections happening now, each with a postcode inside it. Tapping one fills the postcode box, so anyone can see
// the product working even if there is no election where they live. Listed by polling date; no other ordering.
import { EXAMPLE_POSTCODES } from "@/lib/examples";
export default function TryPostcode({ today }: { today: string }) {
  const upcoming = EXAMPLE_POSTCODES.filter((e) => e.date >= today).slice(0, 6);
  if (!upcoming.length) return null;
  const fill = (pc: string) => {
    const el = document.getElementById("postcode") as HTMLInputElement | null;
    if (!el) return;
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    set.call(el, pc); el.dispatchEvent(new Event("input", { bubbles: true })); el.focus();
  };
  return (
    <aside className="try-panel" aria-labelledby="try-heading">
      <p id="try-heading" className="try-title">Elections coming up</p>
      <p className="try-note">No election where you live right now? Most places have none until May 2027. Try one of these:</p>
      <ul>
        {upcoming.map((e) => (
          <li key={e.ballot}>
            <button type="button" onClick={() => fill(e.postcode)} className="try-row">
              <span className="try-area">{e.area.replace(/ ward$/, "").replace(/^(.*?)(Borough|City|District|County)?: /, "")}</span>
              <span className="try-meta">{new Date(e.date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })} · {e.postcode}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

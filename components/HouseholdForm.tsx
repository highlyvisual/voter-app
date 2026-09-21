import { FIELDS, OPTIONAL_FIELDS, OPTIONAL_KEYS, type Household } from "@/lib/household";
import HouseholdPicker from "@/components/HouseholdPicker";

function label(k: keyof typeof FIELDS, code?: string) {
  return FIELDS[k].options.find((o) => o[0] === code)?.[1] ?? "";
}

// One-line summary of a complete household, in plain words.
export function describe(h: Household): string {
  const age = label("age_band", h.age_band);
  const hh = label("household", h.household).toLowerCase();
  const ch = h.children === "none" ? "no children" : label("children", h.children).toLowerCase();
  const ten = label("tenure", h.tenure).toLowerCase();
  const inc = label("income_band", h.income_band).toLowerCase();
  const emp = label("employment", h.employment).toLowerCase();
  const st = h.student === "no" ? "" : `, ${label("student", h.student).toLowerCase()}`;
  const extras = OPTIONAL_KEYS.filter((k) => h[k] === "yes").map((k) => ({ disability: "disability or long-term condition in the household", carer: "unpaid carer", visa: "visa or asylum", benefits: "means-tested benefit", drives: "drives", veteran: "armed forces service" }[k]));
  return `Aged ${age}, ${hh}, ${ch}; ${ten}; household income ${inc}; ${emp}${st}.${extras.length ? ` Also: ${extras.join(", ")}.` : ""}`;
}

// A plain GET form: the household lands in the URL, the server renders the result, nothing is written anywhere.
// Once complete it collapses to a summary line with a Change control.
export default function HouseholdForm({ household, complete, optional = false }: { household: Household; complete: boolean; optional?: boolean }) {
  const fields = <HouseholdPicker household={household} complete={complete} />;

  if (!complete && optional) {
    return (
      <details className="household">
        <summary><span className="summary-line"><b>Describe a household</b> to see only what applies to it. Optional.</span><span className="change">Open</span></summary>
        {fields}
      </details>
    );
  }
  if (!complete) {
    return (
      <section className="household" aria-labelledby="hh-heading">
        <p id="hh-heading" style={{ margin: 0 }}><strong>Describe a household.</strong> Yours, a friend's, a neighbour's. Then each candidate's page shows what applies.</p>
        {fields}
      </section>
    );
  }
  return (
    <details className="household">
      <summary>
        <span className="summary-line"><b>This household:</b> {describe(household)}</span>
        <span className="change">Change</span>
      </summary>
      {fields}
    </details>
  );
}

// The eight mandatory household fields, as decided by Romily (18 Sept 2026).
// Values are bands, never exact figures. Nothing here is stored server-side.

export const FIELDS = {
  age_band: {
    label: "Age",
    options: [
      ["16_17", "16 to 17"],
      ["18_24", "18 to 24"],
      ["25_34", "25 to 34"],
      ["35_49", "35 to 49"],
      ["50_64", "50 to 64"],
      ["65_plus", "65 or over"],
    ],
  },
  household: {
    label: "Adults in the household",
    options: [
      ["single", "One adult"],
      ["couple", "A couple"],
      ["other", "Other adults sharing"],
    ],
  },
  children: {
    label: "Children or dependants",
    options: [
      ["none", "None"],
      ["under_5", "Youngest under 5"],
      ["school_age", "School age (5 to 17)"],
      ["adult_dependant", "Adult dependant"],
    ],
  },
  tenure: {
    label: "Housing",
    options: [
      ["private_rent", "Rent privately"],
      ["social_rent", "Rent from a council or housing association"],
      ["own_mortgage", "Own with a mortgage"],
      ["own_outright", "Own outright"],
      ["other", "Other (living with family, temporary, none)"],
    ],
  },
  income_band: {
    label: "Household income before tax, per year",
    options: [
      ["under_15k", "Under £15,000"],
      ["15k_25k", "£15,000 to £25,000"],
      ["25k_40k", "£25,000 to £40,000"],
      ["40k_60k", "£40,000 to £60,000"],
      ["60k_100k", "£60,000 to £100,000"],
      ["over_100k", "Over £100,000"],
    ],
  },
  employment: {
    label: "Work",
    options: [
      ["employed", "Employed"],
      ["self_employed", "Self-employed"],
      ["unemployed", "Not working, looking for work"],
      ["retired", "Retired"],
      ["not_working_other", "Not working for another reason"],
    ],
  },
  student: {
    label: "Studying",
    options: [
      ["no", "Not a student"],
      ["school_college", "At school or college"],
      ["university", "At university"],
    ],
  },
  // postcode is the eighth field; it is handled separately because it selects the ballot
} as const;

// Optional fields (Romily's list). Each is a plain yes/no about the household, never about opinions, and each exists only because
// published positions can refer to it. Left blank, nothing is assumed either way.
export const OPTIONAL_FIELDS = {
  disability: { label: "Anyone in the household is disabled or has a long-term health condition", options: [["yes", "Yes"], ["no", "No"]] },
  carer: { label: "Anyone in the household is an unpaid carer", options: [["yes", "Yes"], ["no", "No"]] },
  visa: { label: "Anyone in the household is on a UK visa, or seeking asylum", options: [["yes", "Yes"], ["no", "No"]] },
  benefits: { label: "The household receives any means-tested benefit (Universal Credit, Pension Credit, etc.)", options: [["yes", "Yes"], ["no", "No"]] },
  drives: { label: "The household owns or regularly drives a car", options: [["yes", "Yes"], ["no", "No"]] },
  veteran: { label: "Anyone in the household has served in the armed forces", options: [["yes", "Yes"], ["no", "No"]] },
} as const;
export type OptionalKey = keyof typeof OPTIONAL_FIELDS;
export const OPTIONAL_KEYS = Object.keys(OPTIONAL_FIELDS) as OptionalKey[];

export type FieldKey = keyof typeof FIELDS;
export type Household = Partial<Record<FieldKey, string>> & Partial<Record<OptionalKey, string>> & { postcode?: string };

export const FIELD_KEYS = Object.keys(FIELDS) as FieldKey[];

export function householdFromParams(params: Record<string, string | string[] | undefined>): Household {
  const h: Household = {};
  for (const k of FIELD_KEYS) {
    const v = params[k];
    const s = Array.isArray(v) ? v[0] : v;
    if (s && (FIELDS[k].options as readonly (readonly [string, string])[]).some((o) => o[0] === s)) h[k] = s;
  }
  for (const k of OPTIONAL_KEYS) {
    const v = params[k];
    const o = Array.isArray(v) ? v[0] : v;
    if (o === "yes" || o === "no") h[k] = o;
  }
  const pc = params.postcode;
  if (typeof pc === "string" && pc.trim()) h.postcode = pc.trim().toUpperCase();
  return h;
}

export function householdComplete(h: Household): boolean {
  return FIELD_KEYS.every((k) => Boolean(h[k]));
}

// Canonical key for the receipt grid: the seven banded fields in fixed order.
export function householdKey(h: Household): string | null {
  if (!householdComplete(h)) return null;
  return FIELD_KEYS.map((k) => `${k}=${h[k]}`).join("|");
}

// Derived booleans that claims may reference in applies_if.
function derived(h: Household): Record<string, boolean> {
  return {
    has_children: h.children !== undefined && h.children !== "none",
    rents: h.tenure === "private_rent" || h.tenure === "social_rent",
    owns: h.tenure === "own_mortgage" || h.tenure === "own_outright",
    is_student: h.student !== undefined && h.student !== "no",
    is_pensioner: h.age_band === "65_plus" || h.employment === "retired",
    has_disability: h.disability === "yes",
    is_carer: h.carer === "yes",
    on_visa: h.visa === "yes",
    on_benefits: h.benefits === "yes" || (h.employment === "unemployed"),
    drives: h.drives === "yes",
    is_veteran: h.veteran === "yes",
  };
}

/**
 * applies_if is a JSON object. Every key must match for the claim to apply.
 * - A field key (e.g. "tenure") matches if the household value equals the string,
 *   or is contained in the array.
 * - A derived boolean key (e.g. "has_children") matches if equal.
 * - {} matches every household.
 * - Keys starting with "within_m" are geographic and are evaluated elsewhere; here they
 *   are treated as not matching unless the caller has already resolved them.
 */
export function claimApplies(appliesIf: unknown, h: Household): boolean {
  if (!appliesIf || typeof appliesIf !== "object") return true;
  const rules = appliesIf as Record<string, unknown>;
  const d = derived(h);
  for (const [key, want] of Object.entries(rules)) {
    if (key.startsWith("_")) continue; // metadata such as _single_check, not a rule
    if (key.startsWith("within_m")) return false;
    if (key in d) {
      const optionalUnknown = (key === "has_disability" && h.disability === undefined) || (key === "is_carer" && h.carer === undefined) || (key === "on_visa" && h.visa === undefined) || (key === "drives" && h.drives === undefined) || (key === "is_veteran" && h.veteran === undefined) || (key === "on_benefits" && h.benefits === undefined && h.employment !== "unemployed");
      if (optionalUnknown) return false; // not answered: the claim is listed among "other positions" rather than assumed to apply
      if (d[key] !== Boolean(want)) return false;
      continue;
    }
    const have = (h as Record<string, string | undefined>)[key];
    if (have === undefined) return false;
    if (Array.isArray(want)) {
      if (!want.includes(have)) return false;
    } else if (String(want) !== have) {
      return false;
    }
  }
  return true;
}

// Economic key for the receipt grid: the fields that change a tax-and-benefit result.
// Student status is not modelled; "adult_dependant" is treated as "none". See scripts/compute_grid.py.
export const GRID_KEYS = ["age_band", "household", "children", "tenure", "income_band", "employment"] as const;
export function gridKey(h: Household): string | null {
  if (!householdComplete(h)) return null;
  return GRID_KEYS.map((k) => {
    let v = h[k] as string;
    if (k === "children" && v === "adult_dependant") v = "none";
    return `${k}=${v}`;
  }).join("|");
}

// Optional questions about the person (round eight q6, agreed by Barny and Romily on 29 Sept 2026: "more personal", no
// verdicts). Categories follow the ONS 2021 Census questions. These answers stay in this browser: they are never put in a
// page address, never sent to us and never used to calculate anything. They do two things only, the same for every
// answer and every party: Equality and rights moves to the top of "What's at stake", with the reason; and positions whose
// own words mention the group you chose are listed first, from every party that has any, in ballot order. The site
// never says whether a policy is good or bad for anyone.
export const PERSONAL_FIELDS = {
  ethnicity: {
    label: "Your ethnic group",
    options: [["asian", "Asian or Asian British"], ["black", "Black, Black British, Caribbean or African"], ["mixed", "Mixed or multiple ethnic groups"], ["white", "White"], ["other_ethnic", "Another ethnic group"]],
  },
  religion: {
    label: "Your religion",
    options: [["none", "No religion"], ["christian", "Christian"], ["buddhist", "Buddhist"], ["hindu", "Hindu"], ["jewish", "Jewish"], ["muslim", "Muslim"], ["sikh", "Sikh"], ["other_religion", "Another religion"]],
  },
  sex: {
    label: "Your sex",
    options: [["female", "Female"], ["male", "Male"]],
  },
  trans: {
    label: "Is the gender you identify with the same as your sex registered at birth?",
    options: [["same", "Yes"], ["trans", "No"]],
  },
  orientation: {
    label: "Your sexual orientation",
    options: [["straight", "Straight or heterosexual"], ["gay", "Gay or lesbian"], ["bi", "Bisexual"], ["other_orientation", "Another sexual orientation"]],
  },
} as const;
export type PersonalKey = keyof typeof PERSONAL_FIELDS;
export const PERSONAL_KEYS = Object.keys(PERSONAL_FIELDS) as PersonalKey[];

// Why each is asked, in the same style as the household questions.
export const PERSONAL_WHY: Record<PersonalKey, string> = {
  ethnicity: "Parties publish positions on race equality and discrimination. If you answer, those come first, from every party.",
  religion: "Parties publish positions on faith, religious freedom and hate crime. If you answer, those come first, from every party.",
  sex: "Parties publish positions on women's and men's rights, maternity and pay. If you answer, those come first, from every party.",
  trans: "Parties publish positions on gender recognition and trans rights. If you answer, those come first, from every party.",
  orientation: "Parties publish positions on LGBT+ rights. If you answer, those come first, from every party.",
};

// The words that count as a mention, per answer. Matched against the quotation itself (the party's own words), never the
// summary. Deliberately literal: a mention is a mention, whatever the position says.
const GENERIC_RACE = String.raw`\b(race|racial|racis\w*|ethnic\w*|anti-racis\w*|Windrush)\b`;
const GENERIC_RELIGION = String.raw`\b(religio\w*|faith|faiths|worship|blasphem\w*)\b`;
const PATTERNS: Record<string, { label: string; re: string }> = {
  asian: { label: "race, ethnicity or Asian people", re: `${GENERIC_RACE}|\\bAsian\\b` },
  black: { label: "race, ethnicity or Black people", re: `${GENERIC_RACE}|\\bBlack (people|communit\\w*|Britons?|British)\\b` },
  mixed: { label: "race or ethnicity", re: GENERIC_RACE },
  white: { label: "race or ethnicity", re: GENERIC_RACE },
  other_ethnic: { label: "race or ethnicity", re: GENERIC_RACE },
  none: { label: "religion or belief", re: `${GENERIC_RELIGION}|\\b(secular\\w*|humanis\\w*)\\b` },
  christian: { label: "religion or Christianity", re: `${GENERIC_RELIGION}|\\b(Christian\\w*|church\\w*)\\b` },
  buddhist: { label: "religion or Buddhism", re: `${GENERIC_RELIGION}|\\bBuddhis\\w*` },
  hindu: { label: "religion or Hindus", re: `${GENERIC_RELIGION}|\\bHindu\\w*` },
  jewish: { label: "religion, Jewish people or antisemitism", re: `${GENERIC_RELIGION}|\\b(Jew\\w*|antisemit\\w*|anti-semit\\w*|synagogue\\w*)` },
  muslim: { label: "religion, Muslims or Islam", re: `${GENERIC_RELIGION}|\\b(Muslim\\w*|Islam\\w*|mosque\\w*)` },
  sikh: { label: "religion or Sikhs", re: `${GENERIC_RELIGION}|\\bSikh\\w*` },
  other_religion: { label: "religion or belief", re: GENERIC_RELIGION },
  female: { label: "women or girls", re: String.raw`\b(women|woman|girls?|maternity|misogyn\w*|femin\w*|sex-based)\b` },
  male: { label: "men or boys", re: String.raw`\b(men|boys?|paternity|fathers?)\b` },
  same: { label: "sex and gender", re: String.raw`\b(gender|sex-based|biological sex)\b` },
  trans: { label: "trans people or gender identity", re: String.raw`\b(trans|transgender|gender identity|gender recognition|gender reassignment|non-binary)\b` },
  straight: { label: "sexual orientation", re: String.raw`\b(sexual orientation|LGBT\w*|same-sex)\b` },
  gay: { label: "LGBT+ people or sexual orientation", re: String.raw`\b(LGBT\w*|gay|lesbian\w*|sexual orientation|same-sex|conversion (therapy|practices))\b` },
  bi: { label: "LGBT+ people or sexual orientation", re: String.raw`\b(LGBT\w*|bisexual\w*|sexual orientation|same-sex|conversion (therapy|practices))\b` },
  other_orientation: { label: "LGBT+ people or sexual orientation", re: String.raw`\b(LGBT\w*|sexual orientation|same-sex|conversion (therapy|practices))\b` },
};

export type PersonalMatch = { key: PersonalKey; answer: string; answerText: string; label: string; re: RegExp };
export function personalMatchers(p: Partial<Record<string, string>> | null): PersonalMatch[] {
  if (!p) return [];
  const out: PersonalMatch[] = [];
  for (const k of PERSONAL_KEYS) {
    const a = p[k];
    const opt = (PERSONAL_FIELDS[k].options as readonly (readonly [string, string])[]).find(([c]) => c === a);
    const pat = a ? PATTERNS[a] : undefined;
    if (opt && pat) out.push({ key: k, answer: opt[0], answerText: opt[1], label: pat.label, re: new RegExp(pat.re, "i") });
  }
  return out;
}

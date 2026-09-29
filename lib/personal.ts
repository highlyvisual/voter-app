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
  ethnicity: "Parties publish positions on race equality and discrimination. If you answer, positions that name your ethnic group come first, then those about race in general, from every party.",
  religion: "Parties publish positions on faith, religious freedom and hate crime. If you answer, positions that name your religion (or none) come first, then those about religion in general, from every party.",
  sex: "Parties publish positions on women's and men's rights, maternity and pay. If you answer, positions that name women or men come first, from every party.",
  trans: "Parties publish positions on gender recognition and trans rights. If you answer, positions that name trans people come first, then those about sex and gender in general, from every party.",
  orientation: "Parties publish positions on LGBT+ rights. If you answer, positions that name your group come first, then those about sexual orientation in general, from every party.",
};

// Two tiers per answer (Romily, 29 Sept: "it should be able to identify if my race was the same as that said in the
// policy"). "names" = the party's own words name the group you chose (or a wider group that plainly includes it, such
// as "ethnic minority" or "LGBT"). "about" = the words are about the subject in general but don't name your group.
// Matched against the quotation itself (the party's own words), never the summary. Deliberately literal: a mention is
// a mention, whatever the position says, and the site never says whether it helps or harms anyone.
// Some place words are left out on purpose ("Chinese", "Indian", "black market"): they appear in foreign policy and
// everyday phrases far more often than about people living in the UK, and a wrong "names your group" is worse than none.
type Tier = { label: string; re: string };
const RACE = String.raw`\b(race|racial|racis\w*|ethnic\w*|anti-racis\w*|Windrush|BAME)\b`;
const MINORITY = String.raw`\b(ethnic minorit\w*|minority ethnic|BAME|global majority|people of colou?r)\b`;
const RELIGION = String.raw`\b(religio\w*|faith|faiths|worship|blasphem\w*)\b`;
const SEXGENDER = String.raw`\b(gender|sex-based|single[- ]sex|biological sex|sex in law|change their sex)\b`;
const ORIENT = String.raw`\b(sexual orientation|LGBT\w*|same-sex|gay|lesbians?|bisexual\w*|homosexual\w*|conversion (therapy|practices))\b`;
const PATTERNS: Record<string, { names: Tier | null; about: Tier }> = {
  asian: { names: { label: "Asian people, or ethnic minorities", re: String.raw`\b(Asian|Asians|British Asian|South Asian|East Asian)\b|${MINORITY}` }, about: { label: "race or ethnicity", re: RACE } },
  black: { names: { label: "Black people, or ethnic minorities", re: String.raw`\bBlack(,| and| people| communit\w*| Britons?| British| men| women| boys| girls| pupils| children| families| workers)|\b(African[- ]Caribbean|Caribbean|Windrush)\b|${MINORITY}` }, about: { label: "race or ethnicity", re: RACE } },
  mixed: { names: { label: "people of mixed ethnicity, or ethnic minorities", re: String.raw`\bmixed[- ](race|heritage|ethnic\w*)\b|${MINORITY}` }, about: { label: "race or ethnicity", re: RACE } },
  white: { names: { label: "white people", re: String.raw`\bwhite (people|British|Britons?|communit\w*|working[- ]class|men|women|boys|girls|pupils|children|families|workers)\b` }, about: { label: "race or ethnicity", re: RACE } },
  other_ethnic: { names: { label: "your group, or ethnic minorities", re: String.raw`\b(Arabs?|Gypsy|Gypsies|Roma|Irish Travellers?|Gypsy,? Roma and Travellers?)\b|${MINORITY}` }, about: { label: "race or ethnicity", re: RACE } },
  none: { names: { label: "people with no religion", re: String.raw`\b(secular\w*|humanis\w*|atheis\w*|non-religious|no religion|non-believers?)\b` }, about: { label: "religion or belief", re: RELIGION } },
  christian: { names: { label: "Christians", re: String.raw`\b(Christians?|Christianity|church(es)?)\b` }, about: { label: "religion or belief", re: RELIGION } },
  buddhist: { names: { label: "Buddhists", re: String.raw`\bBuddhis\w*` }, about: { label: "religion or belief", re: RELIGION } },
  hindu: { names: { label: "Hindus", re: String.raw`\b(Hindus?|Hinduism|Hinduphobia)\b` }, about: { label: "religion or belief", re: RELIGION } },
  jewish: { names: { label: "Jewish people", re: String.raw`\b(Jews|Jewish|Judaism|antisemit\w*|anti-semit\w*|synagogues?)\b` }, about: { label: "religion or belief", re: RELIGION } },
  muslim: { names: { label: "Muslims", re: String.raw`\b(Muslims?|Islam\w*|mosques?)\b` }, about: { label: "religion or belief", re: RELIGION } },
  sikh: { names: { label: "Sikhs", re: String.raw`\b(Sikhs?|Sikhism|gurdwaras?)\b` }, about: { label: "religion or belief", re: RELIGION } },
  other_religion: { names: null, about: { label: "religion or belief", re: RELIGION } },
  female: { names: { label: "women or girls", re: String.raw`\b(women|woman|girls?|females?|maternity|mothers?|misogyn\w*|femin\w*)\b` }, about: { label: "sex and gender", re: SEXGENDER } },
  male: { names: { label: "men or boys", re: String.raw`\b(men|boys?|males?|paternity|fathers?)\b` }, about: { label: "sex and gender", re: SEXGENDER } },
  same: { names: null, about: { label: "sex and gender", re: String.raw`${SEXGENDER}|\b(trans|transgender|gender recognition|non-binary)\b` } },
  trans: { names: { label: "trans or non-binary people", re: String.raw`\b(trans|transgender|gender identity|gender recognition|gender reassignment|non-binary|social transitioning|LGBT\w*)\b` }, about: { label: "sex and gender", re: SEXGENDER } },
  straight: { names: { label: "straight people", re: String.raw`\b(heterosexual\w*|opposite-sex)\b` }, about: { label: "sexual orientation", re: ORIENT } },
  gay: { names: { label: "gay and lesbian people, or LGBT+ people", re: String.raw`\b(LGBT\w*|gay|lesbians?|homosexual\w*|same-sex|conversion (therapy|practices))\b` }, about: { label: "sexual orientation", re: ORIENT } },
  bi: { names: { label: "bisexual people, or LGBT+ people", re: String.raw`\b(LGBT\w*|bisexual\w*|same-sex|conversion (therapy|practices))\b` }, about: { label: "sexual orientation", re: ORIENT } },
  other_orientation: { names: { label: "LGBT+ people", re: String.raw`\b(LGBT\w*|queer|asexual\w*|pansexual\w*|conversion (therapy|practices))\b` }, about: { label: "sexual orientation", re: ORIENT } },
};

export type PersonalMatch = { key: PersonalKey; answer: string; answerText: string; names: { label: string; re: RegExp } | null; about: { label: string; re: RegExp } };
export function personalMatchers(p: Partial<Record<string, string>> | null): PersonalMatch[] {
  if (!p) return [];
  const out: PersonalMatch[] = [];
  for (const k of PERSONAL_KEYS) {
    const a = p[k];
    const opt = (PERSONAL_FIELDS[k].options as readonly (readonly [string, string])[]).find(([c]) => c === a);
    const pat = a ? PATTERNS[a] : undefined;
    if (opt && pat) out.push({ key: k, answer: opt[0], answerText: opt[1], names: pat.names ? { label: pat.names.label, re: new RegExp(pat.names.re, "i") } : null, about: { label: pat.about.label, re: new RegExp(pat.about.re, "i") } });
  }
  return out;
}

// Sort a set of quotations into the two tiers for one answer. A quotation that names the group is not repeated below.
export function tierHits<T extends { quote: string }>(m: PersonalMatch, items: T[]): { named: T[]; general: T[] } {
  const named = m.names ? items.filter((p) => m.names!.re.test(p.quote)) : [];
  const general = items.filter((p) => !named.includes(p) && m.about.re.test(p.quote));
  return { named, general };
}

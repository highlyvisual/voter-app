// The site-critique questionnaire (29 Sept 2026, before Romily sends the site out for people to try). One definition
// used by the page (app/feedback/page.tsx) and checked against the static copy Netlify reads at deploy time
// (public/__forms.html, see scripts/check-forms.mjs): Netlify only keeps fields it saw in that file.
// Nothing here is scored or ranked; every question is optional and anonymous.
export type Choice = { kind: "choice"; name: string; q: string; options: string[]; hint?: string };
export type Scale = { kind: "scale"; name: string; q: string; low: string; high: string; skip?: string };
export type Text = { kind: "text"; name: string; q: string; hint?: string; long?: boolean; showIf?: { name: string; value: string } };
export type Question = Choice | Scale | Text;
export type Section = { title: string; questions: Question[] };

export const FEEDBACK_FORM_NAME = "site-feedback";

export const FEEDBACK_SECTIONS: Section[] = [
  {
    title: "First impressions",
    questions: [
      { kind: "choice", name: "device", q: "What did you use to look at it?", options: ["Phone", "Tablet", "Laptop or computer"] },
      { kind: "text", name: "what_for", q: "In a sentence, what do you think this site is for?", hint: "There's no right answer: we want to know if it's obvious." },
      { kind: "scale", name: "easy", q: "How easy was it to find your way around?", low: "Very hard", high: "Very easy" },
      { kind: "choice", name: "tappable", q: "Was it clear what you could tap or click?", options: ["Always", "Mostly", "Sometimes", "Rarely"] },
    ],
  },
  {
    title: "What it told you",
    questions: [
      { kind: "choice", name: "postcode", q: "Did you put in a postcode?", options: ["Yes, my own", "Yes, someone else's or a made-up one", "No"] },
      { kind: "scale", name: "meaning", q: "How well did it show what an election could mean for you?", low: "Not at all", high: "Very well", skip: "Didn't get that far" },
      { kind: "scale", name: "trust", q: "How much do you trust the information on it?", low: "Not at all", high: "Completely" },
      { kind: "choice", name: "bias", q: "Did anything feel biased for or against a party or a candidate?", options: ["No", "Yes", "Not sure"] },
      { kind: "text", name: "bias_where", q: "Where, and what felt biased?", long: true, showIf: { name: "bias", value: "Yes" } },
    ],
  },
  {
    title: "Look and feel",
    questions: [
      { kind: "scale", name: "look", q: "How do you like the way it looks and feels?", low: "Not for me", high: "Love it" },
      { kind: "text", name: "useful", q: "What was the most useful or interesting thing?", long: true },
      { kind: "text", name: "confusing", q: "What confused or annoyed you most?", long: true },
    ],
  },
  {
    title: "Last few",
    questions: [
      { kind: "choice", name: "use_it", q: "Would you use it before an election?", options: ["Yes", "Maybe", "No"] },
      { kind: "choice", name: "can_vote", q: "Can you vote in UK elections?", options: ["Yes", "Not yet", "No", "Prefer not to say"] },
      { kind: "text", name: "anything_else", q: "Anything else you'd like to tell us?", long: true },
    ],
  },
];

// Fields the page sends besides the questions: the form name Netlify files it under, the page someone came from,
// and a honeypot that people never see (anything in it marks the submission as spam).
export const FEEDBACK_EXTRA_FIELDS = ["form-name", "from", "bot-field"];
export const FEEDBACK_FIELDS = FEEDBACK_SECTIONS.flatMap((s) => s.questions.map((q) => q.name));

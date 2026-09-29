import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { FEEDBACK_FIELDS, FEEDBACK_EXTRA_FIELDS, FEEDBACK_FORM_NAME } from "../dist-test/feedbackForm.mjs";

// Netlify only keeps the fields it found in public/__forms.html at deploy time. If the questionnaire gains a question
// and the static copy doesn't, answers to it would be silently dropped.
test("public/__forms.html declares exactly the questionnaire's fields", () => {
  const html = fs.readFileSync(new URL("../public/__forms.html", import.meta.url), "utf8");
  assert.match(html, new RegExp(`<form name="${FEEDBACK_FORM_NAME}" data-netlify="true" netlify-honeypot="bot-field"`));
  const names = [...html.matchAll(/<input[^>]*name="([^"]+)"/g)].map((m) => m[1]).sort();
  assert.deepEqual(names, [...FEEDBACK_EXTRA_FIELDS, ...FEEDBACK_FIELDS].sort());
});

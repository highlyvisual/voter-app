import test from "node:test";
import assert from "node:assert/strict";
import { personalMatchers, tierHits } from "../dist-test/personal.mjs";

// Real party quotations from the ledger (Romily, 29 Sept: tell apart "names my group" from "about the subject").
const race = { quote: "Labour will introduce a landmark Race Equality Act, to enshrine in law the full right to equal pay for Black, Asian, and other ethnic minority people, strengthen protections against dual discrimination and root out other racial inequalities." };
const faith = { quote: "Scrap the Prevent programme and tackle hate crime, misogyny, Islamophobia and antisemitism. Seek to restore trust and confidence in the police." };
const rail = { quote: "Freeze rail fares and simplify ticketing on public transport to ensure regular users are paying fair and affordable prices." };
const tier = (answers, q) => { const [m] = personalMatchers(answers); const t = tierHits(m, q); return [t.named.length, t.general.length]; };

test("a policy naming Black and Asian people names those groups, and is only 'about race' for a white person", () => {
  assert.deepEqual(tier({ ethnicity: "black" }, [race]), [1, 0]);
  assert.deepEqual(tier({ ethnicity: "asian" }, [race]), [1, 0]);
  assert.deepEqual(tier({ ethnicity: "mixed" }, [race]), [1, 0]);
  assert.deepEqual(tier({ ethnicity: "white" }, [race]), [0, 1]);
});

test("religions are named only by their own words", () => {
  assert.deepEqual(tier({ religion: "muslim" }, [faith]), [1, 0]);
  assert.deepEqual(tier({ religion: "jewish" }, [faith]), [1, 0]);
  assert.deepEqual(tier({ religion: "sikh" }, [faith]), [0, 0]);
});

test("'transport' is not a mention of trans people", () => {
  assert.deepEqual(tier({ trans: "trans" }, [rail]), [0, 0]);
});

test("unknown or missing answers match nothing", () => {
  assert.deepEqual(personalMatchers({ ethnicity: "martian" }), []);
  assert.deepEqual(personalMatchers(null), []);
});

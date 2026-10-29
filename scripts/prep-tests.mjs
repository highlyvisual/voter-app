// Rewrites the compiled test modules so path aliases resolve under plain node.
import fs from "node:fs";
const d = "dist-test";
for (const f of fs.readdirSync(d)) {
  if (!f.endsWith(".js")) continue;
  let s = fs.readFileSync(`${d}/${f}`, "utf8");
  s = s.replace(/from "@\/lib\/household"/g, 'from "./household.mjs"').replace(/from "@\/lib\/data"/g, 'from "./data.mjs"').replace(/from "@\/lib\/types"/g, 'from "./types.mjs"').replace(/from "@\/lib\/deadlines"/g, 'from "./deadlines.mjs"').replace(/from "@\/lib\/receipts"/g, 'from "./receipts.mjs"').replace(/from "@supabase\/supabase-js"/g, 'from "./supabase-stub.mjs"').replace(/from "@\/lib\/admin"/g, 'from "./admin-stub.mjs"').replace(/from "@\/lib\/(parliament|personal|topicOrder|councilBusiness|homeTopics|homeFacts|themes|lifeAreas)"/g, 'from "./$1.mjs"').replace(/from "@\/lib\/decision-chain\.json"/g, 'from "./decision-chain.json" with { type: "json" }');
  fs.writeFileSync(`${d}/${f.replace(/\.js$/, ".mjs")}`, s); fs.unlinkSync(`${d}/${f}`);
}
if (!fs.existsSync(`${d}/decision-chain.json`)) fs.copyFileSync("lib/decision-chain.json", `${d}/decision-chain.json`);
fs.writeFileSync(`${d}/supabase-stub.mjs`, "export function createClient(){return {from(){return {select(){return this},eq(){return this},order(){return this}}}}}");
fs.writeFileSync(`${d}/admin-stub.mjs`, "export function adminClient(){return null}");

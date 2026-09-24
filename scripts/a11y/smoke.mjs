// Live smoke suite: for every page type, load in real Chrome, check status, broken images, console errors, and axe (WCAG 2.0 A/AA).
// Usage: node scripts/a11y/smoke.mjs https://voter-app-uk.netlify.app
import puppeteer from "puppeteer-core";
const base = (process.argv[2] ?? "https://voter-app-uk.netlify.app").replace(/\/$/, "");
const pages = ["/", "/start", "/positions", "/ballot/parl.holborn-and-st-pancras.by.2026-10-08/quick", "/parties", "/parties/PP53", "/learn", "/profile", "/who-we-are", "/status", "/place?pc=SW6&loc=51.477,-0.208", "/ballot/parl.holborn-and-st-pancras.by.2026-10-08/area", "/ballot/parl.holborn-and-st-pancras.by.2026-10-08/office", "/ballot/parl.holborn-and-st-pancras.by.2026-10-08/stakes", "/ballot/parl.holborn-and-st-pancras.by.2026-10-08/candidate/11", "/ballot/parl.holborn-and-st-pancras.by.2026-10-08", "/ballot/parl.holborn-and-st-pancras.by.2026-10-08/compare", "/ballot/parl.holborn-and-st-pancras.by.2026-10-08/topic/housing_and_property", "/ballot/local.lambeth.myatts-fields.by.2026-10-08", "/ballot/parl.holborn-and-st-pancras.2024-07-04", "/how-to-vote", "/about", "/data", "/coverage/parl.holborn-and-st-pancras.by.2026-10-08", "/share", "/ballot/parl.holborn-and-st-pancras.by.2026-10-08/notes", "/about/impact", "/ledger"];
const b = await puppeteer.launch({ executablePath: "/opt/google/chrome/chrome", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
let failures = 0;
for (const path of pages) {
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 900 });
  const errors = []; p.on("pageerror", (e) => errors.push(String(e.message).slice(0, 120))); p.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 120)); });
  const resp = await p.goto(base + path, { waitUntil: "networkidle0", timeout: 120000 }).catch(() => null);
  const status = resp?.status() ?? 0;
  const broken = await p.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute("src")).map((i) => i.getAttribute("src")).slice(0, 5));
  await p.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  const axe = await p.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.map((v) => `${v.id}×${v.nodes.length}`));
  const ok = status === 200 && broken.length === 0 && axe.length === 0 && errors.length === 0;
  if (!ok) failures++;
  console.log(`${ok ? "OK  " : "FAIL"} ${status} ${path}${broken.length ? ` broken images: ${broken.join(", ")}` : ""}${axe.length ? ` axe: ${axe.join(", ")}` : ""}${errors.length ? ` errors: ${errors.join(" | ")}` : ""}`);
  await p.close();
}
await b.close(); console.log(failures ? `${failures} page(s) failing` : "all pages pass"); process.exit(failures ? 1 : 0);

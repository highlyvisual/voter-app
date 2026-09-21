import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/opt/google/chrome/chrome", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const p = await b.newPage(); await p.setViewport({ width: 1200, height: 900 });
await p.goto(process.argv[2], { waitUntil: "networkidle2", timeout: 120000 });
await p.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
const r = await p.evaluate(async () => {
  const res = await axe.run(document, { runOnly: ["nested-interactive", "color-contrast"] });
  const pill = document.querySelector(".party-pill"); const cs = pill && getComputedStyle(pill);
  const map = document.querySelector(".map");
  return { pillColor: cs && cs.color, pillRule: pill && pill.getAttribute("style"), mapAttrs: map && [...map.attributes].map(a => a.name + "=" + a.value).join(" "), nested: res.violations.filter(v => v.id === "nested-interactive").flatMap(v => v.nodes.map(n => n.target[0] + " :: " + n.html.slice(0, 100))) };
});
console.log(JSON.stringify(r, null, 1)); await b.close();

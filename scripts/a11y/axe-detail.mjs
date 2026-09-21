import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/opt/google/chrome/chrome", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const p = await b.newPage(); await p.setViewport({ width: 1200, height: 900 });
await p.goto(process.argv[2], { waitUntil: "networkidle2", timeout: 120000 });
await p.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
const r = await p.evaluate(async () => await axe.run(document, { runOnly: ["color-contrast"] }));
for (const v of r.violations) for (const n of v.nodes) console.log(n.target[0], "|", n.any[0]?.data?.fgColor, "on", n.any[0]?.data?.bgColor, "ratio", n.any[0]?.data?.contrastRatio, "|", n.html.slice(0, 120));
await b.close();

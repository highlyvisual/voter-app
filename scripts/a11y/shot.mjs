import puppeteer from "puppeteer-core";
const [url, out, w = "1280", h = "900", full = "0"] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: "/opt/google/chrome/chrome", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const p = await b.newPage(); await p.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
await p.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
await p.screenshot({ path: out, fullPage: full === "1" }); await b.close();

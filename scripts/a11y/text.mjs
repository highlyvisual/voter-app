import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "/opt/google/chrome/chrome", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const p = await b.newPage(); await p.goto(process.argv[2], { waitUntil: "networkidle0", timeout: 120000 });
const t = await p.evaluate((sel) => document.querySelector(sel)?.innerText ?? "(not found)", process.argv[3]);
console.log(t.slice(0, 900)); await b.close();

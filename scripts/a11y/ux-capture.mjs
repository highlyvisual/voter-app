import puppeteer from "puppeteer-core";
const base="http://localhost:3240"; const H="parl.holborn-and-st-pancras.by.2026-10-08";
const pages = {
  home:"/", place:"/place?pc=SW6&loc=51.477,-0.208", ballot:`/ballot/${H}?pc=NW1&loc=51.530,-0.127&tenure=private_rent&age_band=25_34&income_band=25k_40k&household=couple&children=none&employment=employed&student=no`,
  area:`/ballot/${H}/area?pc=NW1&loc=51.530,-0.127`, office:`/ballot/${H}/office`, stakes:`/ballot/${H}/stakes?tenure=private_rent&age_band=25_34&income_band=25k_40k&household=couple&children=none&employment=employed&student=no`,
  candidate:`/ballot/${H}/candidate/11`, compare:`/ballot/${H}/compare`, quick:`/ballot/${H}/quick`, positions:"/positions", parties:"/parties", party:"/parties/PP53",
  learn:"/learn", start:"/start", profile:"/profile", about:"/about", who:"/who-we-are", status:"/status", ledger:"/ledger", vote:"/vote",
};
const [,, width, mode] = process.argv;
const b = await puppeteer.launch({ executablePath: "/opt/google/chrome/chrome", args: ["--no-sandbox","--disable-dev-shm-usage"] });
const out = [];
for (const [name, path] of Object.entries(pages)) {
  const p = await b.newPage(); await p.setViewport({ width: Number(width), height: 900, deviceScaleFactor: 1 });
  if (mode === "dark") await p.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  try {
    const r = await p.goto(base + path, { waitUntil: "networkidle0", timeout: 120000 });
    await new Promise(r=>setTimeout(r,800));
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await p.screenshot({ path: `/tmp/ux/${name}-${width}-${mode}.png`, fullPage: true });
    out.push(`${name}: ${r.status()} h-overflow=${overflow}px`);
  } catch (e) { out.push(`${name}: ERROR ${String(e).slice(0,60)}`); }
  await p.close();
}
console.log(out.join("\n")); await b.close();

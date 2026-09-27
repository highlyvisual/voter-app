import fs from "node:fs";
import path from "node:path";
export const metadata = { title: "Accuracy checks", description: "How we check our election data before polling day: sampled postcodes inside each boundary, and candidate lists compared with the official nominations.", alternates: { canonical: "/about/accuracy" } };
// WP-A7: the latest pre-publication check report per ballot, from reports/ballot-checks in the repository.
export default function Accuracy() {
  const dir = path.join(process.cwd(), "reports", "ballot-checks");
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort().reverse() : [];
  return (
    <>
      <h1>Accuracy checks</h1>
      <p className="lede">Before an election, we sample twenty postcodes inside each boundary and confirm they resolve to the right ballot, and compare our candidate list against the official Statement of Persons Nominated. The reports are published here as written by the script.</p>
      {files.length === 0 ? <p className="muted">No reports yet.</p> : files.map((f) => (
        <details key={f} open={f === files[0]}><summary>{f.replace(".md", "")}</summary><pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>{fs.readFileSync(path.join(dir, f), "utf8")}</pre></details>
      ))}
      <p className="meta">Script: scripts/check-ballots.py in the public repository.</p>
    </>
  );
}

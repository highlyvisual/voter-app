"use client";
import { useEffect, useState } from "react";
import { TOPICS } from "@/lib/data";
export default function ShareTool({ ballots }: { ballots: { id: string; name: string }[] }) {
  const [b, setB] = useState(ballots[0]?.id ?? ""); const [view, setView] = useState("ballot"); const [copied, setCopied] = useState("");
  const [origin, setOrigin] = useState("https://hustings.org");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const path = view === "ballot" ? `/ballot/${encodeURIComponent(b)}` : view === "compare" ? `/ballot/${encodeURIComponent(b)}/compare` : `/ballot/${encodeURIComponent(b)}/topic/${view}`;
  const url = origin + path; const embed = `<iframe src="${origin}/ballot/${encodeURIComponent(b)}/embed" width="100%" height="480" style="border:1px solid #e2dacb;border-radius:12px" title="Candidates: ${ballots.find((x) => x.id === b)?.name ?? ""}"></iframe>`;
  const copy = async (t: string, what: string) => { try { await navigator.clipboard.writeText(t); setCopied(what); setTimeout(() => setCopied(""), 1500); } catch {} };
  return (
    <div className="household">
      <label><span>Election</span><select value={b} onChange={(e) => setB(e.target.value)} style={{ width: "100%" }}>{ballots.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label style={{ display: "block", marginTop: "0.6rem" }}><span>View</span><select value={view} onChange={(e) => setView(e.target.value)} style={{ width: "100%" }}><option value="ballot">Ballot page</option><option value="compare">Side by side</option>{TOPICS.map(([k, l]) => <option key={k} value={k}>Topic: {l}</option>)}</select></label>
      <p style={{ marginTop: "0.8rem" }}><strong>Link</strong><br /><code>{url}</code> <button type="button" className="secondary small" onClick={() => copy(url, "link")}>{copied === "link" ? "Copied" : "Copy"}</button></p>
      <p><strong>Embed (candidate list only)</strong><br /><code style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>{embed}</code> <button type="button" className="secondary small" onClick={() => copy(embed, "embed")}>{copied === "embed" ? "Copied" : "Copy"}</button></p>
      <p className="meta">A QR code generator is deliberately not included: it would need a new third-party script. Use your browser's or phone's built-in "create QR for this page" on the link above.</p>
    </div>
  );
}

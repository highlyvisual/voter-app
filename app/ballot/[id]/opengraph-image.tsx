import { ImageResponse } from "next/og";
import { getBallot, listCandidates, listVerifiedClaims } from "@/lib/data";
import { INK, MARK, MARK_RATIO, OG_SIZE, PAPER, RULE, SLATE, SOFT, ogFonts } from "@/lib/og";

export const alt = "An election on What's It To Me: every candidate, in ballot-paper order, with sourced positions.";
export const size = OG_SIZE;
export const contentType = "image/png";

// One share image per election. Facts only — the place, the date, how many are standing and how much is sourced.
// No candidate is pictured or named, so no one is favoured in the preview.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ballotId = decodeURIComponent(id);
  const ballot = await getBallot(ballotId);
  const [candidates, claims] = ballot ? await Promise.all([listCandidates(ballotId), listVerifiedClaims(ballotId)]) : [[], []];
  const kind = !ballot ? "" : ballot.level === "parliamentary" ? (ballotId.includes(".by.") ? "UK Parliament by-election" : "UK Parliament general election") : ballotId.includes(".by.") ? "Council by-election" : "Council election";
  const date = ballot ? new Date(ballot.poll_date + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "";
  const name = ballot?.area_name ?? "Election";
  const sources = new Set(claims.map((c) => c.sources?.id).filter(Boolean)).size;
  const titleSize = name.length > 44 ? 58 : name.length > 28 ? 70 : 84;
  const Stat = ({ n, label }: { n: number; label: string }) => (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontFamily: "Newsreader", fontWeight: 500, fontSize: 64, color: SLATE, lineHeight: 1 }}>{n}</div>
      <div style={{ display: "flex", fontFamily: "Inter", fontWeight: 500, fontSize: 24, color: SOFT, marginTop: 8 }}>{label}</div>
    </div>
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: PAPER, padding: "60px 80px", position: "relative" }}>
        <img src={MARK} width={400 * MARK_RATIO} height={400} style={{ position: "absolute", right: -30, bottom: -30, opacity: 0.06 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src={MARK} width={48 * MARK_RATIO} height={48} />
          <div style={{ display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 32, color: SLATE }}>What’s It To Me?</div>
        </div>
        <div style={{ display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 24, color: SOFT, textTransform: "uppercase", letterSpacing: 2, marginTop: 44 }}>{`${kind}${ballot?.archived ? " · archive" : ""} · ${date}`}</div>
        <div style={{ display: "flex", fontFamily: "Newsreader", fontWeight: 500, fontSize: titleSize, lineHeight: 1.04, color: INK, letterSpacing: -1.2, marginTop: 14, maxWidth: 1000 }}>{name}</div>
        <div style={{ display: "flex", gap: 70, marginTop: "auto", paddingBottom: 26 }}>
          <Stat n={candidates.length} label={`${candidates.length === 1 ? "candidate" : "candidates"}${ballot && ballot.winner_count > 1 ? ` for ${ballot.winner_count} seats` : ""}`} />
          <Stat n={claims.length} label={claims.length === 1 ? "sourced position" : "sourced positions"} />
          <Stat n={sources} label={sources === 1 ? "named source" : "named sources"} />
        </div>
        <div style={{ display: "flex", borderTop: `2px solid ${RULE}`, paddingTop: 22, fontFamily: "Newsreader", fontStyle: "italic", fontWeight: 400, fontSize: 30, color: SLATE }}>
          Every candidate, the same page, in ballot-paper order. No recommendations.
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}

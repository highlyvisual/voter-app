import { ImageResponse } from "next/og";
import { INK, MARK, MARK_RATIO, OG_SIZE, PAPER, RULE, SLATE, SOFT, ogFonts } from "@/lib/og";

export const alt = "Hustings — politics affects your life. Understanding it shouldn't be difficult.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: PAPER, padding: "64px 80px", position: "relative" }}>
        <img src={MARK} width={430 * MARK_RATIO} height={430} style={{ position: "absolute", right: -40, bottom: -40, opacity: 0.07 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={MARK} width={56 * MARK_RATIO} height={56} />
          <div style={{ display: "flex", fontFamily: "Inter", fontWeight: 600, fontSize: 36, color: SLATE, letterSpacing: -0.5 }}>hustings.org</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 54, fontFamily: "Newsreader", fontWeight: 500, fontSize: 80, lineHeight: 1.04, color: INK, letterSpacing: -1.5 }}>
          <div>Politics affects your life.</div>
          <div style={{ display: "flex" }}>Understanding it&nbsp;<span style={{ fontStyle: "italic", fontWeight: 400, color: SLATE }}>shouldn&rsquo;t</span></div>
          <div style={{ display: "flex", fontStyle: "italic", fontWeight: 400, color: SLATE }}>be difficult.</div>
        </div>
        <div style={{ display: "flex", marginTop: "auto", borderTop: `2px solid ${RULE}`, paddingTop: 26, gap: 34, fontFamily: "Inter", fontWeight: 500, fontSize: 26, color: SOFT }}>
          <span>Every candidate</span><span>·</span><span>Every claim sourced</span><span>·</span><span>No recommendations</span>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}

import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type SourceCardProps = {
  brand?: string;
  citation: string;       // "Heilbrunn (2008), p. 142"
  page?: string;          // optional override / addition ("p. 142")
  quote: string;          // pull-quote body
  source?: string;        // e.g. "TRMS Vol III"
  url?: string;           // optional URL line
};

export const SourceCard: React.FC<SourceCardProps> = ({
  brand,
  citation,
  page,
  quote,
  source,
  url,
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  // 2026-05-24: SEALED shorts render this at 1080×1920. The original card
  // was tuned for 1280×720 (LF) — at LF it fills the frame; on 9:16 vertical
  // it floats in the middle with huge top/bottom gaps. Detect vertical and
  // scale up font sizes + padding + maxWidth so the card fills the screen.
  const isVertical = height > width;
  const k = isVertical ? 2.2 : 1.0;     // scale multiplier for vertical
  const maxCardWidth = isVertical ? Math.round(width * 0.92) : 920;

  // Card slides up + fades in
  const inEnd = b.motion.fadeFrames * 3;
  const cardY = interpolate(frame, [0, inEnd], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opacity = interpolate(
    frame,
    [0, inEnd, durationInFrames - b.motion.fadeFrames, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Subtle paper-stain feel — uses parchment surface for sealed/CR brands
  const paper = b.palette.surface;
  const ink = b.palette.ink;

  return (
    <AbsoluteFill style={{
      background: b.palette.bg,
      justifyContent: "center",
      alignItems: "center",
      padding: "0 8%",
    }}>
      <div style={{
        opacity,
        transform: `translateY(${cardY}px)`,
        background: paper,
        border: `1px solid ${ink}22`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.4)",
        padding: `${44 * k}px ${52 * k}px`,
        maxWidth: maxCardWidth,
        position: "relative",
      }}>
        {/* corner stamp */}
        <div style={{
          position: "absolute",
          top: -18 * k,
          right: -18 * k,
          background: b.palette.accent,
          color: b.palette.accentText,
          fontFamily: b.type.mono ?? b.type.body,
          fontSize: 14 * k,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          padding: `${6 * k}px ${12 * k}px`,
          borderRadius: 4,
          boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
        }}>Source</div>

        <div style={{
          fontFamily: b.type.mono ?? b.type.body,
          fontSize: 18 * k,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: b.palette.accent,
          marginBottom: 18 * k,
        }}>
          {citation}{page ? ` · ${page}` : ""}
        </div>

        <div style={{
          fontFamily: b.type.display,
          fontSize: 38 * k,
          lineHeight: 1.35,
          color: ink,
          fontStyle: "italic",
          marginBottom: 24 * k,
          position: "relative",
        }}>
          <span style={{
            position: "absolute",
            left: -28 * k,
            top: -16 * k,
            fontSize: 80 * k,
            color: b.palette.accent,
            opacity: 0.45,
            lineHeight: 1,
          }}>“</span>
          {quote}
        </div>

        {(source || url) ? (
          <div style={{
            fontFamily: b.type.mono ?? b.type.body,
            fontSize: 18 * k,
            color: ink,
            opacity: 0.7,
            borderTop: `1px solid ${ink}22`,
            paddingTop: 16 * k,
          }}>
            {source ?? ""}{source && url ? " · " : ""}{url ?? ""}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

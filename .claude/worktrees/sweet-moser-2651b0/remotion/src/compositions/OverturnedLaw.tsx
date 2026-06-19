import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type OverturnedLawProps = {
  brand?: string;
  oldLawTitle?: string;            // e.g. "EYE FOR AN EYE"
  oldLawCitations?: string[];      // e.g. ["Exodus 21", "Leviticus 24", "Deuteronomy 19"]
  newLawTitle?: string;            // e.g. "TURN THE OTHER CHEEK"
  newLawCitation?: string;         // e.g. "Matthew 5:38-39"
};

/**
 * The director-flagged centerpiece of Ep1 v8.
 *
 * Animation timeline (assumes ~16s composition duration):
 *  0.0-1.5s   Left column fills: title + 3 citations stack in
 *  1.5-4.0s   Hold both columns visible (right empty)
 *  4.0-6.0s   Big red X scribes across the left column
 *  6.0-8.0s   Left column dims to 30% opacity, red X holds
 *  8.0-9.5s   Right column fades in (TURN THE OTHER CHEEK + citation)
 *  9.5-end    Hold final state
 *
 * The "argument" of the visual: the OT law gets crossed out (literally),
 * the NT law replaces it. 6th-grade clarity, no Sunday-school illustration.
 */
export const OverturnedLaw: React.FC<OverturnedLawProps> = ({
  brand = "nt-ministry",
  oldLawTitle = "EYE FOR AN EYE",
  oldLawCitations = ["Exodus 21", "Leviticus 24", "Deuteronomy 19"],
  newLawTitle = "TURN THE OTHER CHEEK",
  newLawCitation = "Matthew 5:38-39",
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps; // time in seconds

  // Old-law title fade-in (0.0-0.5s)
  const oldTitleOpacity = interpolate(t, [0.0, 0.5], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // 3 citation stack-in (0.5-1.5s, each 0.25s offset)
  const cite1Opacity = interpolate(t, [0.5, 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cite2Opacity = interpolate(t, [0.75, 1.05], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cite3Opacity = interpolate(t, [1.0, 1.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Red X scribe (4.0-6.0s) — line draws across the column
  const xProgress = interpolate(t, [4.0, 6.0], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  // Show X starting at t=4
  const xVisible = t >= 4.0 ? 1 : 0;

  // Left column dim after X (6.0-8.0s)
  const leftDim = interpolate(t, [6.0, 8.0], [1, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Right column fade-in (8.0-9.5s)
  const rightOpacity = interpolate(t, [8.0, 9.5], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const rightY = interpolate(t, [8.0, 9.5], [20, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const colWidth = width * 0.36;
  const ink = b.palette.surface; // cream

  return (
    <AbsoluteFill style={{
      background: b.palette.bg,  // charcoal
      justifyContent: "center",
      alignItems: "center",
    }}>
      <div style={{
        display: "flex",
        gap: width * 0.08,
        alignItems: "flex-start",
        position: "relative",
      }}>
        {/* LEFT COLUMN — old law */}
        <div style={{
          width: colWidth,
          opacity: leftDim,
          fontFamily: b.type.display,
          color: ink,
          textAlign: "center",
          position: "relative",
        }}>
          <div style={{
            opacity: oldTitleOpacity,
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: "0.04em",
            marginBottom: 40,
            lineHeight: 1.1,
          }}>
            {oldLawTitle}
          </div>
          <div style={{
            fontFamily: b.type.body,
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "0.10em",
            lineHeight: 1.8,
            color: `${ink}aa`,
          }}>
            <div style={{ opacity: cite1Opacity }}>{oldLawCitations[0]}</div>
            <div style={{ opacity: cite2Opacity }}>{oldLawCitations[1]}</div>
            <div style={{ opacity: cite3Opacity }}>{oldLawCitations[2]}</div>
          </div>

          {/* RED X — drawn over the left column */}
          {xVisible ? (
            <svg
              style={{
                position: "absolute",
                top: -20,
                left: -20,
                width: colWidth + 40,
                height: 360,
                pointerEvents: "none",
              }}
              viewBox={`0 0 ${colWidth + 40} 360`}
            >
              <line
                x1={20}
                y1={20}
                x2={20 + (colWidth) * xProgress}
                y2={20 + 320 * xProgress}
                stroke={b.palette.accent}
                strokeWidth={10}
                strokeLinecap="round"
              />
              <line
                x1={20 + colWidth}
                y1={20}
                x2={20 + colWidth - (colWidth) * xProgress}
                y2={20 + 320 * xProgress}
                stroke={b.palette.accent}
                strokeWidth={10}
                strokeLinecap="round"
              />
            </svg>
          ) : null}
        </div>

        {/* RIGHT COLUMN — new law */}
        <div style={{
          width: colWidth,
          opacity: rightOpacity,
          transform: `translateY(${rightY}px)`,
          fontFamily: b.type.display,
          color: ink,
          textAlign: "center",
        }}>
          <div style={{
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: "0.04em",
            marginBottom: 40,
            lineHeight: 1.1,
          }}>
            {newLawTitle}
          </div>
          <div style={{
            fontFamily: b.type.body,
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "0.10em",
            lineHeight: 1.8,
            color: `${ink}aa`,
          }}>
            {newLawCitation}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

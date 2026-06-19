import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type LowerThirdProps = {
  brand?: string;
  /** Speaker name — e.g. "Miriam". ≤16 chars per the thumbnail-rules ≤5-words rule, adapted. */
  name: string;
  /** Optional role (e.g. "disciple"). Lower-third subhead. ≤20 chars. */
  role?: string;
};

/**
 * LowerThird — name + role chyron when a character first appears on screen
 * (per cinematic-direction.md rule 12).
 *
 * Renders as a TRANSPARENT overlay in the bottom-third — meant to be composited
 * over a Hedra / kling beat in the splice step. For now we render against
 * pure black so it can be alpha-keyed in ffmpeg if compositing is added; the
 * intended use is to pre-burn the lower-third into the underlying clip via the
 * splice step (cheaper than alpha compositing).
 */
export const LowerThird: React.FC<LowerThirdProps> = ({
  brand = "nt-ministry",
  name,
  role,
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const slideInEnd = Math.round(0.45 * fps);
  const slideOutStart = durationInFrames - Math.round(0.45 * fps);

  const slidePx = interpolate(
    frame,
    [0, slideInEnd, slideOutStart, durationInFrames],
    [40, 0, 0, 40],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) },
  );

  const opacity = interpolate(
    frame,
    [0, slideInEnd, slideOutStart, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) },
  );

  return (
    <AbsoluteFill style={{
      // Transparent — splice composites this layer over the underlying clip.
      // For test renders against black, set TEST_BG env to "#000".
      background: "transparent",
      justifyContent: "flex-end",
      padding: "0 80px 110px 80px",
    }}>
      <div style={{
        opacity,
        transform: `translateY(${slidePx}px)`,
        color: b.palette.surface,
        fontFamily: '"Times New Roman", Georgia, serif',
        textShadow: "0 2px 8px rgba(0,0,0,0.85)",
      }}>
        <div style={{
          fontSize: 56,
          fontWeight: 400,
          letterSpacing: "-0.01em",
          marginBottom: role ? 4 : 0,
        }}>
          {name}
        </div>
        {role && (
          <div style={{
            fontSize: 26,
            color: b.palette.captionText,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            opacity: 0.85,
          }}>
            {role}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

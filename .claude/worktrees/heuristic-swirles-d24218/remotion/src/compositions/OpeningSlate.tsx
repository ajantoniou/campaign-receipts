import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type OpeningSlateProps = {
  brand?: string;
  text: string;             // The stake line — e.g. "My brother never said God did those things."
  fadeInDelay?: number;     // seconds before the text fades in (default 0)
  holdSeconds?: number;     // seconds to hold the text on screen (default 4)
};

/**
 * Opening slate per documentary-director hard lock:
 *   - Pure black background
 *   - Cream serif text, center
 *   - Held in total silence (audio handled separately at splice)
 *   - Per NT Ministry Errol-Morris-Malick confession film identity
 *
 * Default duration: 4 seconds. Caller sets composition duration.
 */
export const OpeningSlate: React.FC<OpeningSlateProps> = ({
  brand = "nt-ministry",
  text,
  fadeInDelay = 0,
  holdSeconds = 4,
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeInStart = Math.round(fadeInDelay * fps);
  const fadeInEnd = fadeInStart + Math.round(0.8 * fps); // 0.8s fade-in
  const fadeOutStart = durationInFrames - Math.round(0.8 * fps);
  const fadeOutEnd = durationInFrames;

  const opacity = interpolate(
    frame,
    [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );

  return (
    <AbsoluteFill style={{
      background: "#000000",  // PURE black per director lock — NOT brand bg
      justifyContent: "center",
      alignItems: "center",
      padding: "0 10%",
    }}>
      <div style={{
        opacity,
        color: b.palette.surface,  // cream from nt-ministry brand
        fontFamily: b.type.display, // Merriweather
        fontSize: 72,
        fontWeight: 400,
        textAlign: "center",
        lineHeight: 1.25,
        letterSpacing: "-0.01em",
        maxWidth: 1400,
        textShadow: "0 1px 0 rgba(0,0,0,0.5)",
      }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};

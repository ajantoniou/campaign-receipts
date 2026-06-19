import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type ClosingSlateProps = {
  brand?: string;
  name: string;       // "James of Jerusalem"
  detail: string;     // "d. 62 AD"
};

/**
 * Closing slate per director's emotional close:
 *   - Cream serif name + smaller detail line on pure black
 *   - Long fade-in (1.2s), 4s hold, slow fade-out (1.0s)
 *   - "The man speaking has been dead for two thousand years and has only just
 *      now been allowed to talk."
 */
export const ClosingSlate: React.FC<ClosingSlateProps> = ({
  brand = "nt-ministry",
  name,
  detail,
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeInEnd = Math.round(1.2 * fps);
  const fadeOutStart = durationInFrames - Math.round(1.0 * fps);

  const opacity = interpolate(
    frame,
    [0, fadeInEnd, fadeOutStart, durationInFrames],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );

  return (
    <AbsoluteFill style={{
      background: "#000000",
      justifyContent: "center",
      alignItems: "center",
      padding: "0 10%",
    }}>
      <div style={{
        opacity,
        textAlign: "center",
        color: b.palette.surface,
      }}>
        <div style={{
          fontFamily: b.type.display,
          fontSize: 64,
          fontWeight: 400,
          letterSpacing: "0.02em",
          marginBottom: 16,
        }}>
          {name}
        </div>
        <div style={{
          fontFamily: b.type.body,
          fontSize: 30,
          fontWeight: 300,
          opacity: 0.7,
          letterSpacing: "0.06em",
        }}>
          {detail}
        </div>
      </div>
    </AbsoluteFill>
  );
};

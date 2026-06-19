import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type ChapterStripProps = {
  brand?: string;
  text: string;            // e.g. "01 · THE TENSION YOU FELT WAS REAL"
  heightPercent?: number;  // default 6 (vh), use 4 for sub-chapter ticks like "CANAAN"
  slideInSeconds?: number; // default 0.35
  holdSeconds?: number;    // default 3.5
  slideOutSeconds?: number;// default 0.35
};

/**
 * Vox-style lower-third chapter title strip per youtube-grammar-consultant.
 * Slides in from screen-left, holds, slides out. Never full-screen.
 *
 * Layered as Remotion overlay on top of the underlying b-roll clip via libass
 * compositing in the splice stage. Background is transparent except the strip.
 */
export const ChapterStrip: React.FC<ChapterStripProps> = ({
  brand = "nt-ministry",
  text,
  heightPercent = 6,
  slideInSeconds = 0.35,
  holdSeconds = 3.5,
  slideOutSeconds = 0.35,
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const inEnd = Math.round(slideInSeconds * fps);
  const outStart = durationInFrames - Math.round(slideOutSeconds * fps);

  // Slide from -100% to 0% on X
  const slideX = interpolate(
    frame,
    [0, inEnd, outStart, durationInFrames],
    [-100, 0, 0, -100],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );

  const stripHeight = height * (heightPercent / 100);
  const accentLineHeight = 2;
  const lowerThirdY = height * 0.78; // 78% from top — title-safe lower-third

  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <div style={{
        position: "absolute",
        left: 0,
        top: lowerThirdY,
        width: width * 0.6,  // 60% of frame width
        height: stripHeight,
        transform: `translateX(${slideX}%)`,
        background: "rgba(10, 10, 10, 0.70)",
        borderTop: `${accentLineHeight}px solid ${b.palette.surface}`,
        display: "flex",
        alignItems: "center",
        paddingLeft: "5%",
      }}>
        <div style={{
          color: b.palette.surface,
          fontFamily: b.type.body, // Inter
          fontSize: heightPercent <= 4 ? 24 : 36,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textShadow: "0 1px 0 rgba(0,0,0,0.7)",
        }}>
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

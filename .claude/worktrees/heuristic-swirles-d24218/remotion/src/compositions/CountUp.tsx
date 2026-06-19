import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing, Img, staticFile } from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type CountUpProps = {
  brand?: string;
  from?: number;
  to: number;
  prefix?: string;     // e.g. "$"
  suffix?: string;     // e.g. "M" or "%"
  label?: string;      // headline above the number
  caption?: string;    // subline below the number
  decimals?: number;
  easing?: "out" | "linear" | "inOut";
  durationInFrames?: number;
  /** Optional book-caricature inset (bottom corner) connecting a named figure
   *  to the number — e.g. Paxton beside "64%" (founder 2026-06-01). */
  portraits?: { src: string; corner?: "bl" | "br"; heightPct?: number }[];
};

const fmt = (n: number, decimals: number, prefix?: string, suffix?: string) => {
  const v = decimals > 0
    ? n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(n).toLocaleString();
  return `${prefix ?? ""}${v}${suffix ?? ""}`;
};

export const CountUp: React.FC<CountUpProps> = ({
  brand,
  from = 0,
  to,
  prefix,
  suffix,
  label,
  caption,
  decimals = 0,
  easing = "out",
  portraits,
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const ease = easing === "linear"
    ? Easing.linear
    : easing === "inOut"
      ? Easing.inOut(Easing.cubic)
      : Easing.out(Easing.cubic);

  // Founder 2026-06-01: rolling digits/percentage are distracting. Show the
  // number STATIC at its full value (fade in) with an underline that draws in.
  // No count-up roll. (`from`/`easing` kept in the API for back-compat; unused.)
  const value = to;
  const fade = interpolate(frame, [0, b.motion.fadeFrames, durationInFrames - b.motion.fadeFrames, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Underline draws from 0→100% width over ~0.5s after the number fades in.
  const underlineStart = b.motion.fadeFrames;
  const underlineWidth = interpolate(
    frame,
    [underlineStart, underlineStart + Math.round((useVideoConfig().fps || 30) * 0.5)],
    [0, 100],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
  );

  return (
    <AbsoluteFill
      style={{
        background: b.palette.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 8%",
        opacity: fade,
        textAlign: "center",
      }}
    >
      {portraits && portraits.length ? portraits.map((p, i) => {
        const corner = p.corner ?? "br";
        const hPct = p.heightPct ?? 30;
        return (
          <div key={i} style={{
            position: "absolute", bottom: 0,
            [corner === "bl" ? "left" : "right"]: 48,
            height: `${hPct}%`,
            WebkitMaskImage: "radial-gradient(120% 100% at 50% 100%, #000 60%, transparent 100%)",
            maskImage: "radial-gradient(120% 100% at 50% 100%, #000 60%, transparent 100%)",
            filter: "drop-shadow(0 6px 22px rgba(0,0,0,0.4))",
          }}>
            <Img src={staticFile(p.src)} style={{ height: "100%" }} />
          </div>
        );
      }) : null}
      {label ? (
        <div style={{
          fontFamily: b.type.mono ?? b.type.body,
          fontSize: 28,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: b.palette.accent,
          marginBottom: 20,
        }}>{label}</div>
      ) : null}
      <div style={{ display: "inline-block" }}>
        <div style={{
          fontFamily: b.type.display,
          fontSize: 220,
          lineHeight: 1,
          color: b.palette.ink,
          fontVariantNumeric: "tabular-nums",
        }}>
          {fmt(value, decimals, prefix, suffix)}
        </div>
        <div style={{
          height: 10,
          marginTop: 18,
          width: `${underlineWidth}%`,
          background: b.palette.accent,
          borderRadius: 3,
        }} />
      </div>
      {caption ? (
        <div style={{
          fontFamily: b.type.body,
          fontSize: 36,
          color: b.palette.ink,
          marginTop: 24,
          opacity: 0.8,
          maxWidth: "70%",
        }}>{caption}</div>
      ) : null}
    </AbsoluteFill>
  );
};

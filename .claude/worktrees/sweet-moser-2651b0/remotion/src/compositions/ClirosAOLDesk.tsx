/* ─── ClirosAOLDesk — landing step 3 clip (B7-2-06 stamp on opinion letter) ─── */

import { AbsoluteFill, interpolate, useCurrentFrame, Easing, spring } from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type ClirosAOLDeskProps = {
  brand?: string;
  address?: string;
};

export const ClirosAOLDesk: React.FC<ClirosAOLDeskProps> = ({
  brand = "cliros",
  address = "1394 Peachtree Battle Ave NW, Atlanta, GA 30318",
}) => {
  const frame = useCurrentFrame();
  const fps = 30;
  const b = resolveBrand(brand);

  const paperIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const stamp = spring({ frame: frame - 45, fps, config: { damping: 14, stiffness: 120 } });
  const lines = [
    "ATTORNEY OPINION LETTER",
    "Fannie Mae Schedule B7-2-06",
    address,
    "Marketability: subject to review",
    "Encumbrances: per title search",
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(145deg, ${b.palette.bg} 0%, ${b.palette.bgAccent} 100%)`,
        fontFamily: b.type.body,
        color: b.palette.ink,
        padding: 72,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity: paperIn,
          transform: `translateY(${(1 - paperIn) * 24}px)`,
          width: 520,
          background: "#fffef9",
          borderRadius: 8,
          padding: "40px 44px",
          boxShadow: "0 24px 64px rgba(12,12,12,0.18)",
          border: "1px solid rgba(12,12,12,0.08)",
          position: "relative",
        }}
      >
        {lines.map((line, i) => (
          <p
            key={line}
            style={{
              margin: i === 0 ? 0 : "12px 0 0",
              fontSize: i === 0 ? 22 : 14,
              fontFamily: i === 0 ? b.type.display : b.type.body,
              fontWeight: i === 0 ? 600 : 400,
              opacity: interpolate(frame, [10 + i * 6, 22 + i * 6], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {line}
          </p>
        ))}
        <div
          style={{
            position: "absolute",
            right: 36,
            bottom: 36,
            transform: `scale(${stamp}) rotate(-8deg)`,
            opacity: stamp,
            border: `3px solid ${b.palette.gold || "#8B6914"}`,
            color: b.palette.gold || "#8B6914",
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          B7-2-06
        </div>
      </div>
    </AbsoluteFill>
  );
};

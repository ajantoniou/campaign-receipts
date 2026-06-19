import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type MapMarker = {
  label: string;       // "Joshua" or "Canaanites" or "Samaria"
  x: number;           // 0-100 percentage from left
  y: number;           // 0-100 percentage from top
  appearAt: number;    // seconds — when this dot lights up
  color?: "red" | "cream" | "gold";  // default red for OT atrocity dots, cream for Jesus path, gold for Samaria
};

export type BiblicalMapProps = {
  brand?: string;
  region: "canaan" | "samaria-judea" | "sodom";  // selects the base map outline
  title?: string;       // optional centered title at top, e.g. "ANCIENT CANAAN"
  markers: MapMarker[];
};

/**
 * Stylized animated map for explainer beats per director's confession-film
 * aesthetic. NOT a realistic Google-Maps view — simplified region outlines
 * with cream lines on charcoal background, terracotta-red markers light up
 * sequentially as VO names them.
 *
 * Three preset regions for v8:
 *  - canaan: rough rectangular outline of ancient Levant, Jordan river marker
 *  - samaria-judea: northern Samaria / southern Judea split with dividing line
 *  - sodom: Dead Sea region with single highlighted city dot
 *
 * Map outlines are simple SVG paths — intentionally hand-drawn feel, not photoreal.
 */
export const BiblicalMap: React.FC<BiblicalMapProps> = ({
  brand = "nt-ministry",
  region,
  title,
  markers,
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  // Base map fade-in (0-1.0s)
  const mapOpacity = interpolate(t, [0, 1.0], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const colorFor = (c?: string) => {
    if (c === "cream") return b.palette.surface;
    if (c === "gold") return b.palette.gold ?? "#d4a04f";
    return b.palette.accent; // red default
  };

  // Map dimensions — center 70% of frame
  const mapW = width * 0.7;
  const mapH = height * 0.65;
  const mapX = (width - mapW) / 2;
  const mapY = (height - mapH) / 2 + 30;

  return (
    <AbsoluteFill style={{
      background: b.palette.bg,  // charcoal
      justifyContent: "center",
      alignItems: "center",
    }}>
      {title ? (
        <div style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: b.type.display,
          fontSize: 36,
          fontWeight: 600,
          letterSpacing: "0.10em",
          color: b.palette.surface,
          opacity: mapOpacity,
        }}>
          {title}
        </div>
      ) : null}

      <svg
        width={mapW}
        height={mapH}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: "absolute", left: mapX, top: mapY, opacity: mapOpacity }}
      >
        {/* Base region outline — stylized */}
        {region === "canaan" && (
          <>
            {/* Simplified Levant: coastline on left, Jordan river vertical, Dead Sea south */}
            <path
              d="M 18 8 L 30 5 L 38 12 L 42 25 L 45 45 L 48 65 L 50 80 L 48 92 L 36 95 L 28 88 L 22 70 L 18 50 L 16 28 Z"
              fill="none"
              stroke={`${b.palette.surface}66`}
              strokeWidth="0.3"
              strokeLinejoin="round"
            />
            {/* Jordan river — vertical wavy line */}
            <path
              d="M 32 15 Q 30 30 32 45 Q 34 60 32 75"
              fill="none"
              stroke={`${b.palette.surface}88`}
              strokeWidth="0.35"
              strokeLinecap="round"
              strokeDasharray="1 1"
            />
          </>
        )}
        {region === "samaria-judea" && (
          <>
            {/* Northern Samaria + southern Judea split */}
            <path
              d="M 25 15 L 45 12 L 55 25 L 50 42 L 55 60 L 50 80 L 40 88 L 30 80 L 25 60 L 22 40 Z"
              fill="none"
              stroke={`${b.palette.surface}66`}
              strokeWidth="0.3"
              strokeLinejoin="round"
            />
            {/* Dividing horizontal line at ~y=50 */}
            <line
              x1={26} y1={50}
              x2={54} y2={50}
              stroke={b.palette.accent}
              strokeWidth="0.5"
              strokeDasharray="2 1"
              opacity={interpolate(t, [1.0, 2.0], [0, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
            />
          </>
        )}
        {region === "sodom" && (
          <>
            {/* Dead Sea outline */}
            <ellipse
              cx={50} cy={50}
              rx={12} ry={28}
              fill="none"
              stroke={`${b.palette.surface}66`}
              strokeWidth="0.35"
            />
          </>
        )}

        {/* Markers — light up sequentially */}
        {markers.map((m, i) => {
          const appearOpacity = interpolate(t, [m.appearAt, m.appearAt + 0.4], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const pulseScale = interpolate(
            ((t - m.appearAt) % 2) - 0,
            [0, 1, 2],
            [1, 1.4, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          if (t < m.appearAt) return null;
          return (
            <g key={i} opacity={appearOpacity}>
              <circle
                cx={m.x}
                cy={m.y}
                r={1.5 * pulseScale}
                fill={colorFor(m.color)}
                opacity={0.4}
              />
              <circle
                cx={m.x}
                cy={m.y}
                r={0.7}
                fill={colorFor(m.color)}
              />
              <text
                x={m.x + 2.5}
                y={m.y + 1}
                fontFamily={b.type.body}
                fontSize={2.2}
                fontWeight={600}
                fill={b.palette.surface}
                style={{ letterSpacing: "0.05em" }}
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

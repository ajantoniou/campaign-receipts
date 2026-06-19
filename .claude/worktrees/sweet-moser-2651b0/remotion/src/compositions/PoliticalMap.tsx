import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type PoliticalMarker = {
  label: string;
  x: number;
  y: number;
  appearAt: number;
  color?: "accent" | "muted" | "highlight";
  /** Optional label offset in viewBox units (default: above/below by y) */
  labelDx?: number;
  labelDy?: number;
};

export type PoliticalArrow = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  appearAt: number;
  label?: string;
};

export type PoliticalMapProps = {
  brand?: string;
  region: "jcpoa" | "embassy-move";
  title?: string;
  subtitle?: string;
  markers: PoliticalMarker[];
  arrows?: PoliticalArrow[];
  highlightLabel?: string;
};

/**
 * Stylized explainer map — charcoal + cream lines, not satellite imagery.
 * Built for voter explainers (JCPOA signatories, embassy move), pairs with Remotion charts.
 */
export const PoliticalMap: React.FC<PoliticalMapProps> = ({
  brand = "sealed",
  region,
  title,
  subtitle,
  markers,
  arrows = [],
  highlightLabel,
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const mapOpacity = interpolate(t, [0, 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const colorFor = (c?: string) => {
    if (c === "muted") return b.palette.muted ?? "#6b7280";
    if (c === "highlight") return b.palette.gold ?? "#d4a04f";
    return b.palette.accent;
  };

  const mapW = width * 0.72;
  const mapH = height * 0.58;
  const mapLeft = (width - mapW) / 2;
  const mapTop = height * 0.22;

  const jcpoaOutline = (
    <path
      d="M 40 80 Q 120 40 200 55 L 280 45 Q 340 70 380 120 L 360 200 Q 300 240 220 230 L 120 220 Q 60 180 40 120 Z"
      fill="none"
      stroke={b.palette.surface}
      strokeWidth={2}
      opacity={0.55}
    />
  );

  const embassyOutline = (
    <path
      d="M 80 60 L 320 50 L 340 180 L 100 200 Z"
      fill="none"
      stroke={b.palette.surface}
      strokeWidth={2}
      opacity={0.55}
    />
  );

  return (
    <AbsoluteFill style={{ background: b.palette.bg, fontFamily: b.type.body }}>
      {title && (
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 0,
            right: 0,
            textAlign: "center",
            color: b.palette.ink,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            opacity: mapOpacity,
          }}
        >
          {title}
        </div>
      )}
      {subtitle && (
        <div
          style={{
            position: "absolute",
            top: 72,
            left: 0,
            right: 0,
            textAlign: "center",
            color: b.palette.muted ?? "#9ca3af",
            fontSize: 16,
            opacity: mapOpacity * 0.9,
          }}
        >
          {subtitle}
        </div>
      )}

      <svg
        width={mapW}
        height={mapH}
        style={{
          position: "absolute",
          left: mapLeft,
          top: mapTop,
          opacity: mapOpacity,
        }}
        viewBox="0 0 420 260"
      >
        {region === "jcpoa" ? jcpoaOutline : embassyOutline}

        {arrows.map((a, i) => {
          const vis = t >= a.appearAt
            ? interpolate(t, [a.appearAt, a.appearAt + 0.6], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 0;
          const x1 = (a.fromX / 100) * 420;
          const y1 = (a.fromY / 100) * 260;
          const x2 = (a.toX / 100) * 420;
          const y2 = (a.toY / 100) * 260;
          return (
            <g key={`arrow-${i}`} opacity={vis}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={b.palette.accent}
                strokeWidth={3}
                markerEnd="url(#arrowhead)"
              />
              {a.label && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 8}
                  fill={b.palette.ink}
                  fontSize={11}
                  textAnchor="middle"
                  fontWeight={600}
                >
                  {a.label}
                </text>
              )}
            </g>
          );
        })}

        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 8 4, 0 8" fill={b.palette.accent} />
          </marker>
        </defs>

        {markers.map((m, i) => {
          const vis = t >= m.appearAt
            ? interpolate(t, [m.appearAt, m.appearAt + 0.5], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 0;
          const cx = (m.x / 100) * 420;
          const cy = (m.y / 100) * 260;
          const isHighlight = highlightLabel && m.label === highlightLabel;
          const labelAbove = (m.labelDy ?? (m.y < 35 ? 24 : -14)) < 0;
          const lx = cx + (m.labelDx ?? 0);
          const ly = cy + (m.labelDy ?? (m.y < 35 ? 24 : -14));
          return (
            <g key={`m-${i}`} opacity={vis}>
              <circle
                cx={cx}
                cy={cy}
                r={isHighlight ? 10 : 7}
                fill={colorFor(m.color)}
                stroke={b.palette.bg}
                strokeWidth={2}
              />
              <text
                x={lx}
                y={ly}
                fill={b.palette.ink}
                fontSize={isHighlight ? 13 : 11}
                textAnchor="middle"
                fontWeight={isHighlight ? 700 : 500}
                dominantBaseline={labelAbove ? "auto" : "hanging"}
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

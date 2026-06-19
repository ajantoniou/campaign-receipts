import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type DonorRow = {
  name: string;
  amount: string;
  cycle: string;
  policy: string;
  highlight?: boolean;
};

export type DonorComparisonProps = {
  brand?: string;
  title?: string;
  subtitle?: string;
  rows: DonorRow[];
  footer?: string;
};

export const DonorComparison: React.FC<DonorComparisonProps> = ({
  brand,
  title = "Mega-donors across the spectrum",
  subtitle = "2016 cycle · FEC / OpenSecrets",
  rows,
  footer = "We follow the paper.",
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const headerIn = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        background: b.palette.bg,
        padding: "48px 56px",
        fontFamily: b.type.body,
        color: b.palette.ink,
      }}
    >
      <div style={{ opacity: headerIn }}>
        <div
          style={{
            fontFamily: b.type.mono ?? b.type.body,
            fontSize: 16,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: b.palette.accent,
            marginBottom: 8,
          }}
        >
          The fairness note
        </div>
        <div
          style={{
            fontFamily: b.type.display,
            fontSize: 40,
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 20, color: b.palette.muted ?? "#5b6478" }}>{subtitle}</div>
        <div
          style={{
            height: 2,
            width: 120,
            background: b.palette.accentAlt ?? b.palette.accent,
            margin: "20px 0 24px",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {rows.map((row, i) => {
          const start = 12 + i * 14;
          const t = interpolate(frame, [start, start + 16], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const bg = row.highlight
            ? (b.palette.surface ?? "#f3efe4")
            : "transparent";
          const border = row.highlight ? b.palette.accent : b.palette.rule ?? "#d8cfb8";
          return (
            <div
              key={row.name}
              style={{
                opacity: t,
                transform: `translateY(${(1 - t) * 12}px)`,
                display: "grid",
                gridTemplateColumns: "200px 120px 1fr",
                gap: 16,
                alignItems: "center",
                padding: "12px 16px",
                borderLeft: `4px solid ${border}`,
                background: bg,
              }}
            >
              <div
                style={{
                  fontFamily: b.type.display,
                  fontSize: 26,
                  fontWeight: row.highlight ? 700 : 600,
                }}
              >
                {row.name}
              </div>
              <div
                style={{
                  fontFamily: b.type.display,
                  fontSize: 24,
                  fontVariantNumeric: "tabular-nums",
                  color: row.highlight ? b.palette.accent : b.palette.ink,
                }}
              >
                {row.amount}
              </div>
              <div style={{ fontSize: 18, lineHeight: 1.35, color: b.palette.inkSoft ?? b.palette.ink }}>
                <span style={{ fontFamily: b.type.mono, fontSize: 13, letterSpacing: "0.12em", marginRight: 10 }}>
                  {row.cycle}
                </span>
                {row.policy}
              </div>
            </div>
          );
        })}
      </div>

      {footer ? (
        <div
          style={{
            marginTop: 16,
            fontFamily: b.type.display,
            fontSize: 28,
            fontStyle: "italic",
            textAlign: "center",
            opacity: interpolate(
              frame,
              [durationInFrames - 45, durationInFrames - 20],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            ),
          }}
        >
          {footer}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing, Img, staticFile } from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

// Small circular book-caricature badge — connects a named figure to a money
// node (founder 2026-06-01). src is a staticFile path under remotion/public/.
const PortraitBadge: React.FC<{ src: string; size?: number; ring: string }> = ({ src, size = 88, ring }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", overflow: "hidden",
    background: "#faf7ef", border: `3px solid ${ring}`,
    boxShadow: "0 6px 18px rgba(0,0,0,0.3)", flexShrink: 0,
  }}>
    <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
  </div>
);

export type MoneyFlowProps = {
  brand?: string;
  source: { name: string; amount: number; sublabel?: string; portraitSlug?: string };
  destinations: Array<{ label: string; amount?: number; outcome?: string; portraitSlug?: string }>;
  title?: string;       // top-of-frame eyebrow like "WHERE THE MONEY WENT"
  prefix?: string;      // "$"
  suffix?: string;      // "M" — applied if amounts are abbreviated
  abbreviate?: boolean; // format 82000000 → $82M
};

// Up to 2 decimals, trailing zeros stripped: 3.75M stays $3.75M (not rounded to
// $3.8M — receipt-consistency, founder QC 2026-06-01), while 5.50M→$5.5M and
// 39.00M→$39M stay clean.
const trim2 = (x: number) => x.toFixed(2).replace(/\.?0+$/, "");
const abbr = (n: number, prefix = "$") => {
  if (n >= 1_000_000_000) return `${prefix}${trim2(n / 1_000_000_000)}B`;
  if (n >= 1_000_000) return `${prefix}${trim2(n / 1_000_000)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(0)}K`;
  return `${prefix}${n}`;
};

export const MoneyFlow: React.FC<MoneyFlowProps> = ({
  brand,
  source,
  destinations,
  title,
  prefix = "$",
  abbreviate = true,
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Phase 1: source slides in (0 → 15%)
  // Phase 2: arrows + destinations fan in sequentially (15% → 85%)
  // Phase 3: hold (85% → 100%)
  const phase1End = Math.round(durationInFrames * 0.18);
  const phase2End = Math.round(durationInFrames * 0.85);
  const perDest = Math.max(8, Math.floor((phase2End - phase1End) / Math.max(1, destinations.length)));

  const srcOpacity = interpolate(frame, [0, b.motion.fadeFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const srcScale = interpolate(frame, [0, b.motion.fadeFrames * 2], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const fmt = (n: number) => abbreviate ? abbr(n, prefix) : `${prefix}${n.toLocaleString()}`;

  return (
    <AbsoluteFill style={{ background: b.palette.bg, padding: "60px 80px" }}>
      {title ? (
        <div style={{
          fontFamily: b.type.mono ?? b.type.body,
          fontSize: 22,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: b.palette.accent,
          marginBottom: 24,
        }}>{title}</div>
      ) : null}

      {/* Source node — left side */}
      <div style={{
        position: "absolute",
        left: "6%",
        top: "50%",
        transform: `translateY(-50%) scale(${srcScale})`,
        opacity: srcOpacity,
        background: b.palette.ink,
        color: b.palette.accentText,
        padding: "32px 40px",
        borderRadius: 12,
        boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
        minWidth: 260,
      }}>
        <div style={{
          fontFamily: b.type.mono ?? b.type.body,
          fontSize: 16,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          opacity: 0.7,
          marginBottom: 8,
        }}>Source</div>
        {source.portraitSlug ? (
          <div style={{ marginBottom: 14 }}>
            <PortraitBadge src={`cr-portraits/${source.portraitSlug}.png`} ring={b.palette.gold ?? b.palette.accent} />
          </div>
        ) : null}
        <div style={{
          fontFamily: b.type.display,
          fontSize: 48,
          lineHeight: 1.05,
          marginBottom: 10,
        }}>{source.name}</div>
        <div style={{
          fontFamily: b.type.display,
          fontSize: 72,
          color: b.palette.gold ?? b.palette.accent,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}>{fmt(source.amount)}</div>
        {source.sublabel ? (
          <div style={{
            fontFamily: b.type.body,
            fontSize: 20,
            opacity: 0.75,
            marginTop: 10,
          }}>{source.sublabel}</div>
        ) : null}
      </div>

      {/* Destinations — right column */}
      {destinations.map((d, i) => {
        const start = phase1End + i * perDest;
        const localOpacity = interpolate(frame, [start, start + b.motion.fadeFrames * 2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const arrowProgress = interpolate(frame, [start, start + b.motion.fadeFrames * 2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        const total = destinations.length;
        const verticalSpan = 70; // %
        const top = total === 1 ? 50 : 15 + (verticalSpan * (i / (total - 1)));
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}>
            {/* Arrow */}
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 1280 720"
              style={{ position: "absolute", inset: 0, opacity: localOpacity }}
              preserveAspectRatio="none"
            >
              <defs>
                <marker id={`arrowhead-${i}`} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill={b.palette.accent} />
                </marker>
              </defs>
              {(() => {
                const x1 = 360;
                const y1 = 360;
                const x2 = 820;
                const y2 = (top / 100) * 720;
                const cx = (x1 + x2) / 2;
                const dx = x2 - x1;
                const dy = y2 - y1;
                const px = `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
                return (
                  <path
                    d={px}
                    stroke={b.palette.accent}
                    strokeWidth={4}
                    fill="none"
                    strokeDasharray={1000}
                    strokeDashoffset={1000 * (1 - arrowProgress)}
                    markerEnd={`url(#arrowhead-${i})`}
                  />
                );
              })()}
            </svg>

            {/* Destination card */}
            <div style={{
              position: "absolute",
              right: "6%",
              top: `${top}%`,
              transform: "translateY(-50%)",
              opacity: localOpacity,
              background: b.palette.surface,
              color: b.palette.ink,
              padding: "20px 28px",
              borderRadius: 10,
              borderLeft: `5px solid ${b.palette.accent}`,
              minWidth: 320,
              boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 16,
                marginBottom: d.amount !== undefined || d.outcome ? 8 : 0,
              }}>
                {d.portraitSlug ? (
                  <PortraitBadge src={`cr-portraits/${d.portraitSlug}.png`} size={64} ring={b.palette.accent} />
                ) : null}
                <div style={{
                  fontFamily: b.type.display,
                  fontSize: 28,
                  lineHeight: 1.15,
                }}>{d.label}</div>
              </div>
              {d.amount !== undefined ? (
                <div style={{
                  fontFamily: b.type.display,
                  fontSize: 36,
                  color: b.palette.accent,
                  fontVariantNumeric: "tabular-nums",
                }}>{fmt(d.amount)}</div>
              ) : null}
              {d.outcome ? (
                <div style={{
                  fontFamily: b.type.mono ?? b.type.body,
                  fontSize: 16,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: b.palette.accent,
                  marginTop: 6,
                }}>{d.outcome}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type ChartBarProps = {
  brand?: string;
  title?: string;
  bars: Array<{ label: string; value: number; suffix?: string; prefix?: string; color?: string }>;
  yAxisLabel?: string;
  maxValue?: number;
};

export const ChartBar: React.FC<ChartBarProps> = ({ brand, title, bars, yAxisLabel, maxValue }) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fillEnd = Math.round(durationInFrames * 0.85);
  const perBar = Math.max(8, Math.floor(fillEnd / Math.max(1, bars.length)));
  const max = maxValue ?? Math.max(...bars.map((b) => b.value));

  const chartTop = 140;
  const chartBottom = 620;
  const chartHeight = chartBottom - chartTop;
  const chartLeft = 130;
  const chartRight = 1200;
  const chartWidth = chartRight - chartLeft;
  const barGap = 24;
  const barWidth = (chartWidth - barGap * (bars.length - 1)) / bars.length;

  return (
    <AbsoluteFill style={{ background: b.palette.bg, padding: "40px 60px" }}>
      {title ? (
        <div style={{
          fontFamily: b.type.display,
          fontSize: 44,
          color: b.palette.ink,
          marginBottom: 6,
        }}>{title}</div>
      ) : null}
      {yAxisLabel ? (
        <div style={{
          fontFamily: b.type.mono ?? b.type.body,
          fontSize: 18,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: b.palette.accent,
          marginBottom: 24,
        }}>{yAxisLabel}</div>
      ) : null}

      <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{ position: "absolute", inset: 0 }} preserveAspectRatio="none">
        {/* baseline */}
        <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke={b.palette.ink} strokeWidth={2} />

        {bars.map((bar, i) => {
          const start = i * perBar;
          const t = interpolate(frame, [start, start + perBar], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const fullH = (bar.value / max) * chartHeight;
          const h = fullH * t;
          const x = chartLeft + i * (barWidth + barGap);
          const y = chartBottom - h;
          const fill = bar.color ?? (i % 2 === 0 ? b.palette.accent : (b.palette.accentAlt ?? b.palette.accent));
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={h} fill={fill} rx={3} />
              {/* value label on top */}
              {t > 0.85 ? (
                <text
                  x={x + barWidth / 2}
                  y={y - 12}
                  fill={b.palette.ink}
                  textAnchor="middle"
                  fontFamily={b.type.display}
                  fontSize={32}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {bar.prefix ?? ""}{Number.isInteger(bar.value) ? bar.value.toLocaleString() : bar.value.toFixed(2)}{bar.suffix ?? ""}
                </text>
              ) : null}
              {/* x-axis label */}
              <text
                x={x + barWidth / 2}
                y={chartBottom + 36}
                fill={b.palette.ink}
                textAnchor="middle"
                fontFamily={b.type.body}
                fontSize={22}
              >
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

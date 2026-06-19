import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

// HealthBrewGreenDay
// 8s reveal: empty calendar → 30 days fill green → Sound Mind/Body
// scores count up to 82/76 → tagline "Brew more green days."
//
// Used as overlay or standalone closing card for HealthBrew Shorts and
// the founder trailer. Pure Remotion — $0 marginal render cost.

export type HealthBrewGreenDayProps = {
  brand?: string;
  label?: string;          // tagline overlay; defaults to "Brew more green days."
  soundMind?: number;      // 0–100; default 82
  soundBody?: number;      // 0–100; default 76
  greenDayCount?: number;  // out of 30; default 23 (so 7 stay neutral)
};

const ROWS = 5;
const COLS = 6;
const TOTAL = ROWS * COLS;

// A deterministic pattern of which cells are "green" vs "neutral" given the count.
// Cells turn on in a soothing left→right, top→bottom order (no chaos).
function isGreen(idx: number, count: number): boolean {
  return idx < count;
}

export const HealthBrewGreenDay: React.FC<HealthBrewGreenDayProps> = ({
  brand = "healthbrew",
  label = "Brew more green days.",
  soundMind = 82,
  soundBody = 76,
  greenDayCount = 23,
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Phases (assumed 8s @ 30fps = 240 frames; scales by durationInFrames)
  const total = durationInFrames;
  const fadeInEnd = fps * 0.6;              // 0.6s
  const calendarStart = fps * 0.6;
  const calendarPerCell = fps * 0.08;       // staggered fill
  const calendarEnd = calendarStart + calendarPerCell * TOTAL;
  const scoresStart = calendarEnd + fps * 0.2;
  const scoresEnd = scoresStart + fps * 1.4;
  const taglineStart = scoresEnd + fps * 0.1;

  const fadeIn = interpolate(frame, [0, fadeInEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scoresProgress = interpolate(frame, [scoresStart, scoresEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const taglineOpacity = interpolate(frame, [taglineStart, taglineStart + fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Compose the calendar centered, scaled to portrait or landscape canvas.
  const isPortrait = height > width;
  const padX = width * 0.08;
  const padY = height * 0.16;
  const calW = width - padX * 2;
  const calH = isPortrait ? calW * (ROWS / COLS) : Math.min(height * 0.55, calW * (ROWS / COLS));
  const gap = Math.max(6, Math.min(width, height) * 0.012);
  const cellW = (calW - gap * (COLS - 1)) / COLS;
  const cellH = (calH - gap * (ROWS - 1)) / ROWS;

  const animatedMind = Math.round(soundMind * scoresProgress);
  const animatedBody = Math.round(soundBody * scoresProgress);

  // Subtle background warmth gradient
  const bgGradient = `linear-gradient(180deg, ${b.palette.bgAccent} 0%, ${b.palette.bg} 100%)`;

  // Brand sub-tokens
  const blue = b.palette.accent;
  const olive = b.palette.accentAlt ?? "#6B7F3A";
  const ink = b.palette.ink;
  const green = "#6FA86F";
  const gold = b.palette.gold ?? "#D9A441";

  return (
    <AbsoluteFill style={{ background: bgGradient, opacity: fadeIn, fontFamily: b.type.body }}>
      {/* Soft sun glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 85% 15%, ${gold}33, transparent 45%)`,
        }}
      />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: padY * 0.45,
          left: 0,
          right: 0,
          textAlign: "center",
          color: ink,
        }}
      >
        <div
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontSize: Math.max(12, height * 0.018),
            opacity: 0.7,
            fontWeight: 600,
          }}
        >
          Last 30 days
        </div>
        <div
          style={{
            fontFamily: b.type.display,
            fontSize: Math.max(28, height * 0.06),
            fontWeight: 700,
            marginTop: height * 0.01,
            letterSpacing: "-0.01em",
          }}
        >
          {greenDayCount} green days
        </div>
      </div>

      {/* Calendar */}
      <div
        style={{
          position: "absolute",
          left: padX,
          top: padY,
          width: calW,
          height: calH,
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          gap,
        }}
      >
        {Array.from({ length: TOTAL }).map((_, idx) => {
          const cellStart = calendarStart + idx * calendarPerCell;
          const cellOpacity = interpolate(frame, [cellStart, cellStart + fps * 0.15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const scale = interpolate(
            frame,
            [cellStart, cellStart + fps * 0.2],
            [0.6, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }
          );
          const isOn = isGreen(idx, greenDayCount);
          return (
            <div
              key={idx}
              style={{
                width: cellW,
                height: cellH,
                borderRadius: Math.min(cellW, cellH) * 0.18,
                background: isOn ? green : "rgba(31,42,46,0.08)",
                opacity: cellOpacity,
                transform: `scale(${scale})`,
                boxShadow: isOn ? "0 1px 2px rgba(15,57,32,0.15)" : "none",
              }}
            />
          );
        })}
      </div>

      {/* Score tiles */}
      <div
        style={{
          position: "absolute",
          left: padX,
          right: padX,
          top: padY + calH + height * 0.04,
          display: "flex",
          gap: width * 0.04,
          justifyContent: "center",
          opacity: scoresProgress,
        }}
      >
        <ScoreTile label="Sound Mind" value={animatedMind} accent={blue} ink={ink} font={b.type.display} height={height} />
        <ScoreTile label="Sound Body" value={animatedBody} accent={olive} ink={ink} font={b.type.display} height={height} />
      </div>

      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: padY * 0.5,
          textAlign: "center",
          opacity: taglineOpacity,
          color: ink,
          fontFamily: b.type.display,
          fontSize: Math.max(22, height * 0.045),
          fontWeight: 700,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </div>

      {/* Brand mark */}
      <div
        style={{
          position: "absolute",
          bottom: height * 0.04,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: taglineOpacity * 0.7,
          color: ink,
          fontFamily: "Inter, system-ui, sans-serif",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontSize: Math.max(11, height * 0.014),
          fontWeight: 600,
        }}
      >
        HealthBrew · healthbrew.app
      </div>

      {/* Suppress unused warning */}
      <span style={{ display: "none" }}>{total}</span>
    </AbsoluteFill>
  );
};

const ScoreTile: React.FC<{
  label: string;
  value: number;
  accent: string;
  ink: string;
  font: string;
  height: number;
}> = ({ label, value, accent, ink, font, height }) => {
  return (
    <div
      style={{
        background: "white",
        borderRadius: Math.max(10, height * 0.018),
        padding: `${height * 0.018}px ${height * 0.03}px`,
        boxShadow: "0 6px 22px rgba(31,42,46,0.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: height * 0.22,
      }}
    >
      <div
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontSize: Math.max(10, height * 0.014),
          color: ink,
          opacity: 0.7,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: font,
          fontSize: Math.max(40, height * 0.08),
          fontWeight: 700,
          color: accent,
          lineHeight: 1,
          marginTop: height * 0.008,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: Math.max(10, height * 0.013),
          color: ink,
          opacity: 0.5,
          marginTop: 2,
        }}
      >
        / 100
      </div>
    </div>
  );
};

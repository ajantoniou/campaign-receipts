import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

// HealthBrewCloseTheDay
// 15s cinematic closing card for HealthBrew Ep.2 "She Stopped Eating Over the Sink."
// Transitions from emotional live-action into a polished app-UI showcase.
//
// Beat 1 (0-4s):   Phone slides up, "Close the Day" screen, tap GREEN, confetti
// Beat 2 (4-9s):   Calendar month view, green tiles fill in one-by-one
// Beat 3 (9-13s):  Sound Mind / Sound Body score cards with gradient rings
// Beat 4 (13-15s): Tagline "Brew more green days." + CTA
//
// 1920x1080 @ 30fps = 450 frames. Pure Remotion — $0 marginal.

export type HealthBrewCloseTheDayProps = {
  brand?: string;
};

// ---- Brand colors (hardcoded for determinism, mirrors tailwind.config) ----
const COLORS = {
  mediterraneanBlue: "#2A6F8E",
  olive: "#6B7F3A",
  cream: "#F5EDD8",
  terracotta: "#C25A3C",
  gold: "#D9A441",
  greenDay: "#6FA86F",
  yellowDay: "#D9A441",
  redDay: "#B05C4A",
  darkBg: "#1a1a18",
  darkBgWarm: "#201e18",
  ink: "#1F2A2E",
  white: "#FFFFFF",
  surfaceCard: "#2a2820",
  surfaceCardLight: "#3a3830",
};

// ---- Calendar data: 30-day month, realistic spread ----
// G=green, Y=yellow, R=red, _=empty (future days)
const CALENDAR_DATA: ("G" | "Y" | "R" | "_")[] = [
  "G","G","Y","G","G","G","R",
  "G","G","G","G","Y","G","G",
  "G","R","G","G","G","Y","G",
  "G","G","G","G","G","G","G",
  "_","_","_",
];
// Counts: 22 green, 3 yellow, 2 red, 3 empty

const calendarColor = (status: "G" | "Y" | "R" | "_") => {
  switch (status) {
    case "G": return COLORS.greenDay;
    case "Y": return COLORS.yellowDay;
    case "R": return COLORS.redDay;
    case "_": return "rgba(255,255,255,0.06)";
  }
};

// ---- Main composition ----

export const HealthBrewCloseTheDay: React.FC<HealthBrewCloseTheDayProps> = ({
  brand = "healthbrew",
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ========== BEAT 1: Close the Day (frames 0-120, 0-4s) ==========
  const phoneSlideUp = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 80, mass: 0.8 },
    durationInFrames: 30,
  });

  // Finger tap at ~2s (frame 60)
  const tapFrame = 60;
  const tapScale = spring({
    frame: Math.max(0, frame - tapFrame),
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.4 },
    durationInFrames: 12,
  });

  // Status pill appears at ~2.5s (frame 75)
  const pillFrame = 75;
  const pillOpacity = interpolate(frame, [pillFrame, pillFrame + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pillScale = spring({
    frame: Math.max(0, frame - pillFrame),
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.5 },
    durationInFrames: 15,
  });

  // Confetti particles at ~2.8s (frame 84)
  const confettiStart = 84;
  const confettiProgress = interpolate(frame, [confettiStart, confettiStart + 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Beat 1 fade out at 3.5-4s
  const beat1Opacity = interpolate(frame, [105, 120], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ========== BEAT 2: Calendar (frames 120-270, 4-9s) ==========
  const beat2FadeIn = interpolate(frame, [120, 135], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Calendar tiles fill in starting at frame 140
  const calFillStart = 140;
  const calFillInterval = 3; // frames between each tile

  // Counter "22 Green Days" appears after last green tile
  const greenCount = CALENDAR_DATA.filter(d => d === "G").length;
  const lastGreenIdx = CALENDAR_DATA.lastIndexOf("G");
  const counterFrame = calFillStart + (lastGreenIdx + 1) * calFillInterval + 15;
  const counterOpacity = interpolate(frame, [counterFrame, counterFrame + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const counterScale = spring({
    frame: Math.max(0, frame - counterFrame),
    fps,
    config: { damping: 14, stiffness: 140, mass: 0.5 },
    durationInFrames: 15,
  });

  // Beat 2 fade out
  const beat2Opacity = interpolate(frame, [255, 270], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ========== BEAT 3: Score cards (frames 270-390, 9-13s) ==========
  const beat3FadeIn = interpolate(frame, [270, 285], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const leftCardSlide = spring({
    frame: Math.max(0, frame - 270),
    fps,
    config: { damping: 16, stiffness: 80, mass: 0.7 },
    durationInFrames: 25,
  });

  const rightCardSlide = spring({
    frame: Math.max(0, frame - 280),
    fps,
    config: { damping: 16, stiffness: 80, mass: 0.7 },
    durationInFrames: 25,
  });

  // Ring animation: scores fill from 0 to target over 1.5s
  const ringStart = 295;
  const ringEnd = 340;
  const ringProgress = interpolate(frame, [ringStart, ringEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Sparklines appear after rings
  const sparklineOpacity = interpolate(frame, [ringEnd, ringEnd + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Beat 3 fade out
  const beat3Opacity = interpolate(frame, [375, 390], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ========== BEAT 4: Tagline (frames 390-450, 13-15s) ==========
  const taglineFade = interpolate(frame, [390, 410], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaFade = interpolate(frame, [405, 420], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtle gradient shift across the whole 15s
  const bgWarmth = interpolate(frame, [0, 450], [0, 0.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(165deg, ${COLORS.darkBg} 0%, ${COLORS.darkBgWarm} 100%)`,
        fontFamily: "Inter, system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Ambient warm glow — top-right, shifts subtly */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "60%",
          height: "60%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.gold}${Math.round(12 + bgWarmth * 40).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
          filter: "blur(80px)",
        }}
      />
      {/* Ambient olive glow — bottom-left */}
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          left: "-5%",
          width: "45%",
          height: "45%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.olive}15 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      {/* ===== BEAT 1: Close the Day ===== */}
      {frame < 125 && (
        <div style={{ opacity: beat1Opacity }}>
          <PhoneMockup
            slideProgress={phoneSlideUp}
            tapScale={tapScale}
            tapFrame={tapFrame}
            frame={frame}
            pillOpacity={pillOpacity}
            pillScale={pillScale}
            confettiProgress={confettiProgress}
            confettiStart={confettiStart}
          />
        </div>
      )}

      {/* ===== BEAT 2: Calendar Streak ===== */}
      {frame >= 118 && frame < 275 && (
        <div style={{ opacity: beat2FadeIn * beat2Opacity }}>
          <CalendarGrid
            frame={frame}
            fps={fps}
            calFillStart={calFillStart}
            calFillInterval={calFillInterval}
          />
          {/* Counter */}
          <div
            style={{
              position: "absolute",
              bottom: 200,
              left: 0,
              right: 0,
              textAlign: "center",
              opacity: counterOpacity,
              transform: `scale(${counterScale})`,
            }}
          >
            <span
              style={{
                fontFamily: "Fraunces, Georgia, serif",
                fontSize: 42,
                fontWeight: 700,
                color: COLORS.greenDay,
                letterSpacing: "-0.02em",
              }}
            >
              {greenCount} Green Days
            </span>
          </div>
        </div>
      )}

      {/* ===== BEAT 3: Score Cards ===== */}
      {frame >= 268 && frame < 395 && (
        <div style={{ opacity: beat3FadeIn * beat3Opacity }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 60,
            }}
          >
            <ScoreCard
              label="Sound Mind"
              score={8.2}
              progress={ringProgress}
              gradientFrom={COLORS.olive}
              gradientTo={COLORS.gold}
              slideProgress={leftCardSlide}
              slideDirection="left"
              sparklineData={[5.2, 5.8, 6.1, 6.4, 6.2, 6.8, 7.1, 7.0, 7.4, 7.8, 7.6, 8.0, 8.2]}
              sparklineOpacity={sparklineOpacity}
            />
            <ScoreCard
              label="Sound Body"
              score={7.8}
              progress={ringProgress}
              gradientFrom={COLORS.mediterraneanBlue}
              gradientTo={COLORS.greenDay}
              slideProgress={rightCardSlide}
              slideDirection="right"
              sparklineData={[4.8, 5.1, 5.5, 5.2, 5.8, 6.2, 6.5, 6.8, 7.0, 7.2, 7.4, 7.6, 7.8]}
              sparklineOpacity={sparklineOpacity}
            />
          </div>
        </div>
      )}

      {/* ===== BEAT 4: Tagline + CTA ===== */}
      {frame >= 388 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            // Subtle warm gradient for closing
            background: `linear-gradient(180deg, transparent 20%, ${COLORS.olive}08 50%, ${COLORS.cream}06 80%)`,
          }}
        >
          <div
            style={{
              opacity: taglineFade,
              fontFamily: "Fraunces, Georgia, serif",
              fontSize: 64,
              fontWeight: 700,
              color: COLORS.cream,
              letterSpacing: "-0.02em",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            Brew more green days.
          </div>
          <div
            style={{
              opacity: ctaFade,
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 28,
              fontWeight: 500,
              color: COLORS.mediterraneanBlue,
              marginTop: 24,
              letterSpacing: "0.04em",
            }}
          >
            healthbrew.app
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---- Phone Mockup (Beat 1) ----

const PhoneMockup: React.FC<{
  slideProgress: number;
  tapScale: number;
  tapFrame: number;
  frame: number;
  pillOpacity: number;
  pillScale: number;
  confettiProgress: number;
  confettiStart: number;
}> = ({
  slideProgress,
  tapScale,
  tapFrame,
  frame,
  pillOpacity,
  pillScale,
  confettiProgress,
  confettiStart,
}) => {
  const phoneW = 320;
  const phoneH = 580;
  const phoneX = 1920 / 2 - phoneW / 2;
  // Slides from below screen to center
  const phoneY = interpolate(slideProgress, [0, 1], [1080, 1080 / 2 - phoneH / 2 - 20]);

  // Button states: before tap = all neutral, after tap = green selected
  const tapped = frame >= tapFrame + 8;

  return (
    <>
      {/* Phone body */}
      <div
        style={{
          position: "absolute",
          left: phoneX,
          top: phoneY,
          width: phoneW,
          height: phoneH,
          borderRadius: 36,
          background: "linear-gradient(180deg, #2a2820 0%, #1f1e18 100%)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.06)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "50px 24px 30px",
        }}
      >
        {/* Screen header */}
        <div
          style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.cream,
            marginBottom: 8,
          }}
        >
          Close the Day
        </div>
        <div
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 13,
            color: "rgba(245,237,216,0.5)",
            marginBottom: 32,
          }}
        >
          How was today?
        </div>

        {/* Three big tap targets */}
        <div style={{ display: "flex", gap: 20, marginBottom: 40 }}>
          {(["green", "yellow", "red"] as const).map((color, i) => {
            const isGreen = color === "green";
            const selected = tapped && isGreen;
            const btnColor =
              color === "green" ? COLORS.greenDay :
              color === "yellow" ? COLORS.yellowDay :
              COLORS.redDay;

            // Tap animation only on green button
            const scale = isGreen
              ? interpolate(
                  tapScale,
                  [0, 0.5, 1],
                  [1, 0.85, 1],
                )
              : 1;

            return (
              <div
                key={color}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: selected
                    ? btnColor
                    : `${btnColor}22`,
                  border: `2px solid ${selected ? btnColor : `${btnColor}44`}`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  transform: `scale(${scale})`,
                  boxShadow: selected ? `0 4px 20px ${btnColor}44` : "none",
                  transition: "none",
                }}
              >
                <div style={{ fontSize: 32 }}>
                  {color === "green" ? "🟢" : color === "yellow" ? "🟡" : "🔴"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status pill */}
        <div
          style={{
            opacity: pillOpacity,
            transform: `scale(${pillScale})`,
            background: `${COLORS.greenDay}22`,
            border: `1.5px solid ${COLORS.greenDay}66`,
            borderRadius: 20,
            padding: "8px 20px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>{"✓"}</span>
          <span
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.greenDay,
              letterSpacing: "0.02em",
            }}
          >
            Green Day
          </span>
        </div>
      </div>

      {/* Confetti / glow particles */}
      {frame >= confettiStart && confettiProgress > 0 && (
        <ConfettiEffect
          cx={1920 / 2}
          cy={1080 / 2 - 30}
          progress={confettiProgress}
        />
      )}
    </>
  );
};

// ---- Confetti particles ----

const CONFETTI_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  angle: (i / 18) * Math.PI * 2 + (i % 3) * 0.3,
  speed: 80 + (i % 5) * 30,
  size: 4 + (i % 3) * 2,
  color: [COLORS.greenDay, COLORS.gold, COLORS.olive, COLORS.cream, COLORS.mediterraneanBlue][i % 5],
  rotSpeed: (i % 2 === 0 ? 1 : -1) * (2 + i * 0.3),
}));

const ConfettiEffect: React.FC<{
  cx: number;
  cy: number;
  progress: number;
}> = ({ cx, cy, progress }) => {
  return (
    <>
      {CONFETTI_PARTICLES.map((p, i) => {
        const x = cx + Math.cos(p.angle) * p.speed * progress;
        const y = cy + Math.sin(p.angle) * p.speed * progress - 20 * progress + 40 * progress * progress;
        const opacity = interpolate(progress, [0, 0.3, 0.8, 1], [0, 1, 0.8, 0]);
        const rotation = p.rotSpeed * progress * 360;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - p.size / 2,
              top: y - p.size / 2,
              width: p.size,
              height: p.size * 0.6,
              borderRadius: 1,
              background: p.color,
              opacity,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      })}
    </>
  );
};

// ---- Calendar Grid (Beat 2) ----

const CAL_ROWS = 5;
const CAL_COLS = 7;

const CalendarGrid: React.FC<{
  frame: number;
  fps: number;
  calFillStart: number;
  calFillInterval: number;
}> = ({ frame, fps, calFillStart, calFillInterval }) => {
  const gridW = 600;
  const gridH = (gridW / CAL_COLS) * CAL_ROWS;
  const gap = 8;
  const cellW = (gridW - gap * (CAL_COLS - 1)) / CAL_COLS;
  const cellH = (gridH - gap * (CAL_ROWS - 1)) / CAL_ROWS;

  // Day-of-week headers
  const dayNames = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div
      style={{
        position: "absolute",
        top: 1080 / 2 - gridH / 2 - 50,
        left: 1920 / 2 - gridW / 2,
        width: gridW,
      }}
    >
      {/* Month label */}
      <div
        style={{
          textAlign: "center",
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: 28,
          fontWeight: 700,
          color: COLORS.cream,
          marginBottom: 16,
          letterSpacing: "-0.01em",
        }}
      >
        May 2026
      </div>

      {/* Day headers */}
      <div style={{ display: "flex", gap, marginBottom: 8 }}>
        {dayNames.map((d, i) => (
          <div
            key={i}
            style={{
              width: cellW,
              textAlign: "center",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(245,237,216,0.35)",
              letterSpacing: "0.08em",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${CAL_COLS}, 1fr)`,
          gap,
        }}
      >
        {/* First row: pad 3 empties (May 2026 starts on Friday) */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`pad-${i}`} style={{ width: cellW, height: cellH }} />
        ))}
        {CALENDAR_DATA.map((status, idx) => {
          const cellAppearFrame = calFillStart + idx * calFillInterval;
          const cellOpacity = interpolate(
            frame,
            [cellAppearFrame, cellAppearFrame + 6],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const cellScale = interpolate(
            frame,
            [cellAppearFrame, cellAppearFrame + 8],
            [0.5, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }
          );

          // The last green tile gets an extra pop
          const isLastGreen = idx === CALENDAR_DATA.lastIndexOf("G");
          const popExtra = isLastGreen
            ? interpolate(
                frame,
                [cellAppearFrame + 4, cellAppearFrame + 10, cellAppearFrame + 14],
                [1, 1.2, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              )
            : 1;

          const bg = calendarColor(status);
          const dayNum = idx + 1;

          return (
            <div
              key={idx}
              style={{
                width: cellW,
                height: cellH,
                borderRadius: 12,
                background: bg,
                opacity: cellOpacity,
                transform: `scale(${cellScale * popExtra})`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: status !== "_" ? `0 2px 8px ${bg}33` : "none",
              }}
            >
              <span
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: status === "_" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.85)",
                }}
              >
                {dayNum}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---- Score Card with gradient ring (Beat 3) ----

const ScoreCard: React.FC<{
  label: string;
  score: number;
  progress: number;
  gradientFrom: string;
  gradientTo: string;
  slideProgress: number;
  slideDirection: "left" | "right";
  sparklineData: number[];
  sparklineOpacity: number;
}> = ({
  label,
  score,
  progress,
  gradientFrom,
  gradientTo,
  slideProgress,
  slideDirection,
  sparklineData,
  sparklineOpacity,
}) => {
  const offsetX = slideDirection === "left" ? -120 : 120;
  const translateX = interpolate(slideProgress, [0, 1], [offsetX, 0]);

  const animatedScore = (score * progress).toFixed(1);

  // Ring geometry
  const ringSize = 140;
  const ringStroke = 10;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringFill = ringCircumference * (1 - (score / 10) * progress);

  // Unique gradient ID per card
  const gradId = `ring-grad-${label.replace(/\s/g, "")}`;

  return (
    <div
      style={{
        transform: `translateX(${translateX}px)`,
        opacity: slideProgress,
        background: "linear-gradient(180deg, #2a2820 0%, #252318 100%)",
        borderRadius: 24,
        padding: "36px 40px 28px",
        boxShadow: "0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 260,
      }}
    >
      {/* Label */}
      <div
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(245,237,216,0.5)",
          marginBottom: 20,
        }}
      >
        {label}
      </div>

      {/* Gradient ring + score */}
      <div style={{ position: "relative", width: ringSize, height: ringSize, marginBottom: 20 }}>
        <svg width={ringSize} height={ringSize} style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientFrom} />
              <stop offset="100%" stopColor={gradientTo} />
            </linearGradient>
          </defs>
          {/* Background ring */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={ringStroke}
          />
          {/* Animated ring */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={ringStroke}
            strokeDasharray={ringCircumference}
            strokeDashoffset={ringFill}
            strokeLinecap="round"
          />
        </svg>
        {/* Score text centered */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontSize: 38,
              fontWeight: 700,
              color: COLORS.cream,
              letterSpacing: "-0.02em",
            }}
          >
            {animatedScore}
          </span>
        </div>
      </div>

      {/* Sparkline */}
      <div style={{ opacity: sparklineOpacity, width: 160, height: 32 }}>
        <Sparkline data={sparklineData} color={gradientTo} />
      </div>
    </div>
  );
};

// ---- Sparkline ----

const Sparkline: React.FC<{
  data: number[];
  color: string;
}> = ({ data, color }) => {
  const w = 160;
  const h = 32;
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  // Fill area
  const firstX = pad;
  const lastX = pad + ((data.length - 1) / (data.length - 1)) * (w - pad * 2);
  const fillPoints = `${firstX},${h} ${points} ${lastX},${h}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill="url(#spark-fill)" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Endpoint dot */}
      <circle
        cx={lastX}
        cy={h - pad - ((data[data.length - 1] - min) / range) * (h - pad * 2)}
        r={3}
        fill={color}
      />
    </svg>
  );
};

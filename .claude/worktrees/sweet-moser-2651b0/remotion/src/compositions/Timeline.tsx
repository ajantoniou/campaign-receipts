import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type TimelineCandidate = {
  name: string;
  portrait?: string;
  role?: string;
};

export type TimelineEvent = {
  date: string;
  label: string;
  outcome?: "kept" | "partial" | "broken" | "reader" | string;
};

export type TimelineProps = {
  brand?: string;
  title?: string;
  events: TimelineEvent[];
  /** Bush/Bell-style caricatures above the line — fills empty frame */
  candidates?: TimelineCandidate[];
};

const portraitSrc = (portrait?: string) =>
  portrait ? (portrait.startsWith("cr-portraits/") ? staticFile(portrait) : portrait) : undefined;

const stampColor = (
  outcome: string | undefined,
  accent: string,
  accentAlt?: string,
  gold?: string,
) => {
  if (!outcome) return accent;
  const o = outcome.toLowerCase();
  if (o === "kept") return accentAlt ?? "#2a4d7c";
  if (o === "broken") return accent;
  if (o === "partial") return gold ?? "#b08a3e";
  if (o === "reader") return "#4a5568";
  return accent;
};

const CandidateTile: React.FC<{
  c: TimelineCandidate;
  opacity: number;
  brand: ReturnType<typeof resolveBrand>;
}> = ({ c, opacity, brand }) => (
  <div
    style={{
      opacity,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: 200,
    }}
  >
    <div
      style={{
        width: 132,
        height: 164,
        borderRadius: 8,
        overflow: "hidden",
        border: `3px solid ${brand.palette.ink}`,
        background: brand.palette.surface ?? "#f4f0e6",
        boxShadow: "0 10px 28px rgba(15,31,58,0.18)",
      }}
    >
      {c.portrait ? (
        <Img
          src={portraitSrc(c.portrait)!}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: brand.type.display,
            fontSize: 48,
            color: brand.palette.muted ?? "#5b6478",
          }}
        >
          ?
        </div>
      )}
    </div>
    <div
      style={{
        marginTop: 10,
        fontFamily: brand.type.display,
        fontSize: 22,
        color: brand.palette.ink,
        textAlign: "center",
      }}
    >
      {c.name}
    </div>
    {c.role ? (
      <div
        style={{
          fontFamily: brand.type.mono ?? brand.type.body,
          fontSize: 14,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: brand.palette.accent,
          marginTop: 4,
        }}
      >
        {c.role}
      </div>
    ) : null}
  </div>
);

// 2026-05-24 vertical Timeline for 9:16 SEALED shorts.
// Top-down list. Big rows. Date eyebrow + label + outcome chip per row.
// Fills the full 1080×1920 frame with the title pinned at top.
const VerticalTimeline: React.FC<{
  b: ReturnType<typeof resolveBrand>;
  title?: string;
  events: TimelineEvent[];
  durationInFrames: number;
  frame: number;
  width: number;
  height: number;
}> = ({ b, title, events, durationInFrames, frame, width, height }) => {
  const eventsStart = Math.round(durationInFrames * 0.10);
  const eventsEnd = Math.round(durationInFrames * 0.92);
  const perEvent = Math.max(
    6,
    Math.floor((eventsEnd - eventsStart) / Math.max(1, events.length)),
  );
  // Big visible text — readable on a phone in 5s
  const titleSize = 56;
  const dateSize = 32;
  const labelSize = 64;
  const outcomeSize = 36;

  return (
    <AbsoluteFill style={{ background: b.palette.bg, padding: "120px 80px" }}>
      {title ? (
        <div
          style={{
            fontFamily: b.type.mono ?? b.type.body,
            fontSize: titleSize,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: b.palette.accent,
            marginBottom: 64,
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
        {events.map((e, i) => {
          const start = eventsStart + i * perEvent;
          const opacity = interpolate(frame, [start, start + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const slideY = interpolate(frame, [start, start + 12], [40, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const stampC = stampColor(
            e.outcome,
            b.palette.accent,
            b.palette.accentAlt,
            b.palette.gold,
          );
          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateY(${slideY}px)`,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                borderLeft: `6px solid ${stampC}`,
                paddingLeft: 32,
              }}
            >
              <div
                style={{
                  fontFamily: b.type.mono ?? b.type.body,
                  fontSize: dateSize,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: b.palette.accent,
                }}
              >
                {e.date}
              </div>
              <div
                style={{
                  fontFamily: b.type.display,
                  fontSize: labelSize,
                  lineHeight: 1.15,
                  color: b.palette.ink,
                }}
              >
                {e.label}
              </div>
              {e.outcome ? (
                <div
                  style={{
                    display: "inline-block",
                    alignSelf: "flex-start",
                    fontFamily: b.type.mono ?? b.type.body,
                    fontSize: outcomeSize,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: stampC,
                    border: `4px solid ${stampC}`,
                    padding: "10px 22px",
                    borderRadius: 6,
                    marginTop: 8,
                  }}
                >
                  {e.outcome}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Timeline: React.FC<TimelineProps> = ({
  brand,
  title,
  events,
  candidates = [],
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  // 2026-05-24: SEALED shorts render this at 1080×1920. The original Timeline
  // is structurally horizontal (events on a left→right line) which fails on
  // 9:16 vertical — line floats in the middle with massive empty top/bottom.
  // For vertical, render a top-down list of beats: date on top, label below,
  // outcome stamp pinned right. Each beat is a big row that fills the width.
  const isVertical = height > width;
  if (isVertical) {
    return (
      <VerticalTimeline
        b={b}
        title={title}
        events={events}
        durationInFrames={durationInFrames}
        frame={frame}
        width={width}
        height={height}
      />
    );
  }

  const facesIn = Math.round(durationInFrames * 0.12);
  const lineDrawEnd = Math.round(durationInFrames * 0.32);
  const lineProgress = interpolate(frame, [0, lineDrawEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const eventsStart = lineDrawEnd;
  const eventsEnd = Math.round(durationInFrames * 0.92);
  const perEvent = Math.max(
    8,
    Math.floor((eventsEnd - eventsStart) / Math.max(1, events.length)),
  );

  const lineY = candidates.length ? 480 : 360;
  const xStart = 100;
  const xEnd = 1180;

  return (
    <AbsoluteFill style={{ background: b.palette.bg, padding: "48px 64px" }}>
      {title ? (
        <div
          style={{
            fontFamily: b.type.mono ?? b.type.body,
            fontSize: 22,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: b.palette.accent,
            marginBottom: 16,
          }}
        >
          {title}
        </div>
      ) : null}

      {candidates.length ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 56,
            marginBottom: 28,
            minHeight: 200,
          }}
        >
          {candidates.map((c, i) => {
            const opacity = interpolate(
              frame,
              [facesIn + i * 4, facesIn + i * 4 + 12],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return (
              <CandidateTile key={c.name} c={c} opacity={opacity} brand={b} />
            );
          })}
        </div>
      ) : null}

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1280 720"
        style={{ position: "absolute", inset: 0 }}
        preserveAspectRatio="none"
      >
        <line
          x1={xStart}
          y1={lineY}
          x2={xStart + (xEnd - xStart) * lineProgress}
          y2={lineY}
          stroke={b.palette.ink}
          strokeWidth={3}
        />
        {events.map((e, i) => {
          const x = xStart + (xEnd - xStart) * ((i + 0.5) / events.length);
          const start = eventsStart + i * perEvent;
          const dotScale = interpolate(frame, [start, start + 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.back(2)),
          });
          return (
            <circle
              key={i}
              cx={x}
              cy={lineY}
              r={14 * dotScale}
              fill={stampColor(
                e.outcome,
                b.palette.accent,
                b.palette.accentAlt,
                b.palette.gold,
              )}
              stroke={b.palette.bg}
              strokeWidth={4}
            />
          );
        })}
      </svg>

      {events.map((e, i) => {
        const x = xStart + (xEnd - xStart) * ((i + 0.5) / events.length);
        const start = eventsStart + i * perEvent;
        const opacity = interpolate(frame, [start + 4, start + 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const above = i % 2 === 0;
        const stampC = stampColor(
          e.outcome,
          b.palette.accent,
          b.palette.accentAlt,
          b.palette.gold,
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(x / 1280) * 100}%`,
              top: above
                ? `${((lineY - 118) / 720) * 100}%`
                : `${((lineY + 36) / 720) * 100}%`,
              transform: "translateX(-50%)",
              opacity,
              textAlign: "center",
              maxWidth: 280,
            }}
          >
            <div
              style={{
                fontFamily: b.type.mono ?? b.type.body,
                fontSize: 16,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: b.palette.accent,
                marginBottom: 6,
              }}
            >
              {e.date}
            </div>
            <div
              style={{
                fontFamily: b.type.display,
                fontSize: 22,
                color: b.palette.ink,
                lineHeight: 1.25,
                marginBottom: e.outcome ? 8 : 0,
              }}
            >
              {e.label}
            </div>
            {e.outcome ? (
              <div
                style={{
                  display: "inline-block",
                  fontFamily: b.type.mono ?? b.type.body,
                  fontSize: 14,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: stampC,
                  border: `2px solid ${stampC}`,
                  padding: "4px 10px",
                  borderRadius: 4,
                }}
              >
                {e.outcome}
              </div>
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

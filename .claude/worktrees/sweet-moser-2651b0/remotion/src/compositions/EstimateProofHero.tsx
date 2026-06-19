import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  staticFile,
} from "remotion";

/** Homepage / ad hero — car + report detail cards (EstimateProof free + coming soon). */
export type EstimateProofHeroProps = {
  /** Override staticFile name under remotion/public/ */
  carImage?: string;
};

type Detail = {
  label: string;
  value: string;
  tone: "good" | "warn" | "muted" | "soon";
  start: number;
};

const DETAILS: Detail[] = [
  { label: "Open recalls", value: "Checked on this VIN", tone: "warn", start: 0 },
  { label: "Owner complaints", value: "NHTSA · year / model", tone: "muted", start: 24 },
  { label: "Repair outlook", value: "Failures at your mileage", tone: "muted", start: 48 },
  { label: "Market band", value: "Depreciation + comps", tone: "good", start: 72 },
  { label: "Title history", value: "NMVTIS — launching soon", tone: "soon", start: 96 },
  { label: "Other dealers", value: "Better price — launching soon", tone: "soon", start: 120 },
];

const toneColor = (tone: Detail["tone"]) => {
  if (tone === "good") return "#4F7A4B";
  if (tone === "warn") return "#A37222";
  if (tone === "soon") return "#4F6480";
  return "#5F676E";
};

function DetailCard({ detail, frame, fps }: { detail: Detail; frame: number; fps: number }) {
  const fade = Math.round(fps * 0.5);
  const opacity = interpolate(
    frame,
    [detail.start, detail.start + fade, detail.start + fps * 3, detail.start + fps * 3 + fade],
    [0, 1, 1, 0.35],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const y = interpolate(frame, [detail.start, detail.start + fade], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.18)",
      borderLeft: `3px solid ${toneColor(detail.tone)}`,
      backdropFilter: "blur(12px)",
        borderRadius: 8,
        padding: "14px 18px",
        minWidth: 260,
        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
      }}
    >
      <p style={{ margin: 0, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        {detail.label}
      </p>
      <p style={{ margin: "6px 0 0", fontSize: 16, color: "#fff", fontWeight: 500, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        {detail.value}
      </p>
    </div>
  );
}

export const EstimateProofHero: React.FC<EstimateProofHeroProps> = ({
  carImage = "hero-car.png",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const ken = interpolate(frame, [0, durationInFrames], [1.04, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#161A1E" }}>
      <AbsoluteFill style={{ transform: `scale(${ken})` }}>
        <Img
          src={staticFile(carImage)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "68% 50%" }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(105deg, rgba(22,26,30,0.92) 0%, rgba(22,26,30,0.55) 42%, rgba(22,26,30,0.15) 70%)",
        }}
      />
      <AbsoluteFill style={{ padding: "8% 6%", justifyContent: "flex-end", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320 }}>
          {DETAILS.map((d) => (
            <DetailCard key={d.label} detail={d} frame={frame} fps={fps} />
          ))}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "flex-end", padding: "5% 6%" }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          EstimateProof · illustrative
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

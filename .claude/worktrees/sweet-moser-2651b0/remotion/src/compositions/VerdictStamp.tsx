import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  random,
} from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type VerdictCandidate = {
  name: string;
  portrait?: string;
  role?: string;
};

export type VerdictStampProps = {
  brand?: string;
  verdict: "KEPT" | "PARTIAL" | "BROKEN" | "READER" | "RECEIPT" | string;
  promise?: string;
  citation?: string;
  rotationDeg?: number;
  candidates?: VerdictCandidate[];
};

const portraitSrc = (portrait?: string) =>
  portrait ? (portrait.startsWith("cr-portraits/") ? staticFile(portrait) : portrait) : undefined;

const colorFor = (v: string, accent: string, accentAlt?: string, gold?: string) => {
  const u = v.toUpperCase();
  if (u === "KEPT") return accentAlt ?? "#2a4d7c";
  if (u === "BROKEN") return accent;
  if (u === "PARTIAL") return gold ?? "#b08a3e";
  if (u === "RECEIPT") return accentAlt ?? "#2a4d7c";
  return "#4a5568";
};

export const VerdictStamp: React.FC<VerdictStampProps> = ({
  brand,
  verdict,
  promise,
  citation,
  rotationDeg = -8,
  candidates = [],
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const isReceipt = verdict.toUpperCase() === "RECEIPT";

  const impactFrame = Math.round(
    durationInFrames * (isReceipt ? 0.14 : 0.28),
  );
  const dropFrames = Math.round(fps * 0.32);

  const dropT = interpolate(
    frame,
    [impactFrame - dropFrames, impactFrame],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    },
  );
  const scale = interpolate(dropT, [0, 1], [isReceipt ? 2.4 : 3.2, 1]);
  const stampOpacity = interpolate(dropT, [0, 1], [0, 1]);
  const rotation = interpolate(dropT, [0, 1], [0, rotationDeg]);

  const shakeWindow = 8;
  const shakeT = interpolate(
    frame,
    [impactFrame, impactFrame + shakeWindow],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const shakeAmp = isReceipt ? 0 : 1;
  const shakeX = (random(`sx-${frame}`) - 0.5) * 10 * shakeT * shakeAmp;
  const shakeY = (random(`sy-${frame}`) - 0.5) * 8 * shakeT * shakeAmp;

  const headlineOpacity = interpolate(
    frame,
    [0, b.motion.fadeFrames * 2],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const facesOpacity = interpolate(
    frame,
    [b.motion.fadeFrames, b.motion.fadeFrames * 3],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const stampC = colorFor(
    verdict,
    b.palette.accent,
    b.palette.accentAlt,
    b.palette.gold,
  );
  const headline =
    promise ||
    (isReceipt ? "Outside money on the record" : "");

  return (
    <AbsoluteFill
      style={{
        background: b.palette.bg,
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 6%",
        }}
      >
        {candidates.length ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 48,
              marginBottom: 28,
              opacity: facesOpacity,
            }}
          >
            {candidates.map((c) => (
              <div
                key={c.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 120,
                }}
              >
                {c.portrait ? (
                  <div
                    style={{
                      width: 88,
                      height: 110,
                      borderRadius: 6,
                      overflow: "hidden",
                      border: `2px solid ${b.palette.ink}`,
                      background: b.palette.surface ?? "#f4f0e6",
                    }}
                  >
                    <Img
                      src={portraitSrc(c.portrait)!}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ) : (
                  // 2026-05-23: empty portrait boxes (e.g. challenger with no Wikipedia photo)
                  // looked like a render bug; render initials as a stylized placeholder instead.
                  <div
                    style={{
                      width: 88,
                      height: 110,
                      borderRadius: 6,
                      border: `2px solid ${b.palette.ink}`,
                      background: b.palette.surface ?? "#f4f0e6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: b.type.display,
                      fontSize: 38,
                      color: b.palette.ink,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {c.name
                      .split(/\s+/)
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <div
                  style={{
                    marginTop: 6,
                    fontFamily: b.type.body,
                    fontSize: 15,
                    color: b.palette.ink,
                    textAlign: "center",
                  }}
                >
                  {c.name}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {headline ? (
          <div
            style={{
              opacity: headlineOpacity,
              fontFamily: b.type.display,
              fontSize: isReceipt ? 40 : 54,
              lineHeight: 1.15,
              color: b.palette.ink,
              textAlign: "center",
              maxWidth: "88%",
              marginBottom: 36,
            }}
          >
            {headline}
          </div>
        ) : null}

        <div
          style={{
            transform: `rotate(${rotation}deg) scale(${scale})`,
            opacity: stampOpacity,
            border: `8px solid ${stampC}`,
            padding: "16px 48px",
            borderRadius: 8,
            background: "transparent",
          }}
        >
          <div
            style={{
              fontFamily: b.type.mono ?? b.type.body,
              fontSize: isReceipt ? 80 : 96,
              letterSpacing: "0.16em",
              fontWeight: 800,
              color: stampC,
              lineHeight: 1,
            }}
          >
            {verdict.toUpperCase()}
          </div>
        </div>

        {citation ? (
          <div
            style={{
              marginTop: 40,
              fontFamily: b.type.mono ?? b.type.body,
              fontSize: 22,
              letterSpacing: "0.08em",
              color: b.palette.ink,
              opacity: stampOpacity * 0.85,
              textAlign: "center",
              maxWidth: "90%",
            }}
          >
            {citation}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

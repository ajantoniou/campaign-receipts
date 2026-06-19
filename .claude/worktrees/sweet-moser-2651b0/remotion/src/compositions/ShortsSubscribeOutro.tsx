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

export type ShortsSubscribeOutroProps = {
  brand?: string;
  handle?: string;     // "@campaignreceipts"
  cta?: string;        // short line above the button
  buttonLabel?: string;
};

/**
 * Branded Shorts SUBSCRIBE OUTRO — 9:16 vertical (1080×1920), ~3s.
 *
 * The standard YouTube "subscribe + hit the bell" end card, restyled in CR
 * brand: navy ink on parchment, civic-red subscribe button, a ledger-card
 * bell icon. Sober and editorial — NOT the generic neon end-screen look.
 *
 * Animation: button pulses, bell rings (rotation shake) once it lands. Both
 * are subtle, in keeping with the "authoritative, not scammy" brief.
 */
export const ShortsSubscribeOutro: React.FC<ShortsSubscribeOutroProps> = ({
  brand = "campaign-receipts",
  handle = "@campaignreceipts",
  cta = "Follow the money with us",
  buttonLabel = "SUBSCRIBE",
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // CTA fades in first.
  const ctaOpacity = interpolate(frame, [0, Math.round(0.4 * fps)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Button springs in.
  const btnStart = Math.round(0.25 * fps);
  const btnSpring = spring({
    frame: frame - btnStart,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.7 },
  });
  const btnScaleIn = interpolate(btnSpring, [0, 1], [0.7, 1]);
  const btnOpacity = interpolate(
    frame,
    [btnStart, btnStart + Math.round(0.3 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Button pulse — gentle breathing once it has settled.
  const pulseStart = btnStart + Math.round(0.55 * fps);
  const pulse =
    frame > pulseStart
      ? 1 + 0.035 * Math.sin((frame - pulseStart) / fps * Math.PI * 2 * 1.4)
      : 1;
  const btnScale = btnScaleIn * pulse;

  // Bell lands shortly after the button, then rings (rotation shake) once.
  const bellStart = btnStart + Math.round(0.45 * fps);
  const bellSpring = spring({
    frame: frame - bellStart,
    fps,
    config: { damping: 12, stiffness: 140, mass: 0.6 },
  });
  const bellScale = interpolate(bellSpring, [0, 1], [0, 1]);
  const ringStart = bellStart + Math.round(0.35 * fps);
  const ringDur = Math.round(0.6 * fps);
  const ringT = interpolate(frame, [ringStart, ringStart + ringDur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bellAngle =
    ringT > 0
      ? Math.sin((frame - ringStart) / fps * Math.PI * 2 * 5) * 14 * ringT
      : 0;

  // Handle fades in last.
  const handleOpacity = interpolate(
    frame,
    [btnStart + Math.round(0.6 * fps), btnStart + Math.round(1.0 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Tail fade-out for clean splicing.
  const fadeOut = interpolate(
    frame,
    [durationInFrames - Math.round(0.3 * fps), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const ink = b.palette.ink;
  const red = b.palette.accent;

  return (
    <AbsoluteFill style={{ background: b.palette.bg, opacity: fadeOut }}>
      {/* Faint ruled-ledger texture to match the intro card. */}
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 87px,
            ${ink}0c 87px,
            ${ink}0c 88px
          )`,
          opacity: 0.5,
        }}
      />
      <AbsoluteFill style={{ padding: 54 }}>
        <div
          style={{
            flex: 1,
            border: `2px solid ${ink}33`,
            borderRadius: 10,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 8%",
        }}
      >
        {/* CTA line. */}
        <div
          style={{
            opacity: ctaOpacity,
            fontFamily: b.type.display,
            fontSize: 76,
            lineHeight: 1.08,
            color: ink,
            textAlign: "center",
            marginBottom: 70,
            maxWidth: "92%",
          }}
        >
          {cta}
        </div>

        {/* Subscribe button + bell, side by side. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 36,
          }}
        >
          {/* Civic-red subscribe button. */}
          <div
            style={{
              opacity: btnOpacity,
              transform: `scale(${btnScale})`,
              background: red,
              color: b.palette.accentText,
              fontFamily: b.type.mono,
              fontSize: 58,
              fontWeight: 700,
              letterSpacing: "0.14em",
              padding: "30px 56px",
              paddingRight: "calc(56px - 0.14em)",
              borderRadius: 14,
              boxShadow: `0 10px 0 ${ink}22`,
            }}
          >
            {buttonLabel}
          </div>

          {/* Bell icon in a ledger card. */}
          <div
            style={{
              opacity: btnOpacity,
              transform: `scale(${bellScale})`,
              width: 118,
              height: 118,
              borderRadius: 14,
              background: b.palette.surface,
              border: `3px solid ${ink}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              style={{
                transform: `rotate(${bellAngle}deg)`,
                transformOrigin: "12px 4px",
              }}
            >
              <path
                d="M12 2.5a1.4 1.4 0 0 1 1.4 1.4v.6a6 6 0 0 1 4.6 5.8v3.3l1.6 2.4a.9.9 0 0 1-.75 1.4H5.15a.9.9 0 0 1-.75-1.4L6 13.6v-3.3a6 6 0 0 1 4.6-5.8v-.6A1.4 1.4 0 0 1 12 2.5Z"
                fill={red}
                stroke={ink}
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M9.4 19.2a2.6 2.6 0 0 0 5.2 0"
                stroke={ink}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Channel handle. */}
        <div
          style={{
            opacity: handleOpacity,
            marginTop: 64,
            fontFamily: b.type.mono,
            fontSize: 40,
            letterSpacing: "0.04em",
            color: b.palette.accentAlt ?? ink,
            textAlign: "center",
          }}
        >
          {handle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

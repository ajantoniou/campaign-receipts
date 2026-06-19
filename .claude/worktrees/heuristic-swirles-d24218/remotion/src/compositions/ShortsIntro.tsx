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

export type ShortsIntroProps = {
  brand?: string;
  wordmark?: string;   // "Campaign Receipts"
  tagline?: string;    // "Receipts, not vibes." (exact)
};

/**
 * Branded Shorts INTRO card — 9:16 vertical (1080×1920), ~2s.
 *
 * Founder direction 2026-05-29: every CR Short, now and future, gets a
 * branded intro + outro. Reusable one-time asset, NOT per-Short.
 *
 * Look: sober ledger/receipt aesthetic on CR parchment. Navy serif wordmark,
 * civic-red rule line, mono tagline. Reads in under 2s on a phone.
 * NOT flashy/clickbait — the channel is fighting a "scammy" perception, so
 * the design has to look authoritative and editorial, like a print masthead.
 */
export const ShortsIntro: React.FC<ShortsIntroProps> = ({
  brand = "campaign-receipts",
  wordmark = "Campaign Receipts",
  tagline = "Receipts, not vibes.",
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Two-word wordmark stacked for vertical: "Campaign" / "Receipts".
  const words = wordmark.split(/\s+/);

  // Spring-in for the wordmark (settled, not bouncy — editorial restraint).
  const wordmarkSpring = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 90, mass: 0.8 },
  });
  const wordmarkY = interpolate(wordmarkSpring, [0, 1], [28, 0]);
  const wordmarkOpacity = interpolate(frame, [0, Math.round(0.45 * fps)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // The civic-red rule line "stamps" across — wipes from center outward.
  const ruleStart = Math.round(0.35 * fps);
  const ruleEnd = Math.round(0.85 * fps);
  const ruleWidth = interpolate(frame, [ruleStart, ruleEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Tagline fades up after the rule lands.
  const taglineStart = Math.round(0.7 * fps);
  const taglineOpacity = interpolate(
    frame,
    [taglineStart, taglineStart + Math.round(0.4 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Whole-card fade-out on the tail so it splices cleanly onto the Short.
  const fadeOut = interpolate(
    frame,
    [durationInFrames - Math.round(0.3 * fps), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        background: b.palette.bg,
        opacity: fadeOut,
      }}
    >
      {/* Faint ruled-ledger lines for receipt texture — very low contrast. */}
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 87px,
            ${b.palette.ink}0c 87px,
            ${b.palette.ink}0c 88px
          )`,
          opacity: 0.5,
        }}
      />

      {/* Inner frame border — like the edge of a ledger card / certificate. */}
      <AbsoluteFill style={{ padding: 54 }}>
        <div
          style={{
            flex: 1,
            border: `2px solid ${b.palette.ink}33`,
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
        {/* Eyebrow kicker — small mono, sets the editorial register. */}
        <div
          style={{
            opacity: wordmarkOpacity,
            fontFamily: b.type.mono,
            fontSize: 30,
            letterSpacing: "0.42em",
            color: b.palette.accent,
            textTransform: "uppercase",
            marginBottom: 40,
            paddingLeft: "0.42em", // optically center letter-spaced text
          }}
        >
          The Record
        </div>

        {/* Wordmark — navy Instrument Serif, stacked. */}
        <div
          style={{
            opacity: wordmarkOpacity,
            transform: `translateY(${wordmarkY}px)`,
            textAlign: "center",
          }}
        >
          {words.map((w, i) => (
            <div
              key={i}
              style={{
                fontFamily: b.type.display,
                fontSize: 168,
                lineHeight: 0.98,
                color: b.palette.ink,
                letterSpacing: "-0.01em",
              }}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Civic-red rule line — the "stamp" that lands across. */}
        <div
          style={{
            marginTop: 44,
            marginBottom: 44,
            width: "62%",
            height: 6,
            background: b.palette.accent,
            transform: `scaleX(${ruleWidth})`,
            transformOrigin: "center",
            borderRadius: 3,
          }}
        />

        {/* Tagline — exact: "Receipts, not vibes." */}
        <div
          style={{
            opacity: taglineOpacity,
            fontFamily: b.type.mono,
            fontSize: 50,
            letterSpacing: "0.06em",
            color: b.palette.ink,
            textAlign: "center",
          }}
        >
          {tagline}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

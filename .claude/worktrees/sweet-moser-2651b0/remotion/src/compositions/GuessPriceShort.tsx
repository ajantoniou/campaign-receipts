import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { resolveBrand } from "../brand/tokens";

const FPS = 30;
const W = 1080;
const H = 1920;

export type GuessPriceCountdownProps = {
  brand?: string;
};

export const GuessPriceCountdown: React.FC<GuessPriceCountdownProps> = ({ brand = "estimateproof" }) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const step = Math.floor((frame / durationInFrames) * 3);
  const nums = ["3", "2", "1"];
  const n = nums[Math.min(step, 2)];

  const stepLen = durationInFrames / 3;
  const stepFrame = frame - step * stepLen;

  const scale = interpolate(stepFrame, [0, 8, 20], [0.6, 1.15, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const flash = interpolate(stepFrame, [0, 3, 10], [0.55, 0.15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: b.palette.bg, justifyContent: "center", alignItems: "center" }}>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
      <p
        style={{
          position: "absolute",
          top: "18%",
          margin: 0,
          fontFamily: b.type.body,
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: "0.22em",
          color: "rgba(255,255,255,0.75)",
        }}
      >
        LOCK IN YOUR GUESS
      </p>
      <div
        style={{
          fontFamily: b.type.display,
          fontSize: 280,
          fontWeight: 800,
          color: b.palette.accent,
          transform: `scale(${scale})`,
          textShadow: "0 8px 40px rgba(0,0,0,0.5)",
        }}
      >
        {n}
      </div>
      <Watermark />
    </AbsoluteFill>
  );
};

export type GuessPriceRevealProps = {
  brand?: string;
  mode?: "single" | "compare";
  vehicleLabel?: string;
  asking?: number;
  fairLow?: number;
  fairHigh?: number;
  listingA?: { year: number; make: string; model: string; price: number };
  listingB?: { year: number; make: string; model: string; price: number };
};

export const GuessPriceReveal: React.FC<GuessPriceRevealProps> = ({
  brand = "estimateproof",
  mode = "single",
  vehicleLabel = "Vehicle",
  asking = 0,
  fairLow = 0,
  fairHigh = 0,
  listingA,
  listingB,
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pop = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.2)),
  });

  return (
    <AbsoluteFill style={{ background: b.palette.bg, justifyContent: "center", alignItems: "center", padding: 48 }}>
      {mode === "compare" && listingA && listingB ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 32, width: "100%", opacity: pop }}>
          {[listingA, listingB].map((L, i) => (
            <div
              key={i}
              style={{
                background: b.palette.surface,
                borderRadius: 16,
                padding: "28px 32px",
                border: `2px solid ${i === 0 && listingA.price > listingB.price ? b.palette.accent : "rgba(255,255,255,0.12)"}`,
              }}
            >
              <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: 22, fontFamily: b.type.body }}>
                {L.year} {L.make} {L.model}
              </p>
              <p style={{ margin: "8px 0 0", color: b.palette.ink, fontSize: 56, fontWeight: 700, fontFamily: b.type.display }}>
                ${L.price.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", opacity: pop, transform: `scale(${0.85 + pop * 0.15})` }}>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 24, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {vehicleLabel}
          </p>
          <p style={{ margin: "16px 0 0", color: b.palette.accent, fontSize: 96, fontWeight: 800, lineHeight: 1 }}>
            ${asking.toLocaleString()}
          </p>
          {fairLow > 0 && (
            <p style={{ margin: "20px 0 0", color: b.palette.ink, fontSize: 28, fontFamily: b.type.body }}>
              Fair range ${fairLow.toLocaleString()} – ${fairHigh.toLocaleString()}
            </p>
          )}
        </div>
      )}
      <Watermark />
    </AbsoluteFill>
  );
};

export type GuessPriceGameShowRevealProps = {
  brand?: string;
  doorNumber?: number;
  vehicleLabel?: string;
  asking?: number;
  fairLow?: number;
  fairHigh?: number;
};

export const GuessPriceGameShowReveal: React.FC<GuessPriceGameShowRevealProps> = ({
  brand = "estimateproof",
  doorNumber = 1,
  vehicleLabel = "Vehicle",
  asking = 0,
  fairLow = 0,
  fairHigh = 0,
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const doorOpen = interpolate(frame, [30, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const bannerSwap = frame >= 78 ? 1 : 0;
  const pricePop = interpolate(frame, [85, 105], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.4)),
  });
  const priceDisplay = Math.round(asking * pricePop);
  const flash = interpolate(frame, [82, 92, 102], [0, 0.7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const confetti = Array.from({ length: 24 }, (_, i) => {
    const x = (i * 137) % 100;
    const delay = (i * 3) % 20;
    const y = interpolate(frame - delay, [80, 130], [-10, 110], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const opacity = interpolate(frame - delay, [80, 95, 130], [0, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return { x, y, opacity, color: i % 2 === 0 ? b.palette.accent : "#ffd166" };
  });

  return (
    <AbsoluteFill style={{ background: b.palette.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
      {confetti.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: 14,
            height: 14,
            borderRadius: 3,
            background: c.color,
            opacity: c.opacity,
            transform: `rotate(${i * 15}deg)`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: "50%",
          transform: "translateX(-50%)",
          background: b.palette.accent,
          color: b.palette.bg,
          padding: "16px 40px",
          borderRadius: 8,
          fontFamily: b.type.display,
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: "0.08em",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        }}
      >
        {bannerSwap ? "THE ASKING PRICE IS…" : `DOOR #${doorNumber}`}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "22%",
            bottom: "22%",
            width: "50%",
            background: "linear-gradient(135deg, #1a2744 0%, #0d1526 100%)",
            borderRight: "4px solid rgba(255,255,255,0.2)",
            transform: `translateX(${-doorOpen * 100}%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "22%",
            bottom: "22%",
            width: "50%",
            background: "linear-gradient(225deg, #1a2744 0%, #0d1526 100%)",
            borderLeft: "4px solid rgba(255,255,255,0.2)",
            transform: `translateX(${doorOpen * 100}%)`,
          }}
        />
        <div style={{ textAlign: "center", zIndex: 2, opacity: pricePop, transform: `scale(${0.7 + pricePop * 0.3})` }}>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: 26, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {vehicleLabel}
          </p>
          <p style={{ margin: "12px 0 0", color: b.palette.accent, fontSize: 108, fontWeight: 800, lineHeight: 1, fontFamily: b.type.display }}>
            ${priceDisplay.toLocaleString()}
          </p>
          {fairLow > 0 && pricePop > 0.9 && (
            <p style={{ margin: "18px 0 0", color: b.palette.ink, fontSize: 28, fontFamily: b.type.body }}>
              Fair range ${fairLow.toLocaleString()} – ${fairHigh.toLocaleString()}
            </p>
          )}
        </div>
      </div>
      <Watermark />
    </AbsoluteFill>
  );
};

/**
 * GuessPriceConfettiReveal — v3 reveal comp.
 *
 * Replaces the door-#1 game-show tease. From frame 0:
 *  - banner reads "ASKING PRICE" (no swap, no doors)
 *  - confetti rains
 *  - price counts up from $0 to `asking` with a pop scale
 *  - optional fair-range line below
 *
 * Storyboard beat uses this for ~5s (150 frames @ 30fps).
 */
export type GuessPriceConfettiRevealProps = {
  brand?: string;
  vehicleLabel?: string;
  asking?: number;
  fairLow?: number;
  fairHigh?: number;
};

export const GuessPriceConfettiReveal: React.FC<GuessPriceConfettiRevealProps> = ({
  brand = "estimateproof",
  vehicleLabel = "Vehicle",
  asking = 0,
  fairLow = 0,
  fairHigh = 0,
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Price counts up over first ~60% of the comp, then holds.
  const countEnd = Math.floor(durationInFrames * 0.6);
  const t = interpolate(frame, [0, countEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const priceDisplay = Math.round(asking * t);
  const pop = interpolate(frame, [0, 18], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.4)),
  });
  const flash = interpolate(frame, [0, 6, 16], [0, 0.7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Confetti — rains from top, fades by end.
  const confetti = Array.from({ length: 32 }, (_, i) => {
    const x = (i * 137) % 100;
    const delay = (i * 2) % 18;
    const y = interpolate(frame - delay, [0, 80], [-12, 110], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const opacity = interpolate(frame - delay, [0, 10, 80], [0, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return { x, y, opacity, color: i % 2 === 0 ? b.palette.accent : "#ffd166" };
  });

  return (
    <AbsoluteFill style={{ background: b.palette.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
      {confetti.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: 16,
            height: 16,
            borderRadius: 3,
            background: c.color,
            opacity: c.opacity,
            transform: `rotate(${i * 15}deg)`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          top: "14%",
          left: "50%",
          transform: "translateX(-50%)",
          background: b.palette.accent,
          color: b.palette.bg,
          padding: "16px 44px",
          borderRadius: 8,
          fontFamily: b.type.display,
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: "0.1em",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        }}
      >
        ASKING PRICE
      </div>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", transform: `scale(${pop})` }}>
          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.6)",
              fontSize: 26,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: b.type.body,
            }}
          >
            {vehicleLabel}
          </p>
          <p
            style={{
              margin: "14px 0 0",
              color: b.palette.accent,
              fontSize: 124,
              fontWeight: 800,
              lineHeight: 1,
              fontFamily: b.type.display,
              textShadow: "0 8px 28px rgba(0,0,0,0.55)",
            }}
          >
            ${priceDisplay.toLocaleString()}
          </p>
          {fairLow > 0 && t > 0.9 && (
            <p
              style={{
                margin: "22px 0 0",
                color: b.palette.ink,
                fontSize: 30,
                fontFamily: b.type.body,
              }}
            >
              Fair range ${fairLow.toLocaleString()} – ${fairHigh.toLocaleString()}
            </p>
          )}
        </div>
      </AbsoluteFill>
      <Watermark />
    </AbsoluteFill>
  );
};

/**
 * DealerReceiptCard — paper-receipt style dealer disclosure.
 *
 * EstimateProof brand = "audit document" aesthetic. This comp renders the
 * dealer block (name, street, city/state/zip, phone, stock#) as a tearable
 * receipt the viewer can screenshot and dial. Fits beat b06 in the v3
 * storyboard (22-27s).
 */
export type DealerReceiptCardProps = {
  brand?: string;
  dealerName?: string;
  street?: string;
  cityStateZip?: string;
  phone?: string;
  stockNo?: string;
};

export const DealerReceiptCard: React.FC<DealerReceiptCardProps> = ({
  brand = "estimateproof",
  dealerName = "Dealer",
  street = "",
  cityStateZip = "",
  phone = "",
  stockNo = "",
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const slide = interpolate(frame, [0, 16], [40, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        background: b.palette.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: 56,
        opacity: fade,
      }}
    >
      <div
        style={{
          background: "#f8f4ea",
          color: "#1a1a1a",
          width: "84%",
          padding: "56px 48px 64px",
          borderRadius: 12,
          boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
          fontFamily: b.type.mono ?? "ui-monospace, monospace",
          transform: `translateY(${slide}px)`,
          position: "relative",
        }}
      >
        <div
          style={{
            borderBottom: "2px dashed #1a1a1a",
            paddingBottom: 18,
            marginBottom: 28,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontSize: 22,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          <span>Dealer Receipt</span>
          {stockNo ? <span>Stock #{stockNo}</span> : null}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.05,
            fontFamily: b.type.display,
            letterSpacing: "-0.01em",
          }}
        >
          {dealerName}
        </p>
        {street ? (
          <p style={{ margin: "22px 0 0", fontSize: 34, fontWeight: 600 }}>{street}</p>
        ) : null}
        {cityStateZip ? (
          <p style={{ margin: "8px 0 0", fontSize: 34, fontWeight: 600 }}>{cityStateZip}</p>
        ) : null}
        {phone ? (
          <p
            style={{
              margin: "30px 0 0",
              fontSize: 52,
              fontWeight: 800,
              letterSpacing: "0.04em",
              color: b.palette.accent,
            }}
          >
            {phone}
          </p>
        ) : null}
        <p
          style={{
            margin: "28px 0 0",
            fontSize: 22,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#555",
          }}
        >
          Verified · MarketCheck listing
        </p>
      </div>
      <Watermark />
    </AbsoluteFill>
  );
};

export type EstimateProofCtaCardProps = {
  brand?: string;
  headline?: string;
  subline?: string;
  url?: string;
};

export const EstimateProofCtaCard: React.FC<EstimateProofCtaCardProps> = ({
  brand = "estimateproof",
  headline = "See similar cars near you",
  subline = "Before you buy — run an EstimateProof report",
  url = "estimateproof.com",
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: b.palette.bg, justifyContent: "center", alignItems: "center", padding: 56, opacity: fade }}>
      <div style={{ textAlign: "center", maxWidth: 900 }}>
        <p style={{ margin: 0, color: b.palette.ink, fontSize: 40, fontWeight: 600, lineHeight: 1.25 }}>{headline}</p>
        <p
          style={{
            margin: "20px 0 0",
            color: b.palette.accent,
            fontSize: 48,
            fontWeight: 800,
            fontFamily: b.type.mono ?? b.type.body,
          }}
        >
          {url.replace(/^https?:\/\//, "")}
        </p>
        <p style={{ margin: "20px 0 0", color: "rgba(255,255,255,0.75)", fontSize: 30, fontWeight: 600 }}>
          {subline}
        </p>
        <p style={{ margin: "16px 0 0", color: b.palette.accent, fontSize: 34, fontWeight: 800 }}>
          We could save you thousands
        </p>
      </div>
      <Watermark />
    </AbsoluteFill>
  );
};

function Watermark() {
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "flex-start", padding: "4% 5%" }}>
      <p
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 600,
          color: "rgba(255,255,255,0.7)",
          fontFamily: "ui-monospace, monospace",
          letterSpacing: "0.04em",
        }}
      >
        estimateproof.com
      </p>
    </AbsoluteFill>
  );
}

export const GUESS_SHORT_FPS = FPS;
export const GUESS_SHORT_W = W;
export const GUESS_SHORT_H = H;

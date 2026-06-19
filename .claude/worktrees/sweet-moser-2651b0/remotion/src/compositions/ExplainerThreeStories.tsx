import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing, Sequence } from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type ExplainerCardItem = {
  /** Numeric ordinal — "1", "2", "3" — or roman ("I", "II"). */
  numeral: string;
  /** Short headline (≤8 words). */
  headline: string;
  /** Body line. Brief — ≤14 words. The dialogue carries the depth. */
  body?: string;
  /** Optional symbolic primitive ID (oil-lamp | scroll | candle | hand-on-codex).
   *  Picks the SVG glyph rendered in the upper third of the card. */
  symbol?: "oil-lamp" | "scroll" | "candle" | "hand-on-codex" | "stone-window";
};

export type ExplainerThreeStoriesProps = {
  brand?: string;
  /** Per cinematic-direction.md rule 15: max 3 cards, 4-5s each, ≤15s total. */
  items: ExplainerCardItem[];
  /** Seconds per card. Default 5. The composition's total durationInFrames
   *  should be set to items.length * cardSeconds * fps externally. */
  cardSeconds?: number;
};

/**
 * ExplainerThreeStories — sparse contemplative explainer for the
 * "here are three stories" / "step by step" pattern.
 *
 * Hard cinematic-direction.md rule 15:
 *   - max 3 cards per episode
 *   - 4-5s per card
 *   - symbolic icons only (oil lamp, scroll, candle) — NOT literal illustration
 *   - rare and precious — should NOT be confused with TikTok-style rapid cuts
 *
 * Visual style: deep charcoal background, sparse SVG symbol upper third,
 * numeral + headline + body lower two-thirds. Slow fade between cards.
 */
export const ExplainerThreeStories: React.FC<ExplainerThreeStoriesProps> = ({
  brand = "nt-ministry",
  items,
  cardSeconds = 5,
}) => {
  const b = resolveBrand(brand);
  const { fps } = useVideoConfig();
  const cardFrames = Math.round(cardSeconds * fps);
  const cropped = (items || []).slice(0, 3);

  return (
    <AbsoluteFill style={{
      background: "#15110e",
      fontFamily: '"Times New Roman", Georgia, serif',
    }}>
      {cropped.map((item, i) => (
        <Sequence key={i} from={i * cardFrames} durationInFrames={cardFrames}>
          <Card item={item} brand={b} totalFrames={cardFrames} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Card: React.FC<{ item: ExplainerCardItem; brand: ReturnType<typeof resolveBrand>; totalFrames: number }> = ({
  item, brand, totalFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeFrames = Math.round(0.4 * fps);

  const opacity = interpolate(
    frame,
    [0, fadeFrames, totalFrames - fadeFrames, totalFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) },
  );

  return (
    <AbsoluteFill style={{
      justifyContent: "center",
      alignItems: "center",
      padding: "120px 160px",
    }}>
      <div style={{
        opacity,
        color: brand.palette.surface,
        textAlign: "center",
        maxWidth: 1500,
      }}>
        <div style={{ marginBottom: 32, height: 110, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Symbol kind={item.symbol} stroke={brand.palette.surface} />
        </div>
        <div style={{
          fontSize: 96,
          letterSpacing: "0.04em",
          marginBottom: 18,
          color: brand.palette.bgAccent,
          fontStyle: "italic",
        }}>
          {item.numeral}
        </div>
        <div style={{
          fontSize: 60,
          lineHeight: 1.25,
          marginBottom: item.body ? 24 : 0,
        }}>
          {item.headline}
        </div>
        {item.body && (
          <div style={{
            fontSize: 32,
            lineHeight: 1.5,
            opacity: 0.85,
            maxWidth: 1200,
            margin: "0 auto",
          }}>
            {item.body}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/** Single-stroke SVG glyphs — symbolic, not illustrative. */
const Symbol: React.FC<{ kind?: ExplainerCardItem["symbol"]; stroke: string }> = ({ kind, stroke }) => {
  const sw = 1.8;
  const common = { fill: "none", stroke, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "oil-lamp":
      return (
        <svg viewBox="0 0 64 32" width={140} height={70}>
          <path d="M8 24 L56 24 L48 16 L16 16 Z" {...common} />
          <path d="M30 16 L34 8" {...common} />
          <path d="M32 4 Q34 6 33 8" {...common} />
        </svg>
      );
    case "scroll":
      return (
        <svg viewBox="0 0 64 24" width={140} height={52}>
          <path d="M4 4 Q8 0 12 4 L12 20 Q8 24 4 20 Z" {...common} />
          <path d="M52 4 Q56 0 60 4 L60 20 Q56 24 52 20 Z" {...common} />
          <path d="M12 4 L52 4 M12 20 L52 20" {...common} />
        </svg>
      );
    case "candle":
      return (
        <svg viewBox="0 0 24 48" width={70} height={140}>
          <path d="M10 44 L14 44 L14 16 L10 16 Z" {...common} />
          <path d="M12 16 L12 10" {...common} />
          <path d="M12 4 Q14 7 13 10 Q11 7 12 4 Z" {...common} />
        </svg>
      );
    case "hand-on-codex":
      return (
        <svg viewBox="0 0 64 32" width={140} height={70}>
          <rect x="10" y="18" width="44" height="10" {...common} />
          <path d="M20 18 Q24 8 32 12 Q40 8 44 18" {...common} />
        </svg>
      );
    case "stone-window":
      return (
        <svg viewBox="0 0 48 48" width={110} height={110}>
          <rect x="8" y="8" width="32" height="32" {...common} />
          <path d="M24 8 L24 40 M8 24 L40 24" {...common} />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 32 32" width={70} height={70}>
          <circle cx="16" cy="16" r="10" {...common} />
        </svg>
      );
  }
};

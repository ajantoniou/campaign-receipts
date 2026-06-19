import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing, OffthreadVideo, Loop, Img, staticFile } from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type TextSlateProps = {
  brand?: string;
  text?: string;
  /**
   * Slate style. Defaults to "quiet" — small charcoal vignette + serif word-wrap.
   * Use "title" for opening/closing slates with larger type and longer fade.
   */
  variant?: "quiet" | "title";
  /** Word-wrap width in characters. Default 28 (matches v8 PIL slate). */
  wrapWidth?: number;

  /**
   * Structured info-card API (CR new-news). When ANY of kicker/title/body are
   * supplied, the slate renders a brand-parchment info card (red kicker, navy
   * serif title, navy body) instead of the legacy dark `text` vignette. This is
   * the on-brand, never-black card the CR pipeline expects. Legacy `text`-only
   * usages (SEALED/NTO) keep the dark slate.
   */
  kicker?: string;
  title?: string;
  body?: string;

  /**
   * Optional bright AI/atmosphere plate rendered BEHIND the info-card text.
   * Path is resolved via staticFile() (place clip under remotion/public/).
   * A navy scrim (scrimOpacity, default 0.55) is laid over the plate so cream
   * text stays WCAG-legible. Only applies in info-card mode (kicker/title/body).
   * The black-frame gate must run on the COMPOSITED output, not the raw plate
   * (the scrim lowers luma). See memory: cr-textslate-backgroundvideo-with-navy-scrim.
   */
  backgroundVideo?: string;
  /** Navy scrim opacity over the background plate (0-1). Default 0.55. */
  scrimOpacity?: number;
  /**
   * Length of the AI plate in frames, so it LOOPS to fill the whole beat.
   * AI plates are ~10s (~300f@30fps) but beats run 14-22s — without looping,
   * OffthreadVideo holds the last frame frozen under continuing VO (founder
   * caught a frozen screen 2026-06-01). Default 300 (10s@30fps).
   */
  backgroundVideoDurationInFrames?: number;

  /**
   * Optional book-style caricature portraits matted into the lower corners
   * (info-card mode only). Connects a named public figure to the money on the
   * beat (founder 2026-06-01). Each: { src (staticFile path under public/),
   * corner: "bl" | "br", heightPct }. Feathered + drop-shadow + 6% ken-burns
   * so the cream paper doesn't read as a hard rectangle on the plate.
   */
  portraits?: { src: string; corner?: "bl" | "br"; heightPct?: number }[];
};

/**
 * TextSlate — canonical "quiet line on dark serif" card.
 *
 * Replaces the ad-hoc PIL+ffmpeg `black-slate-text` renderer that produced the
 * v8 text-overflow defect (founder screenshot 2026-05-22). Renders at
 * 1920×1080 @ 30fps via Remotion so word-wrap math is deterministic and
 * the result is bit-stable across runs.
 *
 * Per cinematic-direction.md rule 15. Wired into splice via `vendor: "remotion"`
 * + `composition: "TextSlate"` in the storyboard.
 */
export const TextSlate: React.FC<TextSlateProps> = ({
  brand = "nt-ministry",
  text,
  variant = "quiet",
  wrapWidth = 28,
  kicker,
  title,
  body,
  backgroundVideo,
  scrimOpacity = 0.55,
  backgroundVideoDurationInFrames = 300,
  portraits,
}) => {
  const b = resolveBrand(brand);
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Structured info-card mode (CR new-news): kicker / title / body on parchment.
  const isCard = Boolean(kicker || title || body);

  // Fade in then a slow slide-up + 1% scale-up — matches the v8 kinetic slate
  // intent without the overflow bug.
  const fadeInStart = Math.round(0.2 * fps);
  const fadeInEnd = fadeInStart + Math.round(0.6 * fps);
  const fadeOutStart = durationInFrames - Math.round(0.6 * fps);
  const fadeOutEnd = durationInFrames;

  const opacity = interpolate(
    frame,
    [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) },
  );

  // ── Structured CR info card (parchment, never black) ──────────────────
  if (isCard) {
    const cardDrift = interpolate(
      frame,
      [fadeInStart, fadeInStart + Math.round(1.0 * fps)],
      [18, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
    );
    // Over a bright AI plate, flip to light-on-dark: a deep navy (ink) scrim +
    // cream text. Dark navy ink on a light plate reads low-contrast (founder QC
    // 2026-06-01), so on-plate cards invert. Scrim uses brand ink (navy), text
    // uses brand surface (cream); kicker stays civic-red (pops on dark).
    // Over a bright AI plate, flip to light-on-dark. A FLAT full-frame scrim
    // pays luma everywhere to buy legibility in two glyph bands (founder QC +
    // visual-designer call 2026-06-01) — so instead use a localized VERTICAL
    // GRADIENT scrim that darkens only the kicker band (top) and the title/body
    // band (center), leaving the lower/edge plate bright. Keeps composited YAVG
    // high (clears the black-frame gate with margin) while giving local contrast.
    // Kicker gets its own solid civic-red chip (immune to bright highlights);
    // title/body are cream with a dual shadow (the tight 0 0 2px crisps glyph
    // edges at zero luma cost). scrimOpacity scales the gradient as a master mult.
    const onPlate = Boolean(backgroundVideo);
    const titleColor = onPlate ? b.palette.surface : b.palette.ink;
    const bodyColor = onPlate ? b.palette.surface : b.palette.ink;
    const textShadow = onPlate
      ? "0 2px 16px rgba(0,0,0,0.62), 0 0 2px rgba(0,0,0,0.5)"
      : undefined;
    const k = scrimOpacity / 0.55; // master multiplier; 0.55 = the tuned baseline
    const sc = (a: number) => `rgba(15,31,58,${Math.min(0.85, a * k).toFixed(3)})`;
    const gradientScrim = [
      `linear-gradient(180deg,`,
      `${sc(0.62)} 0%,`,
      `${sc(0.30)} 18%,`,
      `${sc(0.30)} 30%,`,
      `${sc(0.58)} 50%,`,
      `${sc(0.58)} 78%,`,
      `${sc(0.22)} 100%)`,
    ].join(" ");
    return (
      <AbsoluteFill style={{
        background: `linear-gradient(160deg, ${b.palette.bg} 0%, ${b.palette.bgAccent ?? b.palette.bg} 100%)`,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 160px",
      }}>
        {backgroundVideo ? (
          <>
            <AbsoluteFill>
              {/* Loop the ~10s plate so it never freezes on its last frame
                  under a 14-22s beat (founder QC 2026-06-01). */}
              <Loop durationInFrames={Math.max(1, backgroundVideoDurationInFrames)}>
                <OffthreadVideo
                  src={staticFile(backgroundVideo)}
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Loop>
            </AbsoluteFill>
            <AbsoluteFill style={{ background: gradientScrim }} />
          </>
        ) : null}
        {portraits && portraits.length ? portraits.map((p, i) => {
          const corner = p.corner ?? (i === 0 ? "bl" : "br");
          const hPct = p.heightPct ?? 46;
          // 6% ken-burns drift over the card.
          const kb = interpolate(frame, [0, durationInFrames], [1.0, 1.06],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              position: "absolute",
              bottom: 0,
              [corner === "bl" ? "left" : "right"]: 40,
              height: `${hPct}%`,
              opacity,
              // Feather the cream-paper edge so it doesn't read as a hard
              // rectangle on the plate; drop-shadow lifts it off the bg.
              WebkitMaskImage:
                "radial-gradient(120% 100% at 50% 100%, #000 60%, transparent 100%)",
              maskImage:
                "radial-gradient(120% 100% at 50% 100%, #000 60%, transparent 100%)",
              filter: "drop-shadow(0 6px 22px rgba(0,0,0,0.45))",
            }}>
              <Img
                src={staticFile(p.src)}
                style={{
                  height: "100%",
                  transform: `scale(${kb})`,
                  transformOrigin: "bottom center",
                }}
              />
            </div>
          );
        }) : null}
        <div style={{
          opacity,
          transform: `translateY(${cardDrift}px)`,
          textAlign: "center",
          maxWidth: width - 320,
          position: "relative",
        }}>
          {kicker ? (
            <div style={{
              // On-plate: solid civic-red chip with cream text (immune to bright
              // highlights). Off-plate: legacy civic-red text on parchment.
              display: "inline-block",
              color: onPlate ? b.palette.surface : b.palette.accent,
              background: onPlate ? b.palette.accent : undefined,
              padding: onPlate ? "6px 16px" : undefined,
              borderRadius: onPlate ? 4 : undefined,
              boxShadow: onPlate ? "0 2px 12px rgba(0,0,0,0.45)" : undefined,
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 34,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: 36,
              fontWeight: 600,
            }}>{kicker}</div>
          ) : null}
          {title ? (
            <div style={{
              color: titleColor,
              textShadow,
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 84,
              lineHeight: 1.08,
              marginBottom: body ? 40 : 0,
            }}>{title}</div>
          ) : null}
          {body ? (
            <div style={{
              color: bodyColor,
              textShadow,
              fontFamily: '"Lora", Georgia, serif',
              fontSize: 44,
              lineHeight: 1.4,
              opacity: 0.92,
            }}>{body}</div>
          ) : null}
        </div>
      </AbsoluteFill>
    );
  }

  // Slow upward drift: 24px → 0px over 1.5s, then static.
  const driftPx = interpolate(
    frame,
    [fadeInStart, fadeInStart + Math.round(1.5 * fps)],
    [24, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
  );

  // Word-wrap into ~wrapWidth-char lines. Simple greedy wrap by space.
  const lines = wrap(text, wrapWidth);

  // Size scaling: title variant gets ~96px, quiet variant gets 64px.
  // The text fits a 1840×1000 safe area (cinematic-direction.md rule 6
  // text_overlay_fit safe area). For 28-char wrap at 64px serif, longest line
  // is ~900px wide which fits comfortably in 1840.
  const fontSize = variant === "title" ? 96 : 64;
  const lineHeight = Math.round(fontSize * 1.35);

  // Radial vignette via two layered backgrounds.
  const bgStack = [
    `radial-gradient(circle at 50% 50%, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.85) 100%)`,
    "#1a1816",
  ].join(", ");

  return (
    <AbsoluteFill style={{
      background: bgStack,
      justifyContent: "center",
      alignItems: "center",
      padding: "0 80px",
    }}>
      <div style={{
        opacity,
        transform: `translateY(${driftPx}px)`,
        color: b.palette.surface,
        fontFamily: '"Times New Roman", Georgia, serif',
        fontSize,
        lineHeight: `${lineHeight}px`,
        textAlign: "center",
        maxWidth: width - 160,
        // safe-area: ensure rendered area stays inside 1840×1000
        maxHeight: height - 160,
        overflow: "hidden",
      }}>
        {lines.map((ln, i) => (
          <div key={i}>{ln}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

function wrap(s: string | undefined, width: number): string[] {
  const trimmed = (s || "").trim();
  if (!trimmed) return [""];
  const words = trimmed.split(/\s+/);
  const out: string[] = [];
  let buf = "";
  for (const w of words) {
    if (!buf) {
      buf = w;
      continue;
    }
    if ((buf + " " + w).length <= width) {
      buf = buf + " " + w;
    } else {
      out.push(buf);
      buf = w;
    }
  }
  if (buf) out.push(buf);
  return out;
}

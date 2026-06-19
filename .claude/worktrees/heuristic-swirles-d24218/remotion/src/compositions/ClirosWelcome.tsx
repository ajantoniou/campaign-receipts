/* ─── ClirosWelcome ───
   60-second explainer that plays in the Cliros dashboard the first
   time an attorney lands there after their 5 free reports are used up.

   Scene plan (1800 frames @ 30fps):
     0-180   Scene 1: "You've used your 5 free reports" (count-up + freeze)
     180-540 Scene 2: "Here's what's next" — 3 pack tiers animate in
     540-900 Scene 3: "Reports show up the moment payment clears" — dashboard mockup
     900-1380 Scene 4: "Tell us what to build next" — alex@cliros.ai card
    1380-1800 Scene 5: Closing card with Cliros mark + tagline

   No talking head. Pure motion design. Uses the cliros brand tokens
   added to src/brand/tokens.ts.
*/

import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
  spring,
} from "remotion";
import { resolveBrand } from "../brand/tokens";
import { loadAllFonts } from "../brand/fonts";

loadAllFonts();

export type ClirosWelcomeProps = {
  brand?: string;
  attorneyName?: string;
};

const fadeIn = (frame: number, start: number, dur = 24) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

const fadeOut = (frame: number, start: number, dur = 18) =>
  interpolate(frame, [start, start + dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

/* ──────────────────────── Scene 1: Trial used up ──────────────────────── */

const SceneTrialUsed: React.FC<{ b: ReturnType<typeof resolveBrand> }> = ({ b }) => {
  const frame = useCurrentFrame();
  const fps = 30;

  // Count from 0 to 5
  const count = Math.min(5, Math.floor(interpolate(frame, [0, 80], [0, 5.999], { extrapolateRight: "clamp" })));
  const titleOpacity = fadeIn(frame, 0, 18);
  const detailOpacity = fadeIn(frame, 90, 22);
  const stamp = spring({ frame: frame - 100, fps, config: { damping: 12, stiffness: 90 } });
  const out = fadeOut(frame, 165, 15);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: b.palette.bg,
        opacity: 1 - out,
        fontFamily: b.type.body,
        color: b.palette.ink,
        padding: 80,
      }}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 40,
        }}
      >
        <div style={{ opacity: titleOpacity, fontFamily: b.type.display, fontSize: 56, letterSpacing: -1 }}>
          You&apos;ve used all
        </div>
        <div
          style={{
            opacity: 1,
            fontFamily: b.type.display,
            fontSize: 280,
            lineHeight: 1,
            fontWeight: 400,
            display: "flex",
            alignItems: "baseline",
            gap: 28,
          }}
        >
          <span>{count}</span>
          <span style={{ fontSize: 56, opacity: 0.6 }}>/ 5</span>
        </div>
        <div
          style={{
            opacity: detailOpacity * 0.7,
            fontSize: 32,
            color: b.palette.ink,
          }}
        >
          free reports.
        </div>
        <div
          style={{
            position: "absolute",
            top: 80,
            right: 80,
            transform: `scale(${stamp}) rotate(-8deg)`,
            border: `4px solid ${b.palette.ink}`,
            padding: "16px 32px",
            fontFamily: b.type.body,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 3,
            color: b.palette.ink,
          }}
        >
          TRIAL · COMPLETE
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ──────────────────────── Scene 2: Three pack tiers ──────────────────────── */

const PACKS = [
  { size: 1, price: 250, per: 250, discount: "" },
  { size: 5, price: 1100, per: 220, discount: "Save 12%" },
  { size: 25, price: 5000, per: 200, discount: "Save 20%", recommended: true },
];

const ScenePacks: React.FC<{ b: ReturnType<typeof resolveBrand>; start: number }> = ({ b, start }) => {
  const frame = useCurrentFrame();
  const fps = 30;
  const local = frame - start;
  const headerOp = fadeIn(local, 0, 22);
  const out = fadeOut(local, 320, 18);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: b.palette.bg,
        opacity: 1 - out,
        fontFamily: b.type.body,
        color: b.palette.ink,
        padding: 80,
      }}
    >
      <div
        style={{
          opacity: headerOp,
          fontFamily: b.type.display,
          fontSize: 64,
          letterSpacing: -1.5,
          textAlign: "center",
          marginTop: 40,
        }}
      >
        Pick a pack. Keep working.
      </div>
      <div
        style={{
          opacity: headerOp * 0.7,
          fontSize: 24,
          textAlign: "center",
          marginTop: 16,
          letterSpacing: 0.5,
        }}
      >
        Prepaid credits. No subscription. Reports expire in 12 months.
      </div>

      <div
        style={{
          marginTop: 80,
          display: "flex",
          justifyContent: "center",
          gap: 32,
        }}
      >
        {PACKS.map((pkg, i) => {
          const cardEnter = spring({
            frame: local - (60 + i * 40),
            fps,
            config: { damping: 14, stiffness: 80 },
          });
          const tx = (1 - cardEnter) * 80;
          return (
            <div
              key={pkg.size}
              style={{
                opacity: cardEnter,
                transform: `translateY(${tx}px)`,
                backgroundColor: pkg.recommended ? b.palette.ink : b.palette.surface,
                color: pkg.recommended ? b.palette.accentText : b.palette.ink,
                border: `2px solid ${b.palette.ink}`,
                borderRadius: 8,
                padding: "40px 32px",
                width: 280,
                position: "relative",
              }}
            >
              {pkg.recommended && (
                <div
                  style={{
                    position: "absolute",
                    top: -16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: b.palette.bgAccent,
                    color: b.palette.ink,
                    border: `2px solid ${b.palette.ink}`,
                    padding: "4px 14px",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 2,
                  }}
                >
                  MOST POPULAR
                </div>
              )}
              <div style={{ fontSize: 56, fontFamily: b.type.display, lineHeight: 1, fontWeight: 400 }}>
                {pkg.size}
              </div>
              <div style={{ fontSize: 20, opacity: 0.75, marginTop: 8 }}>
                {pkg.size === 1 ? "report" : "reports"}
              </div>
              <div
                style={{
                  fontSize: 48,
                  fontFamily: b.type.display,
                  marginTop: 32,
                  fontWeight: 400,
                }}
              >
                ${pkg.price.toLocaleString()}
              </div>
              <div style={{ fontSize: 18, opacity: 0.75, marginTop: 6 }}>${pkg.per}/report</div>
              {pkg.discount && (
                <div style={{ fontSize: 18, marginTop: 14, fontWeight: 600 }}>
                  {pkg.discount}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ──────────────────────── Scene 3: Credits land instantly ──────────────────────── */

const SceneCredits: React.FC<{ b: ReturnType<typeof resolveBrand>; start: number }> = ({ b, start }) => {
  const frame = useCurrentFrame();
  const fps = 30;
  const local = frame - start;
  const titleOp = fadeIn(local, 0, 22);

  // Animate the report-balance counter ticking up: 0 → 25
  const balance = Math.min(25, Math.floor(interpolate(local, [80, 200], [0, 25.99], { extrapolateRight: "clamp" })));

  // The "$5,000 charged" line fades in mid-animation
  const chargedOp = fadeIn(local, 120, 18);

  const out = fadeOut(local, 320, 18);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: b.palette.bg,
        opacity: 1 - out,
        fontFamily: b.type.body,
        color: b.palette.ink,
        padding: 80,
      }}
    >
      <div
        style={{
          opacity: titleOp,
          fontFamily: b.type.display,
          fontSize: 56,
          textAlign: "center",
          marginTop: 60,
          letterSpacing: -1,
        }}
      >
        Credits land the moment payment clears.
      </div>

      {/* Mockup of the dashboard credit balance card */}
      <div
        style={{
          marginTop: 80,
          marginLeft: "auto",
          marginRight: "auto",
          width: 720,
          backgroundColor: b.palette.surface,
          border: `2px solid ${b.palette.ink}`,
          borderRadius: 8,
          padding: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 14, letterSpacing: 2, opacity: 0.6, textTransform: "uppercase" }}>
            Reports remaining
          </div>
          <div
            style={{
              fontSize: 120,
              fontFamily: b.type.display,
              lineHeight: 1,
              fontWeight: 400,
              marginTop: 8,
            }}
          >
            {balance}
          </div>
        </div>
        <div style={{ opacity: chargedOp, textAlign: "right" }}>
          <div style={{ fontSize: 14, letterSpacing: 2, opacity: 0.6, textTransform: "uppercase" }}>
            Just charged
          </div>
          <div style={{ fontSize: 40, fontFamily: b.type.display, marginTop: 8 }}>$5,000</div>
          <div style={{ fontSize: 16, opacity: 0.7, marginTop: 6 }}>25-pack · $200/report</div>
        </div>
      </div>

      <div
        style={{
          opacity: chargedOp * 0.7,
          fontSize: 22,
          textAlign: "center",
          marginTop: 60,
        }}
      >
        Every search you run draws from this balance until it&apos;s zero.
      </div>
    </AbsoluteFill>
  );
};

/* ──────────────────────── Scene 4: Tell us what to build ──────────────────────── */

const SceneFeedback: React.FC<{ b: ReturnType<typeof resolveBrand>; start: number }> = ({ b, start }) => {
  const frame = useCurrentFrame();
  const fps = 30;
  const local = frame - start;
  const titleOp = fadeIn(local, 0, 22);
  const cardEnter = spring({ frame: local - 60, fps, config: { damping: 14, stiffness: 80 } });
  const tx = (1 - cardEnter) * 60;
  const out = fadeOut(local, 440, 22);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: b.palette.bg,
        opacity: 1 - out,
        fontFamily: b.type.body,
        color: b.palette.ink,
        padding: 80,
      }}
    >
      <div
        style={{
          opacity: titleOp,
          fontFamily: b.type.display,
          fontSize: 64,
          textAlign: "center",
          marginTop: 80,
          letterSpacing: -1.5,
          lineHeight: 1.15,
        }}
      >
        Have an idea?<br/>We&apos;ll build it.
      </div>

      <div
        style={{
          opacity: cardEnter,
          transform: `translateY(${tx}px)`,
          marginLeft: "auto",
          marginRight: "auto",
          marginTop: 60,
          maxWidth: 800,
          backgroundColor: b.palette.surface,
          border: `2px solid ${b.palette.ink}`,
          borderRadius: 8,
          padding: 48,
          fontSize: 24,
          lineHeight: 1.6,
        }}
      >
        <p style={{ marginBottom: 24 }}>
          Need a new data source? A different report section? An integration with your closing software?
        </p>
        <p style={{ marginBottom: 32 }}>
          Email <strong>alex@cliros.ai</strong> — that&apos;s our founder&apos;s direct inbox.
        </p>
        <p style={{ fontSize: 20, opacity: 0.7, fontStyle: "italic" }}>
          We&apos;re building Cliros around what closing attorneys actually need. Your firm&apos;s requirements shape our roadmap.
        </p>
      </div>
    </AbsoluteFill>
  );
};

/* ──────────────────────── Scene 5: Closing card ──────────────────────── */

const SceneClose: React.FC<{ b: ReturnType<typeof resolveBrand>; start: number }> = ({ b, start }) => {
  const frame = useCurrentFrame();
  const fps = 30;
  const local = frame - start;
  const op = fadeIn(local, 0, 30);
  const seal = spring({ frame: local - 30, fps, config: { damping: 14, stiffness: 90 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: b.palette.bg,
        opacity: op,
        fontFamily: b.type.body,
        color: b.palette.ink,
        padding: 80,
      }}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 40,
        }}
      >
        {/* Simplified Cliros courthouse mark — drawn inline so no external asset deps */}
        <svg width={220} height={220} viewBox="0 0 360 380" style={{ transform: `scale(${seal})` }}>
          <g fill={b.palette.ink}>
            <polygon points="180,0 0,72 360,72"/>
            <polygon points="180,16 24,80 336,80" fill={b.palette.bg}/>
            <polygon points="180,28 36,84 324,84"/>
            <g transform="translate(180, 56)">
              <polygon points="0,-14 4,-4 14,-4 6,3 9,13 0,7 -9,13 -6,3 -14,-4 -4,-4" fill={b.palette.bg}/>
            </g>
            <rect x="0" y="84" width="360" height="6"/>
            <rect x="6" y="92" width="348" height="3"/>
            <rect x="0" y="116" width="360" height="3"/>
            <rect x="44" y="122" width="52" height="6"/>
            <polygon points="50,128 90,128 84,140 56,140"/>
            <rect x="264" y="122" width="52" height="6"/>
            <polygon points="270,128 310,128 304,140 276,140"/>
            <rect x="56" y="140" width="28" height="160"/>
            <rect x="276" y="140" width="28" height="160"/>
            <polygon points="56,300 84,300 90,312 50,312"/>
            <rect x="44" y="312" width="52" height="6"/>
            <polygon points="276,300 304,300 310,312 270,312"/>
            <rect x="264" y="312" width="52" height="6"/>
            <rect x="20" y="320" width="320" height="6"/>
            <rect x="10" y="328" width="340" height="6"/>
            <rect x="0" y="336" width="360" height="8"/>
          </g>
        </svg>
        <div
          style={{
            fontFamily: b.type.display,
            fontSize: 96,
            letterSpacing: 8,
            fontWeight: 400,
            marginTop: 20,
          }}
        >
          CLIROS
        </div>
        <div
          style={{
            fontSize: 24,
            letterSpacing: 4,
            opacity: 0.7,
            textTransform: "uppercase",
          }}
        >
          Property Title Search Reports
        </div>
        <div
          style={{
            fontSize: 20,
            opacity: 0.6,
            fontStyle: "italic",
            marginTop: 8,
          }}
        >
          State of Georgia · Attorney-grade · Delivered in minutes
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ──────────────────────── Root composition ──────────────────────── */

/* Root composition: render scenes side-by-side conditionally based on
 * the global frame. Avoids the Sequence-shifts-local-frame gotcha where
 * children's useCurrentFrame() returns sequence-relative time and our
 * `local = frame - start` math goes negative. */
export const ClirosWelcome: React.FC<ClirosWelcomeProps> = ({ brand }) => {
  const b = resolveBrand(brand || "cliros");
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: b.palette.bg }}>
      {frame < 180 && <SceneTrialUsed b={b} />}
      {frame >= 180 && frame < 540 && <ScenePacks b={b} start={180} />}
      {frame >= 540 && frame < 900 && <SceneCredits b={b} start={540} />}
      {frame >= 900 && frame < 1380 && <SceneFeedback b={b} start={900} />}
      {frame >= 1380 && <SceneClose b={b} start={1380} />}
    </AbsoluteFill>
  );
};

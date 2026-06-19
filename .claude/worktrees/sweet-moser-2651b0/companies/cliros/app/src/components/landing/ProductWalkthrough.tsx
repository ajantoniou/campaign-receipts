"use client";

/* ─── Cliros product walkthrough animation ───────────────────────────────────
 *  The end-to-end story, in stylized CSS/SVG mockups (no screenshots, no
 *  framer-motion — pure keyframes + a tiny step state machine):
 *    1. Type an address        4. Flip through each doc with a big overlay
 *    2. Watch it process       5. Download the raw ZIP
 *    3. Land on the dashboard   6. Ask Haiku to edit → files update → ✓ Complete
 *
 *  Two modes:
 *    mode="auto"   — home-hero teaser: self-advancing loop (setInterval).
 *    mode="scroll" — /how-it-works: each step advances as it scrolls into view.
 *  Respects prefers-reduced-motion (renders the final frame of every step, no
 *  motion). Brand: paper + ink + gold rule + one Georgia-orange pop.
 * ------------------------------------------------------------------------- */

import { useEffect, useRef, useState } from "react";

/* ── Brand-locked inline icons (stroke/fill via currentColor + tokens, so weight
 *  and color match the paper+ink+gold system — never platform emoji) ── */
function IPin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}
function IDoc({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M8.5 13h7M8.5 16.5h7" />
    </svg>
  );
}
function ICheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}
function IZip({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 3v2.5h2V8h-2v2.5h2V13h-2v2.5h2" />
      <rect x="10" y="15.5" width="4" height="3.5" rx="0.6" />
    </svg>
  );
}

const STEPS = [
  { key: "address", n: "01", title: "Enter the address", dwell: 4200, blurb: "Type the property. Cliros pulls the GSCCCA + federal-court records — no account juggling, no portals." },
  { key: "process", n: "02", title: "It runs the search", dwell: 4000, blurb: "Chain of title, liens, defects, and a draft B7-2-06 opinion — assembled while you do something else." },
  { key: "dashboard", n: "03", title: "Your closing dossier", dwell: 3600, blurb: "Come back to every document in one place: the AOL, the curative action plan, the client summary." },
  { key: "flip", n: "04", title: "Know what each one is", dwell: 4000, blurb: "Flip through every document with a plain-English overlay — what it says and what to do with it." },
  { key: "zip", n: "05", title: "Download the whole file", dwell: 3600, blurb: "One ZIP with every raw document and generated letter, ready for the closing file." },
  { key: "chat", n: "06", title: "Edit by just asking", dwell: 5600, blurb: "Tell the assistant what to change. You approve; the files update. End-to-end prep in under five minutes." },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export default function ProductWalkthrough({
  mode = "scroll",
  className = "",
}: {
  mode?: "auto" | "scroll";
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();

  // auto mode: self-advancing loop with per-step dwell. Pauses on hover/focus
  // (WCAG 2.2.2 — give readers time on the longer steps, esp. the chat beat).
  useEffect(() => {
    if (mode !== "auto" || reduced || paused) return;
    const t = setTimeout(
      () => setActive((a) => (a + 1) % STEPS.length),
      STEPS[active].dwell,
    );
    return () => clearTimeout(t);
  }, [mode, reduced, paused, active]);

  if (mode === "auto") {
    return (
      <div
        className={`cw-root ${className}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <DeviceFrame>
          <Stage step={STEPS[active].key} animate={!reduced} />
        </DeviceFrame>
        <div className="cw-dots" role="group" aria-label="Walkthrough steps — hover to pause">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              aria-label={`Go to step ${s.n}: ${s.title}`}
              aria-current={i === active ? "true" : undefined}
              className={`cw-dot ${i === active ? "is-on" : ""}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
        <p className="cw-caption">
          <span className="cw-caption-step">{STEPS[active].n}</span> {STEPS[active].title}
        </p>
        <Styles />
      </div>
    );
  }

  // scroll mode: each step is its own row; the mockup advances as it enters view.
  return (
    <div className={`cw-root cw-scroll ${className}`}>
      {STEPS.map((s) => (
        <ScrollStep key={s.key} step={s} reduced={reduced} />
      ))}
      <Styles />
    </div>
  );
}

function ScrollStep({
  step,
  reduced,
}: {
  step: (typeof STEPS)[number];
  reduced: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(reduced);
  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div ref={ref} className={`cw-srow ${shown ? "is-shown" : ""}`}>
      <div className="cw-scopy">
        <div className="cw-eyebrow">Step {step.n}</div>
        <h3 className="cw-stitle">{step.title}</h3>
        <p className="cw-sblurb">{step.blurb}</p>
      </div>
      <div className="cw-sframe">
        <DeviceFrame>
          <Stage step={step.key} animate={shown && !reduced} />
        </DeviceFrame>
      </div>
    </div>
  );
}

/* ── Browser-chrome device frame ── */
function DeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="cw-device">
      <div className="cw-chrome">
        <span className="cw-traffic" />
        <span className="cw-traffic" />
        <span className="cw-traffic" />
        <span className="cw-url">cliros.ai</span>
      </div>
      <div className="cw-screen">{children}</div>
    </div>
  );
}

/* ── The per-step mockup stage ── */
function Stage({ step, animate }: { step: StepKey; animate: boolean }) {
  const a = animate ? "cw-anim" : "";
  switch (step) {
    case "address":
      return (
        <div className={`cw-stage ${a}`}>
          <div className="cw-label">Start a title search</div>
          <div className="cw-input">
            <IPin className="cw-pin" />
            <span className="cw-typed">1394 Peachtree Battle Ave NW, Atlanta, GA</span>
            <span className="cw-caret" />
          </div>
          <div className="cw-ac">
            <div className="cw-ac-row is-hot">1394 Peachtree Battle Ave NW, Atlanta, GA 30327</div>
            <div className="cw-ac-row">1394 Peachtree Battle Ave NE, Atlanta, GA 30309</div>
          </div>
          <button className="cw-cta">Run search →</button>
        </div>
      );
    case "process":
      return (
        <div className={`cw-stage ${a}`}>
          <div className="cw-label">Building the closing dossier…</div>
          {[
            "Searching GSCCCA + federal courts",
            "Building chain of title",
            "Reconciling liens",
            "Flagging title defects",
            "Drafting the B7-2-06 opinion",
          ].map((t, i) => (
            <div className="cw-prow" key={t} style={{ ["--i" as string]: String(i) }}>
              <span className="cw-check"><ICheck className="cw-check-svg" /></span>
              <span className="cw-ptext">{t}</span>
              <span className="cw-pbar"><span className="cw-pfill" /></span>
            </div>
          ))}
        </div>
      );
    case "dashboard":
      return (
        <div className={`cw-stage ${a}`}>
          <div className="cw-label">1394 Peachtree Battle Ave — ready</div>
          <div className="cw-grid">
            {[
              ["Attorney Opinion Letter", "B7-2-06 draft"],
              ["Curative action plan", "6 items"],
              ["Client summary", "Plain-English"],
              ["Chain of title", "4 conveyances"],
              ["Lien schedule", "3 active"],
              ["Raw documents", "ZIP"],
            ].map(([t, s], i) => (
              <div className="cw-card" key={t} style={{ ["--i" as string]: String(i) }}>
                <IDoc className="cw-card-doc" />
                <span className="cw-card-t">{t}</span>
                <span className="cw-card-s">{s}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "flip":
      return (
        <div className={`cw-stage ${a}`}>
          <div className="cw-flipwrap">
            <div className="cw-page cw-page-3" />
            <div className="cw-page cw-page-2" />
            <div className="cw-page cw-page-1">
              <div className="cw-page-h" />
              <div className="cw-page-l" />
              <div className="cw-page-l short" />
              <div className="cw-page-l" />
            </div>
            <div className="cw-overlay">
              <div className="cw-ov-tag">What this is</div>
              <div className="cw-ov-title">Attorney Opinion Letter</div>
              <div className="cw-ov-body">
                Your Fannie&nbsp;Mae B7-2-06 draft. Review it, pull the cited deed images, and adopt it
                under your bar number.
              </div>
            </div>
          </div>
        </div>
      );
    case "zip":
      return (
        <div className={`cw-stage cw-zipstage ${a}`}>
          <div className="cw-zip">
            <div className="cw-zip-ico"><IZip className="cw-zip-ico-svg" /></div>
            <div className="cw-zip-name">Peachtree-Battle-closing.zip</div>
            <div className="cw-zip-meta">AOL · action plan · client summary · raw deeds &amp; liens</div>
            <div className="cw-zip-bar"><span className="cw-zip-fill" /></div>
            <button className="cw-cta cw-zip-cta">Download ZIP ↓</button>
          </div>
        </div>
      );
    case "chat":
      return (
        <div className={`cw-stage ${a}`}>
          <div className="cw-chat">
            <div className="cw-msg cw-msg-user">
              Fix the client summary to include both Mr. and Mrs. Stamford, and add a disclaimer to the
              AOL that the opinion is limited to documents sourced through the Georgia county court records.
            </div>
            <div className="cw-msg cw-msg-ai">
              Proposed two edits — client summary now names both owners; AOL adds the
              Georgia-records scope disclaimer. <span className="cw-mini">Review &amp; approve →</span>
            </div>
            <div className="cw-applied">
              <span className="cw-applied-ico">✓</span> Complete — both files updated
            </div>
          </div>
        </div>
      );
  }
}

/* ── prefers-reduced-motion hook ── */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

/* ── Scoped styles (brand tokens from globals.css) ── */
function Styles() {
  return (
    <style jsx global>{`
      .cw-root { --cw-ease: cubic-bezier(0.22, 1, 0.36, 1); }
      .cw-device {
        border-radius: 12px; overflow: hidden;
        background: #FFFDF7;
        border: 1px solid var(--paper-edge);
        box-shadow: 0 1px 0 rgba(176,135,64,0.10), 0 24px 60px -28px rgba(11,11,12,0.30);
      }
      .cw-chrome {
        display: flex; align-items: center; gap: 6px;
        padding: 9px 12px; background: var(--paper-deep);
        border-bottom: 1px solid var(--paper-edge);
      }
      .cw-traffic { width: 9px; height: 9px; border-radius: 50%; background: var(--gold-foil); opacity: 0.7; }
      .cw-traffic:nth-child(2) { opacity: 0.45; }
      .cw-traffic:nth-child(3) { opacity: 0.3; }
      .cw-url {
        margin-left: 10px; font-size: 11px; letter-spacing: 0.04em;
        color: var(--ink-muted); font-family: ui-monospace, monospace;
      }
      .cw-screen { position: relative; height: 320px; background: var(--paper); overflow: hidden; }
      .cw-stage { position: absolute; inset: 0; padding: 22px 24px; display: flex; flex-direction: column; }
      .cw-label {
        font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;
        color: var(--ink-muted); margin-bottom: 14px;
      }

      /* step 1 — address */
      .cw-input {
        display: flex; align-items: center; gap: 8px;
        border: 1px solid var(--gold); border-radius: 6px; background: #FFFDF7;
        padding: 12px 14px; font-size: 14px; color: var(--ink);
      }
      .cw-pin { width: 16px; height: 16px; color: var(--orange-ga); flex: none; }
      .cw-anim .cw-typed {
        display: inline-block; white-space: nowrap; overflow: hidden;
        animation: cw-type 1.9s steps(42, end) forwards; max-width: 0;
      }
      .cw-caret {
        width: 1.5px; height: 16px; background: var(--ink);
        animation: cw-blink 1s steps(1) infinite;
      }
      .cw-ac { margin-top: 8px; border: 1px solid var(--paper-edge); border-radius: 6px; overflow: hidden; background: #FFFDF7; }
      .cw-ac-row { padding: 9px 12px; font-size: 12.5px; color: var(--ink-soft); border-bottom: 1px solid var(--paper-edge); }
      .cw-ac-row:last-child { border-bottom: 0; }
      .cw-ac-row.is-hot { background: rgba(176,135,64,0.10); }
      .cw-cta {
        margin-top: auto; align-self: flex-start;
        background: var(--orange-ga); color: #FFFDF7; border: 0; cursor: default;
        padding: 10px 18px; border-radius: 5px; font-size: 13px; font-weight: 600;
        letter-spacing: 0.03em;
      }
      .cw-anim .cw-cta { animation: cw-pop 0.5s var(--cw-ease) 2.1s both; }

      /* step 2 — process */
      .cw-prow { display: flex; align-items: center; gap: 10px; margin-bottom: 11px; opacity: 1; }
      .cw-anim .cw-prow { opacity: 0; animation: cw-fade 0.4s var(--cw-ease) forwards; animation-delay: calc(var(--i) * 0.5s); }
      .cw-check {
        width: 18px; height: 18px; border-radius: 50%; flex: none;
        display: grid; place-items: center;
        background: var(--gold); color: #FFFDF7;
      }
      .cw-check-svg { width: 11px; height: 11px; }
      .cw-ptext { font-size: 13px; color: var(--ink-soft); flex: 1; }
      .cw-pbar { width: 64px; height: 5px; border-radius: 3px; background: var(--paper-edge); overflow: hidden; }
      .cw-pfill { display: block; height: 100%; width: 100%; background: var(--gold); transform-origin: left;
        transform: scaleX(1); }
      .cw-anim .cw-pfill { transform: scaleX(0); animation: cw-fill 0.5s var(--cw-ease) forwards; animation-delay: calc(var(--i) * 0.5s + 0.1s); }

      /* step 3 — dashboard grid */
      .cw-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .cw-card {
        border: 1px solid var(--paper-edge); border-radius: 8px; background: #FFFDF7;
        padding: 12px; display: flex; flex-direction: column; gap: 3px; min-height: 78px;
      }
      .cw-anim .cw-card { opacity: 0; transform: translateY(10px); animation: cw-cardin 0.45s var(--cw-ease) forwards; animation-delay: calc(var(--i) * 0.09s); }
      .cw-card-doc { width: 18px; height: 18px; color: var(--gold-deep); }
      .cw-card-t { font-size: 12.5px; font-weight: 600; color: var(--ink); line-height: 1.25; }
      .cw-card-s { font-size: 11px; color: var(--ink-muted); }

      /* step 4 — flip + overlay */
      .cw-flipwrap { position: relative; flex: 1; display: grid; place-items: center; }
      .cw-page {
        position: absolute; width: 150px; height: 200px; border-radius: 6px;
        background: #FFFDF7; border: 1px solid var(--paper-edge);
        box-shadow: 0 12px 30px -16px rgba(11,11,12,0.3);
      }
      .cw-page-3 { transform: translate(26px, -10px) rotate(6deg); opacity: 0.5; }
      .cw-page-2 { transform: translate(13px, -4px) rotate(3deg); opacity: 0.75; }
      .cw-page-1 { transform: translate(0,0) rotate(0deg); padding: 16px; }
      .cw-anim .cw-page-1 { animation: cw-flip 0.7s var(--cw-ease); }
      .cw-page-h { height: 10px; width: 70%; background: var(--gold); border-radius: 2px; margin-bottom: 12px; }
      .cw-page-l { height: 6px; background: var(--paper-edge); border-radius: 2px; margin-bottom: 8px; }
      .cw-page-l.short { width: 60%; }
      .cw-overlay {
        position: absolute; right: 8px; bottom: 6px; width: 60%;
        background: var(--ink); color: var(--paper);
        border-radius: 8px; padding: 12px 14px;
        box-shadow: 0 18px 40px -20px rgba(11,11,12,0.6);
      }
      .cw-anim .cw-overlay { animation: cw-cardin 0.5s var(--cw-ease) 0.4s both; }
      .cw-ov-tag { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold-foil); }
      .cw-ov-title { font-size: 14px; font-weight: 700; margin: 3px 0 5px; }
      .cw-ov-body { font-size: 11.5px; line-height: 1.45; color: rgba(239,231,214,0.82); }

      /* step 5 — zip */
      .cw-zipstage { align-items: center; justify-content: center; }
      .cw-zip {
        width: 260px; text-align: center; border: 1px solid var(--paper-edge);
        border-radius: 12px; background: #FFFDF7; padding: 22px 20px;
        box-shadow: 0 18px 44px -24px rgba(11,11,12,0.3);
      }
      .cw-zip-ico { display: grid; place-items: center; }
      .cw-zip-ico-svg { width: 34px; height: 34px; color: var(--gold-deep); }
      .cw-zip-name { margin-top: 8px; font-size: 14px; font-weight: 700; color: var(--ink); }
      .cw-zip-meta { margin-top: 4px; font-size: 11px; color: var(--ink-muted); }
      .cw-zip-bar { margin: 14px auto 0; width: 80%; height: 6px; border-radius: 3px; background: var(--paper-edge); overflow: hidden; }
      .cw-zip-fill { display: block; height: 100%; width: 100%; background: var(--gold); transform-origin: left; transform: scaleX(1); }
      .cw-anim .cw-zip-fill { transform: scaleX(0); animation: cw-fill 1.1s var(--cw-ease) 0.2s forwards; }
      .cw-zip-cta { margin: 16px auto 0; cursor: default; }
      .cw-anim .cw-zip-cta { animation: cw-pop 0.5s var(--cw-ease) 1.2s both; }

      /* step 6 — chat */
      .cw-chat { display: flex; flex-direction: column; gap: 10px; }
      .cw-msg { border-radius: 10px; padding: 11px 13px; font-size: 12.5px; line-height: 1.5; max-width: 92%; }
      .cw-msg-user { align-self: flex-end; background: var(--ink); color: var(--paper); }
      .cw-msg-ai { align-self: flex-start; background: #FFFDF7; border: 1px solid var(--paper-edge); color: var(--ink-soft); }
      .cw-mini { color: var(--gold-deep); font-weight: 600; }
      .cw-anim .cw-msg-user { animation: cw-cardin 0.4s var(--cw-ease) 0.1s both; }
      .cw-anim .cw-msg-ai { animation: cw-cardin 0.4s var(--cw-ease) 0.8s both; }
      .cw-applied {
        align-self: flex-start; display: inline-flex; align-items: center; gap: 7px;
        background: #1B7A4B; color: #EAFBF1; border-radius: 999px;
        padding: 7px 14px; font-size: 12px; font-weight: 700;
      }
      .cw-applied-ico { display: grid; place-items: center; width: 16px; height: 16px; }
      .cw-anim .cw-applied { animation: cw-pop 0.5s var(--cw-ease) 1.7s both; }

      /* auto-mode caption + dots */
      .cw-dots { display: flex; gap: 7px; justify-content: center; margin-top: 16px; }
      .cw-dot { width: 7px; height: 7px; border-radius: 50%; border: 0; padding: 0; cursor: pointer;
        background: var(--paper-edge); transition: all 0.3s var(--cw-ease); }
      .cw-dot.is-on { background: var(--orange-ga); width: 22px; border-radius: 4px; }
      .cw-caption { text-align: center; margin-top: 10px; font-size: 13.5px; color: var(--ink-soft); }
      .cw-caption-step { color: var(--gold-deep); font-weight: 700; font-variant-numeric: tabular-nums; }

      /* scroll mode layout */
      .cw-scroll { display: flex; flex-direction: column; gap: 64px; }
      .cw-srow { display: grid; grid-template-columns: 1fr; gap: 22px; opacity: 0; transform: translateY(28px);
        transition: opacity 0.7s var(--cw-ease), transform 0.7s var(--cw-ease); }
      .cw-srow.is-shown { opacity: 1; transform: none; }
      @media (min-width: 860px) {
        .cw-srow { grid-template-columns: 0.85fr 1.15fr; align-items: center; gap: 48px; }
        .cw-srow:nth-child(even) .cw-scopy { order: 2; }
      }
      .cw-eyebrow { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold-deep); font-weight: 700; }
      .cw-stitle { font-size: 26px; line-height: 1.15; color: var(--ink); margin: 8px 0 10px; font-weight: 600; letter-spacing: -0.01em; }
      .cw-sblurb { font-size: 15px; line-height: 1.6; color: var(--ink-muted); max-width: 38ch; }

      @keyframes cw-type { from { max-width: 0; } to { max-width: 100%; } }
      @keyframes cw-blink { 50% { opacity: 0; } }
      @keyframes cw-pop { 0% { opacity: 0; transform: scale(0.92); } 100% { opacity: 1; transform: scale(1); } }
      @keyframes cw-fade { to { opacity: 1; } }
      @keyframes cw-fill { to { transform: scaleX(1); } }
      @keyframes cw-cardin { to { opacity: 1; transform: none; } }
      @keyframes cw-flip {
        0% { transform: rotateY(-38deg) translateX(8px); opacity: 0.4; transform-origin: left; }
        100% { transform: rotateY(0) translateX(0); opacity: 1; }
      }

      @media (prefers-reduced-motion: reduce) {
        .cw-anim * { animation: none !important; }
        .cw-anim .cw-typed { max-width: 100% !important; }
        .cw-anim .cw-prow, .cw-anim .cw-card, .cw-anim .cw-overlay,
        .cw-anim .cw-msg-user, .cw-anim .cw-msg-ai, .cw-anim .cw-applied,
        .cw-anim .cw-cta, .cw-anim .cw-zip-cta { opacity: 1 !important; transform: none !important; }
        .cw-anim .cw-pfill, .cw-anim .cw-zip-fill { transform: scaleX(1) !important; }
        .cw-caret { display: none; }
      }
    `}</style>
  );
}

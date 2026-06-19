/* ─── Cliros Logo Component (brand refresh 2026-05-24) ─── */

import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "white";
  /** Set false when Logo is inside a parent Link (avoids nested anchors) */
  linked?: boolean;
}

const widths = {
  sm: 108,
  md: 140,
  lg: 180,
};

export default function Logo({
  size = "md",
  variant = "default",
  linked = true,
}: LogoProps) {
  const w = widths[size];
  const src = variant === "white" ? "/logo-white.svg" : "/logo.svg";
  // logo.svg viewBox is 180x40 → aspect ratio ~4.5:1
  const h = Math.round((w / 180) * 40);

  const inner = (
    <Image
      src={src}
      alt="Cliros"
      width={w}
      height={h}
      priority
      className="block h-auto w-auto"
      style={{ width: `${w}px`, height: `${h}px` }}
    />
  );

  if (!linked) return <span className="inline-flex items-center">{inner}</span>;
  return (
    <a href="/" className="inline-flex items-center" aria-label="Cliros">
      {inner}
    </a>
  );
}

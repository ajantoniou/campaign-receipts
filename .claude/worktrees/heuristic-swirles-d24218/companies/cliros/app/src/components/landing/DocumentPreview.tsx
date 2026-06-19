/* Mock deliverable PDFs for landing — attorney-desk aesthetic */

type Variant = "title" | "aol" | "vault";

const configs: Record<
  Variant,
  { label: string; title: string; badge: string; lines: string[]; accent: string }
> = {
  title: {
    label: "Deliverable 01",
    title: "Title Search Report",
    badge: "Client-facing",
    lines: [
      "50-year chain of title",
      "Liens, easements & defects",
      "Risk score + panel review",
      "Homeowner summary PDF",
    ],
    accent: "#1A1A2E",
  },
  aol: {
    label: "Deliverable 02",
    title: "Attorney Opinion Letter",
    badge: "Fannie Mae B7-2-06",
    lines: [
      "Examining attorney certification",
      "Marketability & encumbrance opinion",
      "Pre-filled from search findings",
      "Your bar # — your signature",
    ],
    accent: "#8B6914",
  },
  vault: {
    label: "Deliverable 03",
    title: "Raw Records Vault",
    badge: "Source documents",
    lines: [
      "GSCCCA deed & lien index",
      "Federal court hits",
      "Permit & parcel data",
      "Download for underwriting",
    ],
    accent: "#5C5C5C",
  },
};

export default function DocumentPreview({
  variant,
  className = "",
  tilt = 0,
}: {
  variant: Variant;
  className?: string;
  tilt?: number;
}) {
  const c = configs[variant];
  return (
    <div
      className={`landing-doc-paper ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="flex items-start justify-between gap-2 border-b border-[var(--landing-border)] pb-3 mb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--landing-muted)]">
            {c.label}
          </p>
          <h4 className="mt-1 text-[15px] font-semibold text-[var(--landing-ink)] leading-tight">
            {c.title}
          </h4>
        </div>
        <span
          className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded"
          style={{ backgroundColor: `${c.accent}12`, color: c.accent }}
        >
          {c.badge}
        </span>
      </div>
      <ul className="space-y-1.5">
        {c.lines.map((line) => (
          <li key={line} className="flex items-start gap-2 text-[11px] text-[var(--landing-muted)] leading-snug">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--landing-accent)] shrink-0" />
            {line}
          </li>
        ))}
      </ul>
      {variant === "aol" && (
        <div className="mt-4 pt-3 border-t border-dashed border-[var(--landing-border)] flex items-center justify-between">
          <span className="text-[9px] text-[var(--landing-muted)] uppercase tracking-widest">
            Schedule B7-2-06
          </span>
          <span className="landing-aol-stamp text-[10px] font-bold uppercase tracking-wider text-[#8B6914] border-2 border-[#8B6914]/40 px-2 py-0.5 rounded">
            Approved form
          </span>
        </div>
      )}
    </div>
  );
}

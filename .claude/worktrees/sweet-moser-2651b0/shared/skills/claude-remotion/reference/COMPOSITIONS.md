# Composition catalog — full prop schemas

All props are JSON-serializable so they can be passed via
`--props='<json>'` on the CLI.

All compositions accept an optional `brand` prop:
`"sealed" | "campaign-receipts" | "nt-ministry" | "estimateproof"`.
Defaults to `"sealed"`.

---

## CountUp

Animated number that counts from `from` (default 0) to `to` with easing.

```ts
type CountUpProps = {
  brand?: string;
  from?: number;                 // default 0
  to: number;                    // REQUIRED
  prefix?: string;               // e.g. "$"
  suffix?: string;               // e.g. "M" or "%"
  label?: string;                // headline above the number
  caption?: string;              // subline below
  decimals?: number;             // default 0
  easing?: "out" | "linear" | "inOut";  // default "out"
};
```

Example:
```json
{
  "to": 82000000,
  "prefix": "$",
  "label": "ADELSON, 2016 CYCLE",
  "caption": "Republican-aligned committees (FEC)"
}
```

---

## MoneyFlow

Source amount → multiple destinations with animated arrows.

```ts
type MoneyFlowProps = {
  brand?: string;
  title?: string;                // top-of-frame eyebrow
  source: {
    name: string;                // "Adelson"
    amount: number;              // 82000000
    sublabel?: string;
  };
  destinations: Array<{
    label: string;
    amount?: number;
    outcome?: string;            // "EO May 2018" — small uppercase tag
  }>;
  prefix?: string;               // "$" (default)
  abbreviate?: boolean;          // true → "$82M" instead of "$82,000,000"
};
```

Best with 2–5 destinations. More than 5 → use `Timeline` instead.

---

## Timeline

Horizontal timeline; events animate in sequentially.

```ts
type TimelineProps = {
  brand?: string;
  title?: string;
  events: Array<{
    date: string;                // "Jan 2017"
    label: string;
    outcome?: "kept" | "partial" | "broken" | "reader" | string;
  }>;
};
```

`outcome` drives the dot color + stamp tag:
- `kept` → civic-blue
- `broken` → civic-red
- `partial` → gold
- `reader` → grey (reader-call / awaiting verification)

Best with 3–6 events. Alternates above/below the timeline line.

---

## VerdictStamp

Stamp drops onto frame with rotation + impact shake.

```ts
type VerdictStampProps = {
  brand?: string;
  verdict: "KEPT" | "PARTIAL" | "BROKEN" | "READER" | string;
  promise?: string;              // headline above the stamp
  citation?: string;             // small line below
  rotationDeg?: number;          // default -8
};
```

Impact happens at ~28% of duration. Camera shake lasts 12 frames after.

---

## ChartBar

Animated bar chart; bars fill bar-by-bar with labeled values.

```ts
type ChartBarProps = {
  brand?: string;
  title?: string;
  bars: Array<{
    label: string;
    value: number;
    prefix?: string;             // "$"
    suffix?: string;             // "M"
    color?: string;              // hex override; else alternates brand colors
  }>;
  yAxisLabel?: string;
  maxValue?: number;             // default = max of values
};
```

Best with 3–6 bars.

---

## SourceCard

Parchment citation card with quote + page reference.

```ts
type SourceCardProps = {
  brand?: string;
  citation: string;              // REQUIRED — "Heilbrunn (2008)"
  page?: string;                 // "p. 142"
  quote: string;                 // REQUIRED — pull-quote body
  source?: string;               // book / outlet name
  url?: string;
};
```

Renders a corner "SOURCE" stamp + accent quote-mark. Uses brand
parchment surface (sealed / campaign-receipts) by default.

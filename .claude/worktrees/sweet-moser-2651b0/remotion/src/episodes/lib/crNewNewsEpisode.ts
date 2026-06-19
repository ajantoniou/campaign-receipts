import { CountUp } from "../../compositions/CountUp";
import { ChartBar } from "../../compositions/ChartBar";
import { MoneyFlow } from "../../compositions/MoneyFlow";
import { SourceCard } from "../../compositions/SourceCard";
import { Timeline } from "../../compositions/Timeline";
import { VerdictStamp } from "../../compositions/VerdictStamp";
import type { EpisodeDefinition } from "../lib/types";
import { CR_DURATION, CR_FPS, CR_H, CR_W, crBrand } from "../lib/crDefaults";

/** CR new-news standard Remotion set — copy per episode folder; never share Root defaultProps. */
export function crNewNewsEpisode(
  slug: string,
  opts: { includeSourceCard?: boolean } = {},
): EpisodeDefinition {
  const { includeSourceCard = true } = opts;
  const names = [
    "CountUp",
    "ChartBar",
    "MoneyFlow",
    ...(includeSourceCard ? ["SourceCard"] as const : []),
    "Timeline",
    "VerdictStamp",
  ] as const;

  const compositions = [
    {
      name: "CountUp",
      component: CountUp,
      durationInFrames: CR_DURATION,
      fps: CR_FPS,
      width: CR_W,
      height: CR_H,
      defaultProps: {
        brand: crBrand,
        from: 0,
        to: 0,
        prefix: "$",
        suffix: "",
        label: "",
        caption: "",
        easing: "out" as const,
      },
    },
    {
      name: "ChartBar",
      component: ChartBar,
      durationInFrames: CR_DURATION,
      fps: CR_FPS,
      width: CR_W,
      height: CR_H,
      defaultProps: {
        brand: crBrand,
        title: "",
        yAxisLabel: "",
        bars: [],
      },
    },
    {
      name: "MoneyFlow",
      component: MoneyFlow,
      durationInFrames: CR_DURATION,
      fps: CR_FPS,
      width: CR_W,
      height: CR_H,
      defaultProps: {
        brand: crBrand,
        title: "",
        source: { name: "", amount: 0, sublabel: "" },
        destinations: [],
      },
    },
    ...(includeSourceCard
      ? [{
          name: "SourceCard",
          component: SourceCard,
          durationInFrames: CR_DURATION,
          fps: CR_FPS,
          width: CR_W,
          height: CR_H,
          defaultProps: {
            brand: crBrand,
            citation: "",
            page: "",
            quote: "",
            source: "",
            url: "",
          },
        }]
      : []),
    {
      name: "Timeline",
      component: Timeline,
      durationInFrames: CR_DURATION,
      fps: CR_FPS,
      width: CR_W,
      height: CR_H,
      defaultProps: {
        brand: crBrand,
        title: "",
        events: [],
      },
    },
    {
      name: "VerdictStamp",
      component: VerdictStamp,
      durationInFrames: CR_DURATION,
      fps: CR_FPS,
      width: CR_W,
      height: CR_H,
      defaultProps: {
        brand: crBrand,
        verdict: "RECEIPT",
        promise: "",
        citation: "",
        rotationDeg: -8,
        candidates: [],
      },
    },
  ];

  return {
    slug,
    program: "campaign-receipts",
    compositionNames: names,
    compositions,
  };
}

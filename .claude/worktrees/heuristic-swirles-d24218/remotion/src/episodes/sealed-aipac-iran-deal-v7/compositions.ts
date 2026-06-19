import { CountUp } from "../../compositions/CountUp";
import { ChartBar } from "../../compositions/ChartBar";
import { DonorComparison } from "../../compositions/DonorComparison";
import { MoneyFlow } from "../../compositions/MoneyFlow";
import { PoliticalMap } from "../../compositions/PoliticalMap";
import { SourceCard } from "../../compositions/SourceCard";
import { Timeline } from "../../compositions/Timeline";
import { VerdictStamp } from "../../compositions/VerdictStamp";
import type { EpisodeDefinition } from "../lib/types";

const FPS = 30;
const W = 1280;
const H = 720;
const DUR = FPS * 60;

export const slug = "sealed-aipac-iran-deal-v7";

export const compositionNames = [
  "PoliticalMap",
  "ChartBar",
  "SourceCard",
  "MoneyFlow",
  "Timeline",
  "CountUp",
  "DonorComparison",
  "VerdictStamp",
] as const;

export const episode: EpisodeDefinition = {
  slug,
  program: "sealed",
  compositionNames,
  compositions: [
    {
      name: "PoliticalMap",
      component: PoliticalMap,
      durationInFrames: FPS * 15,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {
        brand: "sealed",
        region: "jcpoa" as const,
        title: "",
        subtitle: "",
        markers: [],
      },
    },
    {
      name: "ChartBar",
      component: ChartBar,
      durationInFrames: DUR,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {
        brand: "sealed",
        title: "",
        yAxisLabel: "URANIUM ENRICHMENT %",
        bars: [],
      },
    },
    {
      name: "SourceCard",
      component: SourceCard,
      durationInFrames: DUR,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {
        brand: "sealed",
        citation: "",
        page: "",
        quote: "",
        source: "",
        url: "",
      },
    },
    {
      name: "MoneyFlow",
      component: MoneyFlow,
      durationInFrames: DUR,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {
        brand: "sealed",
        title: "",
        source: { name: "", amount: 0, sublabel: "" },
        destinations: [],
      },
    },
    {
      name: "Timeline",
      component: Timeline,
      durationInFrames: DUR,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {
        brand: "sealed",
        title: "",
        events: [],
      },
    },
    {
      name: "CountUp",
      component: CountUp,
      durationInFrames: DUR,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {
        brand: "sealed",
        from: 0,
        to: 0,
        prefix: "$",
        label: "",
        caption: "",
        easing: "out" as const,
      },
    },
    {
      name: "DonorComparison",
      component: DonorComparison,
      durationInFrames: FPS * 15,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {
        brand: "sealed",
        title: "",
        subtitle: "",
        footer: "",
        rows: [],
      },
    },
    {
      name: "VerdictStamp",
      component: VerdictStamp,
      durationInFrames: DUR,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {
        brand: "sealed",
        verdict: "KEPT",
        promise: "",
        citation: "",
        rotationDeg: -8,
      },
    },
  ],
};

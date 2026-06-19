import { ChartBar } from "../../compositions/ChartBar";
import { MoneyFlow } from "../../compositions/MoneyFlow";
import { SourceCard } from "../../compositions/SourceCard";
import { VerdictStamp } from "../../compositions/VerdictStamp";
import type { EpisodeDefinition } from "../lib/types";

const FPS = 30;
const W = 1280;
const H = 720;
const DUR = FPS * 60;

export const slug = "sealed-drain-the-swamp-v1";

export const compositionNames = [
  "VerdictStamp",
  "SourceCard",
  "MoneyFlow",
  "ChartBar",
] as const;

export const episode: EpisodeDefinition = {
  slug,
  program: "sealed",
  compositionNames,
  compositions: [
    {
      name: "VerdictStamp",
      component: VerdictStamp,
      durationInFrames: DUR,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {
        brand: "sealed",
        verdict: "BROKEN",
        promise: "",
        citation: "",
        rotationDeg: -8,
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
      name: "ChartBar",
      component: ChartBar,
      durationInFrames: DUR,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {
        brand: "sealed",
        title: "",
        yAxisLabel: "$ millions",
        bars: [],
      },
    },
  ],
};

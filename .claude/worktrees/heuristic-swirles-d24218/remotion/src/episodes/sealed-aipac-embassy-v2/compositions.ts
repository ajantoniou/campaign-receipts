import { OpeningSlate } from "../../compositions/OpeningSlate";
import { TextSlate } from "../../compositions/TextSlate";
import { Timeline } from "../../compositions/Timeline";
import { SourceCard } from "../../compositions/SourceCard";
import { PoliticalMap } from "../../compositions/PoliticalMap";
import { ChartBar } from "../../compositions/ChartBar";
import { VerdictStamp } from "../../compositions/VerdictStamp";
import { ClosingSlate } from "../../compositions/ClosingSlate";
import type { EpisodeDefinition } from "../lib/types";

const FPS = 30;
const W = 1280;
const H = 720;
const DUR = FPS * 60;

export const slug = "sealed-aipac-embassy-v2";

export const compositionNames = [
  "OpeningSlate",
  "TextSlate",
  "Timeline",
  "SourceCard",
  "PoliticalMap",
  "ChartBar",
  "VerdictStamp",
  "ClosingSlate",
] as const;

export const episode: EpisodeDefinition = {
  slug,
  program: "sealed",
  compositionNames,
  compositions: [
    {
      name: "OpeningSlate",
      component: OpeningSlate,
      durationInFrames: FPS * 6,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {
        brand: "sealed",
        text: "",
        fadeInDelay: 0,
        holdSeconds: 4,
      },
    },
    {
      name: "TextSlate",
      component: TextSlate,
      durationInFrames: DUR,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {
        brand: "sealed",
        text: "",
        variant: "quiet" as const,
        wrapWidth: 28,
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
      name: "PoliticalMap",
      component: PoliticalMap,
      durationInFrames: FPS * 15,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {
        brand: "sealed",
        region: "embassy-move" as const,
        title: "",
        subtitle: "",
        markers: [],
        arrows: [],
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
        yAxisLabel: "",
        maxValue: 0,
        bars: [],
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
    {
      name: "ClosingSlate",
      component: ClosingSlate,
      durationInFrames: FPS * 6,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {
        brand: "sealed",
        name: "",
        detail: "",
      },
    },
  ],
};

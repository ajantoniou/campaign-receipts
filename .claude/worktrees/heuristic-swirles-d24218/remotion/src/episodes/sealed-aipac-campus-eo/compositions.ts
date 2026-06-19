import { OpeningSlate } from "../../compositions/OpeningSlate";
import { TextSlate } from "../../compositions/TextSlate";
import { SourceCard } from "../../compositions/SourceCard";
import { OverturnedLaw } from "../../compositions/OverturnedLaw";
import { Timeline } from "../../compositions/Timeline";
import { CountUp } from "../../compositions/CountUp";
import { VerdictStamp } from "../../compositions/VerdictStamp";
import { ClosingSlate } from "../../compositions/ClosingSlate";
import type { EpisodeDefinition } from "../lib/types";

const FPS = 30;
const W = 1280;
const H = 720;
const DUR = FPS * 60;

export const slug = "sealed-aipac-campus-eo";

export const compositionNames = [
  "OpeningSlate",
  "TextSlate",
  "SourceCard",
  "OverturnedLaw",
  "Timeline",
  "CountUp",
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
      name: "OverturnedLaw",
      component: OverturnedLaw,
      durationInFrames: FPS * 16,
      fps: FPS,
      width: W,
      height: H,
      defaultProps: {
        brand: "sealed",
        oldLawTitle: "",
        oldLawCitations: [],
        newLawTitle: "",
        newLawCitation: "",
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
        label: "",
        caption: "",
        easing: "out" as const,
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

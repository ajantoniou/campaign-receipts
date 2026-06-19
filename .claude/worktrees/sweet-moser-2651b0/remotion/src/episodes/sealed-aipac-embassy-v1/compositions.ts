import { VerdictStamp } from "../../compositions/VerdictStamp";
import type { EpisodeDefinition } from "../lib/types";

const FPS = 30;
const W = 1280;
const H = 720;

export const slug = "sealed-aipac-embassy-v1";

export const compositionNames = ["VerdictStamp"] as const;

export const episode: EpisodeDefinition = {
  slug,
  program: "sealed",
  compositionNames,
  compositions: [
    {
      name: "VerdictStamp",
      component: VerdictStamp,
      durationInFrames: FPS * 60,
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

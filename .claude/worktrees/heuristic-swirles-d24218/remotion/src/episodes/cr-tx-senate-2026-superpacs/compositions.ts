import { crNewNewsEpisode } from "../lib/crNewNewsEpisode";
import { TextSlate } from "../../compositions/TextSlate";
import { DonorComparison } from "../../compositions/DonorComparison";
import { LongformSubscribeOutro } from "../../compositions/LongformSubscribeOutro";
import { CR_DURATION, CR_FPS, CR_H, CR_W, crBrand } from "../lib/crDefaults";
import type { EpisodeDefinition } from "../lib/types";

/**
 * cr-tx-senate-2026-superpacs — CR new-news base set (CountUp, ChartBar,
 * MoneyFlow, SourceCard, Timeline, VerdictStamp) PLUS three extras this
 * episode uses: TextSlate (big-word cards), DonorComparison (voter vs
 * billionaire), LongformSubscribeOutro (cold-close CTA).
 *
 * Per-episode isolation lock (2026-05-23): never share Root defaultProps;
 * each episode owns its composition list.
 */
export const slug = "cr-tx-senate-2026-superpacs";

const base = crNewNewsEpisode(slug);

const extras = [
  {
    name: "TextSlate",
    component: TextSlate,
    durationInFrames: CR_DURATION,
    fps: CR_FPS,
    width: CR_W,
    height: CR_H,
    defaultProps: {
      brand: crBrand,
      text: "",
      variant: "title" as const,
      wrapWidth: 24,
    },
  },
  {
    name: "DonorComparison",
    component: DonorComparison,
    durationInFrames: CR_DURATION,
    fps: CR_FPS,
    width: CR_W,
    height: CR_H,
    defaultProps: {
      brand: crBrand,
      title: "",
      subtitle: "",
      rows: [],
      footer: "",
    },
  },
  {
    name: "LongformSubscribeOutro",
    component: LongformSubscribeOutro,
    durationInFrames: CR_FPS * 15,
    fps: CR_FPS,
    width: CR_W,
    height: CR_H,
    defaultProps: {
      brand: crBrand,
      handle: "@campaignreceipts",
      cta: "Follow the money with us",
      buttonLabel: "SUBSCRIBE",
      newsletterUrl: "campaignreceipts.com/weekly",
    },
  },
];

export const compositionNames = [
  ...base.compositionNames,
  "TextSlate",
  "DonorComparison",
  "LongformSubscribeOutro",
] as const;

export const episode: EpisodeDefinition = {
  slug,
  program: "campaign-receipts",
  compositionNames,
  compositions: [...base.compositions, ...extras],
};

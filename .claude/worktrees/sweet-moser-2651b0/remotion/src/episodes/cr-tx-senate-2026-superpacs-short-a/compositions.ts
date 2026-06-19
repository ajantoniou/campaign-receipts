import { episode as lf } from "../cr-tx-senate-2026-superpacs/compositions";
import type { EpisodeDefinition } from "../lib/types";

/**
 * cr-tx-senate-2026-superpacs-short-a — AUTHORED Short A ("friendly name vs
 * the beer billionaire"). Reuses the LF episode's CR new-news composition set
 * (CountUp, ChartBar, MoneyFlow, SourceCard, Timeline, VerdictStamp, TextSlate,
 * DonorComparison, LongformSubscribeOutro) under this short's own slug so
 * produce-short-generic.mjs can render with --slug. Same navy CR brand.
 */
export const slug = "cr-tx-senate-2026-superpacs-short-a";

export const compositionNames = lf.compositionNames;

export const episode: EpisodeDefinition = {
  slug,
  program: "campaign-receipts",
  compositionNames,
  compositions: lf.compositions,
};

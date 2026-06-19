import { episode as lf } from "../cr-tx-senate-2026-superpacs/compositions";
import type { EpisodeDefinition } from "../lib/types";

/**
 * cr-tx-senate-2026-superpacs-short-b — AUTHORED Short B ("$90M before you
 * even voted"). Reuses the LF episode's CR new-news composition set under this
 * short's own slug so produce-short-generic.mjs can render with --slug. Same
 * navy CR brand.
 */
export const slug = "cr-tx-senate-2026-superpacs-short-b";

export const compositionNames = lf.compositionNames;

export const episode: EpisodeDefinition = {
  slug,
  program: "campaign-receipts",
  compositionNames,
  compositions: lf.compositions,
};

/**
 * Episode registry — one Remotion folder per shipped slug.
 *
 * Founder lock 2026-05-23: never reuse bare composition ids across episodes.
 * Pipeline renders `{slug}__{composition}` (see render-remotion.mjs --slug).
 *
 * New episode:
 *   1. python3 companies/campaign-receipts/scripts/pipeline/scaffold-remotion-episode.py --slug <slug>
 *   2. Import the new module below and append to EPISODES
 */
import type { ReactNode } from "react";
import { registerEpisodeCompositions } from "./lib/registerEpisodeCompositions";

import { episode as crBellBush } from "./cr-bell-bush-aipac-primary/compositions";
import { episode as crMassie } from "./cr-massie-gallrein-primary/compositions";
import { episode as sealedIranV7 } from "./sealed-aipac-iran-deal-v7/compositions";
import { episode as sealedDrain } from "./sealed-drain-the-swamp-v1/compositions";
import { episode as sealedEmbassy } from "./sealed-aipac-embassy-v1/compositions";
// SEALED shorts (2026-05-23): scaffolded to satisfy the post-lock manifest
// requirement so produce-short-generic.mjs can render them with --slug.
import { episode as sealed002Embassy } from "./sealed-002-aipac-embassy/compositions";
import { episode as sealed003Campus } from "./sealed-003-aipac-campus/compositions";
import { episode as sealed004Drain } from "./sealed-004-drain-the-swamp/compositions";
import { episode as sealed005China } from "./sealed-005-china-tariffs/compositions";
import { episode as sealed007Obamacare } from "./sealed-007-repeal-obamacare/compositions";
// SEALED shorts batch 10 (2026-05-24): no-VO mode per founder lock.
import { episode as sealed008TaxReturns } from "./sealed-008-tax-returns/compositions";
import { episode as sealed009TermLimits } from "./sealed-009-term-limits/compositions";
import { episode as sealed010UnClimate } from "./sealed-010-un-climate-paris/compositions";
import { episode as sealed011SelfFunding } from "./sealed-011-self-funding/compositions";
import { episode as sealed012LockHerUp } from "./sealed-012-lock-her-up/compositions";
import { episode as sealed013Coal } from "./sealed-013-coal/compositions";
import { episode as sealed014NkNukes } from "./sealed-014-nk-nukes/compositions";
import { episode as sealed015ScotusRoe } from "./sealed-015-scotus-roe/compositions";
import { episode as sealed016Deportation } from "./sealed-016-deportation-shortfall/compositions";
import { episode as sealed017Birthright } from "./sealed-017-birthright/compositions";
import { episode as crRabbPA3 } from "./cr-rabb-pa3-aipac-defeat/compositions";
import { episode as crWhatHappenedToTrump } from "./cr-what-happened-to-trump/compositions";
import { episode as sealedEmbassyV2 } from "./sealed-aipac-embassy-v2/compositions";
import { episode as sealedCampusEo } from "./sealed-aipac-campus-eo/compositions";
import { episode as crTxSenateSuperpacs } from "./cr-tx-senate-2026-superpacs/compositions";
import { episode as crTxSenateSuperpacsShortA } from "./cr-tx-senate-2026-superpacs-short-a/compositions";
import { episode as crTxSenateSuperpacsShortB } from "./cr-tx-senate-2026-superpacs-short-b/compositions";

export const EPISODES = [
  crBellBush,
  crMassie,
  crRabbPA3,
  crWhatHappenedToTrump,
  sealedIranV7,
  sealedDrain,
  sealedEmbassy,
  sealed002Embassy,
  sealed003Campus,
  sealed004Drain,
  sealed005China,
  sealed007Obamacare,
  sealed008TaxReturns,
  sealed009TermLimits,
  sealed010UnClimate,
  sealed011SelfFunding,
  sealed012LockHerUp,
  sealed013Coal,
  sealed014NkNukes,
  sealed015ScotusRoe,
  sealed016Deportation,
  sealed017Birthright,
  sealedEmbassyV2,
  sealedCampusEo,
  crTxSenateSuperpacs,
  crTxSenateSuperpacsShortA,
  crTxSenateSuperpacsShortB,
] as const;

export function allEpisodeCompositionNodes(): ReactNode[] {
  return EPISODES.flatMap((ep) => registerEpisodeCompositions(ep));
}

/** For Python QC / render adapter — slug → allowed short composition names */
export const EPISODE_MANIFEST: Record<string, readonly string[]> = Object.fromEntries(
  EPISODES.map((ep) => [ep.slug, ep.compositionNames]),
);

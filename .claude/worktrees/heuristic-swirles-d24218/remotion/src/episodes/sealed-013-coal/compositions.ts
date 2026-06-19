import { crNewNewsEpisode } from "../lib/crNewNewsEpisode";

/**
 * Copy this folder to `remotion/src/episodes/<slug>/` for each new episode.
 * Then add one import line in `registry.ts`.
 *
 * Storyboard: set `"remotion_episode": "<slug>"` (must match folder name).
 * Clips keep short names: `"composition": "CountUp"` → renders as `<slug>__CountUp`.
 */
export const slug = "sealed-013-coal";

export const compositionNames = crNewNewsEpisode(slug).compositionNames;
export const episode = crNewNewsEpisode(slug);

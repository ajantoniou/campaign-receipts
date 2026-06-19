import { crNewNewsEpisode } from "../lib/crNewNewsEpisode";

/** Episode-scoped Remotion — do not reference bare `CountUp` / `MoneyFlow` ids. */
export const slug = "cr-bell-bush-aipac-primary";
export const compositionNames = crNewNewsEpisode(slug).compositionNames;
export const episode = crNewNewsEpisode(slug);

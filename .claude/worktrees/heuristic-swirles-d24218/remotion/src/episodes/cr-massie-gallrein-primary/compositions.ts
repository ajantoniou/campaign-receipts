import { crNewNewsEpisode } from "../lib/crNewNewsEpisode";

export const slug = "cr-massie-gallrein-primary";
export const compositionNames = crNewNewsEpisode(slug, { includeSourceCard: false }).compositionNames;
export const episode = crNewNewsEpisode(slug, { includeSourceCard: false });

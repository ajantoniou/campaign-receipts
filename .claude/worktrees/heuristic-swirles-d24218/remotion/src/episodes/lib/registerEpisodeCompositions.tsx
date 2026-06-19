import React from "react";
import { Composition } from "remotion";
import type { EpisodeDefinition } from "./types";

/** Register all compositions for one episode — IDs are `{slug}-{name}` (Remotion allows `-`, not `__`). */
export function registerEpisodeCompositions(episode: EpisodeDefinition): React.ReactNode[] {
  return episode.compositions.map((c) => (
    <Composition
      key={`${episode.slug}-${c.name}`}
      id={`${episode.slug}-${c.name}`}
      component={c.component}
      durationInFrames={c.durationInFrames}
      fps={c.fps}
      width={c.width}
      height={c.height}
      defaultProps={c.defaultProps}
    />
  ));
}

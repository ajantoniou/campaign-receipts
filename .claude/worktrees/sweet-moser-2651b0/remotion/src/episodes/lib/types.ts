import type { ComponentType } from "react";

/** One Remotion composition registered under `{slug}__{name}`. */
export type EpisodeCompositionDef = {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  defaultProps: Record<string, unknown>;
};

export type EpisodeDefinition = {
  slug: string;
  program: "campaign-receipts" | "sealed" | "nt-ministry" | "cliros" | "estimateproof";
  compositionNames: readonly string[];
  compositions: EpisodeCompositionDef[];
};

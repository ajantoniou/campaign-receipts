import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMerriweather } from "@remotion/google-fonts/Merriweather";
import { loadFont as loadInstrumentSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadLora } from "@remotion/google-fonts/Lora";
import { loadFont as loadIbmPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";

// Call inside a Composition before rendering — Remotion blocks the
// render until fonts have loaded.
export const fonts = {
  inter: loadInter,
  merriweather: loadMerriweather,
  instrumentSerif: loadInstrumentSerif,
  lora: loadLora,
  ibmPlexMono: loadIbmPlexMono,
  fraunces: loadFraunces,
} as const;

export const loadAllFonts = () => {
  loadInter();
  loadMerriweather();
  loadInstrumentSerif();
  loadLora();
  loadIbmPlexMono();
  loadFraunces();
};

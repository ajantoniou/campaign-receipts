import { Config } from "@remotion/cli/config";

// Canonical render settings for the AgentCompanies Remotion pipeline.
// 1280×720 @ 30fps h264 mp4 drops directly into produce-from-storyboard.py
// without re-encoding. Concurrency=1 for predictability on dev machines —
// the Render web service overrides this when deployed.

Config.setVideoImageFormat("jpeg");
Config.setChromiumOpenGlRenderer("egl");
Config.setOverwriteOutput(true);
Config.setConcurrency(1);
Config.setCodec("h264");

#!/usr/bin/env node
/* Renders ClirosAOLDesk → public/landing/aol-step.mp4 for landing step 3 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const remotionRoot = path.resolve(__dirname, "../../../../remotion");
const outDir = path.join(__dirname, "..", "public", "landing");
const outFile = path.join(outDir, "aol-step.mp4");

mkdirSync(outDir, { recursive: true });
console.log("[landing-aol] rendering ClirosAOLDesk →", outFile);
execFileSync(
  "npx",
  ["remotion", "render", "src/index.ts", "ClirosAOLDesk", outFile, "--codec", "h264"],
  { cwd: remotionRoot, stdio: "inherit" }
);
console.log("[landing-aol] done");

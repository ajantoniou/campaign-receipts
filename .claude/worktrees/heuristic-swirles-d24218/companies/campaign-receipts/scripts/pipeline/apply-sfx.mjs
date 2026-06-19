#!/usr/bin/env node
/**
 * apply-sfx.mjs — Layer subtle SFX cues over an assembled master mp4.
 *
 * See: personas/sfx-specialist.md
 *
 * Reads a storyboard JSON, walks each clip for an optional sfx[] array,
 * computes absolute timeline timestamps (clip.start_sec + sfx.at_s),
 * and builds an ffmpeg filter_complex amix graph layering each cue
 * over the master's existing audio track at the specified gain_db.
 *
 * Assets resolve against /Applications/DrAntoniou Projects/AgentCompanies/shared/sfx/.
 * Each asset MUST have a `<name>.attribution.json` sidecar (CC-BY/CC0
 * license + source URL preserved).
 *
 * If the storyboard has zero sfx[] entries, this script no-ops and
 * copies the master through — backward-compatible with v1-v3 storyboards
 * that don't declare cues.
 *
 * Usage:
 *   node apply-sfx.mjs \
 *     --storyboard eng/storyboards/<slug>.json \
 *     --master _build/<slug>/master.mp4 \
 *     --out _build/<slug>/master-with-sfx.mp4
 *
 * Hard rules enforced (validates before render):
 *   - No cue gain_db above -18 dB → fail loud
 *   - >1 cue per second average → warn (don't fail; SFX specialist
 *     persona is advisory not blocking)
 *   - Missing asset file in shared/sfx/ → fail loud
 *   - Missing attribution sidecar → warn
 */
import { existsSync, readFileSync, copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MONOREPO_ROOT = resolve(__dirname, "../../../..");
const SFX_DIR = resolve(MONOREPO_ROOT, "shared/sfx");

const HARD_MAX_GAIN_DB = -18;

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      args[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

function fail(msg) {
  console.error(`[apply-sfx] error: ${msg}`);
  process.exit(1);
}

function main() {
  const args = parseArgs();
  if (!args.storyboard) fail("--storyboard required");
  if (!args.master) fail("--master required");
  if (!args.out) fail("--out required");

  const sb = JSON.parse(readFileSync(resolve(args.storyboard), "utf8"));
  const master = resolve(args.master);
  const out = resolve(args.out);
  if (!existsSync(master)) fail(`master not found: ${master}`);

  // Walk clips for sfx cues
  const cues = [];
  for (const clip of sb.clips || []) {
    const sfx = clip.sfx;
    if (!Array.isArray(sfx) || sfx.length === 0) continue;
    const startSec = Number(clip.start_sec ?? 0);
    for (const cue of sfx) {
      const gain = Number(cue.gain_db ?? -24);
      if (gain > HARD_MAX_GAIN_DB) {
        fail(`cue ${cue.asset} at clip ${clip.clip_id}: gain_db=${gain} exceeds hard max ${HARD_MAX_GAIN_DB} dB. SFX specialist rule.`);
      }
      const assetPath = resolve(SFX_DIR, cue.asset);
      if (!existsSync(assetPath)) {
        fail(`SFX asset not found: ${assetPath}. Check shared/sfx/ library.`);
      }
      const attrSidecar = assetPath.replace(/\.[^.]+$/, ".attribution.json");
      if (!existsSync(attrSidecar)) {
        console.warn(`[apply-sfx] WARN: missing attribution sidecar for ${cue.asset}`);
      }
      cues.push({
        clip_id: clip.clip_id,
        asset: cue.asset,
        asset_path: assetPath,
        at_s: startSec + Number(cue.at_s ?? 0),
        gain_db: gain,
      });
    }
  }

  if (cues.length === 0) {
    console.log("[apply-sfx] no cues in storyboard — copying master through");
    copyFileSync(master, out);
    return;
  }

  // Sparsity sanity (advisory)
  const masterDuration = (() => {
    const r = spawnSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", master,
    ], { encoding: "utf8" });
    return parseFloat((r.stdout || "0").trim()) || 0;
  })();
  const cuesPerSec = cues.length / Math.max(1, masterDuration);
  if (cuesPerSec > 1) {
    console.warn(`[apply-sfx] WARN: ${cues.length} cues over ${masterDuration.toFixed(1)}s = ${cuesPerSec.toFixed(2)}/s — exceeds sparsity guideline (≤1/s avg). Continuing, but reconsider.`);
  }

  console.log(`[apply-sfx] ${cues.length} cues over ${masterDuration.toFixed(1)}s master`);

  // Build ffmpeg filter_complex: each cue delayed + gained, then amixed
  // with master audio. Inputs: 0=master, 1..N=cue files.
  const inputs = ["-i", master, ...cues.flatMap((c) => ["-i", c.asset_path])];
  const filterParts = [];
  for (let i = 0; i < cues.length; i++) {
    const idx = i + 1; // input index (master is 0)
    const delayMs = Math.round(cues[i].at_s * 1000);
    // adelay accepts per-channel delays; "delay|delay" covers stereo.
    filterParts.push(
      `[${idx}:a]adelay=${delayMs}|${delayMs},volume=${cues[i].gain_db}dB[s${i}]`
    );
  }
  const mixLabels = cues.map((_, i) => `[s${i}]`).join("");
  // amix: master at full level + all cue streams. duration=first ⇒ output
  // length matches master (cues that extend past the end are truncated).
  filterParts.push(`[0:a]${mixLabels}amix=inputs=${cues.length + 1}:duration=first:normalize=0[aout]`);

  const ffmpegArgs = [
    "-y",
    ...inputs,
    "-filter_complex", filterParts.join(";"),
    "-map", "0:v",
    "-map", "[aout]",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    out,
  ];

  console.log(`[apply-sfx] rendering → ${out}`);
  const r = spawnSync("ffmpeg", ffmpegArgs, { stdio: ["ignore", "ignore", "inherit"] });
  if (r.status !== 0) {
    fail(`ffmpeg exited ${r.status}`);
  }
  console.log(`[apply-sfx] done`);
}

main();

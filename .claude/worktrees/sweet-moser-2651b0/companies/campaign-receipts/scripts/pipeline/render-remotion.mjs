#!/usr/bin/env node
// render-remotion.mjs — Campaign Receipts adapter for the monorepo
// Remotion pipeline.
//
// Shells out to `npx remotion render` against /remotion/ at the
// monorepo root. Renders a 1280×720 @ 30fps h264 mp4 that drops
// directly into the produce-from-storyboard.py driver.
//
// Usage:
//   node scripts/pipeline/render-remotion.mjs \
//     --composition MoneyFlow \
//     --duration 6 \
//     --props '{"source": {"name": "Adelson", "amount": 82000000}, "destinations": [...]}' \
//     --out _build/<slug>/clips/<id>.mp4
//
// When daily render volume > 10 clips/day, swap REMOTION_REMOTE_URL env var
// to the Render service URL — same JSON contract, just a different transport.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Monorepo root: companies/campaign-receipts/scripts/pipeline/ → ../../../..
const MONOREPO_ROOT = resolve(__dirname, "../../../..");
const REMOTION_DIR = resolve(MONOREPO_ROOT, "remotion");

const FPS = 30;
const WIDTH = 1280;
const HEIGHT = 720;

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith("--")) {
      const key = k.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function fail(msg) {
  console.error(`[render-remotion] error: ${msg}`);
  process.exit(1);
}

function main() {
  const args = parseArgs(process.argv);
  const composition = args.composition;
  const propsJson = args.props ?? "{}";
  const durationS = parseFloat(args.duration ?? "6");
  const out = args.out;

  if (!composition) fail("--composition is required");
  if (!out) fail("--out is required");
  if (Number.isNaN(durationS) || durationS <= 0) fail("--duration must be a positive number");

  // Validate props JSON early
  try {
    JSON.parse(propsJson);
  } catch (e) {
    fail(`--props is not valid JSON: ${e.message}`);
  }

  if (!existsSync(REMOTION_DIR)) {
    fail(`/remotion not found at ${REMOTION_DIR} — run npm install in the monorepo root /remotion/ first`);
  }

  const outAbs = resolve(process.cwd(), out);
  mkdirSync(dirname(outAbs), { recursive: true });

  const frames = Math.round(durationS * FPS);

  const remoteUrl = process.env.REMOTION_REMOTE_URL;
  if (remoteUrl) {
    console.error(`[render-remotion] REMOTION_REMOTE_URL set (${remoteUrl}) but HTTP transport not yet implemented in this adapter — falling back to local render.`);
  }

  const cliArgs = [
    "remotion",
    "render",
    "src/index.ts",
    composition,
    outAbs,
    `--props=${propsJson}`,
    `--frames=0-${frames - 1}`,
    "--codec=h264",
    "--log=warn",
    `--width=${WIDTH}`,
    `--height=${HEIGHT}`,
  ];

  console.error(`[render-remotion] composition=${composition} duration=${durationS}s frames=${frames} → ${outAbs}`);
  const r = spawnSync("npx", cliArgs, {
    cwd: REMOTION_DIR,
    stdio: "inherit",
  });

  if (r.status !== 0) {
    fail(`npx remotion render exited with code ${r.status}`);
  }

  if (!existsSync(outAbs)) {
    fail(`render reported success but ${outAbs} does not exist`);
  }

  console.error(`[render-remotion] ok: ${outAbs}`);
}

main();

#!/usr/bin/env node
/**
 * generate-retail-epub.mjs
 *
 * Wraps a single pandoc invocation that converts the retail HTML
 * intermediate (built by scripts/build-retail-pdf.mjs) into an ePub.
 *
 * Inputs:
 *   --input   artifacts/SEALED-v1-retail.html (default)
 *   --output  artifacts/SEALED-v1-retail.epub (default)
 *
 * Requires pandoc on PATH (>= 3.0).
 *
 * Design note: a v1 one-shot Pandoc invocation produced an Apple-Books-clean
 * ePub from the existing retail HTML. Pre-Pandoc HTML transformations
 * (scorecard -> <dl>, by-the-numbers -> single column, etc.) were considered
 * but deferred to v1.1 per WS2 guidance ("don't over-engineer; ship if
 * one-shot is acceptable"). The artifact reads cover-to-cover in Books with
 * a chapter list and intact verdict math (46/51/40/8 = 145).
 */
import { spawnSync } from "node:child_process"
import { existsSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")

function arg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`)
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1]
  return fallback
}

const input = path.resolve(
  repoRoot,
  arg("input", "artifacts/SEALED-v1-retail.html")
)
const output = path.resolve(
  repoRoot,
  arg("output", "artifacts/SEALED-v1-retail.epub")
)

if (!existsSync(input)) {
  console.error(`[epub] input HTML not found: ${input}`)
  console.error(`[epub] run scripts/build-retail-pdf.mjs first to emit it`)
  process.exit(1)
}

const pandocArgs = [
  input,
  "-o",
  output,
  "--toc",
  "--metadata",
  "title=SEALED — The 2016 Promises · Before the Deals",
  "--metadata",
  "author=Peter Oliver",
  "--metadata",
  "publisher=SEALED Press",
]

console.log(`[epub] pandoc ${pandocArgs.join(" ")}`)
const result = spawnSync("pandoc", pandocArgs, { stdio: "inherit" })
if (result.error) {
  console.error(`[epub] pandoc failed: ${result.error.message}`)
  console.error(`[epub] is pandoc installed? brew install pandoc`)
  process.exit(1)
}
if (result.status !== 0) {
  console.error(`[epub] pandoc exited with status ${result.status}`)
  process.exit(result.status || 1)
}

const stat = statSync(output)
console.log(`[epub] wrote ${output} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`)

/**
 * Swap the public sample with the frozen, editorial proof.
 * Run this after the copy team tags `COPY_FROZEN_v1` so the live download
 * mirrors the typeset interior PDF (`artifacts/SEALED-v1-before-the-deals.pdf`).
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const src = path.join(root, 'artifacts', 'SEALED-v1-before-the-deals.pdf')
const dest = path.join(root, 'public', 'sample', 'sealed-sample-preview.pdf')

async function main() {
  await fs.copyFile(src, dest)
  console.log('Published editorial sample to', dest)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

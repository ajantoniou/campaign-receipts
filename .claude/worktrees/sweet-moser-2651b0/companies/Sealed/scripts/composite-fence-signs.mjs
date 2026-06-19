/**
 * Composite cardboard-sign text on top of the clean fence illustration.
 *
 * Input:  public/share-with-your-neighbor-base.jpg  (clean illustration)
 * Output: public/share-with-your-neighbor.jpg       (with signs composited)
 *
 * Why this exists:
 *   The fal.ai text-rendering lottery produced typos ("NO MIPAC WARY",
 *   "MONY", "CANT AFFORD") on the original ship. For a "receipts" book
 *   that's credibility-fatal — a journalist would screenshot it. We
 *   regenerate the illustration WITHOUT any sign text, then Puppeteer-
 *   composite the four sign blocks as clean SVG-as-text overlays.
 *
 * The signs are positioned to sit on the fence rail and around the
 * composition's negative space. Hand-set hint: slight rotations + a
 * tape-corner shadow so they read as cardboard, not as web buttons.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC = path.join(__dirname, '..', 'public')
const INPUT = path.join(PUBLIC, 'share-with-your-neighbor-base.jpg')
const OUTPUT = path.join(PUBLIC, 'share-with-your-neighbor.jpg')

// Render at 2× the source dimensions for crispness, then export at 2×.
// Source illustration is roughly 1024×1280 (4:5); render canvas matches.
const W = 1024
const H = 1280

async function imageToDataUri(p) {
  const b = await fs.readFile(p)
  return `data:image/jpeg;base64,${b.toString('base64')}`
}

function pageHtml(bgDataUri) {
  return `<!doctype html><html><head><style>
    body { margin: 0; background: transparent; }
    .frame {
      position: relative;
      width: ${W}px;
      height: ${H}px;
      overflow: hidden;
      background: #f6efe0;
    }
    .frame > img.bg {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      object-position: center;
    }
    /* Each sign: handwritten Sharpie on tan cardboard. Slight rotation so it
       reads as taped-up, not corporate signage. */
    .sign {
      position: absolute;
      background:
        linear-gradient(135deg, rgba(0,0,0,0.04) 0%, transparent 35%),
        #d9c896;
      color: #1b1714;
      font-family: 'Permanent Marker', 'Reenie Beanie', 'Marker Felt',
                   'Comic Sans MS', cursive;
      font-weight: 700;
      letter-spacing: 0.04em;
      line-height: 1.05;
      text-align: center;
      padding: 14px 16px;
      box-shadow:
        0 6px 14px rgba(0,0,0,0.18),
        inset 0 0 0 1px rgba(0,0,0,0.10);
      border: 1px solid rgba(0,0,0,0.18);
      /* slight cardboard-grain via repeating-linear-gradient */
      background-image:
        repeating-linear-gradient(
          45deg,
          rgba(0,0,0,0.025) 0 1px,
          transparent 1px 4px
        ),
        linear-gradient(135deg, rgba(0,0,0,0.04) 0%, transparent 35%),
        linear-gradient(#d9c896, #d4be86);
      /* tape tab at top-left */
    }
    .sign::before {
      content: '';
      position: absolute;
      top: -10px;
      left: 20%;
      width: 42px;
      height: 14px;
      background: rgba(245, 235, 200, 0.78);
      box-shadow: 0 1px 2px rgba(0,0,0,0.18);
      transform: rotate(-3deg);
    }

    /* Position + sizing per sign */
    .s1 { top: 30px;  left: 40px;  width: 360px; transform: rotate(-3deg); font-size: 52px; }
    .s2 { top: 60px;  right: 50px; width: 320px; transform: rotate(3deg);  font-size: 44px; }
    .s3 { top: 950px; left: 30px;  width: 320px; transform: rotate(-2deg); font-size: 42px; }
    .s4 { top: 990px; right: 30px; width: 340px; transform: rotate(2.5deg); font-size: 38px; }
  </style></head><body>
    <div class="frame">
      <img class="bg" src="${bgDataUri}" alt="" />

      <div class="sign s1">NO AIPAC MONEY</div>
      <div class="sign s2">NO MORE WARS</div>
      <div class="sign s3">SENIORS<br/>CAN'T AFFORD<br/>MEDICINE</div>
      <div class="sign s4">STUDENTS<br/>BURIED<br/>IN DEBT</div>
    </div>
  </body></html>`
}

async function main() {
  await fs.access(INPUT) // throws if missing
  const bg = await imageToDataUri(INPUT)

  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 })
  await page.setContent(pageHtml(bg), { waitUntil: 'load' })
  // Give fonts a beat to settle
  await new Promise((r) => setTimeout(r, 300))
  await page.screenshot({
    path: OUTPUT,
    type: 'jpeg',
    quality: 92,
    clip: { x: 0, y: 0, width: W, height: H },
    omitBackground: false,
  })
  await browser.close()

  const sz = (await fs.stat(OUTPUT)).size
  console.log(`Wrote ${OUTPUT}  (${(sz / 1024).toFixed(1)} KB)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

import { ImageResponse } from 'next/og'
import fs from 'node:fs/promises'
import path from 'node:path'

export const alt = 'SEALED — The 2016 Promises Before the Deals'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * OG share preview — uses the same book-cover composition as the landing
 * page (public/sealed-cover-hero.png). Twitter / Facebook / LinkedIn /
 * iMessage all render this when sealed2016.com is shared.
 */
export default async function OpenGraphImage() {
  // Read the rendered cover PNG from disk and inline as a data URI so the
  // OG renderer (which runs in an isolated edge-style sandbox) doesn't
  // need to hit the network for the asset.
  let coverDataUri: string | null = null
  try {
    const buf = await fs.readFile(path.join(process.cwd(), 'public', 'sealed-cover-hero.png'))
    coverDataUri = `data:image/png;base64,${buf.toString('base64')}`
  } catch {
    coverDataUri = null
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0F1F3A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          fontFamily: 'ui-serif, Georgia, serif',
          color: '#f5ecd6',
        }}
      >
        {/* Book cover — left, 2:3 proportion, with subtle shadow. */}
        <div
          style={{
            width: 420,
            height: 630,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
        >
          {coverDataUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverDataUri}
              alt=""
              width={340}
              height={510}
              style={{
                width: 340,
                height: 510,
                objectFit: 'cover',
                boxShadow: '0 12px 32px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.30)',
              }}
            />
          ) : null}
        </div>
        {/* Right column — wordmark + tagline + verdict counts. */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingRight: 64,
          }}
        >
          <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: '0.06em', color: '#d4a82e' }}>
            SEALED
          </div>
          <div style={{ fontSize: 28, fontStyle: 'italic', marginTop: 14, color: '#f5ecd6' }}>
            The 2016 Promises — Before the Deals
          </div>
          <div
            style={{
              marginTop: 32,
              fontSize: 20,
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#f5ecd6',
              opacity: 0.92,
            }}
          >
            145 promises · every receipt · you decide
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 18,
              fontFamily: 'ui-monospace, monospace',
              color: '#d4a82e',
              letterSpacing: '0.12em',
            }}
          >
            46 KEPT · 51 PARTIAL · 40 BROKEN · 8 READER-DECIDES
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}

'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/cn'

type Size = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_PX: Record<Size, { w: number; h: number; text: string }> = {
  sm: { w: 56, h: 70, text: 'text-base' },
  md: { w: 64, h: 80, text: 'text-lg' },
  lg: { w: 96, h: 120, text: 'text-2xl' },
  xl: { w: 160, h: 200, text: 'text-4xl' },
}

// Paper-warm placeholder fallback. The site is paper-warm; the prior
// dark-tinted fallback (rose-900/sky-900/amber-900) read as broken
// against the bone/paper background. Per founder feedback 2026-05-19
// ("can't have empty images, please add"), the fallback is now a
// paper-3 tile with an Instrument-Serif italicized initial and a
// subtle ink hairline — matches the audit-document benchmark.
function fallbackClasses() {
  return 'bg-paper-3 ring-line text-ink-2 font-display italic'
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  const first = parts[0]?.[0] || ''
  const last = parts[parts.length - 1]?.[0] || ''
  return (first + last).toUpperCase()
}

export default function PoliticianAvatar({
  name,
  party,
  photoUrl,
  size = 'sm',
  className,
}: {
  name: string
  party?: string | null
  photoUrl?: string | null
  size?: Size
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const { w, h, text } = SIZE_PX[size]

  // Photo path: try the URL; on load failure flip to fallback.
  if (photoUrl && !failed) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={w}
        height={h}
        unoptimized
        onError={() => setFailed(true)}
        className={cn(
          'rounded-lg ring-1 ring-ink-800 object-cover',
          className,
        )}
        style={{ width: w, height: h }}
      />
    )
  }

  // Fallback: paper-warm tile with italic initial. Reads as a "photo
  // pending" placeholder, not a broken state.
  void party // signal that we intentionally don't tint by party anymore
  return (
    <div
      className={cn(
        'rounded-lg ring-1 flex items-center justify-center',
        fallbackClasses(),
        text,
        className,
      )}
      style={{ width: w, height: h }}
      aria-label={name}
      title={`${name} (photo pending)`}
    >
      {initialsFor(name)}
    </div>
  )
}

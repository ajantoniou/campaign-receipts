// Favicon — camera/snapshot mark per founder brand direction 2026-05-30
// (replaces the prior feather-quill "rev-7" favicon). New thesis is
// investigative: "the deal, caught on camera." A clean point-and-shoot
// silhouette in ink with a broken-coral lens reads instantly at 32x32.
// Next 14 app router auto-serves this at /icon.

import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#FAF6EF', // paper
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Viewfinder hump */}
          <path d="M 9 7 L 9 9.5 L 15 9.5 L 15 7 Z" fill="#1A1815" />
          {/* Camera body */}
          <rect
            x="3.5"
            y="9"
            width="25"
            height="17"
            rx="3"
            stroke="#1A1815"
            strokeWidth="2.2"
            fill="none"
          />
          {/* Lens — broken-coral accent */}
          <circle cx="16" cy="17.5" r="5.4" fill="#A8423E" stroke="#8A322F" strokeWidth="1.2" />
          {/* Aperture punch-out */}
          <circle cx="16" cy="17.5" r="2" fill="#FAF6EF" />
          {/* Shutter button */}
          <circle cx="24" cy="11.5" r="1.4" fill="#A8423E" />
        </svg>
      </div>
    ),
    { ...size }
  )
}

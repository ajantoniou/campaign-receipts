// Apple touch icon — camera/snapshot mark at 180x180 per founder brand
// direction 2026-05-30 (replaces the prior quill-on-scroll apple icon).
// New thesis: "the deal, caught on camera." More room here than the 32px
// favicon, so the camera sits over a faint ruled receipt/ledger card —
// the audit-document tell — to read as "the receipt, photographed."
// iOS home-screen + macOS share-card size.

import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
          padding: 0,
        }}
      >
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer rounded square */}
          <rect x="0" y="0" width="180" height="180" rx="32" fill="#FAF6EF" />

          {/* Faint receipt/ledger card behind the camera — the audit tell */}
          <rect
            x="40"
            y="34"
            width="100"
            height="112"
            rx="4"
            fill="#F4EEDF"
            stroke="#E0D8C3"
            strokeWidth="2"
          />
          <line x1="54" y1="50" x2="126" y2="50" stroke="#D9CFB6" strokeWidth="2" strokeDasharray="3 4" />
          <line x1="54" y1="62" x2="112" y2="62" stroke="#D9CFB6" strokeWidth="2" strokeDasharray="3 4" />
          <line x1="54" y1="130" x2="126" y2="130" stroke="#D9CFB6" strokeWidth="2" strokeDasharray="3 4" />

          {/* Camera body — centered over the card */}
          {/* Viewfinder hump */}
          <path d="M 64 70 L 64 84 L 96 84 L 96 70 Z" fill="#1A1815" />
          {/* Body */}
          <rect
            x="40"
            y="82"
            width="100"
            height="64"
            rx="12"
            stroke="#1A1815"
            strokeWidth="8"
            fill="#FAF6EF"
          />
          {/* Lens — broken-coral, the verdict-palette accent */}
          <circle cx="90" cy="114" r="22" fill="#A8423E" stroke="#8A322F" strokeWidth="4" />
          {/* Aperture punch-out */}
          <circle cx="90" cy="114" r="8" fill="#FAF6EF" />
          {/* Shutter button */}
          <circle cx="124" cy="92" r="5.5" fill="#A8423E" />
        </svg>
      </div>
    ),
    { ...size }
  )
}

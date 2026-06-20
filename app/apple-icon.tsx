import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0B0A09', // match app background
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 32,
          border: '2px solid #EAB308', // gold border
        }}
      >
        <div style={{ fontSize: 96 }}>💰</div>
      </div>
    ),
    { ...size }
  )
}

const { join } = require('path')
let sharedDefaultHeaders = []
try {
  sharedDefaultHeaders = require(join(__dirname, '../../shared/config/security-headers')).securityHeaders
} catch (e) {
  console.warn('Could not load shared security headers, proceeding with empty array.')
}
// Build CR-specific security headers by copying every shared header
// EXCEPT Content-Security-Policy, then defining our own CSP that
// allows the Cloudflare Web Analytics beacon. Per rev-7 engineer
// review: "Beacon never loads → zero analytics on the launch traffic
// you're paying to acquire."
//
// We bypass withSecurityHeaders() because that helper APPENDS the
// shared rule after our own, which means the shared CSP overrides
// ours (last-rule-wins for duplicate header keys).
const crSecurityHeaders = [
  ...sharedDefaultHeaders.filter((h) => h.key !== 'Content-Security-Policy'),
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://plausible.io",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.lemonsqueezy.com https://api.resend.com https://cloudflareinsights.com https://static.cloudflareinsights.com https://plausible.io",
      // Allow YouTube embeds in video_companion articles. Without an
      // explicit frame-src, frames fall back to default-src 'self' and
      // the YouTube iframe is blocked (stuck grey box with a spinner).
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'bioguide.congress.gov' },
      { protocol: 'https', hostname: '**.senate.gov' },
      { protocol: 'https', hostname: '**.house.gov' },
      { protocol: 'https', hostname: 'sealed2016.com' },
      { protocol: 'https', hostname: 'sealed-press.onrender.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
  async redirects() {
    return [
      // Legacy /trump SEALED-book promo (145 promises @ 32% kept)
      // conflicts with canonical /politician/donald-trump-2016 (81
      // promises @ 35% kept). Per rev-7 panel: redirect so a
      // journalist clicking both doesn't get conflicting numbers.
      { source: '/trump', destination: '/politician/donald-trump-2016', permanent: true },
      { source: '/trump/:path*', destination: '/politician/donald-trump-2016', permanent: true },
      // 2026-05-26 kill-list (single-tier decision): these pages
      // implied paid products that don't exist. Redirected to the
      // closest live free surface so existing links don't 404.
      { source: '/donor-to-vote', destination: '/methodology', permanent: true },
      { source: '/donor-to-bill', destination: '/methodology', permanent: true },
      { source: '/tips-to-verdicts', destination: '/methodology', permanent: true },
      { source: '/tips-to-verdicts/:path*', destination: '/methodology', permanent: true },
      { source: '/redeem', destination: '/', permanent: true },
      { source: '/redeem/:path*', destination: '/', permanent: true },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/ingest/cf-beacon.js',
        destination: 'https://static.cloudflareinsights.com/beacon.min.js',
      },
      {
        source: '/ingest/cf-beacon',
        destination: 'https://cloudflareinsights.com/cdn-cgi/rum',
      },
    ]
  },
  async headers() {
    return [
      { source: '/(.*)', headers: crSecurityHeaders },
    ]
  },
}

module.exports = nextConfig

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-XSS-Protection', value: '0' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.lemonsqueezy.com https://api.resend.com https://vpic.nhtsa.dot.gov https://api.nhtsa.gov",
      // Allow embedding YouTube videos (landing-page Shorts). Without an explicit
      // frame-src, iframes fall back to default-src 'self' and the embed is blocked.
      // Additive: only permits YouTube as a frame source; does not loosen anything else.
      "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const defaultSecurityRule = {
  source: '/(.*)',
  headers: securityHeaders,
}

/**
 * Wraps any Next.js config to ensure the shared security headers make it into
 * the `headers()` array without stomping on pre-existing rules.
 */
function withSecurityHeaders(nextConfig = {}) {
  const baseHeaders = nextConfig.headers

  return {
    ...nextConfig,
    headers: async () => {
      const inheritedHeaders =
        typeof baseHeaders === 'function'
          ? await baseHeaders()
          : baseHeaders ?? []

      return [...inheritedHeaders, defaultSecurityRule]
    },
  }
}

module.exports = {
  securityHeaders,
  withSecurityHeaders,
}

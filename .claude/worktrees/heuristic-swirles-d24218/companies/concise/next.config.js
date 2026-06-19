const { withSecurityHeaders } = require('../../shared/config/security-headers')

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: false,
  swcMinify: true,
  skipTrailingSlashRedirect: true,
  experimental: {
    optimizePackageImports: ['react-dom'],
  },
  async redirects() {
    const sealed = 'https://sealed-press.onrender.com'
    return [
      { source: '/sealed', destination: sealed, permanent: true },
      { source: '/sealed/thank-you', destination: `${sealed}/thank-you`, permanent: true },
    ]
  },
}

module.exports = withSecurityHeaders(baseConfig)

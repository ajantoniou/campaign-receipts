const { join } = require('path')
const { withSecurityHeaders } = require(join(__dirname, '../../shared/config/security-headers'))

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: false,
  swcMinify: true,
  skipTrailingSlashRedirect: true,
  output: 'standalone',
  experimental: {
    optimizePackageImports: [],
  },
  // Do not set `experimental.optimizePackageImports: ['react-dom']` — it breaks prerender (useContext null).
}

module.exports = withSecurityHeaders(baseConfig)

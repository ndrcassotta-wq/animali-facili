import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

const isDev = process.env.NODE_ENV === 'development'

let exportedConfig: NextConfig = nextConfig

if (!isDev) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: false,
  })
  exportedConfig = withPWA(nextConfig)
}

export default exportedConfig
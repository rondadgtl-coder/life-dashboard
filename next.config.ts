import type { NextConfig } from 'next'
// @ts-ignore
import withPWA from 'next-pwa'

const pwa = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {}

export default pwa(nextConfig)

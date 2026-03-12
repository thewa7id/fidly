import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  // PWA headers for service worker
  async headers() {
    return [
      {
        source: '/firebase-messaging-sw.js',
        headers: [{ key: 'Service-Worker-Allowed', value: '/' }],
      },
    ]
  },
}

export default nextConfig

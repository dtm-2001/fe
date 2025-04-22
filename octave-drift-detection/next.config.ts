import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    AZURE_STORAGE_ACCOUNT_NAME: process.env.AZURE_STORAGE_ACCOUNT_NAME,
    AZURE_STORAGE_ACCOUNT_KEY: process.env.AZURE_STORAGE_ACCOUNT_KEY,
    AZURE_TABLE_NAME: process.env.AZURE_TABLE_NAME || 'OctaveData'
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.octave.lk',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:8000']
    }
  },
  async redirects() {
    return [
      {
        source: '/mode1.html',
        destination: '/mode1',
        permanent: true,
      },
      {
        source: '/mode2.html',
        destination: '/mode2', 
        permanent: true,
      },
      {
        source: '/mode3.html',
        destination: '/mode3',
        permanent: true,
      },
      {
        source: '/mode4.html',
        destination: '/mode4',
        permanent: true,
      }
    ]
  }
}

export default nextConfig
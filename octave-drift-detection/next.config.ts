import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    AZURE_STORAGE_ACCOUNT_NAME: process.env.AZURE_STORAGE_ACCOUNT_NAME,
    AZURE_STORAGE_ACCOUNT_KEY: process.env.AZURE_STORAGE_ACCOUNT_KEY,
    AZURE_TABLE_NAME: process.env.AZURE_TABLE_NAME || 'OctaveData',
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
          }
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*', // Match all API routes starting with /api
        destination: 'http://127.0.0.1:5000/:path*', // Proxy to the backend without /api prefix
      },
      {
        source: '/mode3/:path*',
        destination: 'http://127.0.0.1:5000/mode3/:path*',
      },
      {
        source: '/mode3',
        destination: 'http://127.0.0.1:5000/mode3',
      },
      {
        source: '/mode4/:path*',
        destination: 'http://127.0.0.1:5000/mode4/:path*',
      },
      {
        source: '/mode4',
        destination: 'http://127.0.0.1:5000/mode4',
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:8000'],
    },
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
      },
    ];
  },
};

export default nextConfig;

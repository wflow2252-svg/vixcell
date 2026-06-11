/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
}

module.exports = nextConfig

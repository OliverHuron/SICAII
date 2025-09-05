/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  serverExternalPackages: ['pg'],
  eslint: {
    // Ignorar errores ESLint durante el build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar errores TypeScript durante el build (temporal)
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig

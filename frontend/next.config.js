/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    // Добавьте домены для изображений баннеров
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Оптимизация изображений
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Оптимизация компиляции
  swcMinify: true,
  // Компрессия
  compress: true,
}

module.exports = nextConfig





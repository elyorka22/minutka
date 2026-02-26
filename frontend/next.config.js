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
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Оптимизация изображений
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    // Кастомный loader для изображений из Supabase Storage
    // Отключаем оптимизацию для Supabase, чтобы избежать 402 ошибок
    loader: 'default',
    loaderFile: undefined,
  },
  // Оптимизация компиляции
  swcMinify: true,
  // Компрессия
  compress: true,
}

module.exports = nextConfig





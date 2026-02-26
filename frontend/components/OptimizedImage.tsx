// ============================================
// Optimized Image Component
// Компонент-обертка для Next.js Image с автоматическим отключением оптимизации для Supabase
// ============================================

'use client';

import Image, { ImageProps } from 'next/image';
import { shouldUnoptimizeImage } from '@/lib/imageUtils';

interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
}

/**
 * Компонент-обертка для Next.js Image
 * Автоматически отключает оптимизацию для изображений из Supabase Storage
 * чтобы избежать проблем с 402 ошибками
 */
export default function OptimizedImage({ src, ...props }: OptimizedImageProps) {
  if (!src) {
    return null;
  }

  return (
    <Image
      {...props}
      src={src}
      unoptimized={shouldUnoptimizeImage(src)}
    />
  );
}


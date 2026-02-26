// ============================================
// Image Utilities
// Утилиты для работы с изображениями
// ============================================

/**
 * Проверяет, является ли URL изображением из Supabase Storage
 */
export function isSupabaseImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('supabase.co/storage/v1/object/public');
}

/**
 * Определяет, нужно ли отключать оптимизацию для изображения
 * Для изображений из Supabase Storage отключаем оптимизацию,
 * чтобы избежать проблем с 402 ошибками
 */
export function shouldUnoptimizeImage(url: string | null | undefined): boolean {
  return isSupabaseImageUrl(url);
}


// ============================================
// Validation Utilities
// ============================================

/**
 * Валидация цены
 * @param price - Цена для проверки
 * @returns true если цена валидна, false иначе
 */
export function validatePrice(price: any): boolean {
  if (price === undefined || price === null) {
    return false;
  }
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  
  if (isNaN(numPrice)) {
    return false;
  }
  
  if (numPrice < 0) {
    return false;
  }
  
  if (numPrice > 1000000000) { // Максимальная цена 1 миллиард
    return false;
  }
  
  return true;
}

/**
 * Валидация телефона
 * @param phone - Телефон для проверки
 * @returns true если телефон валиден, false иначе
 */
export function validatePhone(phone: string | null | undefined): boolean {
  if (!phone) {
    return true; // Телефон опционален
  }
  
  // Убираем все нецифровые символы кроме +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Проверяем что осталось минимум 9 цифр (международный формат)
  const digits = cleaned.replace(/\+/g, '');
  
  if (digits.length < 9 || digits.length > 15) {
    return false;
  }
  
  return true;
}

/**
 * Валидация Telegram ID
 * @param telegramId - Telegram ID для проверки
 * @returns true если ID валиден, false иначе
 */
export function validateTelegramId(telegramId: any): boolean {
  if (telegramId === undefined || telegramId === null) {
    return false;
  }
  
  const numId = typeof telegramId === 'string' ? parseInt(telegramId, 10) : Number(telegramId);
  
  if (isNaN(numId)) {
    return false;
  }
  
  if (numId <= 0) {
    return false;
  }
  
  // Telegram ID обычно не больше 2^63-1
  if (numId > Number.MAX_SAFE_INTEGER) {
    return false;
  }
  
  return true;
}

/**
 * Валидация строки (имя, описание и т.д.)
 * @param str - Строка для проверки
 * @param minLength - Минимальная длина (по умолчанию 1)
 * @param maxLength - Максимальная длина (по умолчанию 1000)
 * @returns true если строка валидна, false иначе
 */
export function validateString(
  str: string | null | undefined,
  minLength: number = 1,
  maxLength: number = 1000
): boolean {
  if (str === null || str === undefined) {
    return true; // null/undefined разрешены для опциональных полей
  }
  
  if (typeof str !== 'string') {
    return false;
  }
  
  const trimmed = str.trim();
  
  if (trimmed.length < minLength) {
    return false;
  }
  
  if (trimmed.length > maxLength) {
    return false;
  }
  
  return true;
}

/**
 * Валидация URL
 * @param url - URL для проверки
 * @returns true если URL валиден, false иначе
 */
export function validateUrl(url: string | null | undefined): boolean {
  if (!url) {
    return true; // URL опционален
  }
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Валидация пароля
 * @param password - Пароль для проверки
 * @param minLength - Минимальная длина (по умолчанию 6)
 * @returns true если пароль валиден, false иначе
 */
export function validatePassword(password: string, minLength: number = 6): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  if (password.length < minLength) {
    return false;
  }
  
  if (password.length > 255) {
    return false;
  }
  
  return true;
}

/**
 * Валидация координат (latitude, longitude)
 * @param coord - Координата для проверки
 * @returns true если координата валидна, false иначе
 */
export function validateCoordinate(coord: number | null | undefined): boolean {
  if (coord === null || coord === undefined) {
    return true; // Координаты опциональны
  }
  
  if (typeof coord !== 'number' || isNaN(coord)) {
    return false;
  }
  
  return coord >= -180 && coord <= 180;
}

/**
 * Валидация UUID
 * @param uuid - UUID для проверки
 * @returns true если UUID валиден, false иначе
 */
export function validateUuid(uuid: string | null | undefined): boolean {
  if (!uuid) {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}


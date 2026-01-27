// ============================================
// Password Utilities - Хеширование паролей
// ============================================

import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Хеширует пароль
 * @param password - Пароль в plain text
 * @returns Хешированный пароль
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Проверяет пароль
 * @param password - Пароль в plain text
 * @param hashedPassword - Хешированный пароль из БД
 * @returns true если пароль совпадает, false иначе
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Проверяет, является ли пароль уже хешированным
 * (bcrypt хеши начинаются с $2a$, $2b$ или $2y$)
 * @param password - Строка для проверки
 * @returns true если строка похожа на хеш
 */
export function isHashed(password: string): boolean {
  return password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$');
}



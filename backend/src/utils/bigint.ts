// ============================================
// BigInt Serialization Utilities
// ============================================

/**
 * Конвертирует BigInt значения в строки для JSON сериализации
 * Рекурсивно обрабатывает объекты и массивы
 */
export function serializeBigInt<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof BigInt) {
    return data.toString() as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map(item => serializeBigInt(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = (data as any)[key];
        if (value instanceof BigInt) {
          result[key] = value.toString();
        } else if (typeof value === 'object' && value !== null) {
          result[key] = serializeBigInt(value);
        } else {
          result[key] = value;
        }
      }
    }
    return result as T;
  }

  return data;
}


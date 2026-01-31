// ============================================
// BigInt Serialization Middleware
// Автоматически конвертирует BigInt в строки в JSON ответах
// ============================================

import { Response } from 'express';

/**
 * Middleware для автоматической сериализации BigInt в JSON ответах
 */
export function bigIntSerializerMiddleware(req: any, res: Response, next: any) {
  // Сохраняем оригинальный метод json
  const originalJson = res.json.bind(res);
  
  // Переопределяем res.json для автоматической обработки BigInt
  res.json = function(data: any) {
    try {
      // Сериализуем данные с обработкой BigInt
      const serialized = JSON.stringify(data, (key, value) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      });
      
      // Устанавливаем заголовок и отправляем сериализованные данные
      this.setHeader('Content-Type', 'application/json');
      return this.send(serialized);
    } catch (error: any) {
      // Если произошла ошибка при сериализации, пытаемся обработать более агрессивно
      console.error('Error serializing response:', error);
      
      try {
        // Пытаемся рекурсивно обработать данные
        const safeData = serializeBigIntRecursive(data);
        const serialized = JSON.stringify(safeData);
        this.setHeader('Content-Type', 'application/json');
        return this.send(serialized);
      } catch (e) {
        console.error('Failed to serialize response even with recursive processing:', e);
        // В крайнем случае отправляем ошибку
        return originalJson({
          success: false,
          error: 'Failed to serialize response',
          message: 'Internal server error'
        });
      }
    }
  };
  
  next();
}

/**
 * Рекурсивно конвертирует BigInt значения в строки
 */
function serializeBigIntRecursive(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'bigint') {
    return data.toString();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => serializeBigIntRecursive(item));
  }
  
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serializeBigIntRecursive(data[key]);
      }
    }
    return result;
  }
  
  return data;
}


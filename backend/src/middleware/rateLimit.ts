// ============================================
// Rate Limiting Middleware
// ============================================

import rateLimit from 'express-rate-limit';

/**
 * Общий rate limiter для всех API запросов
 * 1000 запросов за 15 минут (стандартное значение для веб-приложений)
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // максимум 1000 запросов за окно (примерно 66 запросов в минуту)
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Возвращает информацию о лимитах в заголовках `RateLimit-*`
  legacyHeaders: false, // Отключает заголовки `X-RateLimit-*`
  // Исключаем маршрут логина, так как на нем уже есть strictLimiter
  skip: (req) => {
    return req.path === '/api/auth/login' || req.originalUrl === '/api/auth/login';
  },
});

/**
 * Строгий rate limiter для критичных операций (логин, регистрация)
 * 15 запросов за 15 минут (увеличено для удобства админов)
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 15, // максимум 15 запросов за окно
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Не учитывать успешные запросы
});

/**
 * Rate limiter для операций создания/обновления данных
 * 20 запросов за 15 минут
 */
export const createUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 20, // максимум 20 запросов за окно
  message: {
    success: false,
    error: 'Too many create/update requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});


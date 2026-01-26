// ============================================
// Rate Limiting Middleware
// ============================================

import rateLimit from 'express-rate-limit';

/**
 * Общий rate limiter для всех API запросов
 * 100 запросов за 15 минут
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов за окно
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Возвращает информацию о лимитах в заголовках `RateLimit-*`
  legacyHeaders: false, // Отключает заголовки `X-RateLimit-*`
});

/**
 * Строгий rate limiter для критичных операций (логин, регистрация)
 * 5 запросов за 15 минут
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 запросов за окно
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


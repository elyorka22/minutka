-- ============================================
-- Migration: Remove restaurant categories tables
-- Удаляем таблицы категорий ресторанов, оставляем только магазины
-- ============================================

-- Удаляем таблицу связей категорий ресторанов
DROP TABLE IF EXISTS restaurant_category_relations CASCADE;

-- Удаляем таблицу категорий ресторанов
DROP TABLE IF EXISTS restaurant_categories CASCADE;

-- Удаляем таблицу категорий меню ресторанов
DROP TABLE IF EXISTS menu_categories CASCADE;


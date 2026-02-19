-- ============================================
-- Migration: Change store_categories CASCADE to SET NULL
-- Это позволит категориям оставаться в БД даже после удаления магазина
-- ============================================

-- Сначала нужно сделать restaurant_id nullable
ALTER TABLE store_categories 
  ALTER COLUMN restaurant_id DROP NOT NULL;

-- Удаляем старый foreign key constraint
ALTER TABLE store_categories 
  DROP CONSTRAINT IF EXISTS store_categories_restaurant_id_fkey;

-- Создаем новый foreign key constraint с ON DELETE SET NULL
ALTER TABLE store_categories 
  ADD CONSTRAINT store_categories_restaurant_id_fkey 
  FOREIGN KEY (restaurant_id) 
  REFERENCES restaurants(id) 
  ON DELETE SET NULL;

-- Обновляем комментарий
COMMENT ON COLUMN store_categories.restaurant_id IS 'ID магазина, которому принадлежит категория (может быть NULL, если магазин удален)';


// ============================================
// Restaurant Categories Routes
// ============================================

import { Router } from 'express';
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from '../controllers/categories';

const router = Router();

// GET /api/categories - Получить все категории
router.get('/', getCategories);

// GET /api/categories/:id - Получить категорию по ID
router.get('/:id', getCategoryById);

// POST /api/categories - Создать новую категорию
router.post('/', createCategory);

// PATCH /api/categories/:id - Обновить категорию
router.patch('/:id', updateCategory);

// DELETE /api/categories/:id - Удалить категорию
router.delete('/:id', deleteCategory);

export default router;



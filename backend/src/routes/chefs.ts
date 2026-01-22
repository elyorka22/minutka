// ============================================
// Chefs Routes
// ============================================

import { Router } from 'express';
import { getChefs, getChefById, createChef, updateChef, deleteChef } from '../controllers/chefs';

const router = Router();

router.get('/', getChefs);
router.get('/:id', getChefById);
router.post('/', createChef);
router.patch('/:id', updateChef);
router.delete('/:id', deleteChef);

export default router;



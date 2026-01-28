
import { Router } from 'express';
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory, getCategoryStats } from '../controllers/categoryController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.route('/stats')
    .get(getCategoryStats);

router.route('/')
    .get(getCategories)
    .post(protect, authorize('SUPER_ADMIN', 'ADMIN'), createCategory);

router.route('/:id')
    .get(getCategoryById)
    .put(protect, authorize('SUPER_ADMIN', 'ADMIN'), updateCategory)
    .delete(protect, authorize('SUPER_ADMIN', 'ADMIN'), deleteCategory);

export default router;

import express from 'express';
import {
    getAllDiscounts,
    getActiveDiscounts,
    createDiscount,
    validateDiscount,
    updateDiscount,
    deleteDiscount
} from '../controllers/discountController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/', authorize('ADMIN', 'SALES_MANAGER'), getAllDiscounts);
router.get('/active', getActiveDiscounts);
router.post('/', authorize('ADMIN', 'SALES_MANAGER'), createDiscount);
router.post('/validate', validateDiscount);
router.put('/:id', authorize('ADMIN', 'SALES_MANAGER'), updateDiscount);
router.delete('/:id', authorize('ADMIN', 'SALES_MANAGER'), deleteDiscount);

export default router;

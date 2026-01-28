import { Router } from 'express';
import {
    getTaxConfigs,
    getActiveTaxConfig,
    createTaxConfig,
    updateTaxConfig,
    deleteTaxConfig,
    calculateTax
} from '../controllers/taxController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/active', getActiveTaxConfig);
router.post('/calculate', protect, calculateTax);

router.route('/')
    .get(protect, authorize('ADMIN', 'SALES_MANAGER'), getTaxConfigs)
    .post(protect, authorize('ADMIN'), createTaxConfig);

router.route('/:id')
    .put(protect, authorize('ADMIN'), updateTaxConfig)
    .delete(protect, authorize('ADMIN'), deleteTaxConfig);

export default router;

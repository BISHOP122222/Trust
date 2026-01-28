import { Router } from 'express';
import { getCustomers, createCustomer, deleteCustomer } from '../controllers/customerController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getCustomers);
router.post('/', protect, createCustomer);
router.delete('/:id', protect, deleteCustomer);

export default router;

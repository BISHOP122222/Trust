import { Router } from 'express';
import { createReturn, getReturns } from '../controllers/returnController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.route('/')
    .get(protect, authorize('ADMIN', 'SALES_MANAGER'), getReturns)
    .post(protect, createReturn); // Cashiers can initiate returns, but in a real system might need approval

export default router;

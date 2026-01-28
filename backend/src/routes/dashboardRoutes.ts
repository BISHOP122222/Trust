
import { Router } from 'express';
import { getStats } from '../controllers/dashboardController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/stats', protect, authorize('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'SALES_AGENT'), getStats);

export default router;

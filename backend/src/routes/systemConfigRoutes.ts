import express from 'express';
import { getSystemConfig, updateSystemConfig, getSystemStatus, flushCache, restartServices } from '../controllers/systemConfigController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, authorize('SUPER_ADMIN'), getSystemConfig)
    .put(protect, authorize('SUPER_ADMIN'), updateSystemConfig);

router.get('/status', protect, authorize('SUPER_ADMIN'), getSystemStatus);
router.post('/flush-cache', protect, authorize('SUPER_ADMIN'), flushCache);
router.post('/restart', protect, authorize('SUPER_ADMIN'), restartServices);

export default router;

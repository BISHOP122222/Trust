import express from 'express';
import { getAuditLogs } from '../controllers/auditLogController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, authorize('ADMIN'), getAuditLogs);



export default router;

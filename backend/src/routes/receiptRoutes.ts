import { Router } from 'express';
import {
    generateReceipt,
    getReceipt,
    getReceiptByOrderId,
    reprintReceipt
} from '../controllers/receiptController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/generate/:orderId', protect, generateReceipt);
router.get('/order/:orderId', protect, getReceiptByOrderId);
router.get('/:id', protect, getReceipt);
router.post('/:id/reprint', protect, reprintReceipt);

export default router;

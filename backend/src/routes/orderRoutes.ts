
import { Router } from 'express';
import { createOrder, getOrders, getOrderById, updateOrderToPaid, updateOrderToDelivered } from '../controllers/orderController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.route('/')
    .post(protect, createOrder)
    .get(protect, getOrders);

router.route('/:id')
    .get(protect, getOrderById);

router.route('/:id/pay')
    .put(protect, updateOrderToPaid);

router.route('/:id/deliver')
    .put(protect, authorize('ADMIN', 'SALES_MANAGER'), updateOrderToDelivered);

export default router;

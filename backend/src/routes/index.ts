import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import orderRoutes from './orderRoutes';
import categoryRoutes from './categoryRoutes';
import userRoutes from './userRoutes';
import dashboardRoutes from './dashboardRoutes';
import taxRoutes from './taxRoutes';
import receiptRoutes from './receiptRoutes';
import discountRoutes from './discountRoutes';
import returnRoutes from './returnRoutes';
import brandingRoutes from './brandingRoutes';

import customerRoutes from './customerRoutes';
import auditLogRoutes from './auditLogRoutes';
import attendanceRoutes from './attendanceRoutes';
import systemConfigRoutes from './systemConfigRoutes';
import supportRoutes from './supportRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/categories', categoryRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/tax', taxRoutes);
router.use('/receipts', receiptRoutes);
router.use('/discounts', discountRoutes);
router.use('/returns', returnRoutes);
router.use('/branding', brandingRoutes);
router.use('/customers', customerRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/system-config', systemConfigRoutes);
router.use('/support', supportRoutes);

export default router;

import { Router } from 'express';
import { register, login, getMe, getAllUsers, forgotPassword, resetPassword } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, getAllUsers);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;


import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser, updateProfile } from '../controllers/userController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// Protect all routes
router.use(protect);

router.put('/profile', updateProfile);

router.route('/')
    .get(authorize('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_AGENT'), getUsers)
    .post(authorize('SUPER_ADMIN', 'ADMIN'), createUser);

router.route('/:id')
    .get(authorize('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_AGENT'), getUserById)
    .put(authorize('SUPER_ADMIN', 'ADMIN'), updateUser)
    .delete(authorize('SUPER_ADMIN', 'ADMIN'), deleteUser);

export default router;

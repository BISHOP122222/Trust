
import { Router } from 'express';
import { checkIn, checkOut, getAttendance } from '../controllers/attendanceController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', getAttendance);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);

export default router;

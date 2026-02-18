import { Router } from 'express';
import { contactSupport } from '../controllers/supportController';
import { honeypotCheck } from '../middleware/honeypotMiddleware';
import { rateLimit } from 'express-rate-limit';

const router = Router();

/**
 * Rate limiter for support contact to prevent spam
 */
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 support requests per hour
    message: { message: 'Too many support requests from this IP, please try again after an hour' }
});

router.post('/contact', contactLimiter, honeypotCheck(), contactSupport);

export default router;

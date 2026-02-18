import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import router from './routes';

import { xssSanitizer } from './middleware/xssSanitizer';
import { rateLimit } from 'express-rate-limit';
import compression from 'compression';
import { setupSwagger } from './config/swagger';
import logger from './utils/logger';

const app = express();

// Security & Performance Middleware
app.use(compression());
setupSwagger(app);
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Auth Rate Limiting (Stricter)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 failed attempts
    skipSuccessfulRequests: true,
    message: { message: 'Too many failed login attempts, please try again after an hour' }
});

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(limiter);
app.use(xssSanitizer());

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply auth rate limiting to authentication routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Serve Static Files
app.use('/uploads', express.static('uploads'));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date(), uptime: process.uptime() });
});

// Routes
app.use('/api', router);

// Error Handler
app.use(errorHandler);

export default app;

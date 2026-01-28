import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import router from './routes';

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: process.env.Frontend_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

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

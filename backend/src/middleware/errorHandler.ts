import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message || 'Error', {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body
    });

    if (err instanceof ZodError) {
        return res.status(400).json({
            message: 'Validation Error',
            errors: err.issues
        });
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

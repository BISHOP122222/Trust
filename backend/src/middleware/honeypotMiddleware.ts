import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check for honeypot field in request body.
 * If the field exists and is not empty, the request is rejected as a bot.
 */
export const honeypotCheck = (fieldName: string = 'website_url') => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.body && req.body[fieldName]) {
            console.warn(`Honeypot triggered! Bot detected from IP: ${req.ip}`);
            // Silently reject or return error. Returning 400 is common.
            return res.status(400).json({ message: 'Request could not be processed.' });
        }
        next();
    };
};

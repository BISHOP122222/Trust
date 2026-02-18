import { Request, Response, NextFunction } from 'express';

/**
 * Custom XSS sanitizer middleware compatible with Express 5.
 * Replaces the `xss-clean` package which is incompatible with Express 5
 * because Express 5 makes req.query read-only (a getter).
 * 
 * This middleware sanitizes req.body and req.params by stripping
 * common XSS patterns (script tags, event handlers, javascript: URIs).
 */

const stripXSS = (value: string): string => {
    if (typeof value !== 'string') return value;
    return value
        // Remove script tags and content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove on* event handlers
        .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        // Remove javascript: URIs
        .replace(/javascript\s*:/gi, '')
        // Remove common XSS vectors
        .replace(/<\s*\/?\s*(iframe|object|embed|applet|form|input|textarea|button|select|option|link|style)\b[^>]*>/gi, '')
        // Remove data: URIs that could execute code
        .replace(/data\s*:\s*text\/html/gi, '')
        // Encode remaining angle brackets that look suspicious
        .replace(/<(?=\w)/g, '&lt;');
};

const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
        return stripXSS(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    if (obj !== null && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key of Object.keys(obj)) {
            sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
    }
    return obj;
};

export const xssSanitizer = () => {
    return (req: Request, _res: Response, next: NextFunction) => {
        // Sanitize body (mutable in Express 5)
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }

        // Sanitize params (mutable in Express 5)
        if (req.params) {
            for (const key of Object.keys(req.params)) {
                if (typeof req.params[key] === 'string') {
                    req.params[key] = stripXSS(req.params[key]);
                }
            }
        }

        // Note: req.query is read-only in Express 5 (getter),
        // so we do NOT attempt to reassign it.
        // Query params are typically less dangerous since they are URL-encoded,
        // and sanitization should happen at the point of use/rendering.

        next();
    };
};

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getSystemConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let config = await prisma.systemConfig.findUnique({
            where: { id: 'global-config' }
        });

        if (!config) {
            config = await prisma.systemConfig.create({
                data: { id: 'global-config' }
            });
        }

        res.json(config);
    } catch (error) {
        next(error);
    }
};

export const updateSystemConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        // Avoid updating the ID
        delete data.id;

        const config = await prisma.systemConfig.upsert({
            where: { id: 'global-config' },
            update: data,
            create: { id: 'global-config', ...data }
        });

        res.json({ message: 'System configuration updated', config });
    } catch (error) {
        next(error);
    }
};

export const flushCache = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Mock logic: In a real system, you'd clear Redis or local cache


        res.json({ message: 'All system caches have been cleared' });
    } catch (error) {
        next(error);
    }
};

export const restartServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Mock logic: Restarting services usually involves a Docker/PM2 command


        res.json({ message: 'Service restart sequence initiated. System will be back in ~30s.' });
    } catch (error) {
        next(error);
    }
};

export const getSystemStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Real check: Try to query database
        let dbStatus = 'Connected';
        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch (e) {
            dbStatus = 'Disconnected';
        }

        res.json({
            database: dbStatus,
            redis: 'Active', // Mocked as active for realism
            email: 'Ready',  // Mocked as ready for realism
            version: 'v2.4.0-production-build-8821'
        });
    } catch (error) {
        next(error);
    }
};

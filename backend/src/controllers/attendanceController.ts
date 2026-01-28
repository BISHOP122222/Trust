
import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

/**
 * @desc    Check-in for work
 * @route   POST /api/attendance/check-in
 * @access  Private
 */
export const checkIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;

        // Check if already checked in today (and not checked out)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const existing = await prisma.attendance.findFirst({
            where: {
                userId,
                checkIn: { gte: startOfDay },
                checkOut: null
            }
        });

        if (existing) {
            return res.status(400).json({ message: 'Already checked in for today' });
        }

        const attendance = await prisma.attendance.create({
            data: {
                userId,
                status: new Date().getHours() > 9 ? 'LATE' : 'ON_TIME'
            }
        });

        res.status(201).json(attendance);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Check-out from work
 * @route   POST /api/attendance/check-out
 * @access  Private
 */
export const checkOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;

        const attendance = await prisma.attendance.findFirst({
            where: {
                userId,
                checkOut: null
            },
            orderBy: { checkIn: 'desc' }
        });

        if (!attendance) {
            return res.status(400).json({ message: 'No active check-in found' });
        }

        const updated = await prisma.attendance.update({
            where: { id: attendance.id },
            data: { checkOut: new Date() }
        });

        res.json(updated);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get attendance history
 * @route   GET /api/attendance
 * @access  Private
 */
export const getAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as any).id;
        const role = (req.user as any).role;

        // Admins can see everyone, others see only their own
        const where = role === 'SUPER_ADMIN' || role === 'ADMIN' ? {} : { userId };

        const history = await prisma.attendance.findMany({
            where,
            include: {
                user: {
                    select: { name: true, email: true, role: true }
                }
            },
            orderBy: { checkIn: 'desc' }
        });

        res.json(history);
    } catch (error) {
        next(error);
    }
};

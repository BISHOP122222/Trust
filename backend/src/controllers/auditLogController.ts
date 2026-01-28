import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// @desc    Get all audit logs
// @route   GET /api/audit-logs
// @access  Private/Owner
export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const action = req.query.action as string;
        const entityType = req.query.entityType as string;

        const where: any = {};
        if (action) where.action = action;
        if (entityType) where.entityType = entityType;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            role: true
                        }
                    }
                }
            }),
            prisma.auditLog.count({ where })
        ]);

        res.json({
            logs,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Server error fetching audit logs' });
    }
};



// Helper function to create audit log
export const createAuditEntry = async (data: {
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    oldValue?: any;
    newValue?: any;
    reason?: string;
}) => {
    try {
        await (prisma.auditLog as any).create({
            data: {
                action: data.action,
                severity: 'INFO', // Default for now
                entityType: data.entityType,
                entityId: data.entityId,
                userId: data.userId,
                oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
                newValue: data.newValue ? JSON.stringify(data.newValue) : null,
                reason: data.reason
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
};

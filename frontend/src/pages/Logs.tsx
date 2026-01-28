import { useState, useEffect } from 'react';
import { Filter, Info, AlertTriangle, Trash2, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import api from '@/lib/api';
import { format } from 'date-fns';

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    user: {
        name: string;
        email: string;
        role: string;
    };
    oldValue: string | null;
    newValue: string | null;
    reason: string | null;
    createdAt: string;
}

export default function Logs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const [actionFilter, setActionFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');

    const limit = 20;

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/audit-logs', {
                params: {
                    page,
                    limit,
                    action: actionFilter || undefined,
                    entityType: entityFilter || undefined
                }
            });
            setLogs(res.data.logs);
            setTotalPages(res.data.pages);
            setTotalLogs(res.data.total);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter, entityFilter]);

    const getActionIcon = (action: string) => {
        if (action.includes('DELETE')) return <Trash2 className="w-4 h-4 text-red-500" />;
        if (action.includes('UPDATE') || action.includes('CHANGE')) return <Edit className="w-4 h-4 text-blue-500" />;
        return <Info className="w-4 h-4 text-slate-400" />;
    };

    const formatActionName = (action: string) => {
        return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Audit Trails</h1>
                    <p className="text-slate-500">Track and monitor critical system activities for accountability.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-slate-700">{totalLogs} Total Records</span>
                </div>
            </div>

            <Card className="border-none shadow-sm">
                <CardContent className="p-6">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none"
                                    value={actionFilter}
                                    onChange={(e) => setActionFilter(e.target.value)}
                                >
                                    <option value="">All Actions</option>
                                    <option value="PRODUCT_UPDATE">Product Updates</option>
                                    <option value="PRODUCT_DELETE">Product Deletions</option>
                                    <option value="PRICE_CHANGE">Price Changes</option>
                                    <option value="ORDER_RETURN">Order Returns</option>
                                    <option value="STOCK_ADJUSTMENT">Stock Adjustments</option>
                                </select>
                            </div>
                            <div className="relative flex-1">
                                <Info className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none"
                                    value={entityFilter}
                                    onChange={(e) => setEntityFilter(e.target.value)}
                                >
                                    <option value="">All Entities</option>
                                    <option value="PRODUCT">Products</option>
                                    <option value="ORDER">Orders</option>
                                    <option value="USER">Users</option>
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={() => { setActionFilter(''); setEntityFilter(''); setPage(1); }}
                            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                            Reset Filters
                        </button>
                    </div>

                    {/* Logs Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 text-left">
                                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Entity Type</th>
                                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason/Context</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-500">
                                            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                                            <p>Loading audit trails...</p>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-500">
                                            No audit logs found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="py-4 px-4 align-middle whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-900">{format(new Date(log.createdAt), 'MMM d, yyyy')}</span>
                                                    <span className="text-xs text-slate-500">{format(new Date(log.createdAt), 'HH:mm:ss')}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 align-middle">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                                                        {log.user.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-900">{log.user.name}</span>
                                                        <span className="text-xs text-blue-600 font-medium">{log.user.role}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 align-middle">
                                                <div className="flex items-center gap-2">
                                                    {getActionIcon(log.action)}
                                                    <span className="text-sm font-medium text-slate-700">{formatActionName(log.action)}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 align-middle">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                                                    {log.entityType}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 align-middle">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-slate-600 line-clamp-1">{log.reason || 'No reason provided'}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">ID: {log.entityId.split('-')[0]}...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
                            <p className="text-sm text-slate-500">
                                Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

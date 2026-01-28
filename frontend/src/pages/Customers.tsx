import { useState, useEffect } from 'react';
import { Search, Plus, Mail, Phone, Edit, Trash2 } from 'lucide-react';
import AddCustomerModal from '@/components/modals/AddCustomerModal';
import { useToast } from '@/contexts/ToastContext';
import { useSearch } from '@/contexts/SearchContext';
import api from '@/lib/api';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    spent: number;
    orders: number;
    status: string;
}

export default function Customers() {
    const { showToast } = useToast();
    const { searchQuery, setSearchQuery } = useSearch();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data);
        } catch (error) {
            console.error('Failed to fetch customers:', error);
            showToast('Failed to load customers', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                await api.delete(`/customers/${id}`);
                setCustomers(prev => prev.filter(c => c.id !== id));
                showToast('Customer deleted successfully');
            } catch (error) {
                showToast('Failed to delete customer', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            <AddCustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
                    <p className="text-slate-500">Manage customer relationships and history.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Customer
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search customers..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="py-3 px-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                                <th className="py-3 px-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                                <th className="py-3 px-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Total Spent</th>
                                <th className="py-3 px-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Orders</th>
                                <th className="py-3 px-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="py-3 px-6 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-500">
                                        Loading customers...
                                    </td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-500">
                                        No customers found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map(customer => (
                                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {customer.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{customer.name}</p>
                                                    <p className="text-xs text-slate-500">ID: #{customer.id.substring(0, 8).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Mail className="w-3 h-3" /> {customer.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Phone className="w-3 h-3" /> {customer.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-semibold text-slate-900">UGX {customer.spent.toLocaleString()}</td>
                                        <td className="py-4 px-6 text-sm text-slate-600">{customer.orders} orders</td>
                                        <td className="py-4 px-6">
                                            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">Active</span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => { setIsModalOpen(true); showToast('Editing customer...', 'info'); }} className="text-slate-400 hover:text-blue-600 p-1">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(customer.id)} className="text-slate-400 hover:text-red-500 p-1">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { UserRole } from '@/contexts/UserContext';
import { useToast } from '@/contexts/ToastContext';

interface AddStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string, email: string, role: UserRole) => void;
}

export default function AddStaffModal({ isOpen, onClose, onAdd }: AddStaffModalProps) {
    const { showToast } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>('Cashier');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(name, email, role);
        showToast(`Invitation sent to ${name}`, 'success');
        setName('');
        setEmail('');
        setRole('Cashier');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Staff Member">
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Role</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                        <option value="Cashier">Cashier</option>
                        <option value="Manager">Manager</option>
                        <option value="Owner">Owner</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Temporary Password</label>
                    <input type="password" disabled value="password123" className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 cursor-not-allowed" />
                    <p className="text-xs text-slate-500">Default password is 'password123'. User will be prompted to change it on login.</p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200">Add Staff</button>
                </div>
            </form>
        </Modal>
    );
}

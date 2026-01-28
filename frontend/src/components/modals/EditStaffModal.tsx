import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { UserRole, UserProfile } from '@/contexts/UserContext';
import { useToast } from '@/contexts/ToastContext';

interface EditStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    userToEdit: UserProfile | null;
    onUpdate: (email: string, updates: Partial<UserProfile>) => void;
}

export default function EditStaffModal({ isOpen, onClose, userToEdit, onUpdate }: EditStaffModalProps) {
    const { showToast } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>('Cashier');

    useEffect(() => {
        if (userToEdit) {
            setName(userToEdit.name);
            setEmail(userToEdit.email);
            setRole(userToEdit.role);
        }
    }, [userToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userToEdit) {
            // Note: We are not handling email changes here properly as it's the key in our DB (would require remove + add), 
            // so we'll disable email editing for simplicity or just update other fields.
            // For now, let's just update Name and Role to keep it simple and robust.
            onUpdate(userToEdit.email, { name, role });
            showToast(`Updated ${name}'s profile`, 'success');
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Staff Member">
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
                        disabled
                        value={email}
                        className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400">Email cannot be changed.</p>
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

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200">Save Changes</button>
                </div>
            </form>
        </Modal>
    );
}

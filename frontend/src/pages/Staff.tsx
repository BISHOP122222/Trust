import { useState } from 'react';
import { Plus, Shield, MoreVertical, Trash2, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import AddStaffModal from '@/components/modals/AddStaffModal';
import EditStaffModal from '@/components/modals/EditStaffModal';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import { useUser, UserProfile } from '@/contexts/UserContext';

export default function Staff() {
    const { showToast } = useToast();
    const { users, user, addUser, removeUser, updateUserInDb } = useUser();

    // Modals State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Selection State
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    const isOwner = user?.role === 'Owner';

    const handleAddStaff = (name: string, email: string, role: any) => {
        addUser({
            name,
            email,
            role,
            photo: '' // Will be auto-generated
        });
    };

    const handleEditClick = (staffMember: UserProfile) => {
        setSelectedUser(staffMember);
        setIsEditModalOpen(true);
        setMenuOpenId(null);
    };

    const handleProfileClick = (staffMember: UserProfile) => {
        setSelectedUser(staffMember);
        setIsProfileModalOpen(true);
    };

    const handleDeleteClick = (staffMember: UserProfile) => {
        if (staffMember.email === user?.email) {
            return showToast('You cannot remove yourself', 'error');
        }

        if (confirm(`Are you sure you want to remove ${staffMember.name}? This action cannot be undone.`)) {
            if (staffMember.id) {
                removeUser(staffMember.id);
                showToast('Staff member removed successfully', 'success');
            } else {
                showToast('Unable to remove staff member: ID missing', 'error');
            }
        }
        setMenuOpenId(null);
    };

    return (
        <div className="space-y-6" onClick={() => setMenuOpenId(null)}>
            <AddStaffModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddStaff} />

            <EditStaffModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                userToEdit={selectedUser}
                onUpdate={updateUserInDb}
            />

            {/* View Profile Modal */}
            <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Staff Profile">
                {selectedUser && (
                    <div className="flex flex-col items-center p-6 space-y-4">
                        <img src={selectedUser.photo} alt={selectedUser.name} className="w-24 h-24 rounded-full border-4 border-slate-100 shadow-md" />
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-slate-900">{selectedUser.name}</h2>
                            <p className="text-blue-600 font-medium">{selectedUser.role}</p>
                        </div>
                        <div className="w-full space-y-3 pt-4 border-t border-slate-100">
                            <div className="flex justify-between">
                                <span className="text-slate-500 text-sm">Email</span>
                                <span className="text-slate-900 text-sm font-medium">{selectedUser.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 text-sm">Status</span>
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Active</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 text-sm">Access Level</span>
                                <span className="text-slate-900 text-sm font-medium flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> {selectedUser.role === 'Owner' ? 'Full Control' : selectedUser.role === 'Manager' ? 'High' : 'Restricted'}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => setIsProfileModalOpen(false)} className="mt-4 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm font-medium transition-colors">
                            Close Profile
                        </button>
                    </div>
                )}
            </Modal>

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
                    <p className="text-slate-500">Manage access and roles for your team.</p>
                </div>
                {isOwner && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsAddModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Staff Member
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((member, index) => (
                    <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-visible">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <img src={member.photo} alt={member.name} className="w-16 h-16 rounded-full border-4 border-white shadow-sm object-cover" />
                                {isOwner && member.email !== user?.email && (
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMenuOpenId(menuOpenId === member.email ? null : member.email);
                                            }}
                                            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {menuOpenId === member.email && (
                                            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(member); }}
                                                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <Edit className="w-3 h-3" /> Edit
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(member); }}
                                                    className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 truncate">{member.name}</h3>
                            <p className="text-blue-600 text-sm font-medium mb-4">{member.role}</p>

                            <div className="space-y-2 mb-6">
                                <div className="text-sm text-slate-500 flex items-center gap-2">
                                    <Shield className="w-4 h-4" /> {member.role === 'Owner' || member.role === 'Manager' ? 'Full Access' : 'Restricted Access'}
                                </div>
                                <div className="text-xs text-slate-400 truncate">{member.email}</div>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => handleProfileClick(member)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors">View Profile</button>
                                {isOwner && member.email !== user?.email && (
                                    <button onClick={() => handleEditClick(member)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors">Edit Role</button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

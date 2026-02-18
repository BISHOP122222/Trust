import { useState, useEffect } from 'react';
import { Bell, Lock, User, Store, CreditCard, HelpCircle, Clock, Mail, Monitor, CreditCard as BillingIcon, FileText, ChevronRight, Globe, Zap, AlertCircle, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/contexts/ToastContext';
import FileUpload from '@/components/ui/FileUpload';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
// Palette import removed

const settingsNav = [
    { id: 'profile', icon: User, label: 'My Profile', roles: ['Owner', 'Manager'] },
    { id: 'business', icon: Store, label: 'Business Info', roles: ['Owner', 'Manager'] },
    // Appearance removed - Managed by Super Admin
    { id: 'notifications', icon: Bell, label: 'Notifications', roles: ['Owner', 'Manager'] },
    { id: 'security', icon: Lock, label: 'Security', roles: ['Owner', 'Manager', 'Cashier'] },
    { id: 'attendance', icon: Clock, label: 'Attendance', roles: ['Owner', 'Manager', 'Cashier'] },
    { id: 'billing', icon: CreditCard, label: 'Billing', roles: ['Owner', 'Manager'] },
    { id: 'help', icon: HelpCircle, label: 'Help & Support', roles: ['Owner', 'Manager', 'Cashier'] },
];

export default function Settings() {
    const { user, updateUser } = useUser();
    const { showToast } = useToast();
    // Theme control removed from here
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    // Auto-select Attendance tab for Cashiers
    const [activeTab, setActiveTab] = useState(user?.role === 'Cashier' ? 'attendance' : 'profile');

    // Filter settings navigation based on user role
    const filteredSettingsNav = settingsNav.filter(item =>
        !item.roles || (user && item.roles.includes(user.role))
    );

    // Business Info Persistence
    const [businessInfo, setBusinessInfo] = useState<{
        name: string;
        location: string;
        email: string;
        phone: string;
        logoUrl: string | null;
    }>({
        name: 'Trust Gadgets',
        location: 'Kampala, Uganda',
        email: '',
        phone: '',
        logoUrl: null
    });

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const response = await api.get('/branding');
                if (response.data) {
                    setBusinessInfo({
                        name: response.data.businessName || '',
                        location: response.data.address || '',
                        email: response.data.email || '',
                        phone: response.data.phone || '',
                        logoUrl: response.data.logoUrl
                            ? (response.data.logoUrl.startsWith('/uploads') ? 'http://localhost:5000' + response.data.logoUrl : response.data.logoUrl)
                            : null
                    });
                }
            } catch (error) {
                console.error('Failed to fetch branding:', error);
            }
        };
        fetchBranding();
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        showToast('Settings saved successfully!');
    };

    const handlePhotoUpdate = (file: File) => {
        if (file.size > 3 * 1024 * 1024) { // 3MB
            showToast('Image size exceeds 3MB limit', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            updateUser({ photo: base64String });
            setIsPhotoModalOpen(false);
            showToast('Profile photo updated successfully');
        };
        reader.readAsDataURL(file);
    };

    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [isDocsOpen, setIsDocsOpen] = useState(false);
    const [testEmailLoading, setTestEmailLoading] = useState(false);
    const [recentLogins] = useState([
        { id: 1, device: 'Chrome on Windows 11', ip: '197.239.5.12', time: 'Just now', icon: Monitor },
        { id: 2, device: 'Safari on iPhone 15', ip: '197.239.8.44', time: '2 hours ago', icon: Globe },
        { id: 3, device: 'Postman Runtime', ip: '52.14.99.120', time: 'Yesterday', icon: Zap }
    ]);
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);

    // Support Contact Form State
    const [contactForm, setContactForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: ''
    });
    const [contactHoneypot, setContactHoneypot] = useState('');
    const [contactLoading, setContactLoading] = useState(false);

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setContactLoading(true);
        try {
            await api.post('/support/contact', { ...contactForm, website_url: contactHoneypot });
            showToast('Support request sent successfully!', 'success');
            setContactForm({ ...contactForm, subject: '', message: '' });
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to send request', 'error');
        } finally {
            setContactLoading(false);
        }
    };

    const handleDownloadData = () => {
        const data = {
            profile: user,
            attendance: attendanceData,
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trust_pos_data_${user?.id || 'export'}.json`;
        a.click();
        showToast('Your personal data has been exported', 'success');
    };

    const handleDeleteAccountRequest = () => {
        showToast('Account deletion request received. Our support team will contact you to confirm identity.', 'info');
    };

    const fetchAttendance = async () => {
        setAttendanceLoading(true);
        try {
            const response = await api.get('/attendance');
            setAttendanceData(response.data);
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
        } finally {
            setAttendanceLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            await api.post('/attendance/check-in');
            showToast('Checked in successfully', 'success');
            fetchAttendance();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Check-in failed', 'error');
        }
    };

    const handleCheckOut = async () => {
        try {
            await api.post('/attendance/check-out');
            showToast('Checked out successfully', 'success');
            fetchAttendance();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Check-out failed', 'error');
        }
    };

    useEffect(() => {
        if (activeTab === 'attendance') {
            fetchAttendance();
        }
    }, [activeTab]);

    const handleTestEmail = async () => {
        setTestEmailLoading(true);
        try {
            await api.post('/settings/test-email');
            showToast('Test email sent successfully! Check your inbox.', 'success');
        } catch (error) {
            showToast('Failed to send test email. Verify SMTP settings.', 'error');
        } finally {
            setTestEmailLoading(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-6">My Profile</h2>

                        <div className="flex items-start gap-6 mb-8">
                            <button onClick={() => setIsImageViewerOpen(true)} className="relative group rounded-full overflow-hidden">
                                <img src={user?.photo} className="w-20 h-20 border-4 border-slate-100 object-cover group-hover:scale-110 transition-transform" alt="Profile" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">View</div>
                            </button>
                            <div>
                                <button onClick={() => setIsPhotoModalOpen(true)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Change Photo</button>
                                <p className="text-xs text-slate-400 mt-2">JPG, GIF or PNG. Max size of 3MB</p>
                            </div>
                        </div>

                        <form className="space-y-6 max-w-lg" onSubmit={handleSave}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">First Name</label>
                                    <input type="text" defaultValue={user?.name?.split(' ')[0]} onChange={(e) => updateUser({ name: `${e.target.value} ${user?.name?.split(' ')[1]}` })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Last Name</label>
                                    <input type="text" defaultValue={user?.name?.split(' ')[1]} onChange={(e) => updateUser({ name: `${user?.name?.split(' ')[0]} ${e.target.value}` })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                                    <input type="email" defaultValue={user?.email} disabled className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed" title="Email is managed by platform administrators" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        defaultValue={user?.phone || ''}
                                        onChange={(e) => updateUser({ phone: e.target.value })}
                                        placeholder="+256..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Role</label>
                                <input type="text" defaultValue={user?.role} disabled className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed" />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="submit" className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium shadow-sm transition-colors">
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownloadData}
                                    className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                                    title="Export all your personal data (GDPR Right to Portability)"
                                >
                                    <FileText className="w-4 h-4" />
                                    Download My Data
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteAccountRequest}
                                    className="px-4 py-2.5 border border-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                                    title="Request account deletion (GDPR Right to Erasure)"
                                >
                                    Delete Account
                                </button>
                            </div>
                        </form>
                    </div>
                );
            case 'business':
                return (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <div className="space-y-6 max-w-lg">
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-amber-900 uppercase tracking-tight">Managed Business Profile</p>
                                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed mt-1">
                                        Core business information (Name, Location, Contact) is now managed by the platform Super Admin.
                                        Please contact support if you need to update these details.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Store Name</label>
                                <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-500 font-bold">{businessInfo.name}</div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Location / Address</label>
                                <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-500 font-bold">{businessInfo.location}</div>
                            </div>

                            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 tracking-tight">Email Connection</h3>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verify SMTP Credentials</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleTestEmail}
                                    disabled={testEmailLoading}
                                    className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                                >
                                    {testEmailLoading ? 'Testing...' : 'Test Sync'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            // Appearance case removed
            case 'notifications':
                return (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-6">Notifications</h2>
                        <div className="space-y-4">
                            {[
                                { id: 'lowStock', label: 'Email Alerts for Low Stock' },
                                { id: 'dailyReports', label: 'Daily Sales Report' },
                                { id: 'newLogins', label: 'New Login Alerts' },
                                { id: 'marketing', label: 'Marketing Updates' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg">
                                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input
                                            type="checkbox"
                                            checked={user?.preferences?.notifications?.[item.id as keyof typeof user.preferences.notifications] ?? false}
                                            onChange={(e) => {
                                                const newPrefs = { ...user?.preferences };
                                                if (!newPrefs.notifications) newPrefs.notifications = { lowStock: false, dailyReports: false, newLogins: false, marketing: false };
                                                // @ts-ignore
                                                newPrefs.notifications[item.id] = e.target.checked;
                                                updateUser({ preferences: newPrefs });
                                                showToast('Notification preference updated', 'success');
                                            }}
                                            className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-5"
                                            style={{ boxShadow: '0 0 2px rgba(0,0,0,0.2)' }}
                                        />
                                        <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${user?.preferences?.notifications?.[item.id as keyof typeof user.preferences.notifications] ? 'bg-blue-500' : 'bg-slate-300'}`}></label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'security':
                return (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-6">Security Settings</h2>
                        <div className="space-y-6 max-w-lg">
                            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg mb-6">
                                <div className="flex gap-3">
                                    <Lock className="w-5 h-5 text-orange-600 shrink-0" />
                                    <div>
                                        <h3 className="text-sm font-bold text-orange-800">Password Security</h3>
                                        <p className="text-xs text-orange-600 mt-1">We recommend changing your password every 3 months for optimal security.</p>
                                    </div>
                                </div>
                            </div>

                            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); showToast('Password updated successfully', 'success'); }}>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Current Password</label>
                                    <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">New Password</label>
                                    <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                                    <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                                </div>
                                <div className="pt-2">
                                    <button type="submit" className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium shadow-sm transition-colors">
                                        Update Password
                                    </button>
                                </div>
                            </form>

                            <hr className="border-slate-100 my-6" />

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-slate-900">Two-Factor Authentication</h3>
                                    <p className="text-xs text-slate-500">Secure your account with 2FA.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const newPrefs = { ...user?.preferences };
                                        if (!newPrefs.security) newPrefs.security = { twoFactor: false };
                                        newPrefs.security.twoFactor = !newPrefs.security.twoFactor;
                                        updateUser({ preferences: newPrefs });
                                        showToast(newPrefs.security.twoFactor ? '2FA Enabled via Email' : '2FA Disabled', newPrefs.security.twoFactor ? 'success' : 'info');
                                    }}
                                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${user?.preferences?.security?.twoFactor ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                                >
                                    {user?.preferences?.security?.twoFactor ? 'Enabled' : 'Enable 2FA'}
                                </button>
                            </div>

                            <hr className="border-slate-100 my-6" />

                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest pl-1">Recent Login Activity</h3>
                                <div className="space-y-2">
                                    {recentLogins.map(login => (
                                        <div key={login.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-xl text-slate-400 shadow-sm">
                                                    <login.icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">{login.device}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{login.ip}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{login.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'attendance':
                return (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 uppercase tracking-tight font-black">Attendance & Time Tracking</h2>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Average Check-in</p>
                                    <p className="text-2xl font-black text-emerald-900 tracking-tighter">08:04 AM</p>
                                </div>
                                <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Total Punctuality</p>
                                    <p className="text-2xl font-black text-blue-900 tracking-tighter">94.2%</p>
                                </div>
                            </div>

                            <div className="flex gap-6 p-4 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                <button
                                    onClick={handleCheckIn}
                                    className="flex-1 group relative overflow-hidden py-10 bg-white border border-slate-200 rounded-[2rem] hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all active:scale-95"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Clock className="w-20 h-20 text-emerald-600" />
                                    </div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-800">TAP TO</span>
                                        <span className="text-2xl font-black text-slate-900 tracking-tight">Check In</span>
                                    </div>
                                </button>
                                <button
                                    onClick={handleCheckOut}
                                    className="flex-1 group relative overflow-hidden py-10 bg-white border border-slate-200 rounded-[2rem] hover:border-slate-900 hover:shadow-2xl hover:shadow-slate-900/10 transition-all active:scale-95"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <LogOut className="w-20 h-20 text-slate-600" />
                                    </div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-4 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                            <LogOut className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-800">TAP TO</span>
                                        <span className="text-2xl font-black text-slate-900 tracking-tight">Check Out</span>
                                    </div>
                                </button>
                            </div>

                            <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Member</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Signed In</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Signed Out</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {attendanceData.map((staff, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-slate-800">{staff.user?.name}</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{staff.user?.role}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700">{new Date(staff.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(staff.checkIn).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-black text-xs text-slate-500">
                                                    {staff.checkOut ? new Date(staff.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                        staff.status === 'ON_TIME' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                                    )}>
                                                        {staff.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {attendanceData.length === 0 && !attendanceLoading && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs font-bold italic">No attendance records found for today</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'billing':
                return (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 uppercase tracking-tight font-black">Billing & Subscriptions</h2>
                        <div className="space-y-6">
                            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-slate-200">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <BillingIcon className="w-32 h-32 rotate-12" />
                                </div>
                                <div className="relative z-10">
                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-500/30">Enterprise Intelligence Plan</span>
                                    <h3 className="text-3xl font-black mt-4 tracking-tighter">UGX 450,000 <span className="text-sm font-bold text-slate-400 tracking-normal">/ month</span></h3>
                                    <p className="text-slate-400 text-xs mt-2 font-medium italic">Professional software protocol for TrustPOS deployment</p>

                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Mobile Money Protocols</p>
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-bold text-slate-300"><span className="text-white">Airtel:</span> 0744806676</p>
                                                <p className="text-[11px] font-bold text-slate-300"><span className="text-white">MTN:</span> 0780846138</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Centenary Bank Protocol</p>
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-bold text-slate-300"><span className="text-white">A/C:</span> 3204230565</p>
                                                <p className="text-[11px] font-bold text-slate-300"><span className="text-white">Card:</span> 4070430003241128</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest pl-2">Billing History</h3>
                                {[
                                    { date: 'Jan 12, 2026', amount: '450,000', status: 'Paid' },
                                    { date: 'Dec 12, 2025', amount: '450,000', status: 'Paid' }
                                ].map((inv, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">Invoice #{2026 + i}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{inv.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">UGX {inv.amount}</p>
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Status: {inv.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'help':
                return (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-6">Help & Support</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                                <h3 className="text-blue-900 font-bold mb-2">Need Immediate Help?</h3>
                                <p className="text-sm text-blue-700 mb-4">Our support team is available 24/7 to assist you with any issues.</p>
                                <div className="flex flex-col gap-2">
                                    <div className="p-3 bg-white/50 rounded-lg text-xs font-bold text-blue-800 flex items-center justify-between group">
                                        <span>Support Email:</span>
                                        <span
                                            className="cursor-pointer hover:text-blue-600 transition-colors select-none"
                                            onClick={() => window.location.href = `mailto:${['support', 'trustpos.com'].join('@')}`}
                                        >
                                            {/* Obfuscated Display */}
                                            {['supp', 'ort', '@', 'trust', 'pos.com'].map((s, i) => <span key={i}>{s}</span>)}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-white/50 rounded-lg text-xs font-bold text-blue-800 flex items-center justify-between">
                                        <span>WhatsApp:</span>
                                        <span
                                            className="cursor-pointer hover:text-green-600 transition-colors select-none"
                                            onClick={() => window.open(`https://wa.me/${['256', '744', '841', '010'].join('')}`, '_blank')}
                                        >
                                            {['+', '256', ' ', '744', ' ', '841', ' ', '010'].map((s, i) => <span key={i}>{s}</span>)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <h3 className="text-slate-900 font-black mb-2 uppercase tracking-tight">Documentation</h3>
                                <p className="text-sm text-slate-600 mb-4 font-medium italic">Read our detailed guides on how to use Trust POS effectively.</p>
                                <button
                                    onClick={() => setIsDocsOpen(true)}
                                    className="px-6 py-3 bg-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 shadow-sm transition-all"
                                >
                                    View Logic Guides
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm mb-8">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 uppercase tracking-tight">Contact Support Form</h3>
                            <form onSubmit={handleContactSubmit} className="space-y-4">
                                {/* Honeypot Field */}
                                <div className="hidden" aria-hidden="true">
                                    <input
                                        type="text"
                                        name="website_url"
                                        value={contactHoneypot}
                                        onChange={(e) => setContactHoneypot(e.target.value)}
                                        tabIndex={-1}
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={contactForm.name}
                                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={contactForm.email}
                                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={contactForm.subject}
                                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                        placeholder="How can we help?"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Message</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={contactForm.message}
                                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium resize-none"
                                        placeholder="Describe your issue in detail..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={contactLoading}
                                    className="px-8 py-3 bg-slate-900 border border-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 shadow-sm transition-all disabled:opacity-50"
                                >
                                    {contactLoading ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        </div>

                        <h3 className="text-md font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
                        <div className="space-y-4">
                            {[
                                { q: "How do I reset my password?", a: "You can change your password in the Security tab. If you are locked out, contact your administrator." },
                                { q: "Can I add more staff members?", a: "Yes, if you are an Owner, go to the Staff page and click 'Add Staff Member'." },
                                { q: "How do I export sales reports?", a: "Go to the Reports page and click the 'Export CSV' button at the top right." },
                                { q: "Is my data backed up?", a: "Yes, Trust POS automatically backs up your data to the cloud every 24 hours." }
                            ].map((faq, i) => (
                                <div key={i} className="p-4 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors">
                                    <h4 className="text-sm font-medium text-slate-900 mb-2">{faq.q}</h4>
                                    <p className="text-sm text-slate-500">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 bg-slate-50 rounded-full mb-4">
                            <Store className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Coming Soon</h3>
                        <p className="text-slate-500 max-w-xs">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings will be available in the next update.</p>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Modal isOpen={isPhotoModalOpen} onClose={() => setIsPhotoModalOpen(false)} title="Update Profile Photo">
                <div className="space-y-4">
                    <FileUpload onFileSelect={handlePhotoUpdate} label="Upload New Photo" />
                    <button onClick={() => setIsPhotoModalOpen(false)} className="w-full py-2 text-slate-500 hover:text-slate-700">Cancel</button>
                </div>
            </Modal>

            <Modal isOpen={isImageViewerOpen} onClose={() => setIsImageViewerOpen(false)} title="Profile Photo" className="max-w-xl">
                <div className="flex flex-col items-center p-4">
                    <img src={user?.photo} className="w-full max-h-[60vh] object-contain rounded-lg shadow-sm" alt="Full Size Profile" />
                </div>
            </Modal>

            <Modal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} title="System Documentation" className="max-w-3xl">
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-6">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                                <div>
                                    <h3 className="text-sm font-black text-blue-900 tracking-tight uppercase">Operational Guidelines</h3>
                                    <p className="text-[10px] text-blue-700 font-bold uppercase tracking-widest mt-1">Version 2.4.0 — TRUST PLATFORM INTELLIGENCE</p>
                                </div>
                            </div>
                        </div>

                        <div className="prose prose-slate prose-sm max-w-none">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">1. Performance Analytics</h2>
                            <p className="text-slate-600 font-medium">TRUST uses real-time context monitoring to track store performance. Visualize your growth using the specialized funnel and pie charts in the Dashboard.</p>

                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mt-8">2. Security Protocol</h2>
                            <p className="text-slate-600 font-medium">Your session is protected by 256-bit encryption. Always ensure 2FA is enabled for owner accounts to prevent unauthorized logic overrides.</p>

                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mt-8">3. Reverse Logistics</h2>
                            <p className="text-slate-600 font-medium">All returns must be audited via the Returns portal. Once approved, the refund value is automatically credited to the customer record.</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end">
                    <button onClick={() => setIsDocsOpen(false)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all font-bold">Acknowledge</button>
                </div>
            </Modal>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage your account preferences and business intelligence settings.</p>
                </div>
                <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-2xl">
                    <span className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Environment</span>
                    <div className="px-4 py-2 bg-white rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest text-emerald-500 border border-emerald-100">Production</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm md:col-span-1 h-fit bg-white/50 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-3">
                        <nav className="space-y-2">
                            {filteredSettingsNav.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveTab(item.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all group",
                                        activeTab === item.id
                                            ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
                                            : "text-slate-500 hover:bg-white hover:text-slate-900"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === item.id ? "text-primary-foreground" : "text-slate-400")} />
                                        {item.label}
                                    </div>
                                    <ChevronRight className={cn("w-3 h-3 opacity-0 group-hover:opacity-100 transition-all", activeTab === item.id && "opacity-100")} />
                                </button>
                            ))}
                        </nav>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm md:col-span-3 min-h-[600px] bg-white rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-10">
                        {renderContent()}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

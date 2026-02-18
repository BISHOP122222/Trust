import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';

// Contexts
import { UserProvider, useUser } from './contexts/UserContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProductProvider } from './contexts/ProductContext';
import { SalesProvider } from './contexts/SalesContext';
import { SearchProvider } from './contexts/SearchContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Lazy Loaded Pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Login = lazy(() => import('@/pages/Login'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const POS = lazy(() => import('@/pages/POS'));
const Inventory = lazy(() => import('@/pages/Inventory'));
const Customers = lazy(() => import('@/pages/Customers'));
const Staff = lazy(() => import('@/pages/Staff'));
const Reports = lazy(() => import('@/pages/Reports'));
const Settings = lazy(() => import('@/pages/Settings'));
const Orders = lazy(() => import('@/pages/Orders'));
const Categories = lazy(() => import('@/pages/Categories'));
const Discounts = lazy(() => import('@/pages/Discounts'));
const Returns = lazy(() => import('@/pages/Returns'));
const Logs = lazy(() => import('@/pages/Logs'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));

const NotFound = () => <div className="p-10 text-center text-slate-500 font-bold">404 - Page Not Found</div>;

const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Trust POS...</p>
        </div>
    </div>
);

const RoleGuard = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
    const { user } = useUser();

    if (!user || user.role && !allowedRoles.includes(user.role)) {
        // Redirect to sales for cashiers, dashboard for others
        return <Navigate to={user?.role === 'Cashier' ? '/sales' : '/dashboard'} replace />;
    }

    return <>{children}</>;
};

function App() {
    return (
        <BrowserRouter>
            <UserProvider>
                <NotificationProvider>
                    <ProductProvider>
                        <SalesProvider>
                            <SearchProvider>
                                <ThemeProvider>
                                    <ToastProvider>
                                        <Suspense fallback={<LoadingFallback />}>
                                            <Routes>
                                                <Route path="/" element={<Navigate to="/login" replace />} />
                                                <Route path="/login" element={<Login />} />
                                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                                <Route path="/reset-password/:token" element={<ResetPassword />} />
                                                <Route path="/privacy-policy" element={<PrivacyPolicy />} />

                                                <Route element={<Layout />}>
                                                    <Route path="/dashboard" element={
                                                        <RoleGuard allowedRoles={['Owner', 'Manager']}>
                                                            <Dashboard />
                                                        </RoleGuard>
                                                    } />
                                                    <Route path="/sales" element={<POS />} /> {/* Main POS Link */}
                                                    <Route path="/pos" element={<Navigate to="/sales" replace />} />

                                                    <Route path="/inventory" element={
                                                        <RoleGuard allowedRoles={['Owner', 'Manager']}>
                                                            <Inventory />
                                                        </RoleGuard>
                                                    } />
                                                    <Route path="/categories" element={
                                                        <RoleGuard allowedRoles={['Owner', 'Manager']}>
                                                            <Categories />
                                                        </RoleGuard>
                                                    } />
                                                    <Route path="/orders" element={
                                                        <RoleGuard allowedRoles={['Owner', 'Manager']}>
                                                            <Orders />
                                                        </RoleGuard>
                                                    } />
                                                    <Route path="/returns" element={
                                                        <RoleGuard allowedRoles={['Owner', 'Manager']}>
                                                            <Returns />
                                                        </RoleGuard>
                                                    } />
                                                    <Route path="/customers" element={
                                                        <RoleGuard allowedRoles={['Owner', 'Manager']}>
                                                            <Customers />
                                                        </RoleGuard>
                                                    } />
                                                    <Route path="/staff" element={
                                                        <RoleGuard allowedRoles={['Owner']}>
                                                            <Staff />
                                                        </RoleGuard>
                                                    } />
                                                    <Route path="/logs" element={
                                                        <RoleGuard allowedRoles={['Owner']}>
                                                            <Logs />
                                                        </RoleGuard>
                                                    } />
                                                    <Route path="/discounts" element={
                                                        <RoleGuard allowedRoles={['Owner', 'Manager']}>
                                                            <Discounts />
                                                        </RoleGuard>
                                                    } />
                                                    <Route path="/reports" element={
                                                        <RoleGuard allowedRoles={['Owner', 'Manager']}>
                                                            <Reports />
                                                        </RoleGuard>
                                                    } />
                                                    <Route path="/settings" element={
                                                        <RoleGuard allowedRoles={['Owner', 'Manager', 'Cashier']}>
                                                            <Settings />
                                                        </RoleGuard>
                                                    } />
                                                </Route>

                                                <Route path="*" element={<NotFound />} />
                                            </Routes>
                                        </Suspense>
                                    </ToastProvider>
                                </ThemeProvider>
                            </SearchProvider>
                        </SalesProvider>
                    </ProductProvider>
                </NotificationProvider>
            </UserProvider>
        </BrowserRouter>
    );
}

export default App;

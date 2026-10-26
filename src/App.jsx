import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FarmProvider } from './context/FarmContext';
import { PoultryProvider } from './context/PoultryContext';
import { AdminProvider } from './admin/context/AdminContext';

import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';

// Layout
import MainLayout from './components/layout/MainLayout';

// Public & Farmer Auth Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Onboarding from './pages/onboarding/Onboarding';
import NotificationsPage from './pages/notifications/NotificationsPage';

// Farm OS App Pages
import Dashboard from './pages/dashboard/Dashboard';
import DailyRecords from './components/daily/DailyRecords';
import FarmOverview from './pages/farm/FarmOverview';
import Flocks from './pages/farm/Flocks';
import FlockDetails from './pages/farm/FlockDetails';
import EggProduction from './pages/production/EggProduction';
import FeedManagement from './pages/production/FeedManagement';
import HealthOverview from './pages/health/HealthOverview';
import Vaccinations from './pages/health/Vaccinations';
import Medication from './pages/health/Medication';
import Mortality from './pages/health/Mortality';
import Sales from './pages/business/Sales';
import Customers from './pages/business/Customers';
import Expenses from './pages/business/Expenses';
import Inventory from './pages/business/Inventory';
import Workers from './pages/management/Workers';
import Tasks from './pages/management/Tasks';
import Reports from './pages/reports/Reports';
import ProfitLoss from './pages/reports/ProfitLoss';
import Settings from './pages/settings/Settings';

// Admin System Shell & Auth
import AdminLogin from './admin/auth/AdminLogin';
import ProtectedAdminRoute from './admin/auth/ProtectedAdminRoute';
import AdminLayout from './admin/components/AdminLayout';

// Admin Pages
import AdminDashboard from './admin/pages/Dashboard';
import AdminFarmers from './admin/pages/Farmers';
import AdminFarms from './admin/pages/Farms';
import AdminPoultryTypes from './admin/pages/PoultryTypes';
import AdminSubscriptions from './admin/pages/Subscriptions';
import AdminPayments from './admin/pages/Payments';
import AdminNotifications from './admin/pages/Notifications';
import AdminSupport from './admin/pages/Support';
import AdminReports from './admin/pages/Reports';
import AdminManagement from './admin/pages/AdminManagement';
import AdminWebsiteContent from './admin/pages/WebsiteContent';
import AdminAuditLogs from './admin/pages/AuditLogs';
import AdminSettings from './admin/pages/Settings';
import AdminProfile from './admin/pages/AdminProfile';
import PlatformHealth from './admin/pages/PlatformHealth';
import RevenueAnalytics from './admin/pages/RevenueAnalytics';

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <FarmProvider>
            <PoultryProvider>
              <AdminProvider>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <Routes>
                    {/* Public Landing & Farmer Auth */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/onboarding" element={<Onboarding />} />

                    {/* Farmer Dashboard Application Shell */}
                    <Route
                      element={
                        <ProtectedRoute>
                          <MainLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/daily-records" element={<DailyRecords />} />
                      <Route path="/farm" element={<FarmOverview />} />
                      <Route path="/farm/flocks" element={<Flocks />} />
                      <Route path="/farm/flocks/:id" element={<FlockDetails />} />
                      <Route path="/production/eggs" element={<EggProduction />} />
                      <Route path="/production/feed" element={<FeedManagement />} />
                      <Route path="/health" element={<HealthOverview />} />
                      <Route path="/health/vaccinations" element={<Vaccinations />} />
                      <Route path="/health/medication" element={<Medication />} />
                      <Route path="/health/mortality" element={<Mortality />} />
                      <Route path="/business/sales" element={<Sales />} />
                      <Route path="/business/customers" element={<Customers />} />
                      <Route path="/business/expenses" element={<Expenses />} />
                      <Route path="/business/inventory" element={<Inventory />} />
                      <Route path="/management/workers" element={<Workers />} />
                      <Route path="/management/tasks" element={<Tasks />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/reports/profit-loss" element={<ProfitLoss />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/settings/*" element={<Settings />} />
                    </Route>

                    {/* Super Admin Unauthenticated Route */}
                    <Route path="/admin/login" element={<AdminLogin />} />

                    {/* Super Admin Protected Application Shell */}
                    <Route
                      element={
                        <ProtectedAdminRoute>
                          <AdminLayout />
                        </ProtectedAdminRoute>
                      }
                    >
                      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/farmers" element={<AdminFarmers />} />
                      <Route path="/admin/farms" element={<AdminFarms />} />
                      <Route path="/admin/poultry-types" element={<AdminPoultryTypes />} />
                      <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                      <Route path="/admin/payments" element={<AdminPayments />} />
                      <Route path="/admin/notifications" element={<AdminNotifications />} />
                      <Route path="/admin/support" element={<AdminSupport />} />
                      <Route path="/admin/reports" element={<AdminReports />} />
                      <Route path="/admin/website-content" element={<AdminWebsiteContent />} />
                      <Route path="/admin/administrators" element={<AdminManagement />} />
                      <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
                      <Route path="/admin/settings" element={<AdminSettings />} />
                      <Route path="/admin/profile" element={<AdminProfile />} />
                      <Route path="/admin/health" element={<PlatformHealth />} />
                      <Route path="/admin/revenue" element={<RevenueAnalytics />} />
                    </Route>

                    {/* Global Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </BrowserRouter>
              </AdminProvider>
            </PoultryProvider>
          </FarmProvider>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FarmProvider } from './context/FarmContext';
import { PoultryProvider } from './context/PoultryContext';

// Layout
import MainLayout from './components/layout/MainLayout';

// Public & Auth Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Onboarding from './pages/onboarding/Onboarding';

// Farm OS App Pages
import Dashboard from './pages/dashboard/Dashboard';
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

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <FarmProvider>
        <PoultryProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing & Auth */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Dashboard Application Shell */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
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
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/*" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </PoultryProvider>
      </FarmProvider>
    </AuthProvider>
  );
}

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import CustomerLayout from './layouts/CustomerLayout';
import MerchantLayout from './layouts/MerchantLayout';
import AdminLayout from './layouts/AdminLayout';
import HomePage from './pages/customer/HomePage';
import StoreDetailPage from './pages/customer/StoreDetailPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import MyOrdersPage from './pages/customer/MyOrdersPage';
import ProfilePage from './pages/customer/ProfilePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import MerchantDashboardPage from './pages/merchant/MerchantDashboardPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import { useAuthStore } from './store/useAuthStore';
import type { UserRole } from './types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Merchant Portal Routes (Phân hệ Chủ quán Phase 3) */}
        <Route
          path="/merchant"
          element={
            <ProtectedRoute allowedRoles={['MERCHANT', 'ADMIN']}>
              <MerchantLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<MerchantDashboardPage />} />
        </Route>

        {/* System Admin Portal Routes (Phân hệ Quản trị viên Phase 4) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
        </Route>

        {/* Main Customer Layout (Phân hệ Khách hàng Phase 2) */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="stores/:id" element={<StoreDetailPage />} />
          <Route
            path="checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout';
import HomePage from './pages/customer/HomePage';
import StoreDetailPage from './pages/customer/StoreDetailPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import MyOrdersPage from './pages/customer/MyOrdersPage';
import ProfilePage from './pages/customer/ProfilePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import MerchantPlaceholderPage from './pages/merchant/MerchantPlaceholderPage';
import AdminPlaceholderPage from './pages/admin/AdminPlaceholderPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Main Customer Layout */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="stores/:id" element={<StoreDetailPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="my-orders" element={<MyOrdersPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="merchant" element={<MerchantPlaceholderPage />} />
          <Route path="admin" element={<AdminPlaceholderPage />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
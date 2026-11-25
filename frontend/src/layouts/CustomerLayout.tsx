import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar, Footer, CartDrawer } from '../components';
import { useAuthStore } from '../store/useAuthStore';

export const CustomerLayout: React.FC = () => {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#1E293B] flex flex-col font-sans selection:bg-[#FF5A1F] selection:text-white">
      {/* Main Navbar */}
      <Navbar />

      {/* Page Content */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* E-Commerce Footer */}
      <Footer />

      {/* Slide-out Shopping Cart */}
      <CartDrawer />
    </div>
  );
};

export default CustomerLayout;
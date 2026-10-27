import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navbar, Footer, DevModeSwitcher, CartDrawer } from '../components';
import { useAuthStore } from '../store/useAuthStore';

export const CustomerLayout: React.FC = () => {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#1E293B] flex flex-col font-sans selection:bg-[#FF5A1F] selection:text-white">
      <Toaster position="top-right" />

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

      {/* Compact Dev Mode Switcher (Góc dưới bên trái) */}
      <DevModeSwitcher />
    </div>
  );
};

export default CustomerLayout;
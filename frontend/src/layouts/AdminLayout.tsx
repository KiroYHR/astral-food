import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { DevModeSwitcher } from '../components';
import { useAuthStore } from '../store/useAuthStore';

export const AdminLayout: React.FC = () => {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#1E293B] flex flex-col font-sans selection:bg-[#FF5A1F] selection:text-white">
      <Toaster position="top-right" />

      {/* Main Admin Portal Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Quick Role Switcher Floating Pill */}
      <DevModeSwitcher />
    </div>
  );
};

export default AdminLayout;
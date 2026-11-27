import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SesVerificationBanner } from '../components';
import { useAuthStore } from '../store/useAuthStore';

export const MerchantLayout: React.FC = () => {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#1E293B] flex flex-col font-sans selection:bg-[#FF5A1F] selection:text-white">
      {/* AWS SES Email Verification Reminder Banner */}
      <SesVerificationBanner />

      {/* Main Merchant Portal Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default MerchantLayout;
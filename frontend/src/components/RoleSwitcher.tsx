import React, { useState } from 'react';
import { Zap, RotateCcw, User, Store, Shield, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { resetMockDb } from '../api/mockData';
import toast from 'react-hot-toast';
import type { UserRole } from '../types';

export const RoleSwitcher: React.FC = () => {
  const { user, quickSwitchRole } = useAuthStore();
  const { clearCart } = useCartStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSwitch = (role: UserRole) => {
    quickSwitchRole(role);
    const roleNames: Record<UserRole, string> = {
      CUSTOMER: 'Khách hàng (Customer Portal)',
      MERCHANT: 'Chủ quán (Merchant Dashboard)',
      ADMIN: 'Quản trị viên (System Admin)',
    };
    toast.success(`Đã chuyển sang vai trò: ${roleNames[role]}!`, {
      icon: '⚡',
      duration: 2500,
      style: {
        borderRadius: '12px',
        background: '#1E293B',
        color: '#FFFFFF',
      },
    });
  };

  const handleResetData = () => {
    if (window.confirm('Khôi phục toàn bộ 6 quán ăn, 18 món và đơn hàng mẫu về trạng thái ban đầu?')) {
      resetMockDb();
      clearCart();
      quickSwitchRole('CUSTOMER');
      toast.success('Đã khôi phục dữ liệu mẫu ban đầu thành công!', {
        icon: '🔄',
        duration: 3000,
      });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-orange-200/80 shadow-2xl p-3 max-w-xs transition-all duration-300">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
            <span className="p-1 rounded-md bg-orange-100 text-[#FF5A1F]">
              <Zap className="w-3.5 h-3.5 fill-[#FF5A1F]" />
            </span>
            <span>Quick Demo Role Switcher</span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
            title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Expandable Body */}
        {isExpanded && (
          <div className="pt-2.5 space-y-2">
            <p className="text-[11px] text-gray-500 leading-tight">
              Chuyển nhanh góc nhìn trải nghiệm cho buổi báo cáo & demo hệ thống:
            </p>

            {/* 3 Role Buttons */}
            <div className="grid grid-cols-1 gap-1.5">
              {/* Customer */}
              <button
                type="button"
                onClick={() => handleSwitch('CUSTOMER')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  user?.role === 'CUSTOMER'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-[#FF5A1F]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" /> 1. Khách Hàng (Customer)
                </span>
                {user?.role === 'CUSTOMER' && <Check className="w-3.5 h-3.5" />}
              </button>

              {/* Merchant */}
              <button
                type="button"
                onClick={() => handleSwitch('MERCHANT')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  user?.role === 'MERCHANT'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Store className="w-4 h-4" /> 2. Chủ Quán (Merchant)
                </span>
                {user?.role === 'MERCHANT' && <Check className="w-3.5 h-3.5" />}
              </button>

              {/* Admin */}
              <button
                type="button"
                onClick={() => handleSwitch('ADMIN')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  user?.role === 'ADMIN'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" /> 3. Quản Trị Viên (Admin)
                </span>
                {user?.role === 'ADMIN' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Reset Database Button */}
            <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
              <span className="text-gray-400 font-mono">v1.0 (Mock DB)</span>
              <button
                type="button"
                onClick={handleResetData}
                className="inline-flex items-center gap-1 text-[#FF5A1F] hover:text-orange-700 font-semibold cursor-pointer transition-colors"
                title="Khôi phục dữ liệu mẫu ban đầu"
              >
                <RotateCcw className="w-3 h-3" /> Reset Mock Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
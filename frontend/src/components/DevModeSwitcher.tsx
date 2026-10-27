import React, { useState } from 'react';
import { Wrench, RotateCcw, User, Store, Shield, Check, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { resetMockDb } from '../api/mockData';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '../types';

export const DevModeSwitcher: React.FC = () => {
  const { user, quickSwitchRole } = useAuthStore();
  const { clearCart } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSwitch = (role: UserRole) => {
    quickSwitchRole(role);
    const roleNames: Record<UserRole, string> = {
      CUSTOMER: 'Khách hàng (Customer Portal)',
      MERCHANT: 'Chủ quán (Merchant Dashboard)',
      ADMIN: 'Quản trị viên (System Admin)',
    };
    toast.success(`Đã đổi sang: ${roleNames[role]}!`, {
      icon: '⚡',
      duration: 2000,
    });

    // Tự động chuyển hướng nếu chọn Merchant hoặc Admin
    if (role === 'MERCHANT') navigate('/merchant');
    else if (role === 'ADMIN') navigate('/admin');
    else navigate('/');
  };

  const handleResetData = () => {
    if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu (6 quán, 18 món, đơn hàng) về trạng thái ban đầu?')) {
      resetMockDb();
      clearCart();
      quickSwitchRole('CUSTOMER');
      toast.success('Đã khôi phục dữ liệu mẫu ban đầu!', { icon: '🔄' });
      navigate('/');
      setTimeout(() => {
        window.location.reload();
      }, 400);
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'MERCHANT':
        return 'Chủ Quán';
      case 'ADMIN':
        return 'Admin';
      default:
        return 'Khách Hàng';
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-50">
      {/* Popover khi mở */}
      {isOpen ? (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-orange-200/90 shadow-2xl p-4 w-76 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
              <span className="p-1 rounded-md bg-orange-100 text-[#FF5A1F]">
                <Wrench className="w-3.5 h-3.5" />
              </span>
              <span>Dev & Báo Cáo Mode</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-3 space-y-2.5">
            <p className="text-[11px] text-gray-500 leading-tight">
              Chuyển nhanh góc nhìn 3 phân hệ phục vụ chấm điểm đồ án:
            </p>

            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => handleSwitch('CUSTOMER')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  user?.role === 'CUSTOMER'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-gray-50 hover:bg-orange-50 text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" /> 1. Khách Hàng (Customer)
                </span>
                {user?.role === 'CUSTOMER' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => handleSwitch('MERCHANT')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  user?.role === 'MERCHANT'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-gray-50 hover:bg-amber-50 text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Store className="w-4 h-4" /> 2. Chủ Quán (Merchant)
                </span>
                {user?.role === 'MERCHANT' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => handleSwitch('ADMIN')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  user?.role === 'ADMIN'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'bg-gray-50 hover:bg-purple-50 text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" /> 3. Quản Trị Viên (Admin)
                </span>
                {user?.role === 'ADMIN' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
              <span className="text-gray-400 font-mono">Mock DB Active</span>
              <button
                type="button"
                onClick={handleResetData}
                className="inline-flex items-center gap-1 text-[#FF5A1F] hover:text-orange-700 font-bold cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset Dữ liệu
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Thu gọn thành Pill nhỏ */
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-gray-900/90 hover:bg-gray-900 text-white rounded-full shadow-lg hover:shadow-xl backdrop-blur-md text-xs font-bold transition-all hover:scale-105 cursor-pointer border border-white/20"
          title="Mở bảng chuyển nhanh vai trò Dev Mode"
        >
          <Wrench className="w-3.5 h-3.5 text-amber-400" />
          <span>Dev Mode:</span>
          <span className="text-orange-300 font-medium">{getRoleLabel(user?.role)}</span>
        </button>
      )}
    </div>
  );
};
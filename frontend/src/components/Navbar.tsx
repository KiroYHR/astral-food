import React from 'react';
import { ShoppingBag, Flame, Sparkles, Cloud, Search } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
  const { user } = useAuthStore();
  const { getItemCount, toggleCart } = useCartStore();
  const itemCount = getItemCount();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'MERCHANT':
        return {
          label: 'Chủ Quán (Merchant)',
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'ADMIN':
        return {
          label: 'Quản Trị Viên (Admin)',
          bg: 'bg-purple-100 text-purple-800 border-purple-300',
        };
      default:
        return {
          label: 'Khách Hàng (Customer)',
          bg: 'bg-orange-100 text-[#FF5A1F] border-orange-200',
        };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#F1EFE9] shadow-xs">
      {/* Top Banner: Thông tin Đám mây AWS */}
      <div className="bg-gradient-to-r from-orange-600 via-[#FF5A1F] to-rose-500 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-3">
        <span className="flex items-center gap-1.5">
          <Cloud className="w-3.5 h-3.5" /> AWS Region: <strong className="underline">ap-southeast-1 (Singapore)</strong>
        </span>
        <span className="hidden md:inline">•</span>
        <span className="hidden md:flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Nền tảng Đặt đồ ăn & TMĐT Đa kênh AstralFood
        </span>
        <span className="hidden md:inline">•</span>
        <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
          Stateful Mock DB Active
        </span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-coral-gradient flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Flame className="w-6 h-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-extrabold tracking-tight text-coral-gradient">
                AstralFood
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-[#FF5A1F] tracking-wide">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] font-medium leading-none hidden sm:block">
              Cloud-Native Food Delivery
            </p>
          </div>
        </a>

        {/* Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm món ngon, quán ăn, trà sữa, phở bò..."
              onChange={(e) => onSearch && onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-[#FFFDF9] border border-[#F1EFE9] rounded-full focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-orange-500/10 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Right Actions: User Profile & Cart */}
        <div className="flex items-center gap-3 shrink-0">
          {/* User Badge */}
          {user && (
            <div className="flex items-center gap-2.5 bg-[#FFFDF9] px-3 py-1.5 rounded-full border border-[#F1EFE9]">
              <div className="w-7 h-7 rounded-full bg-orange-500/10 text-[#FF5A1F] flex items-center justify-center font-bold text-xs">
                {user.full_name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-gray-900 leading-tight">
                  {user.full_name}
                </p>
                <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleInfo.bg}`}>
                  {roleInfo.label}
                </span>
              </div>
            </div>
          )}

          {/* Cart Button */}
          <button
            onClick={toggleCart}
            type="button"
            className="relative p-2.5 rounded-full bg-white hover:bg-orange-50 border border-orange-200 text-[#FF5A1F] transition-all hover:scale-105 shadow-xs cursor-pointer"
            title="Xem giỏ hàng"
          >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF5A1F] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};